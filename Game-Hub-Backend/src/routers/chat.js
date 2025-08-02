const express = require("express");
const Chat = require("../models/chat");
const auth = require("../middleware/auth");

const router = new express.Router();

// GET /chat/:roomId
// backend route (chatController.js or similar)
router.get("/chat/:roomId", auth, async (req, res) => {
  try {
    const messages = await Chat.find({ roomId: req.params.roomId }).populate(
      "sender",
      "name"
    ); // ✅ populate sender with name only
    res.send(messages);
  } catch (e) {
    res.status(500).send({ error: "Failed to load messages" });
  }
});
// Marks all messages in the room as "seen" (if not sent by current user)
router.post("/chat/:roomId/mark-seen", auth, async (req, res) => {
  try {
    const userId = req.user._id; // authenticated user ID
    const { roomId } = req.params;

    await Chat.updateMany(
      {
        roomId,
        sender: { $ne: userId },
        status: { $ne: "seen" },
      },
      {
        $set: { status: "seen" },
      }
    );

    res.send({ success: true });
  } catch (err) {
    console.error("Failed to mark as seen:", err);
    res.status(500).send({ error: "Failed to mark messages as seen" });
  }
});

module.exports = router;
