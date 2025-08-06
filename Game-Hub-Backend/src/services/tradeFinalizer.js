// services/tradeFinalizer.js
const mongoose = require("mongoose");
const Post = require("../models/newPost");
const TradeTransaction = require("../models/TradeTransaction");
const User = require("../models/user");

async function finalizeTradeByPostId(
  postId,
  { io = null, actorId = null, session: externalSession = null } = {}
) {
  // actorId: who triggered the finalization (null = system)
  let session;
  let ownSession = false;
  try {
    session = externalSession || (await mongoose.startSession());
    if (!externalSession) {
      ownSession = true;
      session.startTransaction();
    }

    const post = await Post.findById(postId).session(session);
    if (!post) {
      if (ownSession) {
        await session.abortTransaction();
        session.endSession();
      }
      return { ok: false, reason: "post-not-found" };
    }

    if (post.tradeStatus !== "pending_release") {
      if (ownSession) {
        await session.commitTransaction();
        session.endSession();
      }
      return { ok: false, reason: "not-pending_release" };
    }

    // ensure releaseAt passed
    if (!post.releaseAt || post.releaseAt > new Date()) {
      if (ownSession) {
        await session.commitTransaction();
        session.endSession();
      }
      return { ok: false, reason: "releaseAt-not-reached" };
    }

    const tx = await TradeTransaction.findOne({ post: post._id }).session(
      session
    );
    if (!tx || tx.status !== "pending_release") {
      if (ownSession) {
        await session.commitTransaction();
        session.endSession();
      }
      return { ok: false, reason: "tx-missing-or-invalid" };
    }

    // safety
    if (!post.owner || !post.buyer || !tx.amount) {
      if (ownSession) {
        await session.commitTransaction();
        session.endSession();
      }
      return { ok: false, reason: "invalid-data" };
    }

    // credit seller
    const seller = await User.findById(post.owner).session(session);
    if (!seller) {
      if (ownSession) {
        await session.abortTransaction();
        session.endSession();
      }
      return { ok: false, reason: "seller-not-found" };
    }
    seller.coins = (seller.coins || 0) + Number(tx.amount || 0);
    await seller.save({ session });

    // mark post done
    post.tradeStatus = "completed";
    post.avaliable = false;
    post.releaseAt = null;
    post.tradeCompletedAt = new Date();
    await post.save({ session });

    // mark tx done
    tx.status = "completed";
    tx.releaseAt = null;
    tx.logs = tx.logs || [];
    tx.logs.push({
      message: "Trade auto-finalized",
      by: actorId || null,
      at: new Date(),
    });
    await tx.save({ session });

    if (ownSession) {
      await session.commitTransaction();
      session.endSession();
    }

    // emit socket events outside transaction (best effort)
    try {
      if (io) {
        const sellerId = String(post.owner);
        const buyerId = String(post.buyer);
        io.to(sellerId).emit("tradeFinalized", {
          postId: String(post._id),
          sellerId,
          buyerId,
          amount: tx.amount,
          message: "Trade completed. Coins released to seller.",
        });
        io.to(buyerId).emit("tradeFinalized", {
          postId: String(post._id),
          sellerId,
          buyerId,
          amount: tx.amount,
          message: "Trade completed.",
        });
      }
    } catch (e) {
      console.warn("tradeFinalizer: socket emit failed", e?.message || e);
    }

    return { ok: true, postId: String(post._id) };
  } catch (err) {
    if (ownSession && session) {
      await session.abortTransaction().catch(() => {});
      session.endSession();
    }
    console.error("finalizeTradeByPostId error:", err);
    return { ok: false, reason: err.message || "error" };
  }
}

async function finalizeDueTrades({ io = null, limit = 100 } = {}) {
  const now = new Date();
  const session = await mongoose.startSession();
  session.startTransaction();
  let finalized = 0;
  try {
    // find posts pending_release whose releaseAt <= now
    const posts = await Post.find({
      tradeStatus: "pending_release",
      releaseAt: { $lte: now },
    })
      .limit(limit)
      .session(session);

    for (const post of posts) {
      const tx = await TradeTransaction.findOne({ post: post._id }).session(
        session
      );
      if (!tx || tx.status !== "pending_release") continue;
      if (!post.owner || !post.buyer || !tx.amount) continue;

      const seller = await User.findById(post.owner).session(session);
      if (!seller) continue;

      seller.coins = (seller.coins || 0) + Number(tx.amount || 0);
      await seller.save({ session });

      // update post
      post.tradeStatus = "completed";
      post.avaliable = false;
      post.releaseAt = null;
      post.tradeCompletedAt = new Date();
      await post.save({ session });

      // update tx
      tx.status = "completed";
      tx.releaseAt = null;
      tx.logs = tx.logs || [];
      tx.logs.push({
        message: "Trade auto-finalized",
        by: null,
        at: new Date(),
      });
      await tx.save({ session });

      finalized++;

      // emit events after commit? we will emit after commit for all finalized
    }

    await session.commitTransaction();
    session.endSession();

    // emit events outside transaction
    try {
      if (io && finalized > 0) {
        // fetch those posts again with buyer and owner for emitting
        const finalizedPosts = await Post.find({
          tradeStatus: "completed",
          tradeCompletedAt: { $gte: new Date(Date.now() - 5 * 60 * 1000) }, // recently completed
        })
          .sort({ tradeCompletedAt: -1 })
          .limit(finalized);

        for (const p of finalizedPosts) {
          const tx = await TradeTransaction.findOne({ post: p._id });
          const sellerId = String(p.owner);
          const buyerId = String(p.buyer);
          io.to(sellerId).emit("tradeFinalized", {
            postId: String(p._id),
            sellerId,
            buyerId,
            amount: tx?.amount || null,
            message: "Trade completed. Coins released to seller.",
          });
          io.to(buyerId).emit("tradeFinalized", {
            postId: String(p._id),
            sellerId,
            buyerId,
            amount: tx?.amount || null,
            message: "Trade completed.",
          });
        }
      }
    } catch (e) {
      console.warn("tradeFinalizer: emit after commit failed", e?.message || e);
    }

    return { ok: true, finalizedCount: finalized };
  } catch (err) {
    await session.abortTransaction().catch(() => {});
    session.endSession();
    console.error("finalizeDueTrades error:", err);
    return { ok: false, reason: err.message || "error" };
  }
}

module.exports = { finalizeDueTrades, finalizeTradeByPostId };
