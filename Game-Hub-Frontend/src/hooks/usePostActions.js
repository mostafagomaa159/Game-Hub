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

  // Helper to update a post in state
  const updatePost = (updated) => {
    setPosts((prev) => prev.map((p) => (p._id === updated._id ? updated : p)));
  };

  // Handle voting on a post
  const handleVote = async (post, voteType) => {
    if (!userId) {
      setShowLoginModal(true);
      return;
    }

    const postId = post._id;
    const isProcessing = Array.from(setProcessingIds).includes(postId);
    if (isProcessing) return;
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
    const isProcessing = Array.from(setProcessingIds).includes(postId);
    if (isProcessing) return;

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
    const isProcessing = Array.from(setProcessingIds).includes(postId);
    if (isProcessing) return;

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
    const isProcessing = Array.from(setProcessingIds).includes(postId);
    if (isProcessing) return;

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

  // Handle submitting a report
  const submitReport = async (post, videoUrl) => {
    if (!videoUrl?.trim()) {
      toast.error("Please provide a valid video URL");
      return;
    }

    setReportSubmitting(true);
    try {
      const res = await axios.post(`/newpost/${post._id}/report`, {
        videoUrl: videoUrl.trim(),
      });
      toast.success(res.data?.message || "Report submitted");

      // Refresh post data
      try {
        const resp = await axios.get(`/newpost/${post._id}`);
        if (resp?.data) updatePost(resp.data);
      } catch (err) {
        // Fallback to refresh all posts if single post fetch fails
        const all = await axios.get("/all");
        setPosts(Array.isArray(all.data) ? all.data : []);
      }

      return true;
    } catch (err) {
      toast.error(err?.response?.data?.error || "Failed to submit report");
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
