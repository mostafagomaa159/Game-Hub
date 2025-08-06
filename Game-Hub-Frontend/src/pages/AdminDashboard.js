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
// add near other lazy imports
const UsersTab = React.lazy(() => import("../components/adminTabs/UsersTab"));

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
        if (!userRes.data.isAdmin) {
          alert("Unauthorized access.");
          return window.location.replace("/"); // redirect
        }

        const [pendingDepositsRes, pendingWithdrawalsRes, processedRes] =
          await Promise.all([
            axios.get("/transactions/pending-deposits", { headers }),
            axios.get("/transactions/pending-withdrawals", { headers }),
            axios.get("/transactions/processed", { headers }), // just to show processed count
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
    <div>
      {Array.from({ length: SKELETON_COUNT }).map((_, idx) => (
        <SkeletonCard key={idx} isHistory={activeTab === "history"} />
      ))}
    </div>
  );

  return (
    <div className="p-4 text-white">
      <h1 className="text-2xl font-bold mb-4">Admin Dashboard</h1>

      {/* Tab buttons */}
      <div className="flex gap-2 mb-4 flex-wrap">
        <button
          onClick={() => setActiveTab("deposits")}
          className={`px-4 py-2 rounded ${
            activeTab === "deposits"
              ? "bg-blue-600"
              : "bg-gray-700 text-gray-300"
          }`}
        >
          Pending Deposits ({pendingCounts.deposits})
        </button>

        <button
          onClick={() => setActiveTab("withdrawals")}
          className={`px-4 py-2 rounded ${
            activeTab === "withdrawals"
              ? "bg-blue-600"
              : "bg-gray-700 text-gray-300"
          }`}
        >
          Pending Withdrawals ({pendingCounts.withdrawals})
        </button>

        <button
          onClick={() => setActiveTab("processed")}
          className={`px-4 py-2 rounded ${
            activeTab === "processed"
              ? "bg-blue-600"
              : "bg-gray-700 text-gray-300"
          }`}
        >
          Processed ({processedCount})
        </button>

        <button
          onClick={() => setActiveTab("history")}
          className={`px-4 py-2 rounded ${
            activeTab === "history"
              ? "bg-blue-600"
              : "bg-gray-700 text-gray-300"
          }`}
        >
          Trade History
        </button>
        <button
          onClick={() => setActiveTab("users")}
          className={`px-4 py-2 rounded ${
            activeTab === "users" ? "bg-blue-600" : "bg-gray-700 text-gray-300"
          }`}
        >
          Users
        </button>
      </div>

      {/* Search & sort controls (shared) */}
      <div className="flex gap-4 mb-4">
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => {
            setSearchTerm(e.target.value);
            setCurrentPage(1);
          }}
          placeholder="Search by name/email"
          className="p-2 rounded w-full bg-gray-900 border border-gray-600"
        />

        <select
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value)}
          className="p-2 rounded bg-gray-900 border border-gray-600"
        >
          <option value="date">Sort by Date</option>
          <option value="amount">Sort by Amount</option>
          <option value="price">Sort by Price</option>
        </select>

        <select
          value={sortOrder}
          onChange={(e) => setSortOrder(e.target.value)}
          className="p-2 rounded bg-gray-900 border border-gray-600"
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
              setPendingCounts={setPendingCounts} // tab will decrement when it approves
            />
          )}

          {activeTab === "withdrawals" && (
            <WithdrawalsTab
              searchTerm={searchTerm}
              sortBy={sortBy}
              sortOrder={sortOrder}
              currentPage={currentPage}
              setCurrentPage={setCurrentPage}
              setPendingCounts={setPendingCounts} // tab updates counts on actions
            />
          )}

          {activeTab === "processed" && (
            <ProcessedTab
              searchTerm={searchTerm}
              sortBy={sortBy}
              sortOrder={sortOrder}
              currentPage={currentPage}
              setCurrentPage={setCurrentPage}
              setProcessedCount={setProcessedCount} // <-- pass setter so tab can update the parent count
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
        </Suspense>
      )}
    </div>
  );
};

export default AdminDashboard;
