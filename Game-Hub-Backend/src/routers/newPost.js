const express = require("express");
const newPost = require("../models/newPost");
const auth = require("../middleware/auth");
const User = require("../models/user");
const router = new express.Router();

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
    await req.user.populate("newpost");
    res.send(req.user.newpost);
  } catch (e) {
    console.error("Error in /newpost route:", e);
    res.status(500).send();
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
          avaliable: false,
          purchaseAt: new Date(),
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
    req.user.coins -= reservedPost.price;
    await req.user.save();

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
  try {
    const post = await newPost.findById(req.params.id).populate("owner buyer");
    if (!post || !post.buyer) {
      return res.status(404).send({ error: "Post or buyer not found" });
    }

    const userId = req.user._id.toString();
    if (
      ![post.owner._id.toString(), post.buyer._id.toString()].includes(userId)
    ) {
      return res.status(403).send({ error: "You are not part of this trade" });
    }

    if (post.tradeConfirmations.includes(req.user._id)) {
      return res.status(400).send({ error: "You already confirmed" });
    }

    post.tradeConfirmations.push(req.user._id);

    // If both confirmed
    if (
      post.tradeConfirmations.includes(post.owner._id) &&
      post.tradeConfirmations.includes(post.buyer._id)
    ) {
      post.tradeStatus = "completed";
      post.tradeCompletedAt = new Date();

      const seller = await User.findById(post.owner._id);
      seller.coins += post.price;
      await seller.save();
    }

    await post.save();
    res.send(post);
  } catch (err) {
    console.error(err);
    res.status(500).send({ error: "Trade confirmation failed" });
  }
});

// Cancel trade
router.post("/newpost/:id/cancel-trade", auth, async (req, res) => {
  try {
    const post = await newPost.findById(req.params.id).populate("buyer");

    if (!post) {
      return res.status(404).send({ error: "Post not found" });
    }

    const isOwner = post.owner.toString() === req.user._id.toString();
    const isBuyer =
      post.buyer && post.buyer._id.toString() === req.user._id.toString();

    if (post.tradeStatus !== "pending" || (!isOwner && !isBuyer)) {
      return res.status(403).send({ error: "Not authorized to cancel" });
    }

    // Refund coins if there's a buyer
    if (post.buyer) {
      const buyer = await User.findById(post.buyer._id);
      if (buyer) {
        buyer.coins += post.price;
        await buyer.save();
      }
    }

    // Reset post
    post.tradeStatus = "available";
    post.avaliable = true;
    post.buyer = null;
    post.purchaseAt = null;
    post.tradeConfirmations = [];
    post.cancellationNote = req.body.note || "Cancelled";

    await post.save();

    res.send({ message: "Trade cancelled, coins refunded", post });
  } catch (err) {
    console.error("Cancel trade error:", err);
    res.status(500).send({ error: "Failed to cancel trade" });
  }
});

module.exports = router;
