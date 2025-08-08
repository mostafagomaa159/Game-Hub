import { useState } from "react";
import axios from "../api/axiosInstance";
import { toast } from "react-toastify";

const usePostActions = (
  setPosts,
  userId,
  processingIds,
  setProcessingIds,
  setShowLoginModal,
  setSelectedPostId,
  setHasConfirmed
) => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [reportSubmitting, setReportSubmitting] = useState(false);
  const [dispute, setDispute] = useState(null);

  const updatePost = (updated) => {
    setPosts((prev) => prev.map((p) => (p._id === updated._id ? updated : p)));
  };

  // Helper to add id to processingIds Set immutably
  const addProcessingId = (id) => {
    setProcessingIds((prev) => {
      const next = new Set(prev);
      next.add(id);
      return next;
    });
  };

  // Helper to remove id from processingIds Set immutably
  const removeProcessingId = (id) => {
    setProcessingIds((prev) => {
      const next = new Set(prev);
      next.delete(id);
      return next;
    });
  };

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
      toast.success(requested ? "Request cancelled" : "Request sent");
    } catch (err) {
      updatePost(previousPost);
      toast.error(err.response?.data?.error || "Request failed");
    } finally {
      removeProcessingId(postId);
    }
  };

  const handleBuy = async (post) => {
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
      toast.success(res.data?.message || "Item reserved");
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
      const token = localStorage.getItem("token");
      const res = await axios.post(
        `/newpost/${post._id}/confirm-trade`,
        {},
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      if (res.data) {
        updatePost(res.data);
        setSelectedPostId(res.data._id);
        setHasConfirmed(true);
      }
    } catch (err) {
      toast.error(err.response?.data?.error || "Confirmation failed");
    } finally {
      setIsProcessing(false);
    }
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
      const res = await axios.post(`/newpost/${postId}/cancel-trade`, {
        note: "Cancelled by user",
      });

      if (res.data?.post) {
        updatePost(res.data.post);
        setSelectedPostId(res.data.post._id);
        toast.success("Trade cancelled");
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
      // Prepare payload exactly like backend expects
      const payload = {
        videoUrls: reportData.videoUrls.map((url) => url.trim()),
        reason: reportData.reason || "No reason provided",
        urgency: ["low", "medium", "high"].includes(reportData.urgency)
          ? reportData.urgency
          : "medium",
      };

      const token = localStorage.getItem("token"); // Ensure token is stored on login

      const res = await axios.post(`/newpost/${post._id}/report`, payload, {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
          "X-Report-Type": "trade-issue", // Optional, if backend uses it
        },
      });

      if (!res.data || !res.data.success) {
        toast.error(res.data?.error || "Report submission failed");
        return { success: false };
      }

      // Update UI if needed with returned post data
      if (res.data.post) {
        updatePost(res.data.post);
      }

      toast.success(res.data.message || "Report submitted successfully");
      return { success: true };
    } catch (err) {
      toast.error(err.response?.data?.error || "Report submission failed");
      console.error("submitReport error:", err);
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
    fetchDispute: async (tradeId) => {
      try {
        const res = await axios.get(`/trade/${tradeId}/dispute`);
        setDispute(res.data);
        return res.data;
      } catch (err) {
        console.error("Failed to fetch dispute:", err);
        return null;
      }
    },
    handleVote,
    handleToggleRequest,
    handleBuy,
    handleConfirmTrade,
    handleCancelTrade,
    submitReport,
    userAlreadyConfirmed,
    bothConfirmed,
    updatePost,
  };
};

export default usePostActions;
