// server.js
const express = require("express");
const path = require("path");

const app = express();
const port = process.env.PORT || 3000;

// Serve static files from CRA build
app.use(express.static(path.resolve(__dirname, "build")));

// Handle all other routes with index.html (SPA support)
app.get("*", (req, res) => {
  res.sendFile(path.resolve(__dirname, "build", "index.html"));
});

app.listen(port, () => {
  console.log(`Frontend server running on port ${port}`);
});
