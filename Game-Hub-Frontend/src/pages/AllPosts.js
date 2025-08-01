import React, { useEffect, useRef, useState } from "react";
import axios from "../api/axiosInstance";
import { ThumbsUp, ThumbsDown } from "lucide-react";

const POSTS_PER_PAGE = 12;

const AllPosts = () => {
  const [posts, setPosts] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [serverFilter, setServerFilter] = useState("All");
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedPostId, setSelectedPostId] = useState(null);
  const selectedPost = posts.find((p) => p._id === selectedPostId);
  const [userId, setUserId] = useState(null);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const modalRef = useRef(null);

  useEffect(() => {
    const fetchAllPosts = async () => {
      try {
        const res = await axios.get("/all");
        // console.log("Fetched posts:", res.data); // <-- Add this line
        setPosts(res.data);
        setFiltered(res.data);
      } catch (err) {
        setError("Failed to load posts.");
      } finally {
        setLoading(false);
      }
    };

    const fetchUser = async () => {
      const token = localStorage.getItem("token");
      if (!token) {
        setUserId(null);
        return;
      }

      try {
        const res = await axios.get("/users/me");
        setUserId(res.data._id);
      } catch {
        setUserId(null);
      }
    };

    fetchAllPosts();
    fetchUser();
  }, []);

  useEffect(() => {
    let temp = [...posts];
    if (searchTerm) {
      temp = temp.filter((post) =>
        post.description.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    if (serverFilter !== "All") {
      temp = temp.filter((post) => post.server === serverFilter);
    }
    setFiltered(temp);
    setCurrentPage(1);
  }, [searchTerm, serverFilter, posts]);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (modalRef.current && !modalRef.current.contains(e.target)) {
        setSelectedPostId(null);
        setShowLoginModal(false);
      }
    };

    if (selectedPost || showLoginModal) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [selectedPost, showLoginModal]);

  const handleVote = async (postId, voteType) => {
    if (!userId) {
      setShowLoginModal(true);
      return;
    }

    const post = posts.find((p) => p._id === postId);
    if (post?.voters?.includes(userId)) {
      return;
    }

    try {
      const res = await axios.patch(`/newpost/${postId}/vote`, {
        vote: voteType,
      });
      setPosts((prev) => prev.map((p) => (p._id === postId ? res.data : p)));
    } catch (err) {
      console.error(err);
    }
  };

  const handleBuy = async (postId) => {
    if (!userId) {
      setShowLoginModal(true);
      return;
    }

    try {
      const res = await axios.post(`/newpost/${postId}/buy`);
      const updatedPost = res.data.post;

      setSelectedPostId(updatedPost._id); // keep modal in sync
      setPosts((prev) => prev.map((p) => (p._id === postId ? updatedPost : p)));
    } catch (err) {
      console.error("Buy error", err.response?.data || err.message);
      alert(err.response?.data?.error || "Buy failed");
    }
  };

  const handleConfirmTrade = async () => {
    try {
      const res = await axios.post(
        `/newpost/${selectedPost._id}/confirm-trade`
      );
      const updatedPost = res.data;

      setSelectedPostId(updatedPost._id); // ensure modal sync
      setPosts((prev) =>
        prev.map((p) => (p._id === updatedPost._id ? updatedPost : p))
      );
    } catch (err) {
      console.error("Confirm trade error", err);
    }
  };

  const handleCancelTrade = async () => {
    try {
      const res = await axios.post(
        `/newpost/${selectedPost._id}/cancel-trade`,
        {
          note: "Cancelled by user",
        }
      );

      const updatedPost = res.data.post;

      // Update posts list
      setPosts((prev) =>
        prev.map((p) => (p._id === updatedPost._id ? updatedPost : p))
      );

      // ✅ Update modal selection by ID
      setSelectedPostId(updatedPost._id);
    } catch (err) {
      console.error("Cancel trade error", err);
    }
  };

  const userAlreadyConfirmed = () =>
    selectedPost?.tradeConfirmations?.includes(userId);

  const isOwner =
    selectedPost?.owner?._id === userId || selectedPost?.owner === userId;
  const isBuyer =
    selectedPost?.buyer?._id === userId || selectedPost?.buyer === userId;

  const indexOfLast = currentPage * POSTS_PER_PAGE;
  const indexOfFirst = indexOfLast - POSTS_PER_PAGE;
  const currentPosts = filtered.slice(indexOfFirst, indexOfLast);
  const totalPages = Math.ceil(filtered.length / POSTS_PER_PAGE);

  return (
    <div className="bg-background dark:bg-darkBackground text-black dark:text-white min-h-screen py-8 px-4">
      {/* Filter and Search */}
      <div className="flex flex-col sm:flex-row items-center gap-4 justify-between mb-6 max-w-5xl mx-auto">
        <input
          type="text"
          placeholder="Search by description..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="border px-3 py-2 rounded w-full sm:w-1/2 bg-white dark:bg-darkCard shadow-sm"
        />
        <select
          value={serverFilter}
          onChange={(e) => setServerFilter(e.target.value)}
          className="border px-3 py-2 rounded bg-white dark:bg-darkCard shadow-sm"
        >
          <option value="All">All Servers</option>
          {[...new Set(posts.map((p) => p.server))].map((server) => (
            <option key={server} value={server}>
              {server}
            </option>
          ))}
        </select>
      </div>

      <h1 className="text-3xl font-bold text-center mb-6">
        Marketplace Listings
      </h1>

      {/* Posts */}
      {loading ? (
        <div className="text-center mt-10 text-lg font-medium">
          Loading posts...
        </div>
      ) : error ? (
        <div className="text-center text-red-500 font-semibold mt-10">
          {error}
        </div>
      ) : currentPosts.length === 0 ? (
        <p className="text-center text-gray-500">No matching posts found.</p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
          {currentPosts.map((post) => {
            const hasVoted = post.voters?.includes(userId);
            return (
              <div
                key={post._id}
                className="bg-white dark:bg-darkCard rounded-2xl shadow-card hover:shadow-cardHover transition-shadow duration-300 p-6"
              >
                <h2 className="text-lg font-semibold mb-2">
                  {post.description}
                </h2>
                <p className="text-sm mb-1">💰 {post.price} Coins</p>
                <p className="text-sm mb-1">🖥 Server: {post.server}</p>
                <p
                  className={`text-sm font-semibold ${
                    post.avaliable ? "text-green-600" : "text-red-500"
                  }`}
                >
                  {post.avaliable ? "✔️ Available" : "❌ Not Available"}
                </p>
                <div className="flex items-center gap-4 text-sm mb-1 mt-2">
                  <button
                    onClick={() => handleVote(post._id, "good")}
                    className={`flex items-center gap-1 px-2 py-1 rounded transition ${
                      hasVoted
                        ? "bg-green-300 text-gray-700 cursor-not-allowed"
                        : "hover:bg-green-100 dark:hover:bg-green-800"
                    }`}
                    disabled={hasVoted}
                  >
                    <ThumbsUp className="w-4 h-4" />
                    <span>{post.good_response || 0}</span>
                  </button>
                  <button
                    onClick={() => handleVote(post._id, "bad")}
                    className={`flex items-center gap-1 px-2 py-1 rounded transition ${
                      hasVoted
                        ? "bg-red-300 text-gray-700 cursor-not-allowed"
                        : "hover:bg-red-100 dark:hover:bg-red-800"
                    }`}
                    disabled={hasVoted}
                  >
                    <ThumbsDown className="w-4 h-4" />
                    <span>{post.bad_response || 0}</span>
                  </button>
                </div>
                <button
                  onClick={() => setSelectedPostId(post._id)}
                  className="mt-3 inline-block bg-blue-600 text-white px-4 py-2 rounded-xl hover:bg-blue-700 text-sm"
                >
                  View
                </button>
              </div>
            );
          })}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex justify-center mt-8 space-x-2">
          {[...Array(totalPages)].map((_, idx) => (
            <button
              key={idx + 1}
              className={`px-3 py-1 rounded-xl border transition ${
                currentPage === idx + 1
                  ? "bg-blue-500 text-white"
                  : "bg-white dark:bg-darkCard text-black dark:text-white hover:bg-gray-200 dark:hover:bg-gray-700"
              }`}
              onClick={() => setCurrentPage(idx + 1)}
            >
              {idx + 1}
            </button>
          ))}
        </div>
      )}

      {/* Modal */}
      {selectedPost && (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50">
          <div
            ref={modalRef}
            className="bg-white dark:bg-darkCard text-black dark:text-white rounded-2xl shadow-xl w-full max-w-md p-6 relative"
          >
            <button
              onClick={() => setSelectedPostId(null)}
              className="absolute top-2 right-2 text-gray-500 hover:text-gray-800 dark:hover:text-white text-xl"
            >
              &times;
            </button>
            <h2 className="text-2xl font-bold mb-2">
              {selectedPost.description}
            </h2>
            <p className="mb-2 text-sm text-gray-500 dark:text-gray-300">
              Server: {selectedPost.server}
            </p>
            <p className="mb-2 text-yellow-500 font-semibold">
              {selectedPost.price} Coins
            </p>
            <p className="mb-2 text-sm">
              Discord:{" "}
              <span className="text-blue-600 dark:text-blue-400">
                {selectedPost.discord}
              </span>
            </p>
            <p
              className={`text-sm font-semibold ${
                selectedPost.avaliable ? "text-green-600" : "text-red-500"
              }`}
            >
              {selectedPost.avaliable ? "✔️ Available" : "❌ Not Available"}
            </p>
            {selectedPost.owner && (
              <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
                Seller: {selectedPost.owner.name || "Unknown"}
              </p>
            )}

            {/* Trade Buttons */}
            {selectedPost.tradeStatus === "pending" &&
              (isOwner || isBuyer) &&
              !userAlreadyConfirmed() && (
                <button
                  onClick={handleConfirmTrade}
                  className="mt-4 w-full py-2 bg-green-600 hover:bg-green-700 text-white rounded-xl"
                >
                  Confirm Trade
                </button>
              )}
            {selectedPost.tradeStatus === "pending" && (isOwner || isBuyer) && (
              <button
                onClick={handleCancelTrade}
                className="mt-2 w-full py-2 bg-red-600 hover:bg-red-700 text-white rounded-xl"
              >
                Cancel Trade
              </button>
            )}

            {/* Buy */}
            {userId && selectedPost.owner?._id !== userId && (
              <>
                {selectedPost.avaliable ? (
                  <button
                    className="mt-4 w-full py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white"
                    onClick={() => handleBuy(selectedPost._id)}
                  >
                    Buy Now
                  </button>
                ) : (
                  <button
                    className="mt-4 w-full py-2 rounded-xl bg-gray-500 text-white cursor-not-allowed"
                    disabled
                  >
                    Not Available
                  </button>
                )}
              </>
            )}
          </div>
        </div>
      )}

      {/* Login Modal */}
      {showLoginModal && (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50">
          <div
            ref={modalRef}
            className="bg-white dark:bg-gray-900 rounded-xl shadow-lg p-6 w-80"
          >
            <h3 className="text-xl font-bold mb-4 text-gray-800 dark:text-white">
              Login Required
            </h3>
            <p className="text-gray-600 dark:text-gray-300 mb-6">
              You need to log in to perform this action.
            </p>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setShowLoginModal(false)}
                className="px-4 py-2 bg-gray-300 dark:bg-gray-700 dark:text-white rounded hover:bg-gray-400"
              >
                Cancel
              </button>
              <button
                onClick={() => (window.location.href = "/login")}
                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
              >
                Go to Login
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AllPosts;
