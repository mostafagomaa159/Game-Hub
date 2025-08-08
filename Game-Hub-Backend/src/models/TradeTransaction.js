const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const disputeSchema = new Schema(
  {
    status: {
      type: String,
      enum: [
        "none",
        "seller_reported",
        "buyer_reported",
        "both_reported",
        "resolved",
      ],
      default: "none",
    },
    sellerReport: {
      reason: String,
      urgency: { type: String, enum: ["low", "medium", "high"] },
      evidenceUrl: String,
      reportedAt: Date,
    },
    buyerReport: {
      reason: String,
      urgency: { type: String, enum: ["low", "medium", "high"] },
      evidenceUrl: String,
      reportedAt: Date,
    },
    expiresAt: Date, // 24h deadline
    adminDecision: {
      winner: { type: String, enum: ["seller", "buyer"] },
      decidedAt: Date,
      adminNote: String,
    },
  },
  { _id: false }
);

const tradeTransactionSchema = new Schema(
  {
    post: {
      type: Schema.Types.ObjectId,
      ref: "newPost",
      required: true,
    },
    buyer: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    seller: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    amount: {
      type: Number,
      required: true,
      min: 0,
    },
    status: {
      type: String,
      enum: [
        "pending_release",
        "pending",
        "completed",
        "cancelled",
        "disputed",
        "resolved",
      ],
      default: "pending_release",
    },
    logs: [
      {
        message: String,
        by: { type: Schema.Types.ObjectId, ref: "User" },
        at: { type: Date, default: Date.now },
      },
    ],
    releaseAt: {
      type: Date,
      default: null,
      index: true,
    },
    dispute: disputeSchema,
    adminHandledBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    adminHandledAt: {
      type: Date,
      default: null,
    },
  },
  { timestamps: true }
);

const TradeTransaction = mongoose.model(
  "TradeTransaction",
  tradeTransactionSchema
);

module.exports = TradeTransaction;
