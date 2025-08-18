// src/components/AllPosts/PostCard.js
import React from "react";
import {
  ThumbsUp,
  ThumbsDown,
  Monitor,
  Coins,
  CheckCircle,
  XCircle,
  ArrowRight,
} from "lucide-react";

const VoteButton = ({ type, count, onClick, active, disabled }) => {
  const Icon = type === "good" ? ThumbsUp : ThumbsDown;

  const baseStyles =
    "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-all duration-200";

  const styles = {
    good: active
      ? "bg-green-100/90 dark:bg-green-900/60 text-green-800 dark:text-green-200 border border-green-300 dark:border-green-700"
      : "bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 hover:text-green-700 dark:hover:text-green-400",
    bad: active
      ? "bg-red-100/90 dark:bg-red-900/60 text-red-800 dark:text-red-200 border border-red-300 dark:border-red-700"
      : "bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 hover:text-red-700 dark:hover:text-red-400",
  };

  return (
    <button
      onClick={onClick}
      disabled={disabled}
      title={active ? `Remove ${type} vote` : `Vote ${type}`}
      className={`${baseStyles} ${
        disabled && !active
          ? "bg-gray-200 dark:bg-gray-700 text-gray-400 dark:text-gray-500 cursor-not-allowed"
          : styles[type]
      }`}
    >
      <Icon className={`w-4 h-4 ${active ? "fill-current" : ""}`} />
      <span className="font-medium">{count || 0}</span>
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
  const userVote = post.voters?.find((v) => v.user === userId);

  return (
    <div
      onClick={() => setSelectedPostId(post._id)}
      className="group bg-white dark:bg-gray-900 rounded-xl shadow-sm hover:shadow-md transition-all duration-300 p-4 flex flex-col justify-between border border-gray-200 dark:border-gray-700 h-full min-h-[280px] cursor-pointer hover:border-gray-300 dark:hover:border-gray-600"
    >
      {/* Top Section */}
      <div className="flex flex-col flex-grow space-y-3">
        <h2 className="text-lg font-bold text-gray-900 dark:text-gray-100 line-clamp-2 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
          {post.description}
        </h2>

        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1.5 bg-gray-100 dark:bg-gray-800 px-2.5 py-1 rounded-full text-xs font-medium">
            <Monitor className="w-3 h-3" />
            {post.server}
          </span>
        </div>

        <div className="space-y-2">
          <div className="flex items-center gap-2 text-sm">
            <Coins className="w-4 h-4 text-yellow-500" />
            <span className="font-semibold text-yellow-600 dark:text-yellow-500">
              {post.price} {post.price === 1 ? "Coin" : "Coins"}
            </span>
          </div>

          <div
            className={`flex items-center gap-2 text-sm ${
              post.avaliable
                ? "text-green-600 dark:text-green-400"
                : "text-red-600 dark:text-red-400"
            }`}
          >
            {post.avaliable ? (
              <CheckCircle className="w-4 h-4" />
            ) : (
              <XCircle className="w-4 h-4" />
            )}
            <span className="font-medium">
              {post.avaliable ? "Available" : "Not Available"}
            </span>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="mt-4 space-y-3">
        <div className="flex items-center gap-2">
          <VoteButton
            type="good"
            count={post.good_response}
            onClick={(e) => {
              e.stopPropagation();
              handleVote(post._id, "good");
            }}
            active={userVote?.vote === "good"}
            disabled={isProcessing}
          />
          <VoteButton
            type="bad"
            count={post.bad_response}
            onClick={(e) => {
              e.stopPropagation();
              handleVote(post._id, "bad");
            }}
            active={userVote?.vote === "bad"}
            disabled={isProcessing}
          />
        </div>

        <button
          onClick={(e) => {
            e.stopPropagation();
            setSelectedPostId(post._id);
          }}
          className="w-full flex items-center justify-center gap-2 py-2 rounded-lg bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white text-sm font-medium shadow-sm hover:shadow-md transition-all duration-200"
        >
          View Details
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};

export default React.memo(PostCard);
