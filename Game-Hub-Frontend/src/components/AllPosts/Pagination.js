// src/components/AllPosts/Pagination.js
import React from "react";

const Pagination = ({ totalPages, currentPage, setCurrentPage }) => {
  if (totalPages <= 1) return null;

  return (
    <div className="flex justify-center mt-8 space-x-2">
      {[...Array(totalPages)].map((_, idx) => (
        <button
          key={idx + 1}
          className={`px-3 py-1 rounded-xl border transition ${
            currentPage === idx + 1
              ? "bg-blue-500 text-white"
              : "bg-white dark:bg-darkCard text-black dark:text-white hover:bg-gray-200 dark:hover:bg-gray-700"
          }`}
          onClick={() => setCurrentPage(idx + 1)}
        >
          {idx + 1}
        </button>
      ))}
    </div>
  );
};

export default React.memo(Pagination);
