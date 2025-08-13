const mongoose = require("mongoose");

const newPostSchema = new mongoose.Schema(
  {
    description: {
      type: String,
      trim: true,
      required: true,
    },
    avaliable: {
      type: Boolean,
      default: false,
    },
    price: {
      type: Number,
      trim: true,
      required: true,
    },
    server: {
      type: String,
      trim: true,
      required: true,
    },

    discord: {
      type: String,
      trim: true,
    },
    good_response: {
      type: Number,
      default: 0,
    },
    bad_response: {
      type: Number,
      default: 0,
    },
    voters: {
      type: [mongoose.Schema.Types.ObjectId],
      ref: "User",
      default: [],
    },
    requests: {
      type: [mongoose.Schema.Types.ObjectId],
      ref: "User",
      default: [],
    },

    owner: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: "User",
    },
    buyers: {
      type: [mongoose.Schema.Types.ObjectId],
      ref: "User",
      default: [],
    },
    activeBuyerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null, // ✅ Track which buyer is active
    },
    tradeStatus: {
      type: String,
      enum: [
        "available",
        "pending",
        "completed",
        "cancelled",
        "pending_release",
      ],
      default: "available", // ✅ Changed from null to "available"
    },
    tradeConfirmations: {
      type: [mongoose.Schema.Types.ObjectId],
      default: [],
    },
    tradeCompletedAt: {
      type: Date,
      default: null,
    },
    cancellationNote: {
      type: String,
      trim: true,
      default: "",
    },
    purchaseAt: {
      type: Date,
      default: null,
    },
    releaseAt: {
      type: Date,
      default: null,
      index: true,
    },

    media: [
      {
        url: String,
        mediaType: { type: String, enum: ["image", "video"] },
      },
    ],
    reactions: {
      like: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
      love: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
      haha: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
      // Add more reaction types as needed
    },
    comments: [
      {
        user: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "User",
          required: true,
        },
        text: { type: String, required: true },
        createdAt: { type: Date, default: Date.now },
        replies: [
          {
            user: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
            text: String,
            createdAt: { type: Date, default: Date.now },
          },
        ],
        reactions: {
          like: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
        },
      },
    ],
    shares: [
      {
        user: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
        sharedAt: { type: Date, default: Date.now },
      },
    ],
  },
  {
    timestamps: true,
  }
);

const newPost = mongoose.model("newPost", newPostSchema);

module.exports = newPost;
