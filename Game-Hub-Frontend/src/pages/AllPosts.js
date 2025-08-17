// src/pages/AllPosts.js
import React, {
  useState,
  useRef,
  useEffect,
  useMemo,
  useCallback,
} from "react";
import usePosts from "../hooks/usePosts";
import { useUser } from "../context/UserContext"; // <-- updated import
import usePostActions from "../hooks/usePostActions";
import Filters from "../components/AllPosts/Filters";
import PostGrid from "../components/AllPosts/PostGrid";
import PostModal from "../components/AllPosts/PostModal";
import ReportModal from "../components/AllPosts/ReportModal";
import LoginModal from "../components/AllPosts/LoginModal";
import Pagination from "../components/AllPosts/Pagination";
import socket from "../utils/socket";
import axiosInstance from "../api/axiosInstance"; // or wherever your axios is

const POSTS_PER_PAGE = 12;

const AllPosts = () => {
  // State declarations
  const { posts, loading, error, setPosts } = usePosts();
  const { user } = useUser(); // get full user object
  const userId = user?._id || null; // safely get userId
  const [searchTerm, setSearchTerm] = useState("");
  const [serverFilter, setServerFilter] = useState("All");
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedPostId, setSelectedPostId] = useState(null);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [showReportModal, setShowReportModal] = useState(false);
  const [reportUrl, setReportUrl] = useState("");
  const [processingIds, setProcessingIds] = useState(new Set());
  const [hasConfirmed, setHasConfirmed] = useState(false);
  const modalRef = useRef(null);
  const [selectedPost, setSelectedPost] = useState(null);
  const [modalLoading, setModalLoading] = useState(false);

  useEffect(() => {
    setHasConfirmed(false);
  }, [selectedPostId]);

  useEffect(() => {
    if (!posts.length) return;

    // Join all post rooms once
    posts.forEach((post) => {
      socket.emit("joinRoom", { roomId: `post:${post._id}` });
    });
  }, [posts]); // only join rooms when posts change

  useEffect(() => {
    const handlePostUpdated = (updatedData) => {
      // Update the main posts list
      setPosts((prevPosts) =>
        prevPosts.map((p) =>
          p._id === updatedData._id ? { ...p, ...updatedData } : p
        )
      );

      // Update modal if it's open on this post
      setSelectedPost((prev) =>
        prev && prev._id === updatedData._id
          ? { ...prev, ...updatedData } // merge updated fields
          : prev
      );
    };

    socket.on("postUpdated", handlePostUpdated);

    return () => {
      socket.off("postUpdated", handlePostUpdated);
    };
  }, [setPosts]); // ✅ remove selectedPost from dependency

  const filtered = useMemo(() => {
    let temp = [...posts];
    if (searchTerm) {
      temp = temp.filter((post) =>
        (post.description || "")
          .toLowerCase()
          .includes(searchTerm.toLowerCase())
      );
    }
    if (serverFilter !== "All") {
      temp = temp.filter((post) => post.server === serverFilter);
    }
    return temp;
  }, [searchTerm, serverFilter, posts]);

  const { currentPosts, totalPages } = useMemo(() => {
    const indexOfLast = currentPage * POSTS_PER_PAGE;
    const indexOfFirst = indexOfLast - POSTS_PER_PAGE;
    return {
      currentPosts: filtered.slice(indexOfFirst, indexOfLast),
      totalPages: Math.ceil(filtered.length / POSTS_PER_PAGE),
    };
  }, [currentPage, filtered]);

  const handleOpenPost = async (postId) => {
    const token = localStorage.getItem("token");
    if (!token) {
      alert("⚠️ Please log in first to view post details!");
      return;
    }

    setModalLoading(true);

    // If modal already open, keep the object reference
    setSelectedPost((prev) => ({ ...prev, _id: postId }));

    setSelectedPostId(postId);

    try {
      const res = await axiosInstance.get(`/newpost/${postId}`);
      setSelectedPost((prev) => ({
        ...prev, // keep the original object reference
        ...res.data, // merge API data
      }));
    } catch (err) {
      console.error("Failed to fetch post details:", err);
    } finally {
      setModalLoading(false);
    }
  };

  const isOwner = useMemo(
    () =>
      !!selectedPost &&
      (selectedPost.owner?._id === userId || selectedPost.owner === userId),
    [selectedPost, userId]
  );

  const isBuyer = useMemo(
    () =>
      !!selectedPost &&
      (selectedPost.buyer?._id === userId || selectedPost.buyer === userId),
    [selectedPost, userId]
  );
  const {
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
  } = usePostActions(
    setPosts,
    userId,
    processingIds,
    setProcessingIds,
    setShowLoginModal,
    setSelectedPostId,
    setHasConfirmed
  );

  const handleClickOutside = useCallback((e) => {
    if (modalRef.current && !modalRef.current.contains(e.target)) {
      setShowLoginModal(false);
    }
  }, []);

  useEffect(() => {
    if (selectedPost || showLoginModal) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [selectedPost, showLoginModal, handleClickOutside]);

  const handlePostReport = async (post, reportData) => {
    if (!post || !post._id) {
      console.error("handlePostReport: post or post._id is undefined");
      return null;
    }
    const result = await submitReport(post, reportData); // submit via usePostActions
    if (result?.success && result.data?.post) {
      return result.data.post; // updated post to refresh modal
    }
    return null;
  };

  const handlePostVote = (postId, voteType) => {
    handleVote(
      posts.find((p) => p._id === postId),
      voteType
    );
  };

  const handlePostBuy = async () => {
    if (!selectedPost) return;
    const updatedPost = await handleBuy(selectedPost); // handleBuy should return updated post
    if (updatedPost) setSelectedPost(updatedPost); // <-- update modal state immediately

    return updatedPost;
  };

  const handlePostToggleRequest = async () => {
    if (!selectedPost) return;
    const updated = await handleToggleRequest(selectedPost);
    if (updated) setSelectedPost(updated); // update modal live
  };

  const handlePostConfirmTrade = async () => {
    if (!selectedPost) return;
    const updated = await handleConfirmTrade(selectedPost);
    if (updated) setSelectedPost(updated); // update modal live
  };
  const handlePostCancelTrade = async () => {
    if (!selectedPost) return;
    const updated = await handleCancelTrade(selectedPost);
    if (updated) setSelectedPost(updated); // update modal live
  };

  useEffect(() => {
    const handlePostUpdated = (updatedData) => {
      setPosts((prevPosts) =>
        prevPosts.map((p) =>
          p._id === updatedData._id ? { ...p, ...updatedData } : p
        )
      );

      if (selectedPostId === updatedData._id) {
        // Update selectedPostId to trigger modal re-render with new data
        setSelectedPostId(updatedData._id);
      }
    };

    socket.on("postUpdated", handlePostUpdated);

    return () => {
      socket.off("postUpdated", handlePostUpdated);
    };
  }, [selectedPostId, setPosts, setSelectedPostId]);

  return (
    <div className="bg-background dark:bg-darkBackground text-black dark:text-white min-h-screen py-8 px-4">
      <Filters
        searchTerm={searchTerm}
        setSearchTerm={setSearchTerm}
        serverFilter={serverFilter}
        setServerFilter={setServerFilter}
        posts={posts}
      />

      <h1 className="text-3xl font-bold text-center mb-6">
        Marketplace Listings
      </h1>

      <PostGrid
        loading={loading}
        error={error}
        currentPosts={currentPosts}
        userId={userId}
        processingIds={processingIds}
        setSelectedPostId={handleOpenPost}
        handleVote={handlePostVote}
      />

      {totalPages > 1 && (
        <Pagination
          totalPages={totalPages}
          currentPage={currentPage}
          setCurrentPage={setCurrentPage}
          disabled={loading}
        />
      )}

      {selectedPost && (
        <PostModal
          selectedPost={selectedPost}
          loading={modalLoading}
          onClose={() => {
            setSelectedPost(null);
            setSelectedPostId(null);
          }}
          setSelectedPostId={setSelectedPostId}
          setSelectedPost={setSelectedPost}
          userId={userId}
          isProcessing={isProcessing}
          handleBuy={handlePostBuy}
          handleToggleRequest={handlePostToggleRequest}
          handleConfirmTrade={handlePostConfirmTrade}
          handleCancelTrade={handlePostCancelTrade}
          setShowReportModal={setShowReportModal}
          setReportUrl={setReportUrl}
          isOwner={isOwner}
          isBuyer={isBuyer}
          userAlreadyConfirmed={userAlreadyConfirmed}
          bothConfirmed={bothConfirmed}
          modalRef={modalRef}
          processingIds={processingIds}
          hasConfirmed={hasConfirmed}
        />
      )}

      {showReportModal && (
        <ReportModal
          setShowReportModal={setShowReportModal}
          reportUrl={reportUrl}
          setReportUrl={setReportUrl}
          reportSubmitting={reportSubmitting}
          submitReport={handlePostReport}
          selectedPost={selectedPost}
          onReportSuccess={(updatedPost) => {
            // 1. Update selectedPost in modal
            setSelectedPost(updatedPost);

            // 2. Update the main post list
            setPosts((prev) =>
              prev.map((p) => (p._id === updatedPost._id ? updatedPost : p))
            );

            // 3. Close the modal
            setShowReportModal(false);
          }}
        />
      )}

      {showLoginModal && (
        <LoginModal setShowLoginModal={setShowLoginModal} modalRef={modalRef} />
      )}
    </div>
  );
};

export default AllPosts;
