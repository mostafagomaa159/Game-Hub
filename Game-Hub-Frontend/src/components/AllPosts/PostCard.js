// src/components/AllPosts/PostCard.js
import React from "react";
import {
  ThumbsUp,
  ThumbsDown,
  Monitor,
  Coins,
  CheckCircle,
  XCircle,
} from "lucide-react";

const PostCard = ({
  post,
  userId,
  isProcessing,
  setSelectedPostId,
  handleVote,
}) => {
  const hasVoted = post.voters?.includes(userId);

  return (
    <div
      className="bg-white dark:bg-darkCard rounded-2xl shadow-lg hover:shadow-xl
             transition-all duration-300 p-5 flex flex-col justify-between
             border border-gray-200 dark:border-gray-700
             h-full min-h-[320px]"
    >
      {/* Top section */}
      <div className="flex flex-col flex-grow">
        {/* Title (line clamp 2) */}
        <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-3 line-clamp-2">
          {post.description}
        </h2>

        {/* Price */}
        <p className="flex items-center gap-1 text-sm font-semibold text-yellow-500 mb-1">
          <Coins className="w-4 h-4" />
          {post.price} {post.price === 1 ? "Coin" : "Coins"}
        </p>

        {/* Server */}
        <p className="flex items-center gap-1 text-sm font-medium text-gray-600 dark:text-gray-300 mb-1">
          <Monitor className="w-4 h-4" />
          {post.server}
        </p>

        {/* Availability */}
        <p
          className={`flex items-center gap-1 text-sm font-semibold mb-2 ${
            post.avaliable ? "text-green-600" : "text-red-500"
          }`}
        >
          {post.avaliable ? (
            <CheckCircle className="w-4 h-4" />
          ) : (
            <XCircle className="w-4 h-4" />
          )}
          {post.avaliable ? "Available" : "Not Available"}
        </p>

        {/* Push footer to bottom */}
        <div className="flex-grow" />
      </div>

      {/* Footer */}
      <div>
        {/* Votes */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => handleVote(post._id, "good")}
            className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-sm font-medium transition-all duration-200 ${
              hasVoted
                ? "bg-green-300 text-gray-700 cursor-not-allowed"
                : "bg-green-100 hover:bg-green-200 dark:bg-green-800 dark:hover:bg-green-700 text-green-800 dark:text-white"
            }`}
            disabled={hasVoted || isProcessing}
          >
            <ThumbsUp className="w-4 h-4" />
            {post.good_response || 0}
          </button>

          <button
            onClick={() => handleVote(post._id, "bad")}
            className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-sm font-medium transition-all duration-200 ${
              hasVoted
                ? "bg-red-300 text-gray-700 cursor-not-allowed"
                : "bg-red-100 hover:bg-red-200 dark:bg-red-800 dark:hover:bg-red-700 text-red-800 dark:text-white"
            }`}
            disabled={hasVoted || isProcessing}
          >
            <ThumbsDown className="w-4 h-4" />
            {post.bad_response || 0}
          </button>
        </div>

        {/* View Button */}
        <button
          onClick={() => setSelectedPostId(post._id)}
          className="mt-4 w-full bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-xl text-sm font-semibold transition-all duration-200"
        >
          View Details
        </button>
      </div>
    </div>
  );
};

export default React.memo(PostCard);
