import { useState } from "react";
import axios from "../api/axiosInstance";
import { toast } from "react-toastify";
import socket from "../utils/socket";

const usePostActions = (
  setPosts,
  userId,
  processingIds,
  setProcessingIds,
  setShowLoginModal,
  setSelectedPostId,
  setHasConfirmed,
  selectedPostId
) => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [reportSubmitting, setReportSubmitting] = useState(false);
  const [dispute, setDispute] = useState(null); // ← dispute state

  const updatePost = (updated) => {
    setPosts((prev) => prev.map((p) => (p._id === updated._id ? updated : p)));
  };

  const addProcessingId = (id) => {
    setProcessingIds((prev) => {
      const next = new Set(prev);
      next.add(id);
      return next;
    });
  };

  const removeProcessingId = (id) => {
    setProcessingIds((prev) => {
      const next = new Set(prev);
      next.delete(id);
      return next;
    });
  };
  // ------------------------ Dispute Fetching ------------------------
  const fetchDispute = async (tradeId) => {
    if (!tradeId) return null;
    try {
      const res = await axios.get(`/trade/${tradeId}/dispute`);
      setDispute(res.data);
      return res.data;
    } catch (err) {
      console.error("Failed to fetch dispute:", err);
      return null;
    }
  };

  /** =========================
   *  Handle posting a reply
   *  ========================= */
  const handleReply = async (commentId, replyText) => {
    if (!userId) {
      setShowLoginModal(true);
      return;
    }

    if (!replyText.trim()) {
      toast.error("Reply cannot be empty");
      return;
    }

    try {
      const res = await axios.post(`/comments/${commentId}/reply`, {
        text: replyText.trim(),
      });

      if (res.data?.updatedPost) {
        updatePost(res.data.updatedPost);
      } else {
        // fallback: refresh manually
        toast.success("Reply posted");
      }
    } catch (err) {
      toast.error(err.response?.data?.error || "Failed to post reply");
    }
  };

  /** =========================
   *  Voting
   *  ========================= */
  const handleVote = async (post, voteType) => {
    if (!userId) {
      setShowLoginModal(true);
      return;
    }
    const postId = post._id;
    if (processingIds.has(postId)) return;
    if (post.voters?.includes(userId)) return;

    const previousPost = { ...post, voters: [...(post.voters || [])] };
    const optimisticPost = {
      ...post,
      voters: [...(post.voters || []), userId],
      [voteType === "good" ? "good_response" : "bad_response"]:
        (post[voteType === "good" ? "good_response" : "bad_response"] || 0) + 1,
    };

    updatePost(optimisticPost);
    addProcessingId(postId);

    try {
      const res = await axios.patch(`/newpost/${postId}/vote`, {
        vote: voteType,
      });
      if (res.data) updatePost(res.data);
      else toast.success("Vote recorded");
    } catch (err) {
      updatePost(previousPost);
      toast.error(err.response?.data?.error || "Vote failed");
    } finally {
      removeProcessingId(postId);
    }
  };

  const handleToggleRequest = async (post) => {
    if (!userId) {
      setShowLoginModal(true);
      return;
    }

    const postId = post._id;
    if (processingIds.has(postId)) return;

    const requested = post.requests?.includes(userId);
    const previousPost = { ...post };
    const optimisticPost = {
      ...post,
      requests: requested
        ? post.requests.filter((id) => id !== userId)
        : [...(post.requests || []), userId],
    };

    updatePost(optimisticPost);
    setSelectedPostId(postId);
    addProcessingId(postId);

    try {
      const url = `/newpost/${postId}/${
        requested ? "cancel-request" : "request"
      }`;
      const res = await axios.post(url);
      const updatedPost = res.data?.post || res.data;

      if (updatedPost) {
        updatePost(updatedPost);
        setSelectedPostId(updatedPost._id);
      }

      if (!requested && post.owner && post.owner._id) {
        socket.emit("notify-request", {
          toUserId: post.owner._id,
          message: `A Buyer sent you a chat request for item: ${post.description}`,
          postId: post._id,
        });
      }
    } catch (err) {
      updatePost(previousPost);
      toast.error(err.response?.data?.error || "Request failed");
    } finally {
      removeProcessingId(postId);
    }
  };

  const handleBuy = async (post) => {
    if (!post) {
      console.error("handleBuy received undefined post!");
      return;
    }

    if (!userId) {
      setShowLoginModal(true);
      return;
    }

    const postId = post._id;
    if (processingIds.has(postId)) return;

    addProcessingId(postId);

    try {
      const res = await axios.post(`/newpost/${postId}/buy`);
      const updatedPost = res.data?.post || res.data;

      if (updatedPost) {
        updatePost(updatedPost);
        setSelectedPostId(updatedPost._id);
      }
    } catch (err) {
      toast.error(err.response?.data?.error || "Purchase failed");
    } finally {
      removeProcessingId(postId);
    }
  };

  const handleConfirmTrade = async (post) => {
    if (!userId) {
      setShowLoginModal(true);
      return;
    }

    setIsProcessing(true);

    try {
      const res = await axios.post(`/newpost/${post._id}/confirm-trade`);

      if (res.data) {
        // Update the post in your state
        updatePost(res.data);
        setSelectedPostId(res.data._id);
        setHasConfirmed(true);

        // If backend returns the transaction with fee/net
        if (res.data.transaction) {
          return {
            transaction: {
              fee: res.data.transaction.fee,
              amount: res.data.transaction.amount, // net to seller
            },
          };
        }
      }
    } catch (err) {
      toast.error(err.response?.data?.error || "Confirmation failed");
    } finally {
      setIsProcessing(false);
    }

    return null;
  };

  const handleCancelTrade = async (post) => {
    if (!userId) {
      setShowLoginModal(true);
      return;
    }

    const postId = post._id;
    if (processingIds.has(postId)) return;

    setIsProcessing(true);
    addProcessingId(postId);

    try {
      const res = await axios.post(`/newpost/${post._id}/cancel-trade`, {});
      if (res.data?.post) {
        updatePost(res.data.post);
        setSelectedPostId(res.data.post._id);
      }
    } catch (err) {
      toast.error(err.response?.data?.error || "Cancellation failed");
    } finally {
      setIsProcessing(false);
      removeProcessingId(postId);
    }
  };

  const submitReport = async (post, reportData) => {
    if (!reportData?.videoUrls?.length || !reportData.videoUrls[0]?.trim()) {
      toast.error("Please provide a valid evidence URL");
      return { success: false };
    }

    setReportSubmitting(true);
    try {
      const payload = {
        videoUrls: reportData.videoUrls.map((url) => url.trim()),
        reason: reportData.reason || "No reason provided",
        urgency: ["low", "medium", "high"].includes(reportData.urgency)
          ? reportData.urgency
          : "medium",
      };

      const res = await axios.post(`/newpost/${post._id}/report`, payload);
      if (!res.data || !res.data.message) {
        toast.error(res.data?.error || "Report submission failed");
        return { success: false };
      }

      if (res.data.post) {
        const updatedPost = {
          ...res.data.post,
          tradeTransaction:
            res.data.tradeTransaction || res.data.post.tradeTransaction,
        };
        updatePost(updatedPost);

        if (selectedPostId === updatedPost._id) {
          setSelectedPostId(updatedPost._id); // re-render modal
        }
      }

      toast.success(res.data.message || "Report submitted successfully");
      return { success: true };
    } catch (err) {
      toast.error(err.response?.data?.error || "Report submission failed");
      return { success: false };
    } finally {
      setReportSubmitting(false);
    }
  };

  const getId = (id) => (id?._id ? id._id : id);

  const userAlreadyConfirmed = (post) => {
    if (!post || !userId) return false;
    return post.tradeConfirmations?.some((id) => getId(id) === userId);
  };

  const bothConfirmed = (post) => {
    if (!post) return false;
    const ownerId = getId(post.owner);
    const buyerId = getId(post.buyer);
    return (
      post.tradeConfirmations?.some((id) => getId(id) === ownerId) &&
      post.tradeConfirmations?.some((id) => getId(id) === buyerId)
    );
  };

  return {
    isProcessing,
    reportSubmitting,
    dispute,
    fetchDispute,
    handleVote,
    handleToggleRequest,
    handleBuy,
    handleConfirmTrade,
    handleCancelTrade,
    handleReply,
    submitReport,
    userAlreadyConfirmed,
    bothConfirmed,
    updatePost,
  };
};

export default usePostActions;
