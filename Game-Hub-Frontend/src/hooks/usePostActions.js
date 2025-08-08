// src/hooks/usePostActions.js
import { useState } from "react";
import axios from "../api/axiosInstance";
import { toast } from "react-toastify";

const usePostActions = (
  setPosts,
  userId,
  setProcessingIds,
  setShowLoginModal,
  setSelectedPostId,
  setHasConfirmed
) => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [reportSubmitting, setReportSubmitting] = useState(false);
  const [dispute, setDispute] = useState(null); // New state for dispute info

  // Helper to update a post in state
  const updatePost = (updated) => {
    setPosts((prev) => prev.map((p) => (p._id === updated._id ? updated : p)));
  };

  // Fetch dispute details for a trade/post
  const fetchDispute = async (tradeId) => {
    try {
      const res = await axios.get(`/trade/${tradeId}/dispute`);
      setDispute(res.data);
      return res.data;
    } catch (err) {
      console.error("Failed to fetch dispute:", err);
      return null;
    }
  };

  // Handle voting on a post
  const handleVote = async (post, voteType) => {
    if (!userId) {
      setShowLoginModal(true);
      return;
    }

    const postId = post._id;
    const isProc = Array.from(setProcessingIds).includes(postId);
    if (isProc) return;
    if (post.voters?.includes(userId)) return;

    const previousPost = {
      ...post,
      voters: [...(post.voters || [])],
    };
    const optimisticPost = {
      ...post,
      voters: [...(post.voters || []), userId],
      [voteType === "good" ? "good_response" : "bad_response"]:
        (post[voteType === "good" ? "good_response" : "bad_response"] || 0) + 1,
    };

    updatePost(optimisticPost);
    setProcessingIds((prev) => new Set(prev).add(postId));

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
      setProcessingIds((prev) => {
        const next = new Set(prev);
        next.delete(postId);
        return next;
      });
    }
  };

  // Handle toggling request on a post
  const handleToggleRequest = async (post) => {
    if (!userId) {
      setShowLoginModal(true);
      return;
    }

    const postId = post._id;
    const isProc = Array.from(setProcessingIds).includes(postId);
    if (isProc) return;

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
    setProcessingIds((prev) => new Set(prev).add(postId));

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
      setProcessingIds((prev) => {
        const next = new Set(prev);
        next.delete(postId);
        return next;
      });
    }
  };

  // Handle buying a post
  const handleBuy = async (post) => {
    if (!userId) {
      setShowLoginModal(true);
      return;
    }

    const postId = post._id;
    const isProc = Array.from(setProcessingIds).includes(postId);
    if (isProc) return;

    setProcessingIds((prev) => new Set(prev).add(postId));
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
      setProcessingIds((prev) => {
        const next = new Set(prev);
        next.delete(postId);
        return next;
      });
    }
  };

  // Handle confirming a trade
  const handleConfirmTrade = async (post) => {
    if (!userId) {
      setShowLoginModal(true);
      return;
    }

    setIsProcessing(true);
    try {
      const res = await axios.post(
        `/newpost/${post._id}/confirm-trade`,
        {},
        {
          headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
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

  // Handle canceling a trade
  const handleCancelTrade = async (post) => {
    if (!userId) {
      setShowLoginModal(true);
      return;
    }

    const postId = post._id;
    const isProc = Array.from(setProcessingIds).includes(postId);
    if (isProc) return;

    setIsProcessing(true);
    setProcessingIds((prev) => new Set(prev).add(postId));

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
      setProcessingIds((prev) => {
        const next = new Set(prev);
        next.delete(postId);
        return next;
      });
    }
  };

  // Handle submitting a dispute report
  const submitReport = async (post, reportData) => {
    if (!reportData?.videoUrl?.trim()) {
      toast.error("Please provide valid evidence URL");
      return false;
    }

    setReportSubmitting(true);
    try {
      const payload = {
        videoUrls: [reportData.videoUrl.trim()],
        reason: reportData.reason || "No reason provided",
        urgency: reportData.urgency || "medium",
        reporterId: userId,
        timestamp: new Date().toISOString(),
      };

      const res = await axios.post(`/newpost/${post._id}/report`, payload, {
        headers: {
          "Content-Type": "application/json",
          "X-Report-Type": "trade-issue",
        },
      });

      console.log("Full axios response:", res);
      console.log("Response data:", res.data);

      if (res.data && res.status === 200) {
        toast.success(res.data.message || "Report submitted successfully");
        return true;
      } else {
        toast.error("Report submission failed: No response data");
        return false;
      }
    } catch (err) {
      console.error("Report submission error:", err);
      toast.error(err.response?.data?.error || "Report submission failed");
      return false;
    } finally {
      setReportSubmitting(false);
    }
  };

  // Check if current user already confirmed the trade
  const userAlreadyConfirmed = (post) => {
    if (!post || !userId) return false;
    return post.tradeConfirmations?.some(
      (id) => id === userId || id._id === userId
    );
  };

  // Check if both parties confirmed the trade
  const bothConfirmed = (post) => {
    if (!post) return false;
    const ownerId = post.owner?._id || post.owner;
    const buyerId = post.buyer?._id || post.buyer;
    return (
      post.tradeConfirmations?.some(
        (id) => id === ownerId || id._id === ownerId
      ) &&
      post.tradeConfirmations?.some(
        (id) => id === buyerId || id._id === buyerId
      )
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
    submitReport,
    userAlreadyConfirmed,
    bothConfirmed,
    updatePost,
  };
};

export default usePostActions;
