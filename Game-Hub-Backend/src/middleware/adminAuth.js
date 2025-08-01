const User = require("../models/user");

const adminAuth = async (req, res, next) => {
  try {
    // Make sure `auth` middleware already ran and set `req.user`
    if (!req.user) {
      return res.status(401).send({ error: "Authentication required" });
    }

    if (!req.user.isAdmin) {
      return res.status(403).send({ error: "Admin access required" });
    }

    next();
  } catch (e) {
    res.status(500).send({ error: "Internal server error" });
  }
};

module.exports = adminAuth;
