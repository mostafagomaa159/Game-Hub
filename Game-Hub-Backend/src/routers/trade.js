const express = require("express");
const mongoose = require("mongoose");
const Trade = require("../models/Trade");
const User = require("../models/user");
const auth = require("../middleware/auth");
const adminAuth = require("../middleware/adminAuth");
const TradeTransaction = require("../models/TradeTransaction");
const router = new express.Router();

// Cancel trade route (updated with dispute check)
router.post("/trade/:id/cancel", auth, async (req, res) => {
  try {
    const trade = await Trade.findById(req.params.id);
    if (!trade) return res.status(404).send({ error: "Trade not found" });

    // Dispute check - cannot cancel during active dispute
    if (trade.dispute?.status === "open") {
      return res.status(400).send({
        error: "Cannot cancel trade during active dispute",
      });
    }

    const isBuyer = String(trade.buyer) === String(req.user._id);
    const isSeller = String(trade.seller) === String(req.user._id);

    if (!isBuyer && !isSeller) {
      return res.status(403).send({ error: "Not authorized" });
    }

    if (
      (isBuyer && trade.buyerConfirmed) ||
      (isSeller && trade.sellerConfirmed)
    ) {
      return res.status(403).send({
        error: "Cannot cancel after confirmation",
      });
    }

    trade.status = "cancelled";
    await trade.save();
    res.send({ success: true, trade });
  } catch (err) {
    console.error("Cancel trade error:", err);
    res.status(500).send({ error: "Failed to cancel trade" });
  }
});

// Get trade requests (updated with dispute data)
router.get("/my-requests", auth, async (req, res) => {
  try {
    const trades = await Trade.find({ seller: req.user._id })
      .populate("buyer", "name email")
      .populate("item")
      .populate("dispute.reports.reporter", "name avatar");

    res.send(
      trades.map((trade) => ({
        ...trade.toObject(),
        hasActiveDispute: trade.dispute?.status === "open",
      }))
    );
  } catch (err) {
    console.error("Get trades error:", err);
    res.status(500).send({ error: "Failed to fetch trades" });
  }
});

// Submit dispute report (buyer or seller)
router.post("/trade/:id/report", auth, async (req, res) => {
  try {
    const { reason, evidenceUrl, urgency = "medium" } = req.body;
    const trade = await Trade.findById(req.params.id);

    if (!trade) return res.status(404).send({ error: "Trade not found" });

    // Verify participant
    const isBuyer = String(trade.buyer) === String(req.user._id);
    const isSeller = String(trade.seller) === String(req.user._id);
    if (!isBuyer && !isSeller) {
      return res.status(403).send({ error: "Not authorized" });
    }

    // Initialize dispute object if first report
    if (!trade.dispute || trade.dispute.status !== "open") {
      trade.dispute = {
        status: "open",
        reports: [],
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24h deadline
      };
    }

    // Check for existing report from this user
    const existingReport = trade.dispute.reports.find(
      (r) => String(r.reporter) === String(req.user._id)
    );
    if (existingReport) {
      return res.status(400).send({
        error: "You already submitted a report for this trade",
      });
    }

    // Add new report
    trade.dispute.reports.push({
      reporter: req.user._id,
      role: isBuyer ? "buyer" : "seller",
      reason,
      evidenceUrl,
      urgency,
      reportedAt: new Date(),
    });

    // Update trade status and block release
    trade.status = "disputed";
    trade.releaseAt = null; // Stop automatic release

    await trade.save();

    // TODO: Notify other party about the dispute via sockets or email

    res.send({
      success: true,
      dispute: trade.dispute,
      message: isBuyer
        ? "Dispute report submitted. Seller has 24h to respond with evidence."
        : "Dispute report submitted. Buyer has 24h to respond with evidence.",
    });
  } catch (err) {
    console.error("Report submission error:", err);
    res.status(500).send({ error: "Failed to submit report" });
  }
});

// Get dispute details (participants or admin)
router.get("/trade/:id/dispute", auth, async (req, res) => {
  try {
    const trade = await TradeTransaction.findById(req.params.id)
      .populate("buyer", "name avatar")
      .populate("seller", "name avatar")
      .populate("post", "description");

    if (!trade) return res.status(404).send({ error: "Trade not found" });

    // Only allow buyer, seller, or admin
    const isParticipant =
      String(trade.buyer._id) === String(req.user._id) ||
      String(trade.seller._id) === String(req.user._id);

    if (!isParticipant && !req.user.isAdmin) {
      return res.status(403).send({ error: "Not authorized" });
    }

    // Respond with dispute info
    res.send({
      status: trade.dispute?.status || "none",
      sellerReport: trade.dispute?.sellerReport || null,
      buyerReport: trade.dispute?.buyerReport || null,
      expiresAt: trade.dispute?.expiresAt || null,
      adminDecision: trade.dispute?.adminDecision || null,
    });
  } catch (err) {
    console.error("Get dispute error:", err);
    res.status(500).send({ error: "Failed to fetch dispute details" });
  }
});
// --------------------
// Admin: Resolve dispute
// --------------------
router.post("/trade/:id/dispute/resolve", auth, adminAuth, async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    const tradeId = req.params.id;
    const { winner, adminNote = "" } = req.body; // winner = "buyer" or "seller"

    if (!["buyer", "seller"].includes(winner)) {
      return res.status(400).send({ error: "Invalid winner value" });
    }

    const trade = await Trade.findById(tradeId).session(session);
    if (!trade) {
      await session.abortTransaction();
      session.endSession();
      return res.status(404).send({ error: "Trade not found" });
    }

    // Check if dispute is open
    if (!trade.dispute || trade.dispute.status !== "open") {
      await session.abortTransaction();
      session.endSession();
      return res.status(400).send({ error: "No open dispute found" });
    }

    // Transfer coins to winner
    const amount = trade.price || 0;
    const buyer = await User.findById(trade.buyer).session(session);
    const seller = await User.findById(trade.seller).session(session);

    if (!buyer || !seller) {
      await session.abortTransaction();
      session.endSession();
      return res.status(404).send({ error: "User(s) not found" });
    }

    if (winner === "buyer") {
      buyer.coins += amount;
    } else {
      seller.coins += amount;
    }

    // Update dispute info
    trade.dispute.status = "resolved";
    trade.dispute.resolvedAt = new Date();
    trade.dispute.adminDecision = {
      winner,
      decidedAt: new Date(),
      adminNote,
    };

    // Update trade status
    trade.status = "completed";
    trade.releaseAt = null;

    // Save users and trade
    await buyer.save({ session });
    await seller.save({ session });
    await trade.save({ session });

    await session.commitTransaction();
    session.endSession();

    // Emit socket event to notify clients (adjust as per your socket setup)
    if (req.io) {
      req.io.emit("admin:dispute_resolved", {
        tradeId,
        winner,
        adminNote,
      });
    }

    res.send({
      message: `Dispute resolved. Coins released to ${winner}.`,
      trade,
    });
  } catch (err) {
    await session.abortTransaction().catch(() => {});
    session.endSession();
    console.error("Dispute resolution error:", err);
    res.status(500).send({ error: "Failed to resolve dispute" });
  }
});

module.exports = router;
