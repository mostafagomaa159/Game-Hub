const app = require("./app");
const http = require("http");
const socketIO = require("socket.io");
const axios = require("axios");

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

// Inject io into req for all routes
app.use((req, res, next) => {
  req.io = io;
  next();
});

io.on("connection", (socket) => {
  console.log("✅ A user connected");

  socket.on("joinRoom", ({ roomId }) => {
    socket.join(roomId);
    console.log(`📥 User ${socket.id} joined room: ${roomId}`);
  });

  socket.on("sendMessage", async ({ roomId, message, sender }) => {
    try {
      const User = require("./models/user");
      const Chat = require("./models/chat");

      const user = await User.findById(sender).select("name");
      if (!user) {
        console.error("❌ User not found:", sender);
        return;
      }

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
    } catch (e) {
      console.error("❌ Failed to save message:", e);
    }
  });

  socket.on("markAsSeen", async ({ roomId, userId }) => {
    try {
      const Chat = require("./models/chat");
      await Chat.updateMany(
        {
          roomId,
          sender: { $ne: userId },
          status: { $ne: "seen" },
        },
        { $set: { status: "seen" } }
      );
      io.to(roomId).emit("messagesSeen", { roomId, seenBy: userId });
    } catch (e) {
      console.error("❌ Failed to mark messages as seen:", e);
    }
  });

  socket.on("typing", ({ roomId, sender }) => {
    socket.to(roomId).emit("typing", { sender });
  });

  socket.on("disconnect", () => {
    console.log("❎ User disconnected");
  });
});

// --- ADD THIS PERIODIC TRADE FINALIZER ---

const ADMIN_JWT_TOKEN =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJfaWQiOiI2ODkyMTg2ZWFmMWFhMjEyNTQzZWQ0MTciLCJpYXQiOjE3NTQ0ODE4NzZ9.n5VXahNPSCalzeBCPSmgKYpXnS4ICayTZ6RCdweX2Vc"; // Replace with your real admin JWT token

setInterval(async () => {
  try {
    const res = await axios.post(
      "http://localhost:3001/newpost/finalize-trades",
      null,
      {
        headers: {
          Authorization: `Bearer ${ADMIN_JWT_TOKEN}`,
        },
      }
    );
    console.log("[Trade Finalizer]:", res.data.message);
  } catch (err) {
    console.error("[Trade Finalizer] Error:", err.message);
  }
}, 60 * 1000); // every 1 minute

const port = process.env.PORT || 3001;
server.listen(port, () => {
  console.log("🚀 Server running on port " + port);
});
