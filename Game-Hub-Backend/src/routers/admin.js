const express = require("express");
const router = express.Router();
const auth = require("../middleware/auth");
const adminAuth = require("../middleware/adminAuth");
const Transaction = require("../models/transaction");
const TradeTransaction = require("../models/TradeTransaction");
const User = require("../models/user");
const newPost = require("../models/newPost"); // ✅ Added missing import

// Get paginated withdrawals (default: status=pending)
router.get("/withdrawals", auth, adminAuth, async (req, res) => {
  const { status = "pending", page = 1, limit = 10 } = req.query;
  const match = { type: "withdraw", status };

  try {
    const total = await Transaction.countDocuments(match);
    const transactions = await Transaction.find(match)
      .populate("userId", "name email") // Show who requested withdrawal
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit));

    res.json({
      transactions,
      totalPages: Math.ceil(total / limit),
      currentPage: Number(page),
    });
  } catch (err) {
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
      user.coins += transaction.amount;
      await user.save();
    }

    transaction.status = "rejected";
    await transaction.save();

    res.json({
      success: true,
      message: "Withdrawal rejected and coins refunded.",
    });
  } catch (e) {
    res.status(500).json({ error: "Error rejecting withdrawal" });
  }
});

// Admin Trade History Route
router.get("/admin/trade-history", auth, adminAuth, async (req, res) => {
  try {
    const posts = await newPost
      .find({ tradeStatus: { $in: ["completed", "cancelled"] } })
      .select(
        "description price server tradeStatus tradeCompletedAt cancellationNote createdAt updatedAt"
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

// ✅ Optional: Admin route test
router.get("/admin/test", auth, adminAuth, (req, res) => {
  res.send({ message: "✅ Admin route working", user: req.user });
});
// -----------------------------------------------------------------------------
// Admin: Pending Releases / Manual Release routes
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

    if (tx.status !== "pending_release") {
      await session.abortTransaction();
      session.endSession();
      return res
        .status(400)
        .send({ error: "Trade not in pending_release state" });
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

// --- Admin: user management ---
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
      .select("-password -tokens -avatar") // don't leak sensitive fields
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
    const allowed = ["name", "email", "role", "coins", "isActive"];
    const updates = Object.keys(req.body);
    const invalid = updates.filter((u) => !allowed.includes(u));
    if (invalid.length)
      return res.status(400).send({ error: "Invalid fields", invalid });

    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).send({ error: "User not found" });

    updates.forEach((u) => (user[u] = req.body[u]));
    await user.save();

    // exclude sensitive fields when returning
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

module.exports = router;
