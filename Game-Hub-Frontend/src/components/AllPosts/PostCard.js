// src/components/AllPosts/PostCard.js
import React from "react";
import { ThumbsUp, ThumbsDown } from "lucide-react";

const PostCard = ({
  post,
  userId,
  isProcessing,
  setSelectedPostId,
  handleVote,
}) => {
  const hasVoted = post.voters?.includes(userId);

  return (
    <div className="bg-white dark:bg-darkCard rounded-2xl shadow-card hover:shadow-cardHover transition-shadow duration-300 p-6">
      <h2 className="text-lg font-semibold mb-2">{post.description}</h2>
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
          disabled={hasVoted || isProcessing}
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
          disabled={hasVoted || isProcessing}
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
};

export default React.memo(PostCard);
