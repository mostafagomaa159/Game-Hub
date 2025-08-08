import React from "react";

const SkeletonCard = ({ variant = "post", count = 1, isHistory = false }) => {
  const renderPostSkeleton = () => (
    <div className="bg-white dark:bg-darkCard rounded-2xl shadow p-6 animate-pulse">
      <div className="space-y-3">
        <div className="h-5 bg-gray-200 dark:bg-gray-700 rounded w-3/4" />
        <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/3" />
        <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/2" />
        <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-2/5" />
        <div className="flex gap-4 pt-2">
          <div className="h-6 w-12 bg-gray-200 dark:bg-gray-700 rounded" />
          <div className="h-6 w-12 bg-gray-200 dark:bg-gray-700 rounded" />
        </div>
        <div className="h-8 w-20 bg-blue-200 dark:bg-blue-800 rounded-xl mt-3" />
      </div>
    </div>
  );

  const renderFormSkeleton = () => (
    <div className="p-4 rounded-lg bg-gray-900 animate-pulse border border-gray-800">
      <div className="space-y-3">
        <div className="h-6 bg-gray-700 rounded w-1/3" />
        <div className="h-32 bg-gray-800 rounded" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <div className="h-10 bg-gray-800 rounded" />
          <div className="h-10 bg-gray-800 rounded" />
          <div className="h-10 bg-gray-800 rounded" />
        </div>
        <div className="h-10 bg-gray-800 rounded w-32 mt-2" />
      </div>
    </div>
  );

  const renderUserSkeleton = () => (
    <div className="p-4 rounded-lg bg-gray-800 animate-pulse">
      <div className="flex items-start gap-3">
        <div className="h-12 w-12 rounded-full bg-gray-700" />
        <div className="flex-1">
          <div className="h-4 bg-gray-700 rounded w-3/5 mb-2" />
          <div className="h-3 bg-gray-700 rounded w-1/2 mb-3" />
          <div className="flex items-center gap-3">
            <div className="h-5 w-16 bg-gray-700 rounded" />
            <div className="h-5 w-20 bg-gray-700 rounded" />
          </div>
        </div>
      </div>
      {!isHistory && (
        <div className="mt-4 flex justify-end">
          <div className="h-8 w-24 bg-gray-700 rounded" />
        </div>
      )}
    </div>
  );

  const skeletons = [];
  const iterations = variant === "post" ? count : 1;

  for (let i = 0; i < iterations; i++) {
    switch (variant) {
      case "post":
        skeletons.push(
          <React.Fragment key={i}>{renderPostSkeleton()}</React.Fragment>
        );
        break;
      case "form":
        skeletons.push(
          <React.Fragment key={i}>{renderFormSkeleton()}</React.Fragment>
        );
        break;
      default:
        skeletons.push(
          <React.Fragment key={i}>{renderUserSkeleton()}</React.Fragment>
        );
    }
  }

  return <>{skeletons}</>;
};

export default React.memo(SkeletonCard);
