const express = require("express");
const router = new express.Router();
const auth = require("../middleware/auth");
const User = require("../models/user");

// Deposit coins
router.post("/deposit", auth, async (req, res) => {
  const { amount } = req.body;
  if (!amount || amount <= 0) {
    return res.status(400).send({ error: "Invalid deposit amount." });
  }

  try {
    req.user.coins += amount;
    await req.user.save();
    res.send({ message: "Deposit successful", coins: req.user.coins });
  } catch (e) {
    res.status(500).send({ error: "Deposit failed." });
  }
});

// Withdraw coins
router.post("/withdraw", auth, async (req, res) => {
  const { amount } = req.body;
  if (!amount || amount <= 0) {
    return res.status(400).send({ error: "Invalid withdraw amount." });
  }

  if (req.user.coins < amount) {
    return res.status(400).send({ error: "Insufficient balance." });
  }

  try {
    req.user.coins -= amount;
    await req.user.save();
    res.send({ message: "Withdraw successful", coins: req.user.coins });
  } catch (e) {
    res.status(500).send({ error: "Withdraw failed." });
  }
});

module.exports = router;
