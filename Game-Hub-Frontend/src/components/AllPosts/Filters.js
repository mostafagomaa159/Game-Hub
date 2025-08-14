// src/components/AllPosts/Filters.js
import { FiSearch, FiDollarSign } from "react-icons/fi";

const Filters = ({
  searchTerm,
  setSearchTerm,
  serverFilter,
  setServerFilter,
  priceMin,
  setPriceMin,
  priceMax,
  setPriceMax,
  availableOnly,
  setAvailableOnly,
  posts,
}) => {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-4 mb-6 max-w-6xl mx-auto">
      {/* Search */}
      <div className="relative col-span-1 sm:col-span-2">
        <FiSearch
          className="absolute top-1/2 left-3 transform -translate-y-1/2 text-gray-400 dark:text-gray-500"
          size={20}
        />
        <input
          type="text"
          placeholder="Search description..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10 p-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-darkCard dark:text-white w-full"
        />
      </div>

      {/* Server */}
      <select
        value={serverFilter}
        onChange={(e) => setServerFilter(e.target.value)}
        className="border px-3 py-2 rounded shadow-sm bg-white dark:bg-darkCard w-full"
      >
        <option value="All">All Servers</option>
        {[...new Set(posts.map((p) => p.server))].map((server) => (
          <option key={server} value={server}>
            {server}
          </option>
        ))}
      </select>

      {/* Min Price */}
      <div className="relative">
        <FiDollarSign
          className="absolute top-1/2 left-3 transform -translate-y-1/2 text-gray-400 dark:text-gray-500"
          size={20}
        />
        <input
          type="number"
          placeholder="Min Price"
          value={priceMin}
          onChange={(e) => setPriceMin(e.target.value)}
          className="pl-10 p-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-darkCard dark:text-white w-full"
          min="0"
        />
      </div>

      {/* Max Price */}
      <div className="relative">
        <FiDollarSign
          className="absolute top-1/2 left-3 transform -translate-y-1/2 text-gray-400 dark:text-gray-500"
          size={20}
        />
        <input
          type="number"
          placeholder="Max Price"
          value={priceMax}
          onChange={(e) => setPriceMax(e.target.value)}
          className="pl-10 p-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-darkCard dark:text-white w-full"
          min="0"
        />
      </div>

      {/* Available Only */}
      <label className="flex items-center gap-2 text-sm select-none cursor-pointer">
        <input
          type="checkbox"
          checked={availableOnly}
          onChange={(e) => setAvailableOnly(e.target.checked)}
          className="accent-blue-600"
        />
        Available Only
      </label>
    </div>
  );
};

export default Filters;
