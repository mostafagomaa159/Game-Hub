// models/TradeTransaction.js
const mongoose = require("mongoose");
const { Schema } = mongoose;

const disputeVideoSchema = new Schema(
  {
    url: { type: String, required: true },
    uploader: { type: Schema.Types.ObjectId, ref: "User", required: true },
    uploadedAt: { type: Date, default: Date.now },
  },
  { _id: false }
);

const disputeSchema = new Schema(
  {
    status: {
      type: String,
      enum: ["none", "open", "resolved"],
      default: "none",
    },
    reporter: { type: Schema.Types.ObjectId, ref: "User", default: null },
    videos: { type: [disputeVideoSchema], default: [] },
    adminNote: { type: String, default: "" },
    resolvedBy: { type: Schema.Types.ObjectId, ref: "User", default: null },
    resolvedAt: { type: Date, default: null },
  },
  { _id: false }
);

const tradeTransactionSchema = new Schema(
  {
    post: { type: Schema.Types.ObjectId, ref: "newPost", required: true }, // marketplace item
    buyer: { type: Schema.Types.ObjectId, ref: "User", required: true },
    seller: { type: Schema.Types.ObjectId, ref: "User", required: true },
    amount: { type: Number, required: true, min: 0 },

    // lifecycle: reserved -> pending_release -> released | refunded | disputed
    status: {
      type: String,
      enum: [
        "reserved", // buyer paid and item reserved
        "pending_release", // both confirmed, waiting releaseAt
        "released", // seller paid
        "refunded", // buyer refunded
        "disputed", // dispute opened
        "cancelled", // cancelled before reservation finalization
      ],
      default: "reserved",
    },

    // when to auto-release the funds (set when both confirm)
    releaseAt: { type: Date, default: null },

    // optional: reference to admin who accepted/handled
    adminHandledBy: { type: Schema.Types.ObjectId, ref: "User", default: null },
    adminHandledAt: { type: Date, default: null },

    // dispute subdocument
    dispute: { type: disputeSchema, default: () => ({}) },

    // small audit log
    logs: [
      {
        message: String,
        by: { type: Schema.Types.ObjectId, ref: "User", default: null },
        at: { type: Date, default: Date.now },
      },
    ],
  },
  { timestamps: true }
);

// helpful indexes for queries (worker, admin list)
tradeTransactionSchema.index({ status: 1, releaseAt: 1 });
tradeTransactionSchema.index({ seller: 1, buyer: 1, createdAt: -1 });

module.exports = mongoose.model("TradeTransaction", tradeTransactionSchema);
