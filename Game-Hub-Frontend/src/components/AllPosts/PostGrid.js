// src/components/AllPosts/PostGrid.js
import React from "react";
import SkeletonCard from "../common/SkeletonCard";
import PostCard from "./PostCard";
import { useInView } from "react-intersection-observer";

// Wrapper to use useInView per post
const PostCardWrapper = ({
  post,
  userId,
  processingIds,
  setSelectedPostId,
  handleVote,
  index,
}) => {
  const { ref, inView } = useInView({ triggerOnce: true });

  return (
    <div
      ref={ref}
      style={{ animationDelay: `${index * 100}ms` }}
      className={`transition-transform duration-300 hover:scale-[1.02] hover:shadow-lg
                  ${inView ? "animate-fadeInUp opacity-100" : "opacity-0"}`}
    >
      <PostCard
        post={post}
        userId={userId}
        isProcessing={processingIds.has(post._id)}
        setSelectedPostId={setSelectedPostId}
        handleVote={handleVote}
      />
    </div>
  );
};

const PostGrid = ({
  loading,
  error,
  currentPosts,
  userId,
  processingIds,
  setSelectedPostId,
  handleVote,
}) => {
  // Loading state → skeletons
  if (loading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6 max-w-7xl mx-auto px-4">
        {Array.from({ length: 9 }).map((_, i) => (
          <SkeletonCard key={i} />
        ))}
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="text-center text-red-500 font-semibold mt-10">
        {error}
      </div>
    );
  }

  // Empty state
  if (!currentPosts || currentPosts.length === 0) {
    return (
      <div className="text-center text-gray-400 text-lg mt-10">
        <div className="text-4xl animate-bounce mb-2">📭</div>
        No posts found.
      </div>
    );
  }

  // Normal render
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6 max-w-7xl mx-auto px-4">
      {currentPosts.map((post, index) => (
        <PostCardWrapper
          key={post._id}
          post={post}
          userId={userId}
          processingIds={processingIds}
          setSelectedPostId={setSelectedPostId}
          handleVote={handleVote}
          index={index}
        />
      ))}
    </div>
  );
};

export default PostGrid;
