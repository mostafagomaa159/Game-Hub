import React, { useEffect, useState, Suspense, useRef } from "react";
import axios from "../api/axiosInstance";
import SkeletonCard from "../components/common/SkeletonCard";

// Lazy-loaded tab components
const DepositsTab = React.lazy(() =>
  import("../components/adminTabs/DepositsTab")
);
const WithdrawalsTab = React.lazy(() =>
  import("../components/adminTabs/WithdrawalsTab")
);
const ProcessedTab = React.lazy(() =>
  import("../components/adminTabs/ProcessedTab")
);
const TradeHistoryTab = React.lazy(() =>
  import("../components/adminTabs/TradeHistoryTab")
);
const UsersTab = React.lazy(() => import("../components/adminTabs/UsersTab"));
const DisputesTab = React.lazy(() =>
  import("../components/adminTabs/DisputesTab")
);

const SKELETON_COUNT = 5;

const TAB_LIST = [
  { key: "deposits", label: "Pending Deposits" },
  { key: "withdrawals", label: "Pending Withdrawals" },
  { key: "processed", label: "Processed" },
  { key: "history", label: "Trade History" },
  { key: "users", label: "Users" },
  { key: "disputes", label: "Disputes" },
];

// Icons as inline SVG, colored by tailwind classes dynamically
const icons = {
  deposits: (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      className="h-5 w-5"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={2}
      aria-hidden="true"
      focusable="false"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M12 19V6m0 0l-7 7m7-7l7 7"
      />
    </svg>
  ),
  withdrawals: (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      className="h-5 w-5"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={2}
      aria-hidden="true"
      focusable="false"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M12 5v13m0 0l7-7m-7 7l-7-7"
      />
    </svg>
  ),
  processed: (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      className="h-5 w-5"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={2}
      aria-hidden="true"
      focusable="false"
    >
      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
    </svg>
  ),
  history: (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      className="h-5 w-5"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={2}
      aria-hidden="true"
      focusable="false"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
      />
    </svg>
  ),
  users: (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      className="h-5 w-5"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={2}
      aria-hidden="true"
      focusable="false"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M17 20h5v-2a4 4 0 00-3-3.87M9 20H4v-2a4 4 0 013-3.87M16 7a4 4 0 11-8 0 4 4 0 018 0z"
      />
    </svg>
  ),
  disputes: (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      className="h-5 w-5"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={2}
      aria-hidden="true"
      focusable="false"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
      />
    </svg>
  ),
};

function Tabs({ activeTab, setActiveTab, counts }) {
  const tabRefs = useRef({});
  const [underlineStyle, setUnderlineStyle] = useState({ left: 0, width: 0 });

  useEffect(() => {
    const activeTabEl = tabRefs.current[activeTab];
    if (activeTabEl) {
      setUnderlineStyle({
        left: activeTabEl.offsetLeft,
        width: activeTabEl.clientWidth,
      });
    }
  }, [activeTab]);

  // Map tab keys to count properties
  const countMap = {
    deposits: counts?.deposits,
    withdrawals: counts?.withdrawals,
    processed: counts?.processed,
    users: counts?.activeUsers,
    disputes: counts?.disputes,
    history: counts?.tradeHistory,
  };

  return (
    <div className="relative border-b border-gray-300 dark:border-gray-700 mb-4 select-none overflow-x-auto scrollbar-thin scrollbar-thumb-gray-400 scrollbar-track-gray-200 dark:scrollbar-thumb-gray-600 dark:scrollbar-track-gray-800">
      <div className="flex min-w-max gap-1 md:gap-3">
        {TAB_LIST.map(({ key, label }) => {
          const countDisplay = countMap[key];

          // Determine active or not for color classes
          const isActive = activeTab === key;
          const iconColorClass = isActive
            ? key === "disputes"
              ? "text-red-600 dark:text-red-400"
              : "text-blue-600 dark:text-blue-400"
            : "text-gray-600 dark:text-gray-400";

          return (
            <button
              key={key}
              ref={(el) => (tabRefs.current[key] = el)}
              onClick={() => setActiveTab(key)}
              className={`whitespace-nowrap py-3 px-4 md:px-6 text-sm md:text-base font-semibold
                transition-colors duration-300 focus:outline-none flex items-center gap-2
                ${
                  isActive
                    ? "text-blue-600 dark:text-blue-400 border-b-2 border-blue-600 dark:border-blue-400"
                    : "text-gray-600 hover:text-blue-600 dark:text-gray-400 dark:hover:text-blue-400"
                }`}
              aria-pressed={isActive}
              type="button"
              aria-label={`${label}${
                countDisplay !== null && countDisplay !== undefined
                  ? ` (${countDisplay})`
                  : ""
              }`}
            >
              <span className={`${iconColorClass} flex items-center`}>
                {/* Clone icon SVG and add color classes */}
                {React.cloneElement(icons[key], {
                  className: `h-5 w-5 ${iconColorClass}`,
                })}
              </span>
              <span>{label}</span>
              {countDisplay !== null && countDisplay !== undefined && (
                <span className="inline-block bg-blue-600 dark:bg-blue-400 text-white rounded-full px-2 py-0.5 text-xs font-bold select-none">
                  {countDisplay}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Animated underline */}
      <span
        className="absolute bottom-0 h-[2px] bg-blue-600 dark:bg-blue-400 rounded transition-all duration-300"
        style={{
          left: underlineStyle.left || 0,
          width: underlineStyle.width || 0,
        }}
      />
    </div>
  );
}

const AdminDashboard = () => {
  // shared UI state
  const [activeTab, setActiveTab] = useState("deposits");
  const [searchTerm, setSearchTerm] = useState("");
  const [sortBy, setSortBy] = useState("date");
  const [sortOrder, setSortOrder] = useState("desc");
  const [currentPage, setCurrentPage] = useState(1);

  // app state
  const [loading, setLoading] = useState(true); // initial auth + counts load
  const [counts, setCounts] = useState({
    deposits: 0,
    withdrawals: 0,
    processed: 0,
    activeUsers: 0,
    disputes: 0,
    tradeHistory: 0,
  });

  useEffect(() => {
    let isMounted = true;

    const fetchAuthAndCounts = async () => {
      try {
        setLoading(true);
        const token = localStorage.getItem("token");
        const headers = { Authorization: `Bearer ${token}` };

        // First verify admin status
        const userRes = await axios.get("/users/me", { headers });
        if (!userRes.data?.isAdmin) {
          alert("Unauthorized access.");
          window.location.replace("/");
          return;
        }

        // Then fetch all counts in one request
        const summaryRes = await axios.get("/transactions/summary", {
          headers,
        });

        if (!isMounted) return;

        setCounts({
          deposits: summaryRes.data?.deposits ?? 0,
          withdrawals: summaryRes.data?.withdrawals ?? 0,
          processed: summaryRes.data?.processed ?? 0,
          activeUsers: summaryRes.data?.activeUsers ?? 0,
          disputes: summaryRes.data?.disputes ?? 0,
          tradeHistory: summaryRes.data?.tradeHistory ?? 0,
        });
      } catch (err) {
        console.error("Admin auth/counts failed", err);
        alert("Error loading dashboard.");
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    fetchAuthAndCounts();

    return () => {
      isMounted = false;
    };
  }, []);

  // reset page on tab change
  useEffect(() => {
    setCurrentPage(1);
  }, [activeTab]);

  const fallbackSkeletons = (
    <div className="py-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto px-3">
        {Array.from({ length: SKELETON_COUNT }).map((_, idx) => (
          <SkeletonCard
            key={idx}
            isHistory={activeTab === "history"}
            variant="post"
          />
        ))}
      </div>
    </div>
  );

  return (
    <div className="p-4 max-w-7xl mx-auto">
      {/* Page header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-4">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
          Admin Dashboard
        </h1>

        <div className="text-sm text-gray-700 dark:text-gray-300 whitespace-nowrap">
          <span className="mr-4">
            Deposits: <span className="font-medium">{counts.deposits}</span>
          </span>
          <span className="mr-4">
            Withdrawals:{" "}
            <span className="font-medium">{counts.withdrawals}</span>
          </span>
          <span className="mr-4">
            Processed: <span className="font-medium">{counts.processed}</span>
          </span>
          <span className="mr-4">
            Users: <span className="font-medium">{counts.activeUsers}</span>
          </span>
          <span>
            Disputes: <span className="font-medium">{counts.disputes}</span>
          </span>
        </div>
      </div>

      {/* Tabs */}
      <Tabs activeTab={activeTab} setActiveTab={setActiveTab} counts={counts} />

      {/* Search & sort controls */}
      <div className="flex flex-col md:flex-row gap-3 mb-6">
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => {
            setSearchTerm(e.target.value);
            setCurrentPage(1);
          }}
          placeholder="Search by name/email"
          className="p-2 rounded w-full md:w-auto flex-grow bg-white border border-gray-200 text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-400 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-100 dark:placeholder-gray-400"
        />

        <select
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value)}
          className="p-2 rounded bg-white border border-gray-200 text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-400 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-100"
        >
          <option value="date">Sort by Date</option>
          <option value="amount">Sort by Amount</option>
          <option value="price">Sort by Price</option>
        </select>

        <select
          value={sortOrder}
          onChange={(e) => setSortOrder(e.target.value)}
          className="p-2 rounded bg-white border border-gray-200 text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-400 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-100"
        >
          <option value="desc">Desc</option>
          <option value="asc">Asc</option>
        </select>
      </div>

      {/* Main tab area */}
      {loading ? (
        fallbackSkeletons
      ) : (
        <Suspense fallback={fallbackSkeletons}>
          {activeTab === "deposits" && (
            <DepositsTab
              searchTerm={searchTerm}
              sortBy={sortBy}
              sortOrder={sortOrder}
              currentPage={currentPage}
              setCurrentPage={setCurrentPage}
              setCounts={setCounts}
            />
          )}

          {activeTab === "withdrawals" && (
            <WithdrawalsTab
              searchTerm={searchTerm}
              sortBy={sortBy}
              sortOrder={sortOrder}
              currentPage={currentPage}
              setCurrentPage={setCurrentPage}
              setCounts={setCounts}
            />
          )}

          {activeTab === "processed" && (
            <ProcessedTab
              searchTerm={searchTerm}
              sortBy={sortBy}
              sortOrder={sortOrder}
              currentPage={currentPage}
              setCurrentPage={setCurrentPage}
              setCounts={setCounts}
            />
          )}

          {activeTab === "history" && (
            <TradeHistoryTab
              searchTerm={searchTerm}
              sortBy={sortBy}
              sortOrder={sortOrder}
              currentPage={currentPage}
              setCurrentPage={setCurrentPage}
              setCounts={setCounts}
            />
          )}

          {activeTab === "users" && (
            <UsersTab
              searchTerm={searchTerm}
              sortBy={sortBy}
              sortOrder={sortOrder}
              currentPage={currentPage}
              setCurrentPage={setCurrentPage}
              setCounts={setCounts}
            />
          )}

          {activeTab === "disputes" && (
            <DisputesTab
              searchTerm={searchTerm}
              sortBy={sortBy}
              sortOrder={sortOrder}
              currentPage={currentPage}
              setCurrentPage={setCurrentPage}
              setCounts={setCounts}
            />
          )}
        </Suspense>
      )}
    </div>
  );
};

export default AdminDashboard;
