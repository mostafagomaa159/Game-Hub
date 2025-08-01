const express = require("express");
require("./db/mongoose");
const userRouter = require("./routers/user");
const taskRouter = require("./routers/task");
const newPostRouter = require("./routers/newPost");
const financeRoutes = require("./routers/finance");
const transactionRoutes = require("./routers/transaction");
const tradeRoutes = require("./routers/trade");
const adminRouter = require("./routers/admin");
const cors = require("cors");
const app = express();
const allowedOrigins = [
  "http://localhost:3000",
  "https://game-hub-git-main-game-hub2.vercel.app", // ✅ Add your Vercel frontend domain
  "https://game-hub.vercel.app", // ✅ Add the default Vercel production domain if needed
];

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
app.use(express.json());
app.use(userRouter);
app.use(taskRouter);
app.use(newPostRouter);
app.use(financeRoutes);
app.use(transactionRoutes);
app.use(adminRouter);
app.use(tradeRoutes);
app.get("/", (req, res) => {
  res.send("GameHub Backend is running ✅");
});
module.exports = app;
