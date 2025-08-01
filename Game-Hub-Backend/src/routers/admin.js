const express = require("express");
const router = express.Router();
const auth = require("../middleware/auth");
const adminAuth = require("../middleware/adminAuth");
const Transaction = require("../models/transaction");
const User = require("../models/user");
const newPost = require("../models/newPost"); // ✅ Added missing import

// Get paginated withdrawals (default: status=pending)
router.get("/withdrawals", auth, adminAuth, async (req, res) => {
  const { status = "pending", page = 1, limit = 10 } = req.query;
  const match = { type: "withdraw", status };

  try {
    const total = await Transaction.countDocuments(match);
    const transactions = await Transaction.find(match)
      .populate("userId", "name email") // Show who requested withdrawal
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit));

    res.json({
      transactions,
      totalPages: Math.ceil(total / limit),
      currentPage: Number(page),
    });
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch transactions" });
  }
});

// Approve a withdrawal
router.post("/withdrawals/:id/approve", auth, adminAuth, async (req, res) => {
  try {
    const transaction = await Transaction.findById(req.params.id);
    if (!transaction || transaction.status !== "pending") {
      return res
        .status(404)
        .json({ error: "Transaction not found or already processed" });
    }

    // Simulate PayPal payout
    console.log(
      `✅ Admin ${req.user.email} approved payout to ${transaction.methodEmail} for $${transaction.amount}`
    );

    transaction.status = "approved";
    await transaction.save();

    res.json({
      success: true,
      message: "Withdrawal approved and PayPal payout simulated.",
    });
  } catch (e) {
    res.status(500).json({ error: "Error approving withdrawal" });
  }
});

// Reject a withdrawal and refund coins
router.post("/withdrawals/:id/reject", auth, adminAuth, async (req, res) => {
  try {
    const transaction = await Transaction.findById(req.params.id);
    if (!transaction || transaction.status !== "pending") {
      return res
        .status(404)
        .json({ error: "Transaction not found or already processed" });
    }

    // Refund coins to the user
    const user = await User.findById(transaction.userId);
    if (user) {
      user.coins += transaction.amount;
      await user.save();
    }

    transaction.status = "rejected";
    await transaction.save();

    res.json({
      success: true,
      message: "Withdrawal rejected and coins refunded.",
    });
  } catch (e) {
    res.status(500).json({ error: "Error rejecting withdrawal" });
  }
});

// Admin Trade History Route
router.get("/admin/trade-history", auth, adminAuth, async (req, res) => {
  try {
    const posts = await newPost
      .find({ tradeStatus: { $in: ["completed", "cancelled"] } })
      .select(
        "description price server tradeStatus tradeCompletedAt cancellationNote createdAt updatedAt"
      )
      .populate("owner", "name email")
      .populate("buyer", "name email")
      .sort({ updatedAt: -1 });

    res.send(posts);
  } catch (err) {
    console.error("Admin Trade History Error:", err);
    res.status(500).send({ error: "Server Error" });
  }
});

// ✅ Optional: Admin route test
router.get("/admin/test", auth, adminAuth, (req, res) => {
  res.send({ message: "✅ Admin route working", user: req.user });
});

module.exports = router;
