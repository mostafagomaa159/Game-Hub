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
    <div className="bg-white dark:bg-darkCard shadow-md rounded-2xl p-4 mb-6 max-w-6xl mx-auto">
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-6 gap-4">
        {/* Search */}
        <div className="relative col-span-1 sm:col-span-2">
          <FiSearch
            className="absolute top-1/2 left-3 -translate-y-1/2 text-gray-400"
            size={18}
          />
          <input
            type="text"
            placeholder="Search description..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 w-full py-2 rounded-lg border shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-darkCard dark:text-white"
          />
        </div>

        {/* Server */}
        <select
          value={serverFilter}
          onChange={(e) => setServerFilter(e.target.value)}
          className="w-full py-2 px-3 rounded-lg border shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-darkCard dark:text-white"
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
            className="absolute top-1/2 left-3 -translate-y-1/2 text-gray-400"
            size={18}
          />
          <input
            type="number"
            placeholder="Min Price"
            value={priceMin}
            onChange={(e) => setPriceMin(e.target.value)}
            className="pl-10 w-full py-2 rounded-lg border shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-darkCard dark:text-white"
            min="0"
          />
        </div>

        {/* Max Price */}
        <div className="relative">
          <FiDollarSign
            className="absolute top-1/2 left-3 -translate-y-1/2 text-gray-400"
            size={18}
          />
          <input
            type="number"
            placeholder="Max Price"
            value={priceMax}
            onChange={(e) => setPriceMax(e.target.value)}
            className="pl-10 w-full py-2 rounded-lg border shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-darkCard dark:text-white"
            min="0"
          />
        </div>

        {/* Available Only */}
        <div className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={availableOnly}
            onChange={(e) => setAvailableOnly(e.target.checked)}
            className="accent-blue-600 w-5 h-5"
          />
          <span className="text-sm">Available Only</span>
        </div>
      </div>
    </div>
  );
};

export default Filters;
