import SkeletonCard from "../common/SkeletonCard";
import PostCard from "../AllPosts/PostCard";

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
    <div
      className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 
                 gap-6 max-w-7xl mx-auto px-4 
                 animate-fadeIn"
    >
      {currentPosts.map((post) => (
        <div
          key={post._id}
          className="transition-transform duration-300 hover:scale-[1.02] hover:shadow-lg"
        >
          <PostCard
            post={post}
            userId={userId}
            isProcessing={processingIds.has(post._id)}
            setSelectedPostId={setSelectedPostId}
            handleVote={handleVote}
          />
        </div>
      ))}
    </div>
  );
};

export default PostGrid;
