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
    buyer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    tradeStatus: {
      type: String,
      enum: [
        "available",
        "pending",
        "completed",
        "cancelled",
        "pending_release",
      ], // ✅ Added "available"
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
  },
  {
    timestamps: true,
  }
);

const newPost = mongoose.model("newPost", newPostSchema);

module.exports = newPost;
