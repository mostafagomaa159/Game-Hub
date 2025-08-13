// src/pages/AllPosts.js
import React, {
  useState,
  useRef,
  useEffect,
  useMemo,
  useCallback,
} from "react";
import usePosts from "../hooks/usePosts";
import { useUser } from "../context/UserContext";
import usePostActions from "../hooks/usePostActions";
import Filters from "../components/AllPosts/Filters";
import PostGrid from "../components/AllPosts/PostGrid";
import PostModal from "../components/AllPosts/PostModal";
import ReportModal from "../components/AllPosts/ReportModal";
import LoginModal from "../components/AllPosts/LoginModal";
import Pagination from "../components/AllPosts/Pagination";
import socket from "../utils/socket";

const POSTS_PER_PAGE = 12;

const AllPosts = () => {
  const { posts, loading, error, setPosts } = usePosts();
  const { user } = useUser();
  const userId = user?._id || null;

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

  useEffect(() => {
    setHasConfirmed(false);
  }, [selectedPostId]);

  // Join post rooms
  useEffect(() => {
    if (!posts.length) return;
    posts.forEach((post) => {
      socket.emit("joinRoom", { roomId: `post:${post._id}` });
    });
  }, [posts]);

  // Listen for updates
  useEffect(() => {
    const handlePostUpdated = (updatedData) => {
      setPosts((prevPosts) =>
        prevPosts.map((p) =>
          p._id === updatedData._id ? { ...p, ...updatedData } : p
        )
      );

      if (selectedPostId === updatedData._id) {
        setSelectedPostId(updatedData._id);
      }
    };

    socket.on("postUpdated", handlePostUpdated);
    return () => socket.off("postUpdated", handlePostUpdated);
  }, [selectedPostId, setPosts, setSelectedPostId]);

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

  const selectedPost = useMemo(
    () => posts.find((p) => p._id === selectedPostId),
    [posts, selectedPostId]
  );

  const isOwner = useMemo(
    () =>
      !!selectedPost &&
      (selectedPost.owner?._id === userId || selectedPost.owner === userId),
    [selectedPost, userId]
  );

  const isBuyer = useMemo(
    () =>
      !!selectedPost &&
      selectedPost.buyers?.some((b) => String(b) === String(userId)),
    [selectedPost, userId]
  );

  const {
    isProcessing,
    reportSubmitting,
    handleAcceptBuyer,
    handleCancelBuyer,
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
      return { success: false };
    }
    return await submitReport(post, reportData);
  };

  const handlePostVote = (postId, voteType) => {
    handleVote(
      posts.find((p) => p._id === postId),
      voteType
    );
  };

  const handlePostBuy = (post) => {
    handleBuy(post._id);
  };

  const handlePostToggleRequest = () => {
    if (selectedPost) handleToggleRequest(selectedPost);
  };

  const handlePostConfirmTrade = () => {
    if (selectedPost) handleConfirmTrade(selectedPost);
  };

  const handlePostCancelTrade = () => {
    if (selectedPost) handleCancelTrade(selectedPost);
  };

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
        setSelectedPostId={setSelectedPostId}
        handleVote={handlePostVote}
        handleBuy={handlePostBuy}
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
          setSelectedPostId={setSelectedPostId}
          userId={userId}
          isProcessing={isProcessing}
          handleBuy={handlePostBuy}
          handleToggleRequest={handlePostToggleRequest}
          handleAcceptBuyer={handleAcceptBuyer}
          handleCancelBuyer={handleCancelBuyer}
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
        />
      )}

      {showLoginModal && (
        <LoginModal setShowLoginModal={setShowLoginModal} modalRef={modalRef} />
      )}
    </div>
  );
};

export default AllPosts;
