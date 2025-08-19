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
  setHasConfirmed
) => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [reportSubmitting, setReportSubmitting] = useState(false);

  const updatePost = (updated) =>
    setPosts((prev) => prev.map((p) => (p._id === updated._id ? updated : p)));

  const addProcessingId = (id) => {
    setProcessingIds((prev) => new Set([...prev, id]));
  };

  const removeProcessingId = (id) => {
    setProcessingIds((prev) => {
      const next = new Set(prev);
      next.delete(id);
      return next;
    });
  };

  // ------------------------ Voting ------------------------
  const handleVote = async (post, voteType) => {
    if (!userId) {
      setShowLoginModal(true);
      return;
    }

    const postId = post._id;
    if (processingIds.has(postId) || post.voters?.includes(userId)) return;

    // Determine which field to increment
    const field = voteType === "good" ? "good_response" : "bad_response";

    const previousPost = { ...post, voters: [...(post.voters || [])] };
    const optimisticPost = {
      ...post,
      voters: [...(post.voters || []), userId],
      [field]: (post[field] || 0) + 1,
    };

    updatePost(optimisticPost);
    addProcessingId(postId);

    try {
      const res = await axios.patch(`/newpost/${postId}/vote`, {
        vote: voteType,
      });

      if (res.data) {
        updatePost(res.data); // trust server as source of truth
      } else {
        toast.success("Vote recorded");
      }
    } catch (err) {
      updatePost(previousPost); // rollback optimistic update
      toast.error(err.response?.data?.error || "Failed to record vote");
    } finally {
      removeProcessingId(postId);
    }
  };

  // ------------------------ Chat Requests ------------------------
  const handleToggleRequest = async (post) => {
    if (!userId) return setShowLoginModal(true);

    const postId = post._id;
    if (processingIds.has(postId)) return;

    const requested = post.requests?.includes(userId);
    const previousPost = { ...post };

    // Create optimistic update with preserved owner data
    const optimisticPost = {
      ...post,
      owner: post.owner, // Explicitly preserve owner
      requests: requested
        ? post.requests.filter((id) => String(id) !== String(userId))
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
        // Ensure owner data is preserved in the update
        const completePost = {
          ...updatedPost,
          owner: updatedPost.owner || post.owner, // Fallback to original owner
        };

        updatePost(completePost);
        setSelectedPostId(completePost._id);

        if (!requested && post.owner?._id) {
          socket.emit("notify-request", {
            toUserId: post.owner._id,
            message: `A Buyer sent you a chat request for item: ${post.description}`,
            postId: post._id,
          });
        }

        return completePost;
      }
    } catch (err) {
      // Revert to previous post with owner data intact
      updatePost({
        ...previousPost,
        owner: previousPost.owner, // Ensure owner is preserved in rollback
      });
      toast.error(err.response?.data?.error || "Request failed");
    } finally {
      removeProcessingId(postId);
    }
  };
  // ------------------------ Buy ------------------------
  const handleBuy = async (post) => {
    if (!post || !userId) return setShowLoginModal(true);

    const postId = post._id;
    if (processingIds.has(postId)) return;

    addProcessingId(postId);

    try {
      const res = await axios.post(`/newpost/${postId}/buy`);
      const updatedPost = res.data?.post || res.data;

      if (updatedPost) {
        // Preserve the original owner data if not returned in response
        const completePost = {
          ...updatedPost,
          owner: updatedPost.owner || post.owner,
        };

        updatePost(completePost);
        setSelectedPostId(completePost._id);

        // ✅ GA4 purchase tracking
        if (window.gtag) {
          window.gtag("event", "purchase", {
            transaction_id: completePost._id, // unique ID for this purchase
            value: completePost.price,
            currency: "USD",
            items: [
              {
                item_id: completePost._id,
                item_name: completePost.description,
                price: completePost.price,
                quantity: 1,
              },
            ],
          });
        }

        return completePost;
      }
    } catch (err) {
      toast.error(err.response?.data?.error || "Purchase failed");
    } finally {
      removeProcessingId(postId);
    }
  };

  // ------------------------ Confirm / Cancel Trade ------------------------
  const handleConfirmTrade = async (post) => {
    if (!userId) return setShowLoginModal(true);
    setIsProcessing(true);

    try {
      const res = await axios.post(`/newpost/${post._id}/confirm-trade`);
      const updatedPost = res.data;
      if (updatedPost) {
        updatePost(updatedPost);
        setSelectedPostId(updatedPost._id);
        setHasConfirmed(true);
        return updatedPost; // ✅ return updated post
      }
    } catch (err) {
      toast.error(err.response?.data?.error || "Confirmation failed");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleCancelTrade = async (post) => {
    if (!userId) return setShowLoginModal(true);
    const postId = post._id;
    if (processingIds.has(postId)) return;

    setIsProcessing(true);
    addProcessingId(postId);

    try {
      const res = await axios.post(`/newpost/${post._id}/cancel-trade`);
      const updatedPost = res.data?.post;
      if (updatedPost) {
        updatePost(updatedPost);
        setSelectedPostId(updatedPost._id);
        return updatedPost; // ✅ return updated post
      }
    } catch (err) {
      toast.error(err.response?.data?.error || "Cancellation failed");
    } finally {
      setIsProcessing(false);
      removeProcessingId(postId);
    }
  };

  // ------------------------ Report ------------------------
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

      if (!res.data?.message) {
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
        if (updatedPost._id === post._id) setSelectedPostId(updatedPost._id);
      }

      toast.success(res.data.message);
      return { success: true, data: res.data };
    } catch (err) {
      toast.error(err.response?.data?.error || "Report submission failed");
      return { success: false };
    } finally {
      setReportSubmitting(false);
    }
  };
  // ------------------------ Helpers ------------------------
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
