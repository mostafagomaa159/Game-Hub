// src/pages/AdminDashboard.js
import React, { useEffect, useState, Suspense } from "react";
import axios from "../api/axiosInstance";
import SkeletonCard from "../components/common/SkeletonCard";

// Lazy-loaded tab components (placed in src/components/adminTabs/)
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
  import("../components/adminTabs/DepositsTab")
);

const SKELETON_COUNT = 5;

const AdminDashboard = () => {
  // shared UI state
  const [activeTab, setActiveTab] = useState("deposits");
  const [searchTerm, setSearchTerm] = useState("");
  const [sortBy, setSortBy] = useState("date");
  const [sortOrder, setSortOrder] = useState("desc");
  const [currentPage, setCurrentPage] = useState(1);

  // app state
  const [loading, setLoading] = useState(true); // initial auth + counts load
  const [pendingCounts, setPendingCounts] = useState({
    deposits: 0,
    withdrawals: 0,
  });
  const [processedCount, setProcessedCount] = useState(0); // optional display

  // --- authorize once and fetch lightweight pending counts ---
  useEffect(() => {
    let isMounted = true;

    const fetchAuthAndCounts = async () => {
      try {
        setLoading(true);
        const token = localStorage.getItem("token");
        const headers = { Authorization: `Bearer ${token}` };

        // verify admin and fetch only counts (lightweight)
        const userRes = await axios.get("/users/me", { headers });
        if (!userRes.data?.isAdmin) {
          alert("Unauthorized access.");
          return window.location.replace("/");
        }

        const [pendingDepositsRes, pendingWithdrawalsRes, processedRes] =
          await Promise.all([
            axios.get("/transactions/pending-deposits", { headers }),
            axios.get("/transactions/pending-withdrawals", { headers }),
            axios.get("/transactions/processed", { headers }),
          ]);

        if (!isMounted) return;

        setPendingCounts({
          deposits: pendingDepositsRes.data?.length ?? 0,
          withdrawals: pendingWithdrawalsRes.data?.length ?? 0,
        });
        setProcessedCount(processedRes.data?.length ?? 0);
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

  // reset page when switching tabs
  useEffect(() => {
    setCurrentPage(1);
  }, [activeTab]);

  // skeleton fallback UI used during lazy load
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
    <div className="p-4">
      {/* Page header */}
      <div className="max-w-6xl mx-auto">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-4">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
            Admin Dashboard
          </h1>

          <div className="flex items-center gap-3">
            <div className="text-sm text-gray-700 dark:text-gray-300">
              {/* small stats */}
              <span className="mr-3">
                Deposits:{" "}
                <span className="font-medium">{pendingCounts.deposits}</span>
              </span>
              <span className="mr-3">
                Withdrawals:{" "}
                <span className="font-medium">{pendingCounts.withdrawals}</span>
              </span>
              <span>
                Processed: <span className="font-medium">{processedCount}</span>
              </span>
            </div>
          </div>
        </div>

        {/* Tab buttons */}
        <div className="flex gap-2 mb-4 flex-wrap">
          <button
            onClick={() => setActiveTab("deposits")}
            className={`px-4 py-2 rounded transition ${
              activeTab === "deposits"
                ? "bg-blue-600 text-white dark:bg-blue-500"
                : "bg-gray-100 text-gray-800 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-200 dark:hover:bg-gray-700"
            }`}
          >
            Pending Deposits ({pendingCounts.deposits})
          </button>

          <button
            onClick={() => setActiveTab("withdrawals")}
            className={`px-4 py-2 rounded transition ${
              activeTab === "withdrawals"
                ? "bg-blue-600 text-white dark:bg-blue-500"
                : "bg-gray-100 text-gray-800 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-200 dark:hover:bg-gray-700"
            }`}
          >
            Pending Withdrawals ({pendingCounts.withdrawals})
          </button>

          <button
            onClick={() => setActiveTab("processed")}
            className={`px-4 py-2 rounded transition ${
              activeTab === "processed"
                ? "bg-blue-600 text-white dark:bg-blue-500"
                : "bg-gray-100 text-gray-800 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-200 dark:hover:bg-gray-700"
            }`}
          >
            Processed ({processedCount})
          </button>

          <button
            onClick={() => setActiveTab("history")}
            className={`px-4 py-2 rounded transition ${
              activeTab === "history"
                ? "bg-blue-600 text-white dark:bg-blue-500"
                : "bg-gray-100 text-gray-800 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-200 dark:hover:bg-gray-700"
            }`}
          >
            Trade History
          </button>

          <button
            onClick={() => setActiveTab("users")}
            className={`px-4 py-2 rounded transition ${
              activeTab === "users"
                ? "bg-blue-600 text-white dark:bg-blue-500"
                : "bg-gray-100 text-gray-800 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-200 dark:hover:bg-gray-700"
            }`}
          >
            Users
          </button>
          <button
            onClick={() => setActiveTab("disputes")}
            className={`px-4 py-2 rounded transition ${
              activeTab === "disputes"
                ? "bg-blue-600 text-white dark:bg-blue-500"
                : "bg-gray-100 text-gray-800 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-200 dark:hover:bg-gray-700"
            }`}
          >
            Disputes
          </button>
        </div>

        {/* Search & sort controls (shared) */}
        <div className="flex flex-col md:flex-row gap-3 mb-6">
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setCurrentPage(1);
            }}
            placeholder="Search by name/email"
            className="p-2 rounded w-full bg-white border border-gray-200 text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-400 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-100 dark:placeholder-gray-400"
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

        {/* Main tab area (lazy-loaded tabs). Each tab fetches its own data and shows skeletons while loading. */}
        {loading ? (
          // initial auth/load - show full page skeletons
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
                setPendingCounts={setPendingCounts}
              />
            )}

            {activeTab === "withdrawals" && (
              <WithdrawalsTab
                searchTerm={searchTerm}
                sortBy={sortBy}
                sortOrder={sortOrder}
                currentPage={currentPage}
                setCurrentPage={setCurrentPage}
                setPendingCounts={setPendingCounts}
              />
            )}

            {activeTab === "processed" && (
              <ProcessedTab
                searchTerm={searchTerm}
                sortBy={sortBy}
                sortOrder={sortOrder}
                currentPage={currentPage}
                setCurrentPage={setCurrentPage}
                setProcessedCount={setProcessedCount}
              />
            )}

            {activeTab === "history" && (
              <TradeHistoryTab
                searchTerm={searchTerm}
                sortBy={sortBy}
                sortOrder={sortOrder}
                currentPage={currentPage}
                setCurrentPage={setCurrentPage}
              />
            )}

            {activeTab === "users" && (
              <UsersTab
                searchTerm={searchTerm}
                sortBy={sortBy}
                sortOrder={sortOrder}
                currentPage={currentPage}
                setCurrentPage={setCurrentPage}
              />
            )}
            {activeTab === "disputes" && <DisputesTab />}
          </Suspense>
        )}
      </div>
    </div>
  );
};

export default AdminDashboard;
