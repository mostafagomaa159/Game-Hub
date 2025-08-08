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
  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
        {Array.from({ length: 12 }).map((_, i) => (
          <SkeletonCard key={i} />
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center text-red-500 font-semibold mt-10">
        {error}
      </div>
    );
  }

  if (currentPosts.length === 0) {
    return (
      <div className="text-center text-gray-400 text-lg mt-10">
        <div className="text-4xl animate-bounce mb-2">📭</div>
        No posts found.
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
      {currentPosts.map((post) => (
        <PostCard
          key={post._id}
          post={post}
          userId={userId}
          isProcessing={processingIds.has(post._id)}
          setSelectedPostId={setSelectedPostId}
          handleVote={handleVote}
        />
      ))}
    </div>
  );
};

export default PostGrid;
