import React, { useState, useEffect, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import PostModal from "../components/AllPosts/PostModal";
import axios from "../api/axiosInstance";
import { FaRegCopy } from "react-icons/fa";

const UserProfilePage = () => {
  const { userId } = useParams();
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPosts, setTotalPosts] = useState(0);
  const [completedTrades, setCompletedTrades] = useState(0);
  const [selectedPost, setSelectedPost] = useState(null);
  const [copied, setCopied] = useState(false);
  const [commentInputs, setCommentInputs] = useState({});
  const [replyInputs, setReplyInputs] = useState({});

  const limit = 10;

  // Fetch user data and posts
  const fetchProfileData = useCallback(async () => {
    try {
      setLoading(true);
      const userRes = await axios.get(
        `/user/${userId}/profile?page=${page}&limit=${limit}`
      );
      console.log("Posts data:", userRes.data.posts);
      setUser(userRes.data.user);
      setPosts(userRes.data.posts);
      setTotalPosts(userRes.data.totalPosts);
      setCompletedTrades(userRes.data.completedTradesCount);
    } catch (error) {
      toast.error("Failed to load profile data");
      console.error(error);
      navigate("/");
    } finally {
      setLoading(false);
    }
  }, [userId, page, limit, navigate]);

  useEffect(() => {
    fetchProfileData();
  }, [fetchProfileData]);

  // Handle post reactions
  const handleReact = async (postId, reactionType) => {
    try {
      const res = await axios.post(`/posts/${postId}/react`, { reactionType });

      setPosts((prevPosts) =>
        prevPosts.map((post) =>
          post._id === postId
            ? {
                ...post,
                reactions: res.data.reactions,
                userReaction: res.data.userReaction,
              }
            : post
        )
      );
    } catch (error) {
      toast.error("Failed to add reaction");
    }
  };

  // Handle new comment
  const handleComment = async (postId) => {
    if (!commentInputs[postId]) return;
    try {
      const res = await axios.post(`/posts/${postId}/comments`, {
        text: commentInputs[postId],
      });
      setPosts((prev) =>
        prev.map((post) =>
          post._id === postId
            ? { ...post, comments: [...post.comments, res.data] }
            : post
        )
      );
      setCommentInputs({ ...commentInputs, [postId]: "" });
    } catch (error) {
      toast.error("Failed to add comment");
    }
  };

  // Handle comment replies
  const handleReply = async (postId, commentId) => {
    if (!replyInputs[commentId]) return;
    try {
      const res = await axios.post(
        `/posts/${postId}/comments/${commentId}/reply`,
        { text: replyInputs[commentId] }
      );
      setPosts((prev) =>
        prev.map((post) =>
          post._id === postId
            ? {
                ...post,
                comments: post.comments.map((c) =>
                  c._id === commentId
                    ? { ...c, replies: [...c.replies, res.data] }
                    : c
                ),
              }
            : post
        )
      );
      setReplyInputs({ ...replyInputs, [commentId]: "" });
    } catch (error) {
      toast.error("Failed to add reply");
    }
  };

  const getCount = (reaction) =>
    Array.isArray(reaction) ? reaction.length : reaction ?? 0;

  // Handle post sharing
  const handleShare = async (postId) => {
    try {
      const { data } = await axios.post(`/posts/${postId}/share`);
      toast.success(`Post shared! Shares: ${data.sharesCount}`);

      setPosts((prevPosts) =>
        prevPosts.map((post) =>
          post._id === postId
            ? { ...post, sharesCount: data.sharesCount }
            : post
        )
      );
    } catch (error) {
      const message = error.response?.data?.error || "Failed to share post";
      toast.error(message);
    }
  };

  const handleCopyLink = (postId) => {
    // Make sure to accept postId parameter
    const url = `${window.location.origin}/posts/${postId}`;
    navigator.clipboard
      .writeText(url)
      .then(() => {
        setCopied(true);
        toast.success("Link copied to clipboard!");
        setTimeout(() => setCopied(false), 2000);
      })
      .catch(() => {
        toast.error("Failed to copy link");
      });
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex justify-center items-center min-h-screen text-gray-600 dark:text-gray-300">
        User not found
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Enhanced User Profile Header */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 mb-8 border border-gray-100 dark:border-gray-700">
        <div className="flex flex-col md:flex-row items-center gap-6">
          <div className="relative w-24 h-24 rounded-full bg-gradient-to-br from-blue-100 to-purple-100 dark:from-gray-700 dark:to-gray-600 p-1 shadow-md">
            <div className="w-full h-full rounded-full bg-white dark:bg-gray-800 flex items-center justify-center overflow-hidden border-2 border-white dark:border-gray-700">
              {user.avatar ? (
                <img
                  src={`data:image/jpeg;base64,${user.avatar}`}
                  alt="Profile"
                  className="w-full h-full object-cover"
                />
              ) : (
                <span className="text-3xl text-gray-500 dark:text-gray-400">
                  {user.name.charAt(0).toUpperCase()}
                </span>
              )}
            </div>
          </div>

          <div className="flex-1 text-center md:text-left">
            <h1 className="text-2xl font-bold dark:text-white">{user.name}</h1>
            <p className="text-gray-600 dark:text-gray-300">{user.email}</p>
            <div className="flex flex-wrap justify-center md:justify-start gap-3 mt-3">
              <div className="bg-blue-50 dark:bg-blue-900/30 px-3 py-1 rounded-lg border border-blue-100 dark:border-blue-900/50">
                <span className="font-medium text-blue-700 dark:text-blue-300">
                  {totalPosts} {totalPosts === 1 ? "Post" : "Posts"}
                </span>
              </div>
              <div className="bg-green-50 dark:bg-green-900/30 px-3 py-1 rounded-lg border border-green-100 dark:border-green-900/50">
                <span className="font-medium text-green-700 dark:text-green-300">
                  {completedTrades} Completed Trades
                </span>
              </div>
              <div className="bg-yellow-50 dark:bg-yellow-900/30 px-3 py-1 rounded-lg border border-yellow-100 dark:border-yellow-900/50">
                <span className="font-medium text-yellow-700 dark:text-yellow-300">
                  {user.coins} Coins
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Enhanced User Posts Section */}
      <div className="mb-8">
        <h2 className="text-xl font-semibold dark:text-white mb-6">
          Recent Posts
        </h2>

        {posts.length === 0 ? (
          <div className="text-center py-10 text-gray-500 dark:text-gray-400 bg-white dark:bg-gray-800 rounded-xl shadow p-8 border border-gray-100 dark:border-gray-700">
            No posts found
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {posts.map((post) => (
              <div
                key={post._id}
                className="bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-all duration-300 cursor-pointer border border-gray-100 dark:border-gray-700"
                onClick={() => setSelectedPost(post)}
              >
                {post.media && post.media.length > 0 && (
                  <div className="h-48 w-full relative overflow-hidden">
                    <img
                      src={post.media[0].url}
                      alt="Post media"
                      className="w-full h-full object-cover transition-transform duration-500 hover:scale-105"
                    />
                    <div className="absolute top-2 right-2 bg-black/60 text-white px-2 py-1 rounded-md text-xs backdrop-blur-sm">
                      {post.server}
                    </div>
                  </div>
                )}

                <div className="p-4">
                  <h3 className="font-bold text-lg dark:text-white mb-2 line-clamp-2">
                    {post.description}
                  </h3>

                  <div className="flex justify-between items-center mb-2">
                    <span className="text-yellow-600 dark:text-yellow-400 font-semibold">
                      {post.price} {post.price === 1 ? "Coin" : "Coins"}
                    </span>

                    {post.avaliable ? (
                      <span className="inline-block px-2 py-1 rounded-full text-xs bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                        Available to buy
                      </span>
                    ) : (
                      <span className="inline-block px-2 py-1 rounded-full text-xs bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200">
                        Unavailable to buy
                      </span>
                    )}
                  </div>

                  <div className="flex justify-between items-center text-sm">
                    <div className="flex space-x-2">
                      {/* Like - Original implementation */}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleReact(post._id, "like");
                        }}
                        className={`flex items-center cursor-pointer select-none ${
                          post.userReaction === "like"
                            ? "text-blue-600 font-semibold"
                            : "text-gray-500 dark:text-gray-400 hover:text-blue-500"
                        }`}
                      >
                        👍 {getCount(post.reactions?.like)}
                      </button>

                      {/* Love - Original implementation */}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleReact(post._id, "love");
                        }}
                        className={`flex items-center cursor-pointer select-none ${
                          post.userReaction === "love"
                            ? "text-red-600 font-semibold"
                            : "text-gray-500 dark:text-gray-400 hover:text-red-500"
                        }`}
                      >
                        ❤️ {getCount(post.reactions?.love)}
                      </button>

                      {/* Haha - Original implementation */}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleReact(post._id, "haha");
                        }}
                        className={`flex items-center cursor-pointer select-none ${
                          post.userReaction === "haha"
                            ? "text-yellow-600 font-semibold"
                            : "text-gray-500 dark:text-gray-400 hover:text-yellow-500"
                        }`}
                      >
                        😆 {getCount(post.reactions?.haha)}
                      </button>

                      {/* Share Button - Original implementation */}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleShare(post._id);
                        }}
                        className="flex items-center text-gray-500 dark:text-gray-400 hover:text-green-500 cursor-pointer select-none"
                      >
                        🔗 Share ({post.sharesCount || 0})
                      </button>

                      {/* Copy link icon - Original implementation */}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleCopyLink(post._id); // Pass the post._id here
                        }}
                        title="Copy post link"
                        className="flex items-center gap-1 text-gray-500 dark:text-gray-400 hover:text-blue-500"
                      >
                        <FaRegCopy />
                        {copied ? "Copied!" : "Copy Link"}
                      </button>
                    </div>

                    <span
                      className={`px-2 py-1 rounded-full text-xs ${
                        post.tradeStatus === "completed"
                          ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
                          : post.tradeStatus === "pending"
                          ? "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200"
                          : "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200"
                      }`}
                    >
                      {post.tradeStatus}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Enhanced Pagination */}
        {totalPosts > limit && (
          <div className="flex justify-center mt-8">
            <nav className="inline-flex rounded-md shadow-sm">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className={`inline-flex items-center px-4 py-2 rounded-l-md border ${
                  page === 1
                    ? "bg-gray-50 dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-400 dark:text-gray-500 cursor-not-allowed"
                    : "bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
                }`}
              >
                Previous
              </button>
              <span className="inline-flex items-center px-4 py-2 border-t border-b border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300">
                Page {page} of {Math.ceil(totalPosts / limit)}
              </span>
              <button
                onClick={() => setPage((p) => p + 1)}
                disabled={page >= Math.ceil(totalPosts / limit)}
                className={`inline-flex items-center px-4 py-2 rounded-r-md border ${
                  page >= Math.ceil(totalPosts / limit)
                    ? "bg-gray-50 dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-400 dark:text-gray-500 cursor-not-allowed"
                    : "bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
                }`}
              >
                Next
              </button>
            </nav>
          </div>
        )}
      </div>

      {/* Post Modal with comments & replies */}
      {selectedPost && (
        <PostModal
          selectedPost={selectedPost}
          onClose={() => setSelectedPost(null)}
          userId={localStorage.getItem("userId")}
          isProcessing={false}
          handleBuy={async (postId) => {
            try {
              await axios.post(`/posts/${postId}/buy`);
              toast.success("Purchase initiated successfully");
              setSelectedPost(null);
              const res = await axios.get(
                `/user/${userId}/posts?page=${page}&limit=${limit}`
              );
              setPosts(res.data.posts);
            } catch (error) {
              toast.error("Failed to initiate purchase");
            }
          }}
          handleComment={handleComment}
          handleReply={handleReply}
          commentInputs={commentInputs}
          setCommentInputs={setCommentInputs}
          replyInputs={replyInputs}
          setReplyInputs={setReplyInputs}
        />
      )}
    </div>
  );
};

export default UserProfilePage;
