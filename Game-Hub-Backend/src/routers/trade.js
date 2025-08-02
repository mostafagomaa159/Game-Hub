const express = require("express");
const Trade = require("../models/Trade");
const User = require("../models/user");
const auth = require("../middleware/auth");

const router = new express.Router();

router.patch("/trade/:id/confirm", auth, async (req, res) => {
  try {
    const trade = await Trade.findById(req.params.id);
    if (!trade) return res.status(404).send({ error: "Trade not found" });

    if (
      String(trade.buyer) !== String(req.user._id) &&
      String(trade.seller) !== String(req.user._id)
    ) {
      return res.status(403).send({ error: "Not authorized" });
    }

    if (String(trade.buyer) === String(req.user._id)) {
      trade.buyerConfirmed = true;
    }

    if (String(trade.seller) === String(req.user._id)) {
      trade.sellerConfirmed = true;
    }

    // If both confirmed
    if (trade.buyerConfirmed && trade.sellerConfirmed) {
      trade.status = "completed";

      const seller = await User.findById(trade.seller);
      seller.coins += trade.price;
      await seller.save();
    } else if (trade.buyerConfirmed) {
      trade.status = "buyer_confirmed";
    } else if (trade.sellerConfirmed) {
      trade.status = "seller_confirmed";
    }

    await trade.save();
    res.send(trade);
  } catch (e) {
    console.error("Confirm trade error:", e);
    res.status(500).send({ error: "Failed to confirm trade" });
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
