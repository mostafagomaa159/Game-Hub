const mongoose = require("mongoose");

const disputeSchema = new mongoose.Schema(
  {
    post: { type: mongoose.Schema.Types.ObjectId, ref: "newPost" },

    buyer: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    seller: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    reason: { type: String }, // move this up from nested
    note: { type: String },
    videoUrls: [{ type: String }],
    status: { type: String, enum: ["open", "resolved"], default: "open" },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Dispute", disputeSchema);
