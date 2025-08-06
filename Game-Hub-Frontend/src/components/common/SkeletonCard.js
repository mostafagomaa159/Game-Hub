import React from "react";

const SkeletonCard = ({ isHistory }) => (
  <div className="p-4 rounded-lg mb-4 bg-gray-800">
    <div className="animate-pulse flex flex-col gap-2">
      <div className="h-4 bg-gray-700 rounded w-3/4" />
      <div className="h-4 bg-gray-700 rounded w-1/2" />
      <div className="h-4 bg-gray-700 rounded w-1/3" />
      {!isHistory && (
        <>
          <div className="h-3 bg-gray-700 rounded w-full" />
          <div className="h-3 bg-gray-700 rounded w-5/6" />
        </>
      )}
      <div className="h-8 bg-gray-700 rounded w-32 mt-2" />
    </div>
  </div>
);

export default SkeletonCard;
