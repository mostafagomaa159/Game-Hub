// src/components/common/SkeletonCard.js
import React from "react";

/**
 * SkeletonCard
 * variant: "user" | "post" | "form"
 * isHistory: keeps old behaviour if needed
 */
const SkeletonCard = ({ variant = "user", isHistory = false }) => {
  if (variant === "post") {
    return (
      <div className="p-4 rounded-lg bg-gray-800 animate-pulse">
        <div className="flex flex-col gap-3">
          <div className="h-4 bg-gray-700 rounded w-2/5" />
          <div className="h-3 bg-gray-700 rounded w-full" />
          <div className="h-3 bg-gray-700 rounded w-5/6" />
          <div className="flex justify-between items-center mt-3">
            <div className="h-6 w-16 bg-gray-700 rounded" />
            <div className="h-6 w-10 bg-gray-700 rounded" />
          </div>
        </div>
      </div>
    );
  }

  if (variant === "form") {
    return (
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
  }

  // default: user skeleton
  return (
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
};

export default SkeletonCard;
