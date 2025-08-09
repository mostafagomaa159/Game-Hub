const mongoose = require("mongoose");
mongoose
  .connect(process.env.MONGODB_URL, {})
  .then(() => console.log("✅ Connected to MongoDB Atlas (game-hub)"))
  .catch((err) => console.error("❌ MongoDB connection error:", err.message));
