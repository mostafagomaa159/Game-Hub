// src/components/adminTabs/TradeHistoryTab.js
import React, { useEffect, useState } from "react";
import axios from "../../api/axiosInstance";
import SkeletonCard from "../common/SkeletonCard";

const ITEMS_PER_PAGE = 5;
const SKELETON_COUNT = 6; // number of skeleton cards to render while loading

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

  // Filtering by search & cancelled flag
  const term = (searchTerm || "").toLowerCase();
  const filtered = history
    .filter((item) => {
      if (showCancelledOnly && item.tradeStatus !== "cancelled") return false;
      const owner = (item.owner?.name || item.owner?.email || "").toLowerCase();
      const buyer = (item.buyer?.name || item.buyer?.email || "").toLowerCase();
      if (!term) return true;
      return (
        owner.includes(term) ||
        buyer.includes(term) ||
        (item.owner?.email || "").toLowerCase().includes(term)
      );
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

  // Pagination
  const totalPages = Math.max(1, Math.ceil(filtered.length / ITEMS_PER_PAGE));
  const paginated = filtered.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  useEffect(() => {
    if (currentPage > totalPages && setCurrentPage) setCurrentPage(1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [totalPages]);

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

  // --- UI branches: loading / error / empty / normal
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

  if (error) {
    return (
      <div className="py-8">
        <div className="max-w-2xl mx-auto text-center px-3">
          <div className="text-red-600 dark:text-red-400 font-semibold mb-3">
            {error}
          </div>
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
            className="px-4 py-2 rounded bg-blue-600 hover:bg-blue-700 text-white dark:bg-blue-500 dark:hover:bg-blue-600 transition"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  if (paginated.length === 0) {
    return (
      <div className="py-8">
        <div className="max-w-2xl mx-auto text-center px-4">
          <div className="text-4xl animate-bounce mb-2">📭</div>
          <div className="text-gray-600 dark:text-gray-300 text-lg">
            No trade history results.
          </div>

          <div className="mt-6 flex items-center justify-center gap-4">
            <button
              onClick={exportToCSV}
              disabled={filtered.length === 0}
              className={`px-4 py-2 rounded transition ${
                filtered.length === 0
                  ? "bg-gray-200 text-gray-400 cursor-not-allowed dark:bg-gray-700 dark:text-gray-500"
                  : "bg-green-600 text-white hover:bg-green-700 dark:bg-green-500 dark:hover:bg-green-600"
              }`}
            >
              Export CSV
            </button>

            <label className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
              <input
                type="checkbox"
                checked={showCancelledOnly}
                onChange={(e) => setShowCancelledOnly(e.target.checked)}
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
    <div className="py-4">
      <div className="max-w-6xl mx-auto px-3">
        <div className="flex items-center gap-4 mb-4">
          <button
            onClick={exportToCSV}
            disabled={filtered.length === 0}
            className={`px-4 py-2 rounded transition ${
              filtered.length === 0
                ? "bg-gray-200 text-gray-400 cursor-not-allowed dark:bg-gray-700 dark:text-gray-500"
                : "bg-green-600 text-white hover:bg-green-700 dark:bg-green-500 dark:hover:bg-green-600"
            }`}
          >
            Export CSV
          </button>
          <label className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
            <input
              type="checkbox"
              checked={showCancelledOnly}
              onChange={(e) => setShowCancelledOnly(e.target.checked)}
            />
            Show only Cancelled
          </label>
        </div>

        <div className="space-y-4">
          {paginated.map((item) => (
            <div
              key={item._id}
              className="p-4 rounded-lg shadow-md bg-white text-gray-900 border border-gray-100 dark:bg-gray-800 dark:text-gray-100 dark:border-gray-700"
            >
              <div className="flex flex-col md:flex-row md:justify-between gap-3">
                <div>
                  <p className="text-sm">
                    <strong className="mr-2">Seller:</strong>
                    <span className="font-medium">
                      {item.owner?.name || item.owner?.email || "N/A"}
                    </span>
                  </p>
                  <p className="text-sm mt-1">
                    <strong className="mr-2">Buyer:</strong>
                    <span className="font-medium">
                      {item.buyer?.name || item.buyer?.email || "N/A"}
                    </span>
                  </p>
                </div>

                <div className="text-sm text-right">
                  <p>
                    <strong className="mr-2">💰:</strong>
                    <span className="font-medium">
                      {item.price ?? item.amount ?? "-"}
                    </span>
                  </p>

                  <p className="flex items-center gap-2 mt-1">
                    <strong>Status:</strong>
                    {item.tradeStatus === "completed" ? (
                      <span className="text-green-600 dark:text-green-400 font-medium">
                        Completed
                      </span>
                    ) : item.tradeStatus === "cancelled" ? (
                      <span className="text-red-600 dark:text-red-400 font-medium">
                        Cancelled
                      </span>
                    ) : (
                      <span className="text-gray-500 dark:text-gray-400">
                        {item.tradeStatus ?? "Unknown"}
                      </span>
                    )}
                  </p>

                  <p className="mt-1">
                    <strong className="mr-2">Server:</strong>
                    <span className="font-medium">{item.server || "N/A"}</span>
                  </p>

                  <p className="mt-1">
                    <strong className="mr-2">Date:</strong>
                    <span className="font-medium">
                      {new Date(
                        item.updatedAt || item.createdAt
                      ).toLocaleString()}
                    </span>
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>

        {totalPages > 1 && (
          <div className="flex justify-center mt-6 gap-2">
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((pg) => (
              <button
                key={pg}
                onClick={() => setCurrentPage?.(pg)}
                className={`px-3 py-1 rounded transition ${
                  pg === currentPage
                    ? "bg-blue-600 text-white dark:bg-blue-500"
                    : "bg-gray-200 text-gray-800 dark:bg-gray-700 dark:text-gray-300"
                }`}
              >
                {pg}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default TradeHistoryTab;
