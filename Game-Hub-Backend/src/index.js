const express = require("express");
const http = require("http");
const socketIO = require("socket.io");
const { app, setSocketIO } = require("./app");
const axios = require("axios");
const User = require("./models/user");
const Chat = require("./models/chat");

const { finalizeDueTrades } = require("./services/tradeFinalizer");

const server = http.createServer(app);

// ✅ CORS for Socket.IO
const allowedOrigins = [
  "http://localhost:3000",
  "https://game-4jdkbo5s3-game-hub2.vercel.app",
];

const io = socketIO(server, {
  cors: {
    origin: allowedOrigins,
    methods: ["GET", "POST"],
    credentials: true,
  },
});

// ✅ Give app.js access to io
setSocketIO(io);

// Socket.IO handlers
io.on("connection", (socket) => {
  console.log("✅ A user connected");

  socket.on("joinRoom", ({ roomId }) => {
    socket.join(roomId);
    console.log(`📥 User ${socket.id} joined room: ${roomId}`);
  });

  socket.on("sendMessage", async ({ roomId, message, sender }) => {
    try {
      const user = await User.findById(sender).select("name");
      if (!user) return;

      const newMessage = await Chat.create({
        roomId,
        message,
        sender,
        status: "sent",
      });

      io.to(roomId).emit("receiveMessage", {
        message: newMessage.message,
        sender: newMessage.sender,
        senderName: user.name,
        createdAt: newMessage.createdAt,
        status: newMessage.status,
      });
    } catch (err) {
      console.error("❌ sendMessage error:", err);
    }
  });

  socket.on("markAsSeen", async ({ roomId, userId }) => {
    try {
      await Chat.updateMany(
        {
          roomId,
          sender: { $ne: userId },
          status: { $ne: "seen" },
        },
        { $set: { status: "seen" } }
      );
      io.to(roomId).emit("messagesSeen", { roomId, seenBy: userId });
    } catch (err) {
      console.error("❌ markAsSeen error:", err);
    }
  });

  socket.on("typing", ({ roomId, sender }) => {
    socket.to(roomId).emit("typing", { sender });
  });

  socket.on("disconnect", () => {
    console.log("❎ User disconnected");
  });
});

// Auto-finalize trades
const FINALIZE_INTERVAL_MS = 5 * 60 * 1000; // 5 minutes
setInterval(async () => {
  try {
    const result = await finalizeDueTrades({ io });
    if (result?.finalizedCount > 0) {
      console.log(
        `[Trade Finalizer] finalized ${result.finalizedCount} trades`
      );
    }
  } catch (err) {
    console.error("[Trade Finalizer] unexpected error:", err);
  }
}, FINALIZE_INTERVAL_MS);

// Start server
const port = process.env.PORT || 3001;
server.listen(port, () => {
  console.log("🚀 Server running on port " + port);
});
