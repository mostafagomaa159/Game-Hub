const express = require("express");
const Trade = require("../models/Trade");
const User = require("../models/user");
const auth = require("../middleware/auth");

const router = new express.Router();

router.post("/trade/:id/cancel", auth, async (req, res) => {
  try {
    const trade = await Trade.findById(req.params.id);
    if (!trade) return res.status(404).send({ error: "Trade not found" });

    const isBuyer = String(trade.buyer) === String(req.user._id);
    const isSeller = String(trade.seller) === String(req.user._id);

    if (!isBuyer && !isSeller) {
      return res.status(403).send({ error: "Not authorized" });
    }

    // ❌ Block cancel if user has already confirmed
    if (
      (isBuyer && trade.buyerConfirmed) ||
      (isSeller && trade.sellerConfirmed)
    ) {
      return res
        .status(403)
        .send({ error: "You have already confirmed this trade." });
    }

    trade.status = "cancelled";
    await trade.save();
    res.send({ success: true, post: trade });
  } catch (err) {
    console.error("Cancel trade error:", err);
    res.status(500).send({ error: "Failed to cancel trade" });
  }
});

// GET seller's incoming trade requests
router.get("/my-requests", auth, async (req, res) => {
  try {
    const trades = await Trade.find({ seller: req.user._id })
      .populate("buyer", "name email")
      .populate("item");
    res.send(trades);
  } catch (err) {
    console.error("Get trades error:", err);
    res.status(500).send({ error: "Failed to fetch trades" });
  }
});

module.exports = router;
