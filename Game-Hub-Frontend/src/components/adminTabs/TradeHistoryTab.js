import React, { useEffect, useState, useCallback } from "react";
import axios from "../../api/axiosInstance";
import SkeletonCard from "../common/SkeletonCard";
import {
  ArrowPathIcon,
  ArrowLeftIcon,
  ArrowRightIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  XCircleIcon,
  DocumentArrowDownIcon,
} from "@heroicons/react/24/outline";

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

  const fetchData = useCallback(async (signal) => {
    try {
      setError("");
      setLoading(true);
      const token = localStorage.getItem("token");
      const headers = { Authorization: `Bearer ${token}` };
      const res = await axios.get("/admin/trade-history", {
        headers,
        signal,
      });
      setHistory(res.data || []);
    } catch (err) {
      if (axios.isCancel && axios.isCancel(err)) return;
      console.error("Failed to fetch trade history", err);
      setError("Failed to load trade history. Please try again.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    let mounted = true;
    (async () => {
      if (!mounted) return;
      await fetchData(controller.signal);
    })();
    return () => {
      mounted = false;
      controller.abort();
    };
  }, [fetchData]);

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
    if (currentPage > totalPages) setCurrentPage?.(1);
  }, [currentPage, totalPages, setCurrentPage]);

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

  if (loading) {
    return (
      <div className="py-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto px-4">
          {Array.from({ length: SKELETON_COUNT }).map((_, i) => (
            <SkeletonCard key={i} variant="post" isHistory />
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="py-8">
        <div className="max-w-2xl mx-auto text-center px-4">
          <div className="bg-red-50 dark:bg-red-900/30 border-l-4 border-red-500 p-4 rounded-r-lg flex flex-col items-center gap-3">
            <ExclamationTriangleIcon className="w-8 h-8 text-red-500 dark:text-red-400" />
            <div className="text-red-700 dark:text-red-300 font-medium">
              {error}
            </div>
            <button
              onClick={fetchData}
              className="mt-2 flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-medium shadow-md hover:shadow-lg transition-all duration-200"
            >
              <ArrowPathIcon className="w-5 h-5" />
              Retry
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (paginated.length === 0) {
    return (
      <div className="py-8">
        <div className="max-w-2xl mx-auto text-center px-4">
          <div className="bg-gray-50 dark:bg-gray-800/50 p-6 rounded-xl border border-gray-200 dark:border-gray-700">
            <div className="text-4xl mb-3">📭</div>
            <div className="text-gray-600 dark:text-gray-300 text-lg font-medium">
              No trade history found
            </div>
            <div className="mt-6 flex flex-col sm:flex-row items-center justify-center gap-4">
              <button
                onClick={exportToCSV}
                disabled={filtered.length === 0}
                className={`flex items-center justify-center gap-2 px-4 py-2 rounded-lg font-medium shadow-md transition-all duration-200 ${
                  filtered.length === 0
                    ? "bg-gray-200 text-gray-400 cursor-not-allowed dark:bg-gray-700 dark:text-gray-500"
                    : "bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white"
                }`}
              >
                <DocumentArrowDownIcon className="w-5 h-5" />
                Export CSV
              </button>
              <label className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={showCancelledOnly}
                  onChange={(e) => setShowCancelledOnly(e.target.checked)}
                  className="rounded border-gray-300 text-blue-600 shadow-sm focus:border-blue-300 focus:ring focus:ring-blue-200 focus:ring-opacity-50 dark:border-gray-600 dark:bg-gray-700"
                />
                Show only Cancelled
              </label>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="py-4">
      <div className="max-w-6xl mx-auto px-4 space-y-4">
        {/* Controls */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mb-4">
          <button
            onClick={exportToCSV}
            disabled={filtered.length === 0}
            className={`flex items-center justify-center gap-2 px-4 py-2 rounded-lg font-medium shadow-md transition-all duration-200 ${
              filtered.length === 0
                ? "bg-gray-200 text-gray-400 cursor-not-allowed dark:bg-gray-700 dark:text-gray-500"
                : "bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white"
            }`}
          >
            <DocumentArrowDownIcon className="w-5 h-5" />
            Export CSV
          </button>
          <label className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={showCancelledOnly}
              onChange={(e) => setShowCancelledOnly(e.target.checked)}
              className="rounded border-gray-300 text-blue-600 shadow-sm focus:border-blue-300 focus:ring focus:ring-blue-200 focus:ring-opacity-50 dark:border-gray-600 dark:bg-gray-700"
            />
            Show only Cancelled
          </label>
        </div>

        {/* Trade Cards */}
        <div className="space-y-4">
          {paginated.map((item) => (
            <div
              key={item._id}
              className={`p-5 rounded-xl bg-white dark:bg-gray-800 border shadow-sm hover:shadow-md transition-shadow duration-200 ${
                item.tradeStatus === "completed"
                  ? "border-green-200 dark:border-green-800/50"
                  : item.tradeStatus === "cancelled"
                  ? "border-red-200 dark:border-red-800/50"
                  : "border-gray-200 dark:border-gray-700"
              }`}
            >
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Left: Seller/Buyer Info */}
                <div className="space-y-3">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        Seller
                      </p>
                      <p className="font-medium">
                        {item.owner?.name || item.owner?.email || "N/A"}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        Buyer
                      </p>
                      <p className="font-medium">
                        {item.buyer?.name || item.buyer?.email || "N/A"}
                      </p>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        description
                      </p>
                      <p className="font-medium">{item.description || "-"}</p>
                    </div>
                    <div>
                      <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        Price
                      </p>
                      <p className="font-medium text-yellow-600 dark:text-yellow-500">
                        {item.price ?? item.amount ?? "-"}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        Server
                      </p>
                      <p className="font-medium">{item.server || "-"}</p>
                    </div>
                  </div>
                </div>

                {/* Right: Status/Date Info */}
                <div className="space-y-3">
                  <div>
                    <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Status
                    </p>
                    <div className="flex items-center gap-2 mt-1">
                      {item.tradeStatus === "completed" ? (
                        <CheckCircleIcon className="w-5 h-5 text-green-500" />
                      ) : item.tradeStatus === "cancelled" ? (
                        <XCircleIcon className="w-5 h-5 text-red-500" />
                      ) : null}
                      <span className="font-medium capitalize">
                        {item.tradeStatus ?? "-"}
                      </span>
                    </div>
                  </div>
                  <div>
                    <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Date
                    </p>
                    <p className="font-medium">
                      {new Date(
                        item.updatedAt || item.createdAt
                      ).toLocaleString()}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex justify-center mt-6 gap-1">
            <button
              onClick={() => setCurrentPage?.(Math.max(1, currentPage - 1))}
              disabled={currentPage === 1}
              className="p-2 rounded-lg bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 disabled:opacity-50 disabled:cursor-not-allowed transition"
            >
              <ArrowLeftIcon className="w-5 h-5" />
            </button>

            {Array.from({ length: totalPages }, (_, i) => i + 1).map((pg) => (
              <button
                key={pg}
                onClick={() => setCurrentPage?.(pg)}
                className={`px-4 py-2 rounded-lg transition ${
                  pg === currentPage
                    ? "bg-blue-600 text-white dark:bg-blue-500"
                    : "bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300"
                }`}
              >
                {pg}
              </button>
            ))}

            <button
              onClick={() =>
                setCurrentPage?.(Math.min(totalPages, currentPage + 1))
              }
              disabled={currentPage === totalPages}
              className="p-2 rounded-lg bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 disabled:opacity-50 disabled:cursor-not-allowed transition"
            >
              <ArrowRightIcon className="w-5 h-5" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default TradeHistoryTab;
