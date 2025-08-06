// routers/newpost.js
const express = require("express");
const mongoose = require("mongoose");
const Post = require("../models/newPost"); // use clear name Post
const auth = require("../middleware/auth");
const User = require("../models/user");
const TradeTransaction = require("../models/TradeTransaction"); // new model
const router = new express.Router();
const Trade = require("../models/Trade");

// Create new post
router.post("/newpost", auth, async (req, res) => {
  const newpost = new Post({
    ...req.body,
    owner: req.user._id,
  });
  try {
    await newpost.save();
    res.status(201).send(newpost);
  } catch (e) {
    res.status(400).send(e);
  }
});

// Get current user's posts
router.get("/newpost", auth, async (req, res) => {
  try {
    const { page = 1, limit = 10, title, status } = req.query;
    const userId = req.user._id;

    const filter = { owner: userId };

    if (title) {
      filter.title = { $regex: title, $options: "i" };
    }

    if (status) {
      filter.status = status;
    }

    const total = await Post.countDocuments(filter);
    const posts = await Post.find(filter)
      .skip((page - 1) * limit)
      .limit(Number(limit))
      .sort({ createdAt: -1 });

    res.send({
      total,
      page: Number(page),
      limit: Number(limit),
      posts,
    });
  } catch (e) {
    console.error("Error in /newpost route:", e);
    res.status(500).send({ error: "Failed to fetch posts" });
  }
});

// Get all posts (public)
router.get("/all", async (req, res) => {
  try {
    const posts = await Post.find({}).populate("owner", "name email").sort({
      createdAt: -1,
    });

    res.status(200).json(posts);
  } catch (e) {
    console.error("Error fetching posts:", e);
    res.status(500).json({ message: "Server error" });
  }
});

// Get single post (by owner)
router.get("/newpost/:id", auth, async (req, res) => {
  try {
    const newpost = await Post.findOne({
      _id: req.params.id,
      owner: req.user._id,
    });
    if (!newpost) {
      return res.status(404).send();
    }
    res.send(newpost);
  } catch (e) {
    res.status(500).send();
  }
});

// Update post
router.patch("/newpost/:id", auth, async (req, res) => {
  const updates = Object.keys(req.body);
  const allowedUpdates = [
    "avaliable",
    "description",
    "price",
    "discord",
    "server",
    "good_response",
    "bad_response",
  ];
  const isValid = updates.every((u) => allowedUpdates.includes(u));
  if (!isValid) {
    return res.status(400).send({ error: "Invalid updates!" });
  }

  try {
    const post = await Post.findOne({
      _id: req.params.id,
      owner: req.user._id,
    });
    if (!post) return res.status(404).send({ error: "Post not found" });

    updates.forEach((u) => (post[u] = req.body[u]));
    await post.save();
    res.send(post);
  } catch (e) {
    res.status(400).send(e);
  }
});

// Vote on a post
router.patch("/newpost/:id/vote", auth, async (req, res) => {
  const { vote } = req.body;
  const userId = req.user._id;

  if (!["good", "bad"].includes(vote)) {
    return res.status(400).send({ error: "Invalid vote value" });
  }

  try {
    const post = await Post.findById(req.params.id);
    if (!post) return res.status(404).send({ error: "Post not found" });

    if (post.voters.includes(userId)) {
      return res.status(403).send({ error: "You already voted" });
    }

    if (vote === "good") post.good_response += 1;
    else post.bad_response += 1;

    post.voters.push(userId);
    await post.save();

    res.send(post);
  } catch (e) {
    res.status(500).send({ error: "Voting failed" });
  }
});

// Delete post
router.delete("/newpost/:id", auth, async (req, res) => {
  try {
    const deleted = await Post.findOneAndDelete({
      _id: req.params.id,
      owner: req.user._id,
    });
    if (!deleted) return res.status(404).send();
    res.send(deleted);
  } catch (e) {
    res.status(500).send(e);
  }
});

/* -------------------
   Transaction-safe buy
   ------------------- */
router.post("/newpost/:id/buy", auth, async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    const postId = req.params.id;
    const buyerId = req.user._id;

    // reload models inside session
    const buyer = await User.findById(buyerId).session(session);
    if (!buyer) throw new Error("Buyer not found");

    const post = await Post.findById(postId).session(session);
    if (!post) throw new Error("Post not found");

    if (post.owner.toString() === buyerId.toString()) {
      return res.status(400).send({ error: "You cannot buy your own item" });
    }

    if (!post.avaliable || post.tradeStatus !== "available") {
      return res.status(400).send({ error: "Item is not available to buy" });
    }

    const price = Number(post.price || 0);
    if (buyer.coins < price) {
      return res.status(400).send({ error: "Insufficient coins" });
    }

    // atomically reserve the post
    const reservedPost = await Post.findOneAndUpdate(
      { _id: postId, tradeStatus: "available", avaliable: true },
      {
        $set: {
          buyer: buyerId,
          tradeStatus: "pending",
          avaliable: false,
          purchaseAt: new Date(),
        },
      },
      { new: true, session }
    );

    if (!reservedPost) {
      await session.abortTransaction();
      session.endSession();
      return res
        .status(400)
        .send({ error: "Item has already been reserved by someone else" });
    }

    // deduct buyer coins
    buyer.coins -= price;
    await buyer.save({ session });

    // create trade transaction (escrow record)
    const tx = new TradeTransaction({
      post: postId,
      buyer: buyerId,
      seller: post.owner,
      amount: price,
      status: "reserved",
      releaseAt: null,
      logs: [{ message: "Reserved by buyer", by: buyerId }],
    });
    await tx.save({ session });

    await session.commitTransaction();
    session.endSession();

    const populated = await Post.findById(postId).populate("owner buyer");
    return res.send({
      message: "Item reserved. Awaiting trade confirmation",
      post: populated,
      tradeTransaction: tx,
      buyer: { _id: buyer._id, coins: buyer.coins },
    });
  } catch (e) {
    await session.abortTransaction().catch(() => {});
    session.endSession();
    console.error("Buy error:", e);
    return res
      .status(500)
      .send({ error: e.message || "Failed to process purchase" });
  }
});

/* -------------------------
   Transaction-safe confirm
   ------------------------- */
router.post("/newpost/:id/confirm-trade", auth, async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    const postId = req.params.id;
    const userId = req.user._id.toString();

    const post = await Post.findById(postId)
      .session(session)
      .populate("owner buyer");
    if (!post || !post.buyer) {
      await session.abortTransaction();
      session.endSession();
      return res.status(404).send({ error: "Post or buyer not found" });
    }

    const ownerId = post.owner._id.toString();
    const buyerId = post.buyer._id.toString();
    if (![ownerId, buyerId].includes(userId)) {
      await session.abortTransaction();
      session.endSession();
      return res.status(403).send({ error: "You are not part of this trade" });
    }

    // ensure tradeConfirmations are string ids
    post.tradeConfirmations = (post.tradeConfirmations || []).map(String);

    if (post.tradeConfirmations.includes(userId)) {
      const fresh = await Post.findById(postId)
        .populate("owner buyer")
        .session(session);
      await session.commitTransaction();
      session.endSession();
      return res.send(fresh);
    }

    post.tradeConfirmations.push(userId);

    const confirmedByOwner = post.tradeConfirmations.includes(ownerId);
    const confirmedByBuyer = post.tradeConfirmations.includes(buyerId);

    if (confirmedByOwner && confirmedByBuyer) {
      // schedule a 1-minute hold (pending_release)
      const releaseAt = new Date(Date.now() + 5 * 60 * 1000); // 1 minute

      post.tradeStatus = "pending_release";
      post.releaseAt = releaseAt;

      // update or create TradeTransaction -> pending_release
      let tx = await TradeTransaction.findOne({ post: postId }).session(
        session
      );
      if (!tx) {
        tx = new TradeTransaction({
          post: postId,
          buyer: post.buyer,
          seller: post.owner,
          amount: post.price,
          status: "pending_release",
          releaseAt,
          logs: [
            { message: "Both confirmed; scheduled release", by: req.user._id },
          ],
        });
      } else {
        tx.status = "pending_release";
        tx.releaseAt = releaseAt;
        tx.logs = tx.logs || [];
        tx.logs.push({
          message: "Both confirmed; scheduled release",
          by: req.user._id,
        });
      }
      await tx.save({ session });
    }

    await post.save({ session });

    await session.commitTransaction();
    session.endSession();

    const updated = await Post.findById(postId).populate("owner buyer");
    return res.send(updated);
  } catch (err) {
    await session.abortTransaction().catch(() => {});
    session.endSession();
    console.error("Confirm trade error:", err);
    return res
      .status(500)
      .send({ error: err.message || "Trade confirmation failed" });
  }
});

/* -------------------------
   Transaction-safe cancel trade
   ------------------------- */
router.post("/newpost/:id/cancel-trade", auth, async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    const postId = req.params.id;
    const userId = req.user._id.toString();

    const post = await Post.findById(postId)
      .session(session)
      .populate("buyer owner");
    if (!post) {
      await session.abortTransaction();
      session.endSession();
      return res.status(404).send({ error: "Post not found" });
    }

    const isOwner = post.owner && post.owner._id.toString() === userId;
    const isBuyer = post.buyer && post.buyer._id.toString() === userId;

    if (post.tradeStatus !== "pending" || (!isOwner && !isBuyer)) {
      await session.abortTransaction();
      session.endSession();
      return res.status(403).send({ error: "Not authorized to cancel" });
    }

    if (post.buyer) {
      const buyer = await User.findById(post.buyer._id).session(session);
      if (buyer) {
        const price = Number(post.price || 0);
        buyer.coins += price;
        await buyer.save({ session });
      }
    }

    post.tradeStatus = "available";
    post.avaliable = true;
    post.buyer = null;
    post.purchaseAt = null;
    post.tradeConfirmations = [];
    post.cancellationNote = req.body.note || "Cancelled";

    await post.save({ session });

    await session.commitTransaction();
    session.endSession();

    const updated = await Post.findById(postId).populate("owner buyer");
    return res.send({
      message: "Trade cancelled, coins refunded",
      post: updated,
    });
  } catch (err) {
    await session.abortTransaction();
    session.endSession();
    console.error("Cancel trade error:", err);
    return res
      .status(500)
      .send({ error: err.message || "Failed to cancel trade" });
  }
});
// Run this periodically (e.g. every 10 mins) or call manually by admin
router.post("/newpost/finalize-trades", auth, async (req, res) => {
  // optional: require admin
  // if (!req.user?.isAdmin) return res.status(403).send({ error: "Admin required" });

  const session = await mongoose.startSession();
  await session.startTransaction();
  try {
    const now = new Date();

    // Find posts that are pending_release and whose releaseAt <= now
    // We only select minimally needed fields to keep memory low
    const postsToFinalize = await Post.find(
      {
        tradeStatus: "pending_release",
        releaseAt: { $lte: now },
      },
      // projection: include owner, buyer, price
      { owner: 1, buyer: 1, price: 1 }
    ).session(session);

    let finalizedCount = 0;

    for (const post of postsToFinalize) {
      // load the transaction inside the same session
      const tx = await TradeTransaction.findOne({ post: post._id }).session(
        session
      );

      // require a pending_release transaction
      if (!tx || tx.status !== "pending_release") {
        // skip if no valid transaction found
        continue;
      }

      // safety checks
      if (!post.buyer || !post.owner || !tx.amount) continue;

      // add coins to seller
      const sellerId =
        typeof post.owner === "object"
          ? post.owner._id || post.owner
          : post.owner;
      const buyerId =
        typeof post.buyer === "object"
          ? post.buyer._id || post.buyer
          : post.buyer;

      const seller = await User.findById(sellerId).session(session);
      if (!seller) {
        console.warn(
          "Finalize: seller not found for post",
          post._id.toString()
        );
        continue;
      }

      // transfer funds
      seller.coins = (seller.coins || 0) + Number(tx.amount || 0);
      await seller.save({ session });

      // mark post fields
      const postDoc = await Post.findById(post._id).session(session);
      postDoc.tradeStatus = "completed";
      postDoc.avaliable = false;
      postDoc.releaseAt = null;
      postDoc.tradeCompletedAt = new Date();
      // clear buyer if you don't want it visible after completion (optional)
      // postDoc.buyer = null;
      await postDoc.save({ session });

      // mark tx completed
      tx.status = "completed";
      tx.releaseAt = null;
      tx.logs = tx.logs || [];
      tx.logs.push({
        message: "Trade finalized, coins released to seller",
        by: req.user ? req.user._id : null,
        at: new Date(),
      });
      await tx.save({ session });

      finalizedCount++;

      // notify buyer & seller via sockets if available
      try {
        if (req.io) {
          // Use socket rooms / naming conventions your app uses
          // Example emits (adjust event names / payloads to your frontend)
          req.io.to(String(sellerId)).emit("tradeFinalized", {
            postId: post._id,
            message: "Trade completed. Coins released to seller.",
            sellerId,
            buyerId,
            amount: tx.amount,
          });

          req.io.to(String(buyerId)).emit("tradeFinalized", {
            postId: post._id,
            message: "Trade completed. Seller was paid.",
            sellerId,
            buyerId,
            amount: tx.amount,
          });
        }
      } catch (e) {
        // don't fail the whole transaction because notification failed
        console.warn(
          "Notify sockets failed for post",
          post._id.toString(),
          e.message
        );
      }
    }

    await session.commitTransaction();
    session.endSession();

    return res.send({ message: `${finalizedCount} trades finalized.` });
  } catch (err) {
    await session.abortTransaction().catch(() => {});
    session.endSession();
    console.error("Finalize trades error:", err);
    return res.status(500).send({ error: "Failed to finalize trades" });
  }
});

/* -------------------------
   Request / Cancel-request
   ------------------------- */
// Send request to buy (without reserving)
router.post("/newpost/:id/request", auth, async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    if (!post) return res.status(404).send({ error: "Post not found" });

    if (post.owner.toString() === req.user._id.toString()) {
      return res.status(400).send({ error: "You can't request your own post" });
    }

    if (post.requests.includes(req.user._id)) {
      return res.status(400).send({ error: "Already requested" });
    }

    post.requests.push(req.user._id);
    await post.save();

    const trade = new Trade({
      item: post._id,
      buyer: req.user._id,
      seller: post.owner,
      price: post.price,
    });

    await trade.save();

    res.status(201).send({ message: "Request sent", post });
  } catch (e) {
    console.error("Send request error:", e);
    res.status(500).send({ error: "Failed to send request" });
  }
});

// Cancel request
router.post("/newpost/:id/cancel-request", auth, async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    if (!post) return res.status(404).send({ error: "Post not found" });

    post.requests = post.requests.filter(
      (id) => id.toString() !== req.user._id.toString()
    );
    await post.save();

    await Trade.findOneAndDelete({
      buyer: req.user._id,
      item: post._id,
    });

    res.send({ message: "Request cancelled", post });
  } catch (e) {
    console.error("Cancel request error:", e);
    res.status(500).send({ error: "Failed to cancel request" });
  }
});
router.post("/newpost/:id/report", auth, async (req, res) => {
  const userId = req.user._id;
  const postId = req.params.id;
  const videoUrl = req.body?.videoUrl;

  if (!videoUrl) {
    return res.status(400).send({ error: "Video URL is required" });
  }

  const post = await newPost.findById(postId);
  if (!post) {
    return res.status(404).send({ error: "Post not found" });
  }

  if (
    String(post.owner) !== String(userId) &&
    String(post.buyer) !== String(userId)
  ) {
    return res
      .status(403)
      .send({ error: "Not authorized to report this trade" });
  }

  // Find or create transaction
  let tx = await TradeTransaction.findOne({ post: postId });
  if (!tx) {
    tx = new TradeTransaction({
      post: postId,
      buyer: post.buyer,
      seller: post.owner,
    });
  }

  tx.status = "disputed";
  tx.dispute = tx.dispute || {};
  tx.dispute.videos = tx.dispute.videos || [];
  tx.dispute.videos.push({
    url: videoUrl,
    uploader: userId,
    at: new Date(),
  });

  await tx.save();

  post.tradeStatus = "pending"; // prevent auto-release during dispute
  await post.save();

  // 🔔 Emit to both participants and admin
  try {
    const io = req.io;
    if (io) {
      const buyerIdStr = String(post.buyer);
      const ownerIdStr = String(post.owner);

      // Notify buyer & seller
      io.to(buyerIdStr).emit("tradeDisputed", {
        postId: String(post._id),
        by: String(userId),
        videoUrl,
        message: "Trade reported — admin will review.",
      });
      io.to(ownerIdStr).emit("tradeDisputed", {
        postId: String(post._id),
        by: String(userId),
        videoUrl,
        message: "Trade reported — admin will review.",
      });

      // ✅ Notify admin panel
      io.emit("admin:dispute_created", {
        postId: String(post._id),
        tradeId: String(tx._id),
        reportedBy: String(userId),
        videoUrl,
      });
    }
  } catch (e) {
    console.warn("report route: socket emit failed", e?.message || e);
  }

  res.send({
    message: "Trade dispute submitted",
    tradeTransaction: tx,
    post,
  });
});

module.exports = router;
