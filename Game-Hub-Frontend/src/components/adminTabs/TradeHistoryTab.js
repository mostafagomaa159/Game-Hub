import React, { useEffect, useState } from "react";
import axios from "../../api/axiosInstance";
import SkeletonCard from "../common/SkeletonCard";

const ITEMS_PER_PAGE = 5;
const SKELETON_COUNT = 6;

const TradeHistoryTab = ({
  searchTerm = "",
  sortBy = "date",
  sortOrder = "desc",
  currentPage = 1,
  setCurrentPage,
}) => {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCancelledOnly, setShowCancelledOnly] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const controller = new AbortController();
    let mounted = true;

    const fetchData = async () => {
      try {
        setError("");
        setLoading(true);
        const token = localStorage.getItem("token");
        const headers = { Authorization: `Bearer ${token}` };
        const res = await axios.get("/admin/trade-history", {
          headers,
          signal: controller.signal,
        });
        if (!mounted) return;
        setHistory(res.data || []);
      } catch (err) {
        if (axios.isCancel && axios.isCancel(err)) return;
        console.error("Failed to fetch trade history", err);
        if (mounted)
          setError("Failed to load trade history. Please try again.");
      } finally {
        if (mounted) setLoading(false);
      }
    };

    fetchData();
    return () => {
      mounted = false;
      controller.abort();
    };
  }, []);

  // Filtering and sorting
  const term = (searchTerm || "").toLowerCase();
  const filtered = history
    .filter((item) => {
      if (showCancelledOnly && item.tradeStatus !== "cancelled") return false;
      const owner = (item.owner?.name || item.owner?.email || "").toLowerCase();
      const buyer = (item.buyer?.name || item.buyer?.email || "").toLowerCase();
      if (!term) return true;
      return owner.includes(term) || buyer.includes(term);
    })
    .sort((a, b) => {
      if (sortBy === "amount" || sortBy === "price") {
        const aval = Number(a.amount ?? a.price ?? 0);
        const bval = Number(b.amount ?? b.price ?? 0);
        return sortOrder === "asc" ? aval - bval : bval - aval;
      } else {
        const at = new Date(a.updatedAt || a.createdAt).getTime();
        const bt = new Date(b.updatedAt || b.createdAt).getTime();
        return sortOrder === "asc" ? at - bt : bt - at;
      }
    });

  const totalPages = Math.max(1, Math.ceil(filtered.length / ITEMS_PER_PAGE));
  const paginated = filtered.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  useEffect(() => {
    if (currentPage > totalPages && setCurrentPage) setCurrentPage(1);
  }, [totalPages, currentPage, setCurrentPage]);

  // Export CSV function unchanged
  const exportToCSV = () => {
    const rows = [
      ["Seller", "Buyer", "Price", "Status", "Server", "Available", "Date"],
      ...filtered.map((tx) => [
        tx.owner?.name || tx.owner?.email || "",
        tx.buyer?.name || tx.buyer?.email || "",
        tx.price ?? tx.amount ?? "",
        tx.tradeStatus || "",
        tx.server || "",
        tx.avaliable ? "Yes" : "No",
        new Date(tx.updatedAt || tx.createdAt).toLocaleString(),
      ]),
    ];
    const csv = rows
      .map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(","))
      .join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = "trade_history.csv";
    a.click();
    URL.revokeObjectURL(a.href);
  };

  // Loading UI
  if (loading) {
    return (
      <div className="py-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto px-3">
          {Array.from({ length: SKELETON_COUNT }).map((_, i) => (
            <SkeletonCard key={i} variant="post" isHistory />
          ))}
        </div>
      </div>
    );
  }

  // Error UI
  if (error) {
    return (
      <div className="py-8">
        <div className="max-w-2xl mx-auto text-center px-3">
          <p className="text-red-600 dark:text-red-400 font-semibold mb-3">
            {error}
          </p>
          <button
            onClick={async () => {
              setError("");
              setLoading(true);
              try {
                const token = localStorage.getItem("token");
                const headers = { Authorization: `Bearer ${token}` };
                const res = await axios.get("/admin/trade-history", {
                  headers,
                });
                setHistory(res.data || []);
              } catch (err2) {
                console.error("Retry failed", err2);
                setError("Retry failed. Check console for details.");
              } finally {
                setLoading(false);
              }
            }}
            className="px-5 py-2 rounded bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600 text-white font-semibold transition-shadow shadow-sm hover:shadow-md"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  // Empty results UI
  if (paginated.length === 0) {
    return (
      <div className="py-8">
        <div className="max-w-2xl mx-auto text-center px-4">
          <div className="text-5xl animate-bounce mb-3 select-none">📭</div>
          <p className="text-gray-700 dark:text-gray-300 text-lg font-medium mb-6">
            No trade history results.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <button
              onClick={exportToCSV}
              disabled={filtered.length === 0}
              className={`px-5 py-2 rounded font-semibold transition
                ${
                  filtered.length === 0
                    ? "bg-gray-200 text-gray-400 cursor-not-allowed dark:bg-gray-700 dark:text-gray-500"
                    : "bg-green-600 text-white hover:bg-green-700 dark:bg-green-500 dark:hover:bg-green-600"
                }`}
            >
              Export CSV
            </button>

            <label className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={showCancelledOnly}
                onChange={(e) => setShowCancelledOnly(e.target.checked)}
                className="cursor-pointer"
              />
              Show only Cancelled
            </label>
          </div>
        </div>
      </div>
    );
  }

  // Normal render
  return (
    <div className="py-6">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Controls */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mb-6">
          <button
            onClick={exportToCSV}
            disabled={filtered.length === 0}
            className={`px-5 py-2 rounded font-semibold transition-shadow shadow-sm hover:shadow-md
              ${
                filtered.length === 0
                  ? "bg-gray-200 text-gray-400 cursor-not-allowed dark:bg-gray-700 dark:text-gray-500"
                  : "bg-green-600 text-white hover:bg-green-700 dark:bg-green-500 dark:hover:bg-green-600"
              }`}
          >
            Export CSV
          </button>
          <label className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={showCancelledOnly}
              onChange={(e) => setShowCancelledOnly(e.target.checked)}
              className="cursor-pointer"
            />
            Show only Cancelled
          </label>
        </div>

        {/* Cards */}
        <div className="space-y-5">
          {paginated.map((item) => (
            <article
              key={item._id}
              className="p-6 bg-white dark:bg-gray-800 rounded-lg shadow-md border border-gray-200 dark:border-gray-700 hover:shadow-lg transition-shadow"
              tabIndex={0}
              aria-label={`Trade between ${
                item.owner?.name || item.owner?.email || "unknown seller"
              } and ${
                item.buyer?.name || item.buyer?.email || "unknown buyer"
              } on ${new Date(
                item.updatedAt || item.createdAt
              ).toLocaleDateString()}`}
            >
              <div className="flex flex-col md:flex-row md:justify-between gap-6">
                <div className="flex flex-col space-y-2">
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    <span className="font-semibold text-gray-800 dark:text-gray-100">
                      Seller:
                    </span>{" "}
                    {item.owner?.name || item.owner?.email || "N/A"}
                  </p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    <span className="font-semibold text-gray-800 dark:text-gray-100">
                      Buyer:
                    </span>{" "}
                    {item.buyer?.name || item.buyer?.email || "N/A"}
                  </p>
                </div>

                <div className="text-sm text-right space-y-2 min-w-[130px]">
                  <p>
                    <span className="font-semibold text-gray-800 dark:text-gray-100">
                      💰 Price:
                    </span>{" "}
                    <span className="font-medium">
                      {item.price ?? item.amount ?? "-"}
                    </span>
                  </p>

                  <p className="flex items-center justify-end gap-2">
                    <span className="font-semibold text-gray-800 dark:text-gray-100">
                      Status:
                    </span>
                    {item.tradeStatus === "completed" ? (
                      <span className="px-3 py-0.5 rounded-full text-green-700 bg-green-100 dark:bg-green-800 dark:text-green-300 font-semibold select-none">
                        Completed
                      </span>
                    ) : item.tradeStatus === "cancelled" ? (
                      <span className="px-3 py-0.5 rounded-full text-red-700 bg-red-100 dark:bg-red-800 dark:text-red-300 font-semibold select-none">
                        Cancelled
                      </span>
                    ) : (
                      <span className="px-3 py-0.5 rounded-full text-gray-600 bg-gray-100 dark:bg-gray-700 dark:text-gray-300 font-semibold select-none">
                        {item.tradeStatus ?? "Unknown"}
                      </span>
                    )}
                  </p>

                  <p>
                    <span className="font-semibold text-gray-800 dark:text-gray-100">
                      Server:
                    </span>{" "}
                    <span className="font-medium">{item.server || "N/A"}</span>
                  </p>

                  <p>
                    <span className="font-semibold text-gray-800 dark:text-gray-100">
                      Date:
                    </span>{" "}
                    <span className="font-medium">
                      {new Date(
                        item.updatedAt || item.createdAt
                      ).toLocaleString()}
                    </span>
                  </p>
                </div>
              </div>
            </article>
          ))}
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <nav
            aria-label="Pagination"
            className="flex justify-center mt-8 space-x-2"
          >
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((pg) => (
              <button
                key={pg}
                onClick={() => setCurrentPage?.(pg)}
                className={`px-4 py-2 rounded-md font-medium transition
                  ${
                    pg === currentPage
                      ? "bg-blue-600 text-white shadow-md dark:bg-blue-500"
                      : "bg-gray-200 text-gray-800 hover:bg-gray-300 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600"
                  }`}
                aria-current={pg === currentPage ? "page" : undefined}
                aria-label={`Go to page ${pg}`}
              >
                {pg}
              </button>
            ))}
          </nav>
        )}
      </div>
    </div>
  );
};

export default TradeHistoryTab;
