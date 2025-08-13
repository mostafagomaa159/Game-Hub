const express = require("express");
const mongoose = require("mongoose");
const newPost = require("../../models/newPost");
const auth = require("../../middleware/auth");
const User = require("../../models/user");
const router = new express.Router();

router.get("/user/:userId/profile", auth, async (req, res) => {
  try {
    const { page = 1, limit = 10 } = req.query;
    const userId = req.params.userId;
    const currentUserId = req.user._id;

    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).send({ error: "Invalid user ID" });
    }

    // Fetch user profile
    const userPromise = User.findById(userId)
      .select("name email coins avatar createdAt")
      .lean();

    // Fetch posts for the user
    const postsPromise = newPost
      .find({ owner: userId })
      .select(
        "description price avaliable server discord good_response bad_response voters tradeStatus media shares createdAt reactions"
      )
      .populate("owner", "name email")
      .populate("voters", "name")
      .skip((page - 1) * limit)
      .limit(Number(limit))
      .sort({ createdAt: -1 })
      .lean();

    const totalPostsPromise = newPost.countDocuments({ owner: userId });
    const completedTradesCountPromise = newPost.countDocuments({
      owner: userId,
      tradeStatus: "completed",
    });

    const [user, posts, totalPosts, completedTradesCount] = await Promise.all([
      userPromise,
      postsPromise,
      totalPostsPromise,
      completedTradesCountPromise,
    ]);

    if (!user) {
      return res.status(404).send({ error: "User not found" });
    }

    const reactionTypes = ["like", "love", "haha"];

    // Attach userReaction per post
    const postsWithUserReaction = posts.map((post) => {
      let userReaction = null;

      for (const type of reactionTypes) {
        if (
          post.reactions &&
          post.reactions[type] &&
          post.reactions[type].some((uid) => uid.equals(currentUserId))
        ) {
          userReaction = type;
          break;
        }
      }

      return {
        ...post,
        userReaction,
        media: post.media || [],
        voters: post.voters || [],
        sharesCount: post.shares?.length || 0,
      };
    });

    res.send({
      user,
      posts: postsWithUserReaction,
      totalPosts,
      completedTradesCount,
    });
  } catch (error) {
    console.error("Error in /user/:userId/profile:", error);
    res.status(500).send({ error: "Failed to fetch profile and posts" });
  }
});
// Add reaction to post
router.post("/posts/:id/react", auth, async (req, res) => {
  try {
    const { reactionType } = req.body;
    const validReactions = ["like", "love", "haha"];

    if (!validReactions.includes(reactionType)) {
      return res.status(400).send({ error: "Invalid reaction type" });
    }

    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).send({ error: "Invalid post ID" });
    }

    const post = await newPost.findById(req.params.id);
    if (!post) {
      return res.status(404).send({ error: "Post not found" });
    }

    // Remove user from all reactions first
    validReactions.forEach((type) => {
      post.reactions[type] = post.reactions[type].filter(
        (userId) => !userId.equals(req.user._id)
      );
    });

    // Add user to selected reaction
    post.reactions[reactionType].push(req.user._id);
    await post.save();

    // Calculate updated reaction counts
    const reactionSummary = validReactions.reduce((acc, type) => {
      acc[type] = post.reactions[type].length;
      return acc;
    }, {});

    // Find user's current reaction (should be reactionType, but let's verify)
    let userReaction = null;
    for (const type of validReactions) {
      if (post.reactions[type].some((userId) => userId.equals(req.user._id))) {
        userReaction = type;
        break;
      }
    }

    res.send({
      reactions: reactionSummary,
      userReaction,
    });
  } catch (e) {
    console.error("Error updating reaction:", e);
    res.status(500).send({ error: "Failed to update reaction" });
  }
});

// Add reply to comment
router.post(
  "/posts/:postId/comments/:commentId/reply",
  auth,
  async (req, res) => {
    try {
      const { text } = req.body;

      if (!text || text.trim().length === 0) {
        return res.status(400).send({ error: "Reply text is required" });
      }

      if (
        !mongoose.Types.ObjectId.isValid(req.params.postId) ||
        !mongoose.Types.ObjectId.isValid(req.params.commentId)
      ) {
        return res.status(400).send({ error: "Invalid ID" });
      }

      const post = await newPost.findById(req.params.postId);
      if (!post) {
        return res.status(404).send({ error: "Post not found" });
      }

      const comment = post.comments.id(req.params.commentId);
      if (!comment) {
        return res.status(404).send({ error: "Comment not found" });
      }

      comment.replies.push({
        user: req.user._id,
        text: text.trim(),
      });

      await post.save();

      const savedReply = comment.replies[comment.replies.length - 1];
      await newPost.populate(savedReply, {
        path: "user",
        select: "name avatar",
      });

      res.send(savedReply);
    } catch (e) {
      res.status(500).send({ error: "Failed to add reply" });
    }
  }
);

// Share a post
router.post("/posts/:id/share", auth, async (req, res) => {
  try {
    const postId = req.params.id;

    if (!mongoose.Types.ObjectId.isValid(postId)) {
      return res.status(400).send({ error: "Invalid post ID" });
    }

    const post = await newPost.findById(postId);

    if (!post) {
      return res.status(404).send({ error: "Post not found" });
    }

    // Check if user already shared
    const alreadyShared = post.shares.some(
      (share) => share.user.toString() === req.user._id.toString()
    );

    if (alreadyShared) {
      return res.status(400).send({ error: "You already shared this post" });
    }

    // Add the share
    post.shares.push({
      user: req.user._id,
      sharedAt: new Date(),
    });

    await post.save();

    res.send({ success: true, sharesCount: post.shares.length });
  } catch (e) {
    console.error(e);
    res.status(500).send({ error: "Failed to share post" });
  }
});

// Get post details
router.get("/posts/:id", async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).send({ error: "Invalid post ID" });
    }

    const post = await newPost
      .findById(req.params.id)
      .populate("owner", "name avatar")
      .populate("comments.user", "name avatar")
      .populate("comments.replies.user", "name avatar")
      .populate("reactions.like", "name avatar")
      .populate("reactions.love", "name avatar")
      .populate("reactions.haha", "name avatar")
      .populate("shares.user", "name avatar")
      .lean();

    if (!post) {
      return res.status(404).send({ error: "Post not found" });
    }

    // Format response
    const response = {
      ...post,
      reactionSummary: {
        like: post.reactions.like.length,
        love: post.reactions.love.length,
        haha: post.reactions.haha.length,
      },
      comments: post.comments.map((comment) => ({
        ...comment,
        replies: comment.replies || [],
      })),
      shares: post.shares || [],
    };

    res.send(response);
  } catch (e) {
    res.status(500).send({ error: "Failed to fetch post" });
  }
});

module.exports = router;
