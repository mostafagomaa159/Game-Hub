const express = require("express");
const mongoose = require("mongoose");
const newPost = require("../models/newPost");
const auth = require("../middleware/auth");
const User = require("../models/user");
const router = new express.Router();
const TradeTransaction = require("../models/TradeTransaction");

// Create new post
router.post("/newpost", auth, async (req, res) => {
  const newpost = new newPost({
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

    const filter = { owner: userId }; // base filter to only get user’s posts

    if (title) {
      filter.title = { $regex: title, $options: "i" }; // case-insensitive search
    }

    if (status) {
      filter.status = status; // e.g., "active", "sold", etc.
    }

    const total = await newPost.countDocuments(filter); // total count
    const posts = await newPost
      .find(filter)
      .skip((page - 1) * limit)
      .limit(Number(limit))
      .sort({ createdAt: -1 }); // optional sort by latest

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

// Get all posts
router.get("/all", async (req, res) => {
  try {
    const posts = await newPost
      .find({})
      .populate("owner", "name email")
      .sort({ createdAt: -1 });

    res.status(200).json(posts);
  } catch (e) {
    console.error("Error fetching posts:", e);
    res.status(500).json({ message: "Server error" });
  }
});

// Get single post (by owner)
router.get("/newpost/:id", auth, async (req, res) => {
  try {
    const newpost = await newPost.findOne({
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
    "tradeStatus",
  ];
  const isValid = updates.every((u) => allowedUpdates.includes(u));

  if (!isValid) {
    return res.status(400).send({ error: "Invalid updates!" });
  }

  try {
    const post = await newPost.findOne({
      _id: req.params.id,
      owner: req.user._id,
    });
    if (!post) return res.status(404).send({ error: "Post not found" });

    updates.forEach((u) => (post[u] = req.body[u]));
    post.buyer = null;
    post.tradeConfirmations = [];
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
    const post = await newPost.findById(req.params.id);
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
    const deleted = await newPost.findOneAndDelete({
      _id: req.params.id,
      owner: req.user._id,
    });

    if (!deleted) return res.status(404).send();
    res.send(deleted);
  } catch (e) {
    res.status(500).send(e);
  }
});

// Buy post
router.post("/newpost/:id/buy", auth, async (req, res) => {
  try {
    const post = await newPost.findById(req.params.id);
    if (!post) {
      return res.status(404).send({ error: "Item not found" });
    }

    if (post.owner.toString() === req.user._id.toString()) {
      return res.status(400).send({ error: "You cannot buy your own item" });
    }

    // ✅ Check both availability fields
    if (!post.avaliable || post.tradeStatus !== "available") {
      return res.status(400).send({ error: "Item is not available to buy" });
    }

    if (req.user.coins < post.price) {
      return res.status(400).send({ error: "Insufficient coins" });
    }

    // ✅ Atomically reserve the post
    const reservedPost = await newPost.findOneAndUpdate(
      {
        _id: req.params.id,
        tradeStatus: "available",
        avaliable: true,
      },
      {
        $set: {
          buyer: req.user._id,
          tradeStatus: "pending",
        },
      },
      { new: true }
    );

    if (!reservedPost) {
      return res
        .status(400)
        .send({ error: "Item has already been reserved by someone else" });
    }

    // ✅ Deduct coins
    // req.user.coins -= reservedPost.price;
    // await req.user.save();

    // Emit update to clients watching this post room
    if (req.io) {
      req.io.to(`post:${reservedPost._id}`).emit("postUpdated", {
        _id: reservedPost._id,
        tradeStatus: reservedPost.tradeStatus,
        avaliable: reservedPost.avaliable,
        buyer: reservedPost.buyer,
      });
    }

    res.send({
      message: "Item reserved. Awaiting trade confirmation",
      post: reservedPost,
    });
  } catch (e) {
    console.error("Buy error:", e);
    res.status(500).send({ error: "Failed to process purchase" });
  }
});

// Confirm trade
router.post("/newpost/:id/confirm-trade", auth, async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const postId = req.params.id;
    const userId = req.user._id.toString();

    const post = await newPost
      .findById(postId)
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

    post.tradeConfirmations = (post.tradeConfirmations || []).map(String);

    if (post.tradeConfirmations.includes(userId)) {
      const fresh = await newPost
        .findById(postId)
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
      const releaseAt = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes hold

      post.tradeStatus = "pending_release";
      post.avaliable = false;
      post.releaseAt = releaseAt;
      const buyerDoc = await User.findById(post.buyer._id).session(session);
      buyerDoc.coins -= post.price;
      await buyerDoc.save({ session });
      // Find or create TradeTransaction
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

    // Emit update to clients
    if (req.io) {
      req.io.to(`post:${post._id}`).emit("postUpdated", {
        _id: post._id,
        tradeStatus: post.tradeStatus,
        avaliable: post.avaliable,
        tradeConfirmations: post.tradeConfirmations,
        releaseAt: post.releaseAt,
        buyer: post.buyer,
        owner: post.owner,
      });
    }

    session.endSession();

    const updated = await newPost.findById(postId).populate("owner buyer");
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

// Cancel trade
router.post("/newpost/:id/cancel-trade", auth, async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const post = await newPost
      .findById(req.params.id)
      .populate("buyer owner")
      .session(session);

    if (!post) {
      await session.abortTransaction();
      session.endSession();
      return res.status(404).send({ error: "Post not found" });
    }

    const userId = req.user._id.toString();
    const isOwner = post.owner._id.toString() === userId;
    const isBuyer = post.buyer && post.buyer._id.toString() === userId;

    // Prevent cancel if user is neither buyer nor owner
    if (!isOwner && !isBuyer) {
      await session.abortTransaction();
      session.endSession();
      return res
        .status(403)
        .send({ error: "Not authorized to cancel this trade" });
    }

    // Check tradeConfirmations - disallow cancel if both confirmed
    const confirmations = (post.tradeConfirmations || []).map(String);
    const confirmedByBuyer =
      post.buyer && confirmations.includes(post.buyer._id.toString());
    const confirmedByOwner = confirmations.includes(post.owner._id.toString());

    if (confirmedByBuyer && confirmedByOwner) {
      await session.abortTransaction();
      session.endSession();
      return res.status(403).send({
        error: "Cannot cancel trade, both buyer and seller have confirmed.",
      });
    }

    // // Refund coins if there's a buyer and the canceller is authorized
    // if (post.buyer) {
    //   const buyer = await User.findById(post.buyer._id).session(session);
    //   if (buyer) {
    //     buyer.coins += post.price;
    //     await buyer.save({ session });
    //   }
    // }

    // Reset post fields accordingly
    post.tradeStatus = "available";
    post.avaliable = true;
    post.buyer = null;
    post.purchaseAt = null;
    post.tradeConfirmations = [];
    post.cancellationNote = req.body.note || "Cancelled";

    await post.save({ session });

    await session.commitTransaction();

    // Emit updated post info
    if (req.io) {
      req.io.to(`post:${post._id}`).emit("postUpdated", {
        _id: post._id,
        tradeStatus: post.tradeStatus,
        avaliable: post.avaliable,
        buyer: post.buyer,
        tradeConfirmations: post.tradeConfirmations,
        cancellationNote: post.cancellationNote,
      });
    }

    session.endSession();

    res.send({ message: "Trade cancelled, coins refunded", post });
  } catch (err) {
    await session.abortTransaction().catch(() => {});
    session.endSession();
    console.error("Cancel trade error:", err);
    return res.status(500).send({ error: "Failed to cancel trade" });
  }
});

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

// Send request to buy (without reserving)
router.post("/newpost/:id/request", auth, async (req, res) => {
  try {
    const post = await newPost.findById(req.params.id);
    if (!post) return res.status(404).send({ error: "Post not found" });

    // Prevent self-request
    if (post.owner.toString() === req.user._id.toString()) {
      return res.status(400).send({ error: "You can't request your own post" });
    }

    // Prevent duplicate request
    if (post.requests.includes(req.user._id)) {
      return res.status(400).send({ error: "Already requested" });
    }

    // Add to post.requests array
    post.requests.push(req.user._id);
    await post.save();

    // Create new TradeTransaction document
    const tradeTransaction = new TradeTransaction({
      post: post._id,
      buyer: req.user._id,
      seller: post.owner,
      amount: post.price,
      status: "pending", // or "reserved" depending on your flow
      logs: [
        {
          message: "Trade request created",
          by: req.user._id,
        },
      ],
    });

    await tradeTransaction.save();

    res.status(201).send({ message: "Request sent", post });
  } catch (e) {
    console.error("Send request error:", e);
    res.status(500).send({ error: "Failed to send request" });
  }
});
// Cancel request
router.post("/newpost/:id/cancel-request", auth, async (req, res) => {
  try {
    const post = await newPost.findById(req.params.id);
    if (!post) return res.status(404).send({ error: "Post not found" });

    // Remove user from post.requests array
    post.requests = post.requests.filter(
      (id) => id.toString() !== req.user._id.toString()
    );
    await post.save();

    // Remove the corresponding TradeTransaction document
    await TradeTransaction.findOneAndDelete({
      buyer: req.user._id,
      post: post._id,
    });

    res.send({ message: "Request cancelled", post });
  } catch (e) {
    console.error("Cancel request error:", e);
    res.status(500).send({ error: "Failed to cancel request" });
  }
});
//Delete request
router.delete("/newpost/:id/request", auth, async (req, res) => {
  const userId = req.user._id.toString();
  const postId = req.params.id;

  try {
    const post = await newPost.findById(postId);
    if (!post) return res.status(404).send({ error: "Post not found" });

    if (post.owner.toString() !== userId) {
      return res.status(403).send({ error: "Not authorized" });
    }

    // Remove all buyers (or you can remove just one if needed)
    post.requests = []; // clears all requests
    await post.save();

    // Delete all TradeTransaction for this post and seller
    const deleteResult = await TradeTransaction.deleteMany({
      post: postId,
      seller: userId,
    });

    if (deleteResult.deletedCount === 0) {
      return res
        .status(404)
        .send({ error: "No matching trade requests to delete" });
    }

    res.send({ message: "All requests cancelled by seller", post });
  } catch (err) {
    console.error("Seller cancel request error:", err);
    res.status(500).send({ error: "Failed to cancel request" });
  }
});

router.post("/newpost/:id/report", auth, async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const userId = req.user._id.toString();
    const postId = req.params.id;
    const { videoUrls, reason, urgency } = req.body;

    // Validate videoUrls is an array with exactly one non-empty string
    if (
      !Array.isArray(videoUrls) ||
      videoUrls.length !== 1 ||
      typeof videoUrls[0] !== "string" ||
      !videoUrls[0].trim()
    ) {
      await session.abortTransaction();
      session.endSession();
      return res.status(400).send({ error: "One valid video URL is required" });
    }

    // Validate urgency enum
    const validUrgencies = ["low", "medium", "high"];
    const safeUrgency = validUrgencies.includes(urgency) ? urgency : "medium";

    const post = await newPost.findById(postId).session(session);
    if (!post) {
      await session.abortTransaction();
      session.endSession();
      return res.status(404).send({ error: "Post not found" });
    }

    // Prevent reporting if trade is completed
    if (post.tradeStatus === "completed") {
      await session.abortTransaction();
      session.endSession();
      return res
        .status(400)
        .send({ error: "Cannot report a trade that has been completed" });
    }

    // Normalize owner and buyer ids to string for comparison
    const ownerId = post.owner.toString();
    const buyerId = post.buyer ? post.buyer.toString() : null;

    if (userId !== ownerId && userId !== buyerId) {
      await session.abortTransaction();
      session.endSession();
      return res
        .status(403)
        .send({ error: "Not authorized to report this trade" });
    }

    let tx = await TradeTransaction.findOne({ post: postId }).session(session);

    if (!tx) {
      tx = new TradeTransaction({
        post: postId,
        buyer: post.buyer,
        seller: post.owner,
        amount: 0,
        dispute: {}, // initialize dispute object
      });
    }

    if (!tx.dispute) tx.dispute = {};

    const now = new Date();

    if (userId === tx.seller.toString()) {
      tx.dispute.sellerReport = {
        reason: reason || "No reason provided",
        urgency: safeUrgency,
        evidenceUrl: videoUrls[0].trim(),
        reportedAt: now,
      };
    } else if (userId === tx.buyer?.toString()) {
      tx.dispute.buyerReport = {
        reason: reason || "No reason provided",
        urgency: safeUrgency,
        evidenceUrl: videoUrls[0].trim(),
        reportedAt: now,
      };
    } else {
      await session.abortTransaction();
      session.endSession();
      return res
        .status(403)
        .send({ error: "User not authorized for this dispute" });
    }

    if (tx.dispute.sellerReport && tx.dispute.buyerReport) {
      tx.dispute.status = "both_reported";
    } else if (tx.dispute.sellerReport) {
      tx.dispute.status = "seller_reported";
    } else if (tx.dispute.buyerReport) {
      tx.dispute.status = "buyer_reported";
    } else {
      tx.dispute.status = "none";
    }

    // Set releaseAt to null and tradeStatus to "pending" on both documents
    tx.releaseAt = null;
    tx.status = "pending";

    post.releaseAt = null;
    post.tradeStatus = "pending";

    // Save both documents within the session
    await tx.save({ session });
    await post.save({ session });

    await session.commitTransaction();
    session.endSession();

    res.send({
      success: true,
      message: "Trade dispute submitted, trade pending",
      tradeTransaction: tx,
      post,
    });
  } catch (error) {
    await session.abortTransaction().catch(() => {});
    session.endSession();
    console.error("Error submitting trade dispute:", error);
    res.status(500).send({
      error: "Internal server error",
      message: error.message,
      stack: error.stack,
    });
  }
});

module.exports = router;
