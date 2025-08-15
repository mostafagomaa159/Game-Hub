const express = require("express");
const router = express.Router();
const auth = require("../middleware/auth");
const adminAuth = require("../middleware/adminAuth");
const Transaction = require("../models/transaction");
const User = require("../models/user");
const { client } = require("../utils/paypalClient");
const sendPaypalPayout = require("../utils/sendPaypalPayout");
const axios = require("axios");
const TradeTransaction = require("../models/TradeTransaction");

// Email validation helper
const isValidEmail = (email) => {
  const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return regex.test(email);
};
// 👮 Admin: Shortcut to get all pending withdrawals
router.get("/transactions/pending", auth, adminAuth, async (req, res) => {
  try {
    const pendingWithdrawals = await Transaction.find({
      type: "withdraw",
      status: "pending",
    })
      .populate("userId", "name email") // ✅ important!
      .sort({ createdAt: -1 });

    res.send(pendingWithdrawals);
  } catch (e) {
    res.status(500).send({ error: "Failed to fetch pending withdrawals" });
  }
});

// 💰 Deposit Request (PayPal or Bank)
router.post("/transactions/deposit", auth, async (req, res) => {
  try {
    const { amount, method, iban, accountNumber } = req.body;

    // ✅ Minimum 10 coins check
    if (!amount || amount < 10) {
      return res.status(400).send({
        error: "Minimum deposit amount is 10 coins",
      });
    }

    if (!["paypal", "bank"].includes(method)) {
      return res.status(400).send({ error: "Unsupported deposit method" });
    }

    if (method === "bank") {
      const ibanRegex = /^[A-Z0-9]{15,34}$/;
      const accRegex = /^[0-9]{6,20}$/;

      const ibanInvalid = !iban || !ibanRegex.test(iban);
      const accInvalid = !accountNumber || !accRegex.test(accountNumber);

      if (ibanInvalid && accInvalid) {
        return res
          .status(400)
          .send({ error: "Please enter a valid IBAN and account number." });
      } else if (ibanInvalid) {
        return res.status(400).send({ error: "Please enter a valid IBAN." });
      } else if (accInvalid) {
        return res
          .status(400)
          .send({ error: "Please enter a valid account number." });
      }

      const existing = await Transaction.findOne({
        userId: req.user._id,
        type: "deposit",
        method: "bank",
        amount,
        iban,
        accountNumber,
      });

      if (existing) {
        return res
          .status(400)
          .send({ error: "This bank deposit has already been submitted." });
      }
    }

    const transaction = new Transaction({
      userId: req.user._id,
      type: "deposit",
      amount,
      method,
      status: "pending", // 👈 pending now
      iban: method === "bank" ? iban : undefined,
      accountNumber: method === "bank" ? accountNumber : undefined,
    });

    await transaction.save();

    res.status(201).send(transaction);
  } catch (e) {
    console.error("Deposit error:", e);
    res.status(400).send({
      error: "Failed to deposit",
      details: e.errors || null,
    });
  }
});

// 👮 Admin: Get all pending deposits
router.get(
  "/transactions/pending-deposits",
  auth,
  adminAuth,
  async (req, res) => {
    try {
      const pendingDeposits = await Transaction.find({
        type: "deposit",
        status: "pending",
      })
        .populate("userId", "name email")
        .sort({ createdAt: -1 });
      res.send(pendingDeposits);
    } catch (e) {
      res.status(500).send({ error: "Failed to fetch pending deposits" });
    }
  }
);
router.get(
  "/transactions/pending-withdrawals",
  auth,
  adminAuth,
  async (req, res) => {
    try {
      const pendingWithdrawals = await Transaction.find({
        type: "withdraw",
        status: "pending",
      })
        .populate("userId", "name email")
        .sort({ createdAt: -1 });
      res.send(pendingWithdrawals);
    } catch (e) {
      res.status(500).send({ error: "Failed to fetch pending withdrawals" });
    }
  }
);

// ✅ Admin: Approve/Reject Bank Deposit
router.patch(
  "/transactions/:id/approve-deposit",
  auth,
  adminAuth,
  async (req, res) => {
    try {
      const transaction = await Transaction.findById(req.params.id);
      if (!transaction || transaction.type !== "deposit") {
        return res.status(404).send({ error: "Transaction not found" });
      }

      if (transaction.status !== "pending") {
        return res.status(400).send({ error: "Transaction already processed" });
      }

      const { status, adminNote } = req.body;
      if (!["approved", "rejected"].includes(status)) {
        return res.status(400).send({ error: "Invalid status" });
      }

      transaction.status = status;

      transaction.adminLog = {
        adminId: req.user._id,
        decision: status,
        note: adminNote || "",
        timestamp: new Date(),
      };

      transaction.adminLogs.push({
        message: `Deposit ${status} by admin ${req.user._id}${
          adminNote ? `: ${adminNote}` : ""
        }`,
        timestamp: new Date(),
      });

      // Credit coins if approved
      if (status === "approved") {
        const user = await User.findById(transaction.userId);
        if (user) {
          user.coins += transaction.amount;
          await user.save();
        }
      }

      await transaction.save();

      res.send(transaction);
    } catch (e) {
      console.error("Approval error:", e);
      res.status(400).send({ error: "Failed to approve deposit" });
    }
  }
);

// 💸 Withdraw Request
router.post("/transactions/withdraw", auth, async (req, res) => {
  try {
    const { amount, method, paypalEmail, iban, accountNumber } = req.body;

    // ✅ Minimum 10 coins + balance check
    if (!amount || amount < 10 || req.user.coins < amount) {
      return res.status(400).send({
        error:
          "Minimum withdrawal is 10 coins and must not exceed your available balance",
      });
    }

    if (!["paypal", "bank"].includes(method)) {
      return res.status(400).send({ error: "Unsupported withdrawal method" });
    }

    if (method === "paypal") {
      if (!paypalEmail || !isValidEmail(paypalEmail)) {
        return res
          .status(400)
          .send({ error: "Invalid or missing PayPal email" });
      }
    }

    if (method === "bank") {
      if (!iban || !accountNumber) {
        return res
          .status(400)
          .send({ error: "Missing IBAN or account number" });
      }
    }

    const transaction = new Transaction({
      userId: req.user._id,
      type: "withdraw",
      amount,
      method,
      status: "pending",
      paypalEmail: paypalEmail || null,
      iban: iban || null,
      accountNumber: accountNumber || null,
    });

    // 🚨 Anti-fraud check
    if (amount > req.user.coins * 0.8) {
      transaction.fraudFlag = true;
      transaction.notes =
        "Withdraw exceeds 80% of balance – flagged for review.";
    }

    await transaction.save();

    req.user.coins -= amount;
    await req.user.save();

    res.status(201).send(transaction);
  } catch (e) {
    console.error("Withdraw error:", e);
    res.status(400).send({ error: "Failed to request withdrawal" });
  }
});

router.post("/transactions/deposit/paypal", auth, async (req, res) => {
  const { amount } = req.body;

  try {
    const auth = Buffer.from(
      `${process.env.PAYPAL_CLIENT_ID}:${process.env.PAYPAL_CLIENT_SECRET}`
    ).toString("base64");
    const tokenRes = await axios.post(
      "https://api-m.sandbox.paypal.com/v1/oauth2/token",
      "grant_type=client_credentials",
      {
        headers: {
          Authorization: `Basic ${auth}`,
          "Content-Type": "application/x-www-form-urlencoded",
        },
      }
    );

    const accessToken = tokenRes.data.access_token;

    const orderRes = await axios.post(
      "https://api-m.sandbox.paypal.com/v2/checkout/orders",
      {
        intent: "CAPTURE",
        purchase_units: [
          {
            amount: {
              currency_code: "USD",
              value: amount.toFixed(2),
            },
          },
        ],
        application_context: {
          return_url: "http://localhost:3000/deposit-success",
          cancel_url: "http://localhost:3000/deposit-cancel",
        },
      },
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
      }
    );

    const approvalUrl = orderRes.data.links.find(
      (l) => l.rel === "approve"
    ).href;
    res.send({ approvalUrl });
  } catch (e) {
    console.error("PayPal error", e?.response?.data || e.message);
    res.status(500).send({ error: "Failed to initiate PayPal payment." });
  }
});
// 🧾 Get Current User Transactions
router.get("/transactions/me", auth, async (req, res) => {
  try {
    const transactions = await Transaction.find({ userId: req.user._id }).sort({
      createdAt: -1,
    });
    res.send(transactions);
  } catch (e) {
    res.status(500).send({ error: "Failed to fetch transactions" });
  }
});

// 👮 Admin: Get Withdrawals with Pagination
router.get("/transactions/withdrawals", auth, adminAuth, async (req, res) => {
  try {
    const { status = "pending", page = 1, limit = 10 } = req.query;

    const withdrawals = await Transaction.find({
      type: "withdraw",
      status,
    })
      .populate("userId", "name email") // 👈 ADD THIS LINE
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit));

    const total = await Transaction.countDocuments({
      type: "withdraw",
      status,
    });

    res.send({
      data: withdrawals,
      page: Number(page),
      limit: Number(limit),
      total,
    });
  } catch (e) {
    res.status(500).send({ error: "Failed to fetch withdrawals" });
  }
});
// ✅ Admin: Approve/Reject Withdrawal
router.patch("/transactions/:id/approve", auth, adminAuth, async (req, res) => {
  console.log("PATCH /transactions/:id/approve called with id:", req.params.id);
  try {
    const transaction = await Transaction.findById(req.params.id);
    if (!transaction || transaction.type !== "withdraw") {
      return res.status(404).send({ error: "Transaction not found" });
    }

    if (transaction.status !== "pending") {
      return res.status(400).send({ error: "Transaction already processed" });
    }

    const { status, adminNote } = req.body;
    if (!["approved", "rejected"].includes(status)) {
      return res.status(400).send({ error: "Invalid status" });
    }

    transaction.status = status;

    // Add admin log
    transaction.adminLog = {
      adminId: req.user._id,
      decision: status,
      note: adminNote || "",
      timestamp: new Date(),
    };

    transaction.adminLogs.push({
      message: `Transaction ${status} by admin ${req.user._id}${
        adminNote ? `: ${adminNote}` : ""
      }`,
      timestamp: new Date(),
    });

    // Refund if rejected
    if (status === "rejected") {
      const user = await User.findById(transaction.userId);
      if (user) {
        user.coins += transaction.amount;
        await user.save();
      }
    }

    // Handle payout if approved
    if (status === "approved" && transaction.method === "paypal") {
      try {
        const payout = await sendPaypalPayout(
          transaction.amount,
          transaction.paypalEmail
        );

        transaction.payoutBatchId = payout.batch_header.payout_batch_id;
        transaction.payoutStatus = payout.batch_header.batch_status;
        transaction.payoutTrackingLink = payout.links?.[0]?.href || null;

        console.log("✅ PayPal payout success:", payout.batch_header);
      } catch (paypalErr) {
        console.error("❌ PayPal payout failed:", paypalErr);
        return res.status(500).send({ error: "PayPal payout failed" });
      }
    }

    await transaction.save();

    res.send(transaction);
  } catch (e) {
    console.error("Approval error:", e);
    res.status(400).send({ error: "Failed to update transaction" });
  }
});

// Approve or reject a deposit transaction
router.patch(
  "/transactions/:id/approve-deposit",
  auth,
  adminAuth,
  async (req, res) => {
    try {
      const transaction = await Transaction.findById(req.params.id);
      if (!transaction || transaction.type !== "deposit") {
        return res.status(404).send({ error: "Deposit transaction not found" });
      }

      if (transaction.status !== "pending") {
        return res.status(400).send({ error: "Transaction already processed" });
      }

      const { status, adminNote } = req.body;
      if (!["approved", "rejected"].includes(status)) {
        return res.status(400).send({ error: "Invalid status" });
      }

      transaction.status = status;

      // Admin log
      transaction.adminLog = {
        adminId: req.user._id,
        decision: status,
        note: adminNote || "",
        timestamp: new Date(),
      };

      transaction.adminLogs.push({
        message: `Deposit transaction ${status} by admin ${req.user._id}${
          adminNote ? `: ${adminNote}` : ""
        }`,
        timestamp: new Date(),
      });

      if (status === "approved") {
        // Credit user coins
        const user = await User.findById(transaction.userId);
        if (user) {
          user.coins += transaction.amount;
          await user.save();
        }
      }

      await transaction.save();

      res.send(transaction);
    } catch (e) {
      console.error("Deposit approval error:", e);
      res.status(400).send({ error: "Failed to update deposit transaction" });
    }
  }
);

//Deposit Section!!!
router.post("/transactions/deposit/paypal", auth, async (req, res) => {
  const { amount } = req.body;

  if (!amount || amount <= 0) {
    return res.status(400).send({ error: "Invalid amount" });
  }

  try {
    const authHeader = Buffer.from(
      `${process.env.PAYPAL_CLIENT_ID}:${process.env.PAYPAL_CLIENT_SECRET}`
    ).toString("base64");

    // Get PayPal access token
    const tokenRes = await axios.post(
      "https://api-m.sandbox.paypal.com/v1/oauth2/token",
      "grant_type=client_credentials",
      {
        headers: {
          Authorization: `Basic ${authHeader}`,
          "Content-Type": "application/x-www-form-urlencoded",
        },
      }
    );

    const accessToken = tokenRes.data.access_token;

    // Create PayPal order
    const orderRes = await axios.post(
      "https://api-m.sandbox.paypal.com/v2/checkout/orders",
      {
        intent: "CAPTURE",
        purchase_units: [
          {
            amount: {
              currency_code: "USD",
              value: amount.toFixed(2),
            },
          },
        ],
        application_context: {
          return_url: "http://localhost:3000/deposit-success",
          cancel_url: "http://localhost:3000/deposit-cancel",
        },
      },
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
      }
    );

    const approvalUrl = orderRes.data.links.find(
      (link) => link.rel === "approve"
    )?.href;

    res.send({ approvalUrl });
  } catch (e) {
    console.error("PayPal error:", e.response?.data || e.message);
    res.status(500).send({ error: "Failed to initiate PayPal payment." });
  }
});

// ✅ Capture PayPal payment and credit coins
// ✅ changes are inside /transactions/deposit/paypal/capture 👇
router.get("/transactions/deposit/paypal/capture", auth, async (req, res) => {
  const { token } = req.query;

  if (!token) {
    return res.status(400).send({ error: "Missing PayPal token." });
  }

  try {
    const authHeader = Buffer.from(
      `${process.env.PAYPAL_CLIENT_ID}:${process.env.PAYPAL_CLIENT_SECRET}`
    ).toString("base64");

    const tokenRes = await axios.post(
      "https://api-m.sandbox.paypal.com/v1/oauth2/token",
      "grant_type=client_credentials",
      {
        headers: {
          Authorization: `Basic ${authHeader}`,
          "Content-Type": "application/x-www-form-urlencoded",
        },
      }
    );

    const accessToken = tokenRes.data.access_token;

    const captureRes = await axios.post(
      `https://api-m.sandbox.paypal.com/v2/checkout/orders/${token}/capture`,
      {},
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
      }
    );

    const captured = captureRes.data;
    const capturedAmount = parseFloat(
      captured.purchase_units[0].payments.captures[0].amount.value
    );

    // Create transaction using actual captured amount
    const transaction = new Transaction({
      userId: req.user._id,
      type: "deposit",
      amount: capturedAmount,
      method: "paypal",
      status: "pending", // Coins added only after admin approval
      paypalOrderId: token,
    });

    await transaction.save();

    res.redirect("http://localhost:3000/deposit-success?status=pending");
  } catch (e) {
    console.error("PayPal capture error:", e.response?.data || e.message);
    res.redirect("http://localhost:3000/deposit-success?status=failed");
  }
});

// Fetch all pending withdrawals (admin only)
router.get("/transactions/pending", auth, adminAuth, async (req, res) => {
  try {
    const pending = await Transaction.find({
      type: "withdraw",
      status: "pending",
    }).sort({ createdAt: -1 });
    res.send(pending);
  } catch (e) {
    console.error("Failed to load pending transactions", e);
    res.status(500).send({ error: "Internal server error" });
  }
});

router.patch("/transactions/:id/note", auth, adminAuth, async (req, res) => {
  try {
    const transaction = await Transaction.findById(req.params.id);
    if (!transaction)
      return res.status(404).json({ message: "Transaction not found" });

    transaction.adminNote = req.body.note;
    await transaction.save();

    res.json({ message: "Note updated", adminNote: transaction.adminNote });
  } catch (err) {
    console.error("Failed to update note:", err);
    res.status(500).json({ message: "Server error" });
  }
});
router.get("/transactions/summary", auth, adminAuth, async (req, res) => {
  console.log("Incoming request to /transactions/summary");
  try {
    const depositsCount = await Transaction.countDocuments({
      type: "deposit",
      status: "pending",
    });

    const withdrawalsCount = await Transaction.countDocuments({
      type: "withdraw",
      status: "pending",
    });

    const processedCount = await Transaction.countDocuments({
      status: { $in: ["approved", "rejected"] },
    });

    const activeUsersCount = await User.countDocuments({ isActive: true });

    const disputesCount = await TradeTransaction.countDocuments({
      status: { $in: "disputed" },
    });

    const tradeHistoryCount = await TradeTransaction.countDocuments({
      status: { $in: ["completed", "released", "resolved"] },
    });

    console.log("Summary counts:", {
      depositsCount,
      withdrawalsCount,
      processedCount,
      activeUsersCount,
      disputesCount,
      tradeHistoryCount,
    });

    res.send({
      deposits: depositsCount,
      withdrawals: withdrawalsCount,
      processed: processedCount,
      activeUsers: activeUsersCount,
      disputes: disputesCount,
      tradeHistory: tradeHistoryCount,
    });
  } catch (error) {
    console.error("Error fetching transaction summary", error);
    res.status(500).send({ error: "Failed to fetch transaction summary" });
  }
});

router.get("/transactions/processed", auth, adminAuth, async (req, res) => {
  try {
    const transactions = await Transaction.find({
      status: { $in: ["approved", "rejected"] },
    }).populate("userId", "name email");

    res.send(transactions);
  } catch (err) {
    console.error("Error fetching processed transactions", err);
    res.status(500).send({ error: "Failed to load processed transactions" });
  }
});

module.exports = router;
