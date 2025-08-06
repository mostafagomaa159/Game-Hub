// index.js
const app = require("./app");
const http = require("http");
const socketIO = require("socket.io");
const axios = require("axios");
const User = require("./models/user");
const Chat = require("./models/chat");

// service to auto-finalize trades
const { finalizeDueTrades } = require("./services/tradeFinalizer");

const server = http.createServer(app);

const io = socketIO(server, {
  cors: {
    origin: [
      "http://localhost:3000",
      "https://game-hub-git-main-game-hub2.vercel.app",
      "https://game-aeas1daoo-game-hub2.vercel.app",
      "https://game-hub-one-vert.vercel.app",
      "https://game-hub.vercel.app",
    ],
    credentials: true,
  },
});

// ✅ Inject io into req object for all routes
app.use((req, res, next) => {
  req.io = io;
  next();
});

io.on("connection", (socket) => {
  console.log("✅ A user connected");

  // User joins a chat room
  socket.on("joinRoom", ({ roomId }) => {
    socket.join(roomId);
    console.log(`📥 User ${socket.id} joined room: ${roomId}`);
  });

  // Sending a message
  socket.on("sendMessage", async ({ roomId, message, sender }) => {
    try {
      const user = await User.findById(sender).select("name");
      if (!user) {
        console.error("❌ User not found:", sender);
        return;
      }

      const newMessage = await Chat.create({
        roomId,
        message,
        sender,
        status: "sent", // default
      });

      // Emit to everyone in room
      io.to(roomId).emit("receiveMessage", {
        message: newMessage.message,
        sender: newMessage.sender,
        senderName: user.name,
        createdAt: newMessage.createdAt,
        status: newMessage.status,
      });
    } catch (e) {
      console.error("❌ Failed to save message:", e);
    }
  });

  // Mark messages as seen
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

      // Notify sender(s)
      io.to(roomId).emit("messagesSeen", { roomId, seenBy: userId });
    } catch (e) {
      console.error("❌ Failed to mark messages as seen:", e);
    }
  });

  // Typing indicator
  socket.on("typing", ({ roomId, sender }) => {
    socket.to(roomId).emit("typing", { sender });
  });

  // Disconnect
  socket.on("disconnect", () => {
    console.log("❎ User disconnected");
  });
});

/**
 * Auto-finalizer: run finalizeDueTrades every minute.
 * This calls internal service directly (no HTTP self-call / admin JWT required).
 *
 * NOTE: If you run multiple instances of this server, ensure only one instance
 * performs the scheduled job (e.g. external cron, leader election, or run worker).
 */
const FINALIZE_INTERVAL_MS = 5 * 60 * 1000; // 1 minute

setInterval(async () => {
  try {
    const result = await finalizeDueTrades({ io });
    if (result && result.ok) {
      if (result.finalizedCount && result.finalizedCount > 0) {
        console.log(
          `[Trade Finalizer] finalized ${result.finalizedCount} trades`
        );
      } else {
        // no trades finalized this run; that's normal
        // console.debug(`[Trade Finalizer] no trades to finalize`);
      }
    } else if (result && result.reason) {
      // informational
      // console.debug(`[Trade Finalizer] info: ${result.reason}`);
    }
  } catch (err) {
    console.error("[Trade Finalizer] unexpected error:", err);
  }
}, FINALIZE_INTERVAL_MS);

const port = process.env.PORT || 3001;
server.listen(port, () => {
  console.log("🚀 Server running on port " + port);
});
