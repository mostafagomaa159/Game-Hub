// src/components/AllPosts/Filters.js
import React from "react";

const Filters = ({
  searchTerm,
  setSearchTerm,
  serverFilter,
  setServerFilter,
  posts,
}) => {
  return (
    <div className="flex flex-col sm:flex-row items-center gap-4 justify-between mb-6 max-w-5xl mx-auto">
      <input
        type="text"
        placeholder="Search by description..."
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        className="border px-3 py-2 rounded w-full sm:w-1/2 bg-white dark:bg-darkCard shadow-sm"
      />
      <select
        value={serverFilter}
        onChange={(e) => setServerFilter(e.target.value)}
        className="border px-3 py-2 rounded bg-white dark:bg-darkCard shadow-sm"
      >
        <option value="All">All Servers</option>
        {[...new Set(posts.map((p) => p.server))].map((server) => (
          <option key={server} value={server}>
            {server}
          </option>
        ))}
      </select>
    </div>
  );
};

export default Filters;
