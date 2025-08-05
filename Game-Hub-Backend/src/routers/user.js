const express = require("express");
const User = require("../models/user");
const sharp = require("sharp");
const auth = require("../middleware/auth");
const Transaction = require("../models/transaction");
const multer = require("multer");
const newPost = require("../models/newPost");
const router = new express.Router();
const Trade = require("../models/Trade");

// Register
router.post("/users", async (req, res) => {
  const user = new User(req.body);
  try {
    await user.save();
    // sendWelcomeEmail(user.email, user.name);
    const token = await user.generateAuthToken();
    res.status(201).send({ user, token });
  } catch (e) {
    res
      .status(400)
      .send({ error: "Registration failed. Email may already be in use." });
  }
});
router.get("/users", auth, async (req, res) => {
  try {
    const users = await User.find().select("name email createdAt");
    res.send(users);
  } catch (e) {
    res.status(500).send({ error: "Failed to fetch users" });
  }
});

// Login
router.post("/users/login", async (req, res) => {
  try {
    const user = await User.findByCredentials(
      req.body.email,
      req.body.password
    );
    const token = await user.generateAuthToken();
    res.send({ user, token });
  } catch (e) {
    // Send a clear message to the frontend
    res.status(400).send({
      message: e.message,
    });
  }
});

// Logout
router.post("/users/logout", auth, async (req, res) => {
  try {
    req.user.tokens = req.user.tokens.filter(
      (token) => token.token !== req.token
    );
    await req.user.save();
    res.send("LoggedOut Successfully!");
  } catch (e) {
    res.status(500).send();
  }
});

// Logout All
router.post("/users/logoutAll", auth, async (req, res) => {
  try {
    req.user.tokens = [];
    await req.user.save();
    res.send();
  } catch (e) {
    res.status(500).send();
  }
});

// Get profile
router.get("/users/me", auth, async (req, res) => {
  res.send(req.user);
});

// Update profile
router.patch("/users/me", auth, async (req, res) => {
  const updates = Object.keys(req.body);
  const allowedUpdatees = ["name", "email", "password", "age"];
  const isValidOperation = updates.every((update) =>
    allowedUpdatees.includes(update)
  );

  if (!isValidOperation) {
    return res.status(400).send({ error: "Invalid updates!" });
  }

  try {
    updates.forEach((update) => (req.user[update] = req.body[update]));
    await req.user.save();
    res.send(req.user);
  } catch (e) {
    res.status(400).send(e);
  }
});

// Delete account
router.delete("/users/me", auth, async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    if (!user) return res.status(404).send({ error: "User not found" });

    await user.deleteOne();
    // await sendCancelationEmail(user.email, user.name);

    res.send(user);
  } catch (e) {
    console.error("Delete error:", e);
    res.status(400).send(e);
  }
});

// Avatar upload config
const upload = multer({
  limits: { fileSize: 1000000 },
  fileFilter(req, file, cb) {
    if (!file.originalname.match(/\.(png|jpeg|jpg)$/)) {
      return cb(new Error("Please upload only png or jpg or jpeg"));
    }
    cb(undefined, true);
  },
});

// Upload avatar
router.post(
  "/users/me/avatar",
  auth,
  upload.single("avatar"),
  async (req, res) => {
    const buffer = await sharp(req.file.buffer)
      .resize({ width: 250, height: 250 }) // fixed typo from `with` to `width`
      .png()
      .toBuffer();
    req.user.avatar = buffer;
    await req.user.save();
    res.send("Uploaded!");
  },
  (error, req, res, next) => {
    res.status(400).send({ error: error.message });
  }
);

// Delete avatar
router.delete("/users/me/avatar", auth, async (req, res) => {
  req.user.avatar = undefined;
  await req.user.save();
  res.send();
});

// Get user avatar
router.get("/users/:id/avatar", async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user || !user.avatar) throw new Error();
    res.set("Content-Type", "image/png");
    res.send(user.avatar);
  } catch (e) {
    res.status(400).send(e);
  }
});

// User trade history
router.get("/me/trade-history", auth, async (req, res) => {
  try {
    const userId = req.user._id;

    const posts = await newPost
      .find({
        tradeStatus: { $in: ["completed", "cancelled"] },
        $or: [{ owner: userId }, { buyer: userId }],
      })
      .select(
        "description price server tradeStatus tradeCompletedAt cancellationNote createdAt"
      )
      .populate("owner", "name email")
      .populate("buyer", "name email")
      .sort({ updatedAt: -1 });

    res.send(posts);
  } catch (err) {
    console.error("User Trade History Error:", err);
    res.status(500).send({ error: "Server Error" });
  }
});
// GET /me/trade-requests
router.get("/me/trade-requests", auth, async (req, res) => {
  try {
    const trades = await Trade.find({
      seller: req.user._id,
      status: "pending",
    });
    res.send({ count: trades.length });
  } catch (e) {
    res.status(500).send({ error: "Failed to load requests" });
  }
});
router.get("/me/sent-trade-requests", auth, async (req, res) => {
  try {
    const trades = await Trade.find({
      buyer: req.user._id,
      status: "pending",
    });
    res.send({ count: trades.length });
  } catch (e) {
    res.status(500).send({ error: "Failed to load sent requests" });
  }
});
router.get("/me/sent-trades", auth, async (req, res) => {
  try {
    const trades = await Trade.find({ buyer: req.user._id })
      .populate("seller", "name email")
      .populate("item");
    res.send(trades);
  } catch (e) {
    res.status(500).send({ error: "Failed to load sent trades" });
  }
});
router.get("/trade/:id", auth, async (req, res) => {
  try {
    const trade = await Trade.findById(req.params.id)
      .populate("buyer", "name email")
      .populate("seller", "name email")
      .populate("item");
    if (!trade) return res.status(404).send({ error: "Trade not found" });
    res.send(trade);
  } catch (e) {
    res.status(500).send({ error: "Failed to fetch trade" });
  }
});

module.exports = router;
