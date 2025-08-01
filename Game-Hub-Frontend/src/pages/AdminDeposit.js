// const express = require("express");
// const router = express.Router();
// const auth = require("../middleware/auth");
// const adminAuth = require("../middleware/adminAuth");
// const Transaction = require("../models/transaction");

// // 🧾 Admin: Get all pending deposits
// router.get(
//   "/transactions/pending-deposits",
//   auth,
//   adminAuth,
//   async (req, res) => {
//     try {
//       const { method, userId, page = 1, limit = 10 } = req.query;

//       const filter = {
//         type: "deposit",
//         status: "pending",
//       };

//       if (method) filter.method = method;
//       if (userId) filter.userId = userId;

//       const deposits = await Transaction.find(filter)
//         .populate("userId", "name email")
//         .sort({ createdAt: -1 })
//         .skip((page - 1) * limit)
//         .limit(parseInt(limit));

//       const total = await Transaction.countDocuments(filter);

//       res.send({
//         data: deposits,
//         page: Number(page),
//         limit: Number(limit),
//         total,
//       });
//     } catch (err) {
//       console.error("Failed to load pending deposits:", err);
//       res.status(500).send({ error: "Internal server error" });
//     }
//   }
// );

// // 🧾 Admin: Get all processed (approved/rejected) deposits
// router.get(
//   "/transactions/processed-deposits",
//   auth,
//   adminAuth,
//   async (req, res) => {
//     try {
//       const { method, userId, page = 1, limit = 10 } = req.query;

//       const filter = {
//         type: "deposit",
//         status: { $in: ["approved", "rejected"] },
//       };

//       if (method) filter.method = method;
//       if (userId) filter.userId = userId;

//       const deposits = await Transaction.find(filter)
//         .populate("userId", "name email")
//         .sort({ updatedAt: -1 })
//         .skip((page - 1) * limit)
//         .limit(parseInt(limit));

//       const total = await Transaction.countDocuments(filter);

//       res.send({
//         data: deposits,
//         page: Number(page),
//         limit: Number(limit),
//         total,
//       });
//     } catch (err) {
//       console.error("Failed to load processed deposits:", err);
//       res.status(500).send({ error: "Internal server error" });
//     }
//   }
// );

// router.patch(
//   "/transactions/:id/note-deposit",
//   auth,
//   adminAuth,
//   async (req, res) => {
//     try {
//       const transaction = await Transaction.findById(req.params.id);

//       if (!transaction || transaction.type !== "deposit") {
//         return res
//           .status(404)
//           .json({ message: "Deposit transaction not found" });
//       }

//       transaction.adminNote = req.body.note || "";

//       // Optional: push to logs
//       transaction.adminLogs.push({
//         message: `Note updated by admin ${req.user._id}`,
//         timestamp: new Date(),
//       });

//       await transaction.save();

//       res.json({ message: "Note updated", adminNote: transaction.adminNote });
//     } catch (err) {
//       console.error("Failed to update deposit note:", err);
//       res.status(500).json({ message: "Server error" });
//     }
//   }
// );
// module.exports = router;
