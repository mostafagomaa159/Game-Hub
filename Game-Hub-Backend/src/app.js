const express = require("express");
require("./db/mongoose");
const cors = require("cors");

const userRouter = require("./routers/user");
const taskRouter = require("./routers/task");
const newPostRouter = require("./routers/newPost");
const financeRoutes = require("./routers/finance");
const transactionRoutes = require("./routers/transaction");
const tradeRoutes = require("./routers/trade");
const adminRouter = require("./routers/admin");
const chatRouter = require("./routers/chat");

const app = express();

// ✅ Allowed frontend domains
const allowedOrigins = [
  "http://localhost:3000",
  "https://game-hub-git-main-game-hub2.vercel.app",
  "https://game-aeas1daoo-game-hub2.vercel.app",
  "https://game-hub-one-vert.vercel.app",
  "https://game-hub.vercel.app",
  "https://game-4jdkbo5s3-game-hub2.vercel.app",
];

// ✅ Log request origin for debugging
app.use((req, res, next) => {
  console.log("Request Origin:", req.headers.origin);
  next();
});

// ✅ Enable CORS for HTTP routes
app.use(
  cors({
    origin: function (origin, callback) {
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error("Not allowed by CORS"));
      }
    },
    credentials: true,
  })
);

// ✅ Enable JSON body parsing
app.use(express.json());

// ✅ Register routers
app.use(userRouter);
app.use(taskRouter);
app.use(newPostRouter);
app.use(financeRoutes);
app.use(transactionRoutes);
app.use(adminRouter);
app.use(tradeRoutes);
app.use(chatRouter);

// ✅ Default root route
app.get("/", (req, res) => {
  res.send("GameHub Backend is running ✅");
});

module.exports = app;
