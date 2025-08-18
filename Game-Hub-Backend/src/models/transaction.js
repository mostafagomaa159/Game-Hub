const mongoose = require("mongoose");

const transactionSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    type: {
      type: String,
      enum: ["deposit", "withdraw"],
      required: true,
    },
    amount: {
      type: Number,
      required: true,
      min: [10, "Amount must be at least 10"],
    },
    method: {
      type: String,
      enum: ["paypal", "bank"],
      required: true,
    },
    paypalEmail: {
      type: String,
      required() {
        return this.method === "paypal" && this.type === "withdraw";
      },
      validate: {
        validator(email) {
          return (
            this.method !== "paypal" || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
          );
        },
        message: "Invalid PayPal email format",
      },
    },
    screenshot: {
      type: String,
      required: true,
    },
    iban: {
      type: String,
      required() {
        return this.method === "bank";
      },
      validate: {
        validator(iban) {
          return this.method !== "bank" || /^[A-Z0-9]{15,34}$/.test(iban);
        },
        message: "Invalid IBAN format",
      },
    },
    accountNumber: {
      type: String,
      required() {
        return this.method === "bank";
      },

      validate: {
        validator(acc) {
          return this.method !== "bank" || /^[0-9]{6,20}$/.test(acc);
        },
        message: "Invalid account number format",
      },
    },
    status: {
      type: String,
      enum: ["pending", "approved", "rejected"],
      default: "pending",
    },
    fraudFlag: {
      type: Boolean,
      default: false,
    },
    notes: String,
    adminNote: {
      type: String,
      default: "",
    },
    payoutBatchId: String,
    payoutStatus: String,
    payoutTrackingLink: String,
    adminLog: {
      adminId: mongoose.Schema.Types.ObjectId,
      decision: String,
      note: String,
      timestamp: Date,
    },
    adminLogs: [
      {
        message: String,
        timestamp: Date,
      },
    ],
  },
  { timestamps: true }
);

module.exports = mongoose.model("Transaction", transactionSchema);
