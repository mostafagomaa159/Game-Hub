// src/pages/AllPosts.js
import React, {
  useState,
  useRef,
  useEffect,
  useMemo,
  useCallback,
} from "react";
import usePosts from "../hooks/usePosts";
import useUser from "../hooks/useUser";
import usePostActions from "../hooks/usePostActions";
import Filters from "../components/AllPosts/Filters";
import PostGrid from "../components/AllPosts/PostGrid";
import PostModal from "../components/AllPosts/PostModal";
import ReportModal from "../components/AllPosts/ReportModal";
import LoginModal from "../components/AllPosts/LoginModal";
import Pagination from "../components/AllPosts/Pagination";

const POSTS_PER_PAGE = 12;

const AllPosts = () => {
  // State declarations
  const { posts, loading, error, setPosts } = usePosts();
  const { userId } = useUser();
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

  // Reset hasConfirmed whenever selected post changes
  useEffect(() => {
    setHasConfirmed(false);
  }, [selectedPostId]);

  // Memoized filtered posts
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

  // Memoized pagination data
  const { currentPosts, totalPages } = useMemo(() => {
    const indexOfLast = currentPage * POSTS_PER_PAGE;
    const indexOfFirst = indexOfLast - POSTS_PER_PAGE;
    return {
      currentPosts: filtered.slice(indexOfFirst, indexOfLast),
      totalPages: Math.ceil(filtered.length / POSTS_PER_PAGE),
    };
  }, [currentPage, filtered]);

  // Selected post
  const selectedPost = useMemo(
    () => posts.find((p) => p._id === selectedPostId),
    [posts, selectedPostId]
  );

  // Ownership checks
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

  // Post actions hook with all required parameters
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
    setProcessingIds,
    setShowLoginModal,
    setSelectedPostId,
    setHasConfirmed
  );

  // Click outside handler
  const handleClickOutside = useCallback((e) => {
    if (modalRef.current && !modalRef.current.contains(e.target)) {
      setSelectedPostId(null);
      setShowLoginModal(false);
    }
  }, []);

  // Effect for click outside
  useEffect(() => {
    if (selectedPost || showLoginModal) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [selectedPost, showLoginModal, handleClickOutside]);

  // Fixed handlers for buttons
  const handlePostVote = (postId, voteType) => {
    handleVote(
      posts.find((p) => p._id === postId),
      voteType
    );
  };

  const handlePostBuy = (postId) => {
    handleBuy(posts.find((p) => p._id === postId));
  };

  const handlePostToggleRequest = () => {
    if (selectedPost) {
      handleToggleRequest(selectedPost);
    }
  };

  const handlePostConfirmTrade = () => {
    if (selectedPost) {
      handleConfirmTrade(selectedPost);
    }
  };

  const handlePostCancelTrade = () => {
    if (selectedPost) {
      handleCancelTrade(selectedPost);
    }
  };

  const handlePostReport = () => {
    if (selectedPost) {
      submitReport(selectedPost, reportUrl).then((success) => {
        if (success) {
          setShowReportModal(false);
          setReportUrl("");
        }
      });
    }
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
      />

      {totalPages > 1 && (
        <Pagination
          totalPages={totalPages}
          currentPage={currentPage}
          setCurrentPage={setCurrentPage}
          disabled={loading} // optional disable while loading
        />
      )}

      {selectedPost && (
        <PostModal
          selectedPost={selectedPost}
          setSelectedPostId={setSelectedPostId}
          userId={userId}
          isProcessing={isProcessing}
          handleBuy={() => handlePostBuy(selectedPost._id)}
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
