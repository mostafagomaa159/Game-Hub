// src/routers/admin.js
const express = require("express");
const router = express.Router();
const auth = require("../middleware/auth");
const adminAuth = require("../middleware/adminAuth");
const mongoose = require("mongoose");
const Transaction = require("../models/transaction");
const TradeTransaction = require("../models/TradeTransaction");
const User = require("../models/user");
const newPost = require("../models/newPost");
const Dispute = require("../models/dispute");

// service to finalize single trades (and used by force-release)
const { finalizeTradeByPostId } = require("../services/tradeFinalizer");

// -------------------------
// Withdrawals & transactions
// -------------------------

// Get paginated withdrawals (default: status=pending)
router.get("/withdrawals", auth, adminAuth, async (req, res) => {
  const { status = "pending", page = 1, limit = 10 } = req.query;
  const match = { type: "withdraw", status };

  try {
    const total = await Transaction.countDocuments(match);
    const transactions = await Transaction.find(match)
      .populate("userId", "name email")
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit));

    res.json({
      transactions,
      totalPages: Math.ceil(total / limit),
      currentPage: Number(page),
    });
  } catch (err) {
    console.error("Admin withdrawals error:", err);
    res.status(500).json({ error: "Failed to fetch transactions" });
  }
});

// Approve a withdrawal
router.post("/withdrawals/:id/approve", auth, adminAuth, async (req, res) => {
  try {
    const transaction = await Transaction.findById(req.params.id);
    if (!transaction || transaction.status !== "pending") {
      return res
        .status(404)
        .json({ error: "Transaction not found or already processed" });
    }

    // Simulate PayPal payout
    console.log(
      `✅ Admin ${req.user.email} approved payout to ${transaction.methodEmail} for $${transaction.amount}`
    );

    transaction.status = "approved";
    await transaction.save();

    res.json({
      success: true,
      message: "Withdrawal approved and PayPal payout simulated.",
    });
  } catch (e) {
    console.error("Approve withdrawal error:", e);
    res.status(500).json({ error: "Error approving withdrawal" });
  }
});

// Reject a withdrawal and refund coins
router.post("/withdrawals/:id/reject", auth, adminAuth, async (req, res) => {
  try {
    const transaction = await Transaction.findById(req.params.id);
    if (!transaction || transaction.status !== "pending") {
      return res
        .status(404)
        .json({ error: "Transaction not found or already processed" });
    }

    // Refund coins to the user
    const user = await User.findById(transaction.userId);
    if (user) {
      user.coins = (user.coins || 0) + Number(transaction.amount || 0);
      await user.save();
    }

    transaction.status = "rejected";
    await transaction.save();

    res.json({
      success: true,
      message: "Withdrawal rejected and coins refunded.",
    });
  } catch (e) {
    console.error("Reject withdrawal error:", e);
    res.status(500).json({ error: "Error rejecting withdrawal" });
  }
});

// -------------------------
// Admin Trade History
// -------------------------
router.get("/admin/trade-history", auth, adminAuth, async (req, res) => {
  try {
    const posts = await newPost
      .find({ tradeStatus: { $in: ["completed", "cancelled"] } })
      .select(
        "description price server tradeStatus tradeCompletedAt cancellationNote createdAt updatedAt owner buyer"
      )
      .populate("owner", "name email")
      .populate("buyer", "name email")
      .sort({ updatedAt: -1 });

    res.send(posts);
  } catch (err) {
    console.error("Admin Trade History Error:", err);
    res.status(500).send({ error: "Server Error" });
  }
});

// -----------------------------------------------------------------------------
// Admin: Pending Releases / Manual Release routes (new + existing)
// -----------------------------------------------------------------------------

/**
 * GET /admin/trades/pending-releases
 * List trade transactions that are in pending_release (optionally ?readyOnly=true)
 */
router.get(
  "/admin/trades/pending-releases",
  auth,
  adminAuth,
  async (req, res) => {
    try {
      const { readyOnly } = req.query;
      const now = new Date();

      const q = { status: "pending_release" };
      if (readyOnly === "true") q.releaseAt = { $lte: now };

      const trades = await TradeTransaction.find(q)
        .populate("post buyer seller")
        .sort({ releaseAt: 1, createdAt: -1 })
        .limit(200);

      return res.send(trades);
    } catch (err) {
      console.error("Admin list pending-releases error:", err);
      return res.status(500).send({ error: "Failed to list pending releases" });
    }
  }
);

/**
 * GET /admin/trades/:id
 * View detailed trade transaction
 */
router.get("/admin/trades/:id", auth, adminAuth, async (req, res) => {
  try {
    const tx = await TradeTransaction.findById(req.params.id)
      .populate("post buyer seller dispute.videos.uploader")
      .lean();

    if (!tx) return res.status(404).send({ error: "Trade not found" });
    return res.send(tx);
  } catch (err) {
    console.error("Admin get trade error:", err);
    return res.status(500).send({ error: "Failed to load trade" });
  }
});

/**
 * POST /admin/trades/:id/release
 * Admin manually releases funds to seller for a pending_release tx.
 * Body (optional): { note: "..." }
 *
 * (You already had this - kept intact)
 */
router.post("/admin/trades/:id/release", auth, adminAuth, async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    const txId = req.params.id;
    const note = req.body?.note || "";

    const tx = await TradeTransaction.findById(txId).session(session);
    if (!tx) {
      await session.abortTransaction();
      session.endSession();
      return res.status(404).send({ error: "Trade not found" });
    }

    // ALLOWED STATES: admin may release when tx is pending_release OR disputed
    if (!["pending_release", "disputed"].includes(tx.status)) {
      await session.abortTransaction();
      session.endSession();
      return res.status(400).send({ error: "Trade not in a releasable state" });
    }

    // reload post and seller in session
    const post = await newPost.findById(tx.post).session(session);
    const seller = await User.findById(tx.seller).session(session);
    if (!post || !seller) {
      await session.abortTransaction();
      session.endSession();
      return res
        .status(404)
        .send({ error: "Related post or seller not found" });
    }

    const amount = Number(tx.amount || 0);

    // credit seller
    seller.coins = (seller.coins || 0) + amount;
    await seller.save({ session });

    // mark tx released
    tx.status = "released";
    tx.logs = tx.logs || [];
    tx.logs.push({
      message: `Admin released funds; note: ${note}`,
      by: req.user._id,
      at: new Date(),
    });
    tx.adminHandledBy = req.user._id;
    tx.adminHandledAt = new Date();
    await tx.save({ session });

    // update post
    post.tradeStatus = "completed";
    post.tradeCompletedAt = new Date();
    post.releaseAt = null;
    await post.save({ session });

    await session.commitTransaction();
    session.endSession();

    // return updated resources
    const updatedTx = await TradeTransaction.findById(txId).populate(
      "post buyer seller dispute.videos.uploader"
    );
    const updatedPost = await newPost
      .findById(post._id)
      .populate("owner buyer");

    return res.send({
      message: "Funds released to seller",
      tradeTransaction: updatedTx,
      post: updatedPost,
    });
  } catch (err) {
    await session.abortTransaction().catch(() => {});
    session.endSession();
    console.error("Admin release error:", err);
    return res.status(500).send({ error: "Failed to release funds" });
  }
});

// -------------------------
// NEW: Posts-level pending list & admin force/refund endpoints
// -------------------------

/**
 * GET /admin/pending-trades
 * List posts with tradeStatus "pending_release" (populated)
 */
router.get("/admin/pending-trades", auth, adminAuth, async (req, res) => {
  try {
    const pending = await newPost
      .find({ tradeStatus: "pending_release" })
      .populate("owner buyer")
      .sort({ releaseAt: 1 })
      .limit(200);
    return res.send(pending);
  } catch (err) {
    console.error("Admin pending-trades error:", err);
    return res.status(500).send({ error: "Failed to fetch pending trades" });
  }
});

/**
 * POST /admin/trades/:postId/force-release
 * Force finalize a single post's trade (admin)
 */
router.post(
  "/admin/trades/:postId/force-release",
  auth,
  adminAuth,
  async (req, res) => {
    const postId = req.params.postId;
    try {
      // Force = true lets admins bypass the releaseAt/time lock
      const result = await finalizeTradeByPostId(postId, {
        io: req.io,
        actorId: req.user._id,
        force: true, // <- added
      });

      if (result.ok)
        return res.send({
          message: "Trade force-released",
          postId: result.postId,
        });

      return res
        .status(400)
        .send({ error: result.reason || "Cannot finalize" });
    } catch (err) {
      console.error("Admin force-release error:", err);
      return res.status(500).send({ error: "Failed to force release" });
    }
  }
);

/**
 * POST /admin/trades/:postId/refund
 * Refund/cancel a post (admin) — return coins to buyer and mark tx refunded
 */
router.post(
  "/admin/trades/:postId/refund",
  auth,
  adminAuth,
  async (req, res) => {
    const postId = req.params.postId;
    const session = await mongoose.startSession();
    session.startTransaction();
    try {
      const post = await newPost.findById(postId).session(session);
      if (!post) throw new Error("Post not found");

      if (
        post.tradeStatus !== "pending_release" &&
        post.tradeStatus !== "pending"
      ) {
        throw new Error("Not refundable");
      }

      const tx = await TradeTransaction.findOne({ post: post._id }).session(
        session
      );
      if (!tx) throw new Error("Transaction not found");

      // refund buyer
      const buyer = await User.findById(post.buyer).session(session);
      if (buyer) {
        buyer.coins = (buyer.coins || 0) + Number(tx.amount || 0);
        await buyer.save({ session });
      }

      // update tx and post
      tx.status = "refunded";
      tx.logs = tx.logs || [];
      tx.logs.push({
        message: "Refunded by admin",
        by: req.user._id,
        at: new Date(),
      });
      await tx.save({ session });

      post.tradeStatus = "cancelled";
      post.avaliable = true;
      post.buyer = null;
      post.releaseAt = null;
      post.cancellationNote = "Refunded by admin";
      await post.save({ session });

      await session.commitTransaction();
      session.endSession();

      // emit socket events to buyer & seller about refund
      try {
        if (req.io) {
          const buyerId = String(buyer._id);
          const ownerId = String(post.owner);
          req.io.to(buyerId).emit("tradeRefunded", {
            postId: String(post._id),
            message: "Trade refunded by admin",
          });
          req.io.to(ownerId).emit("tradeRefunded", {
            postId: String(post._id),
            message: "Trade refunded by admin",
          });
        }
      } catch (e) {
        console.warn("admin refund: socket emit failed", e?.message || e);
      }

      return res.send({ message: "Refund processed" });
    } catch (err) {
      await session.abortTransaction().catch(() => {});
      session.endSession();
      console.error("Admin refund error:", err);
      return res.status(500).send({ error: err.message || "Refund failed" });
    }
  }
);

// -------------------------
// Admin: users, posts management (unchanged)
// -------------------------

// GET /admin/users?search=&page=&limit=
router.get("/admin/users", auth, adminAuth, async (req, res) => {
  try {
    const { search = "", page = 1, limit = 12 } = req.query;
    const q = {};

    if (search) {
      const re = new RegExp(search, "i");
      q.$or = [{ name: re }, { email: re }];
    }

    const total = await User.countDocuments(q);
    const users = await User.find(q)
      .select("-password -tokens -avatar")
      .skip((page - 1) * limit)
      .limit(Number(limit))
      .sort({ createdAt: -1 });

    return res.send({
      users,
      total,
      page: Number(page),
      limit: Number(limit),
      totalPages: Math.ceil(total / limit),
    });
  } catch (err) {
    console.error("Admin get users error:", err);
    return res.status(500).send({ error: "Failed to fetch users" });
  }
});

// PUT /admin/users/:id  (edit user profile by admin)
router.put("/admin/users/:id", auth, adminAuth, async (req, res) => {
  try {
    const allowed = ["name", "email", "role", "coins", "isActive", "isAdmin"];
    const updates = Object.keys(req.body);
    const invalid = updates.filter((u) => !allowed.includes(u));
    if (invalid.length)
      return res.status(400).send({ error: "Invalid fields", invalid });

    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).send({ error: "User not found" });

    // Map role -> isAdmin if 'role' is present
    if (req.body.role !== undefined) {
      if (typeof req.body.role === "string") {
        user.isAdmin = req.body.role === "admin";
      } else if (typeof req.body.role === "boolean") {
        user.isAdmin = !!req.body.role;
      }
    }

    // Apply allowed direct fields: name, email, coins, isActive, isAdmin
    const directFields = ["name", "email", "coins", "isActive", "isAdmin"];
    directFields.forEach((f) => {
      if (req.body[f] !== undefined) {
        user[f] = req.body[f];
      }
    });

    await user.save();

    const obj = user.toObject();
    delete obj.password;
    delete obj.tokens;
    delete obj.avatar;
    res.send({ user: obj });
  } catch (err) {
    console.error("Admin edit user error:", err);
    res.status(500).send({ error: "Failed to update user" });
  }
});

// PATCH /admin/users/:id/toggle-active
router.patch(
  "/admin/users/:id/toggle-active",
  auth,
  adminAuth,
  async (req, res) => {
    try {
      const { active } = req.body;
      if (typeof active !== "boolean")
        return res.status(400).send({ error: "active boolean required" });

      const user = await User.findById(req.params.id);
      if (!user) return res.status(404).send({ error: "User not found" });

      user.isActive = active;
      await user.save();

      const obj = user.toObject();
      delete obj.password;
      delete obj.tokens;
      delete obj.avatar;
      res.send({ user: obj });
    } catch (err) {
      console.error("Admin toggle user error:", err);
      res.status(500).send({ error: "Failed to toggle user" });
    }
  }
);

// GET /admin/users/:id/posts
router.get("/admin/users/:id/posts", auth, adminAuth, async (req, res) => {
  try {
    const { page = 1, limit = 20 } = req.query;
    const postsQuery = { owner: req.params.id };

    const total = await newPost.countDocuments(postsQuery);
    const posts = await newPost
      .find(postsQuery)
      .skip((page - 1) * limit)
      .limit(Number(limit))
      .sort({ createdAt: -1 });

    res.send({ posts, total, page: Number(page), limit: Number(limit) });
  } catch (err) {
    console.error("Admin get user posts error:", err);
    res.status(500).send({ error: "Failed to fetch posts" });
  }
});

// Admin edit post (PUT) and delete post (DELETE)
router.put("/admin/posts/:id", auth, adminAuth, async (req, res) => {
  try {
    const allowed = [
      "avaliable",
      "description",
      "price",
      "discord",
      "server",
      "isActive",
      "good_response",
      "bad_response",
      "tradeStatus",
    ];
    const updates = Object.keys(req.body);
    const invalid = updates.filter((u) => !allowed.includes(u));
    if (invalid.length)
      return res.status(400).send({ error: "Invalid fields", invalid });

    const post = await newPost.findById(req.params.id);
    if (!post) return res.status(404).send({ error: "Post not found" });

    updates.forEach((u) => (post[u] = req.body[u]));
    await post.save();
    res.send(post);
  } catch (err) {
    console.error("Admin edit post error:", err);
    res.status(500).send({ error: "Failed to update post" });
  }
});

router.delete("/admin/posts/:id", auth, adminAuth, async (req, res) => {
  try {
    const post = await newPost.findByIdAndDelete(req.params.id);
    if (!post) return res.status(404).send({ error: "Post not found" });
    // optionally: clean related Trade/TradeTransaction docs
    res.send({ success: true, deleted: post });
  } catch (err) {
    console.error("Admin delete post error:", err);
    res.status(500).send({ error: "Failed to delete post" });
  }
});
// POST /trades/:id/dispute/video
router.post("/trades/:id/dispute/video", auth, async (req, res) => {
  try {
    const txId = req.params.id;
    const videoURL = req.body?.videoURL;

    const tx = await TradeTransaction.findById(txId);
    if (!tx || tx.status !== "disputed")
      return res.status(400).send({ error: "Trade not in dispute" });

    tx.dispute.videos = tx.dispute.videos || [];
    tx.dispute.videos.push({
      url: videoURL,
      uploadedBy: req.user._id,
      at: new Date(),
    });

    await tx.save();
    return res.send({ message: "Video added", tradeTransaction: tx });
  } catch (err) {
    console.error("Add dispute video error:", err);
    return res.status(500).send({ error: "Failed to add video" });
  }
});

// POST /trades/:id/report
router.post("/trades/:id/report", auth, async (req, res) => {
  try {
    const txId = req.params.id;
    const videoURL = req.body?.videoURL;

    const tx = await TradeTransaction.findById(txId);
    if (!tx) return res.status(404).send({ error: "Trade not found" });

    if (!["pending_release"].includes(tx.status))
      return res.status(400).send({ error: "Cannot report this trade" });

    tx.status = "disputed";
    tx.dispute = {
      reportedBy: req.user._id,
      at: new Date(),
      videos: videoURL
        ? [
            {
              url: videoURL,
              uploadedBy: req.user._id,
              at: new Date(),
            },
          ]
        : [],
    };

    await tx.save();

    return res.send({ message: "Trade reported", tradeTransaction: tx });
  } catch (err) {
    console.error("Report dispute error:", err);
    return res.status(500).send({ error: "Failed to report trade" });
  }
});
// POST /admin/trades/:id/resolve
router.post(
  "/admin/disputes/:id/resolve",
  auth,
  adminAuth,
  async (req, res) => {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      const tradeId = req.params.id;
      const { action, note } = req.body; // action = 'refund' or 'release'

      const tx = await TradeTransaction.findById(tradeId).session(session);
      if (!tx) {
        await session.abortTransaction();
        session.endSession();
        return res.status(404).send({ error: "Trade not found" });
      }

      const post = await newPost.findById(tx.post).session(session);
      const buyer = await User.findById(tx.buyer).session(session);
      const seller = await User.findById(tx.seller).session(session);
      if (!post || !buyer || !seller) {
        await session.abortTransaction();
        session.endSession();
        return res.status(404).send({ error: "Data not found" });
      }

      const amount = Number(tx.amount || 0);

      // Action
      if (action === "refund") {
        buyer.coins += amount;
        tx.logs.push({
          message: `Admin refunded buyer. Note: ${note}`,
          by: req.user._id,
          at: new Date(),
        });
      } else if (action === "release") {
        seller.coins += amount;
        tx.logs.push({
          message: `Admin released to seller. Note: ${note}`,
          by: req.user._id,
          at: new Date(),
        });
      } else {
        await session.abortTransaction();
        session.endSession();
        return res.status(400).send({ error: "Invalid action" });
      }

      tx.status = "released";
      tx.adminHandledBy = req.user._id;
      tx.adminHandledAt = new Date();

      post.tradeStatus = "completed";
      post.tradeCompletedAt = new Date();
      post.releaseAt = null;

      await buyer.save({ session });
      await seller.save({ session });
      await tx.save({ session });
      await post.save({ session });

      await session.commitTransaction();
      session.endSession();

      // ✅ Emit socket update
      req.io.emit("admin:dispute_resolved", {
        postId: post._id,
        tradeId: tx._id,
        resolvedBy: req.user._id,
        action,
      });

      return res.send({
        message: `Dispute resolved and funds ${
          action === "refund" ? "refunded to buyer" : "released to seller"
        }`,
        tradeTransaction: tx,
        post,
      });
    } catch (err) {
      await session.abortTransaction().catch(() => {});
      session.endSession();
      console.error("Dispute resolution error:", err);
      return res.status(500).send({ error: "Failed to resolve dispute" });
    }
  }
);

// GET /admin/disputes
router.get("/admin/disputes", adminAuth, async (req, res) => {
  try {
    console.log("🛡️ Admin user:", req.user); // log authenticated user

    const disputes = await Dispute.find()
      .populate("post", "description")
      .populate("buyer", "username email")
      .populate("seller", "username email")
      .sort({ createdAt: -1 });

    console.log("✅ Disputes fetched:", disputes.length);
    res.json(disputes);
  } catch (err) {
    console.error("❌ Error in /admin/disputes:", err);
    res.status(500).json({ error: "Server error", details: err.message });
  }
});

// POST /disputes - User creates a dispute
router.post("/disputes", auth, async (req, res) => {
  try {
    const userId = req.user._id;
    const { postId, reason, videoUrls = [], note = "" } = req.body;

    // Validate required fields
    if (!postId || !reason) {
      return res
        .status(400)
        .json({ error: "Post ID and reason are required." });
    }

    // Validate video URLs
    if (videoUrls.length > 0) {
      const invalid = videoUrls.filter((url) => {
        try {
          const parsed = new URL(url);
          return !["http:", "https:"].includes(parsed.protocol);
        } catch {
          return true;
        }
      });

      if (invalid.length > 0) {
        return res.status(400).json({
          error: "Invalid video URL(s). Must start with http:// or https://",
          invalid,
        });
      }
    }

    // Check post exists
    const post = await Post.findById(postId).populate("owner");
    if (!post) {
      return res.status(404).json({ error: "Post not found." });
    }

    // Prevent users from disputing their own post
    if (String(post.owner._id) === String(userId)) {
      return res
        .status(403)
        .json({ error: "You cannot dispute your own post." });
    }

    // Create Dispute
    const dispute = new Dispute({
      buyer: userId,
      seller: post.owner._id,
      post: post._id,
      reason,
      note,
      videoUrls,
      status: "open",
    });

    await dispute.save();

    // Notify admins via Socket.IO
    io.emit("user:dispute_opened", {
      disputeId: dispute._id,
      postId: post._id,
      buyer: userId,
      seller: post.owner._id,
    });

    res.status(201).json({ message: "Dispute created", dispute });
  } catch (error) {
    console.error("Error creating dispute:", error);
    res.status(500).json({ error: "Failed to create dispute" });
  }
});

module.exports = router;
