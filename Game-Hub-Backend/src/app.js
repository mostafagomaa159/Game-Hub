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
app.use(
  cors({
    origin: "http://localhost:3000", // ✅ your frontend URL
    credentials: true, // ✅ only needed if your backend sets cookies or uses sessions
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
