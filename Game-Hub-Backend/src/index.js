// index.js
const app = require("./app");
const http = require("http");
const socketIO = require("socket.io");
const axios = require("axios");
const User = require("./models/user");
const Chat = require("./models/chat");

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

const ADMIN_JWT_TOKEN = process.env.ADMIN_JWT_TOKEN || ""; // set this in your env (recommended)
if (!ADMIN_JWT_TOKEN) {
  console.warn(
    "⚠️  ADMIN_JWT_TOKEN not set. Finalize-trades background job will not run until you set ADMIN_JWT_TOKEN env var."
  );
}

const FINALIZE_INTERVAL_MS = 60 * 1000; // every 1 minute
const FINALIZE_URL =
  process.env.FINALIZE_URL || "http://localhost:3001/newpost/finalize-trades";

if (ADMIN_JWT_TOKEN) {
  // start background finalizer (runs in this Node process)
  setInterval(async () => {
    try {
      const res = await axios.post(FINALIZE_URL, null, {
        headers: {
          Authorization: `Bearer ${ADMIN_JWT_TOKEN}`,
        },
        timeout: 30 * 1000,
      });
      console.log("[Trade Finalizer]:", res.data?.message || "no message");
    } catch (err) {
      console.error(
        "[Trade Finalizer] Error:",
        err?.response?.data || err.message
      );
    }
  }, FINALIZE_INTERVAL_MS);

  console.log(
    `[Trade Finalizer] scheduled every ${FINALIZE_INTERVAL_MS / 1000}s`
  );
}

const port = process.env.PORT || 3001;
server.listen(port, () => {
  console.log("🚀 Server running on port " + port);
});
