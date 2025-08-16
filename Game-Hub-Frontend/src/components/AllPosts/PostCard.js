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

const VoteButton = ({ type, count, onClick, disabled }) => {
  const Icon = type === "good" ? ThumbsUp : ThumbsDown;
  const bgColor = type === "good" ? "green" : "red";

  return (
    <button
      onClick={onClick}
      disabled={disabled}
      title={disabled ? "Already voted or processing..." : `Vote ${type}`}
      className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-sm font-medium transition-all duration-200 ${
        disabled
          ? "bg-gray-300 dark:bg-gray-600 text-gray-500 cursor-not-allowed"
          : `bg-${bgColor}-100 hover:bg-${bgColor}-200 dark:bg-${bgColor}-800 dark:hover:bg-${bgColor}-700 text-${bgColor}-800 dark:text-white`
      }`}
    >
      <Icon className="w-4 h-4" />
      {count || 0}
    </button>
  );
};

const PostCard = ({
  post,
  userId,
  isProcessing,
  setSelectedPostId,
  handleVote,
}) => {
  const hasVoted = post.voters?.includes(userId);

  return (
    <div className="bg-white dark:bg-darkCard rounded-2xl shadow-lg hover:shadow-xl hover:scale-[1.02] transition-transform duration-300 p-5 flex flex-col justify-between border border-gray-200 dark:border-gray-700 h-full min-h-[320px] cursor-pointer">
      {/* Top Section */}
      <div className="flex flex-col flex-grow">
        <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-3 line-clamp-2">
          {post.description}
        </h2>
        <p className="flex items-center gap-1 text-sm font-semibold text-yellow-500 mb-1">
          <Coins className="w-4 h-4" />
          {post.price} {post.price === 1 ? "Coin" : "Coins"}
        </p>
        <p className="flex items-center gap-1 text-sm font-medium text-gray-600 dark:text-gray-300 mb-1">
          <Monitor className="w-4 h-4" />
          {post.server}
        </p>
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
        <div className="flex-grow" /> {/* Push footer down */}
      </div>

      {/* Footer */}
      <div>
        <div className="flex items-center gap-3 mb-3">
          <VoteButton
            type="good"
            count={post.good_response}
            onClick={() => handleVote(post._id, "good")}
            disabled={hasVoted || isProcessing}
          />
          <VoteButton
            type="bad"
            count={post.bad_response}
            onClick={() => handleVote(post._id, "bad")}
            disabled={hasVoted || isProcessing}
          />
        </div>

        <button
          onClick={() => setSelectedPostId(post._id)}
          className="mt-auto w-full bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-xl text-sm font-semibold transition-all duration-200"
        >
          View Details
        </button>
      </div>
    </div>
  );
};

export default React.memo(PostCard);
