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
  PencilIcon,
} from "@heroicons/react/24/outline";

const ITEMS_PER_PAGE = 5;
const SKELETON_COUNT = 6;

const ProcessedTab = ({
  searchTerm = "",
  sortBy = "date",
  sortOrder = "desc",
  currentPage = 1,
  setCurrentPage,
  setProcessedCount,
}) => {
  const [processed, setProcessed] = useState([]);
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState(null);
  const [error, setError] = useState("");

  const fetchData = useCallback(
    async (signal) => {
      try {
        setError("");
        setLoading(true);
        const token = localStorage.getItem("token");
        const headers = { Authorization: `Bearer ${token}` };
        const res = await axios.get("/transactions/processed", {
          headers,
          signal,
        });
        const data = res.data || [];
        setProcessed(data);
        setProcessedCount?.(Array.isArray(data) ? data.length : 0);
      } catch (err) {
        if (axios.isCancel && axios.isCancel(err)) return;
        console.error("Failed to fetch processed transactions", err);
        setError("Failed to load processed transactions. Please try again.");
      } finally {
        setLoading(false);
      }
    },
    [setProcessedCount]
  );

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

  const retryFetch = async () => {
    const controller = new AbortController();
    await fetchData(controller.signal);
  };

  const updateNote = async (id, note) => {
    setProcessingId(id);
    try {
      const token = localStorage.getItem("token");
      await axios.patch(
        `/transactions/${id}/note`,
        { note },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setProcessed((prev) =>
        prev.map((tx) => (tx._id === id ? { ...tx, adminNote: note } : tx))
      );
    } catch (err) {
      console.error("Failed to update note", err);
      alert("Failed to update note");
    } finally {
      setProcessingId(null);
    }
  };

  // Filtering
  const term = (searchTerm || "").toLowerCase();
  const filtered = processed.filter((tx) => {
    const owner = tx.userId?.name || "";
    const email = tx.userId?.email || "";
    if (!term) return true;
    return (
      owner.toLowerCase().includes(term) || email.toLowerCase().includes(term)
    );
  });

  // Sorting
  filtered.sort((a, b) => {
    if (sortBy === "amount" || sortBy === "price") {
      const aval = Number(a.amount ?? a.price ?? 0);
      const bval = Number(b.amount ?? b.price ?? 0);
      return sortOrder === "asc" ? aval - bval : bval - aval;
    } else {
      const at = new Date(a.createdAt || a.updatedAt).getTime();
      const bt = new Date(b.createdAt || b.updatedAt).getTime();
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
    if (currentPage > totalPages) setCurrentPage?.(1);
  }, [currentPage, totalPages, setCurrentPage]);

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
              onClick={retryFetch}
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
              No processed transactions found
            </div>
            <button
              onClick={retryFetch}
              className="mt-4 flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-medium shadow-md hover:shadow-lg transition-all duration-200"
            >
              <ArrowPathIcon className="w-5 h-5" />
              Refresh
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="py-4">
      <div className="max-w-6xl mx-auto px-4 space-y-4">
        {paginated.map((item) => (
          <div
            key={item._id}
            className={`p-5 rounded-xl bg-white dark:bg-gray-800 border shadow-sm hover:shadow-md transition-shadow duration-200 ${
              item.status === "approved"
                ? "border-green-200 dark:border-green-800/50"
                : item.status === "rejected"
                ? "border-red-200 dark:border-red-800/50"
                : "border-gray-200 dark:border-gray-700"
            }`}
          >
            {/* Transaction info */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Left: User info */}
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Name
                    </p>
                    <p className="font-medium">{item.userId?.name || "N/A"}</p>
                  </div>
                  <div>
                    <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Email
                    </p>
                    <p className="font-medium">{item.userId?.email || "N/A"}</p>
                  </div>
                  <div>
                    <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Amount
                    </p>
                    <p className="font-medium text-yellow-600 dark:text-yellow-500">
                      {item.amount ?? "-"} coins
                    </p>
                  </div>
                  <div>
                    <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Type
                    </p>
                    <p className="font-medium capitalize">{item.type ?? "-"}</p>
                  </div>
                </div>

                {item.method === "paypal" && item.paypalEmail && (
                  <div>
                    <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      PayPal Email
                    </p>
                    <p className="font-medium">{item.paypalEmail}</p>
                  </div>
                )}

                {item.method === "bank" && (
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        IBAN
                      </p>
                      <p className="font-medium">{item.iban || "-"}</p>
                    </div>
                    <div>
                      <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        Account Number
                      </p>
                      <p className="font-medium">{item.accountNumber || "-"}</p>
                    </div>
                  </div>
                )}
              </div>

              {/* Right: Transaction details */}
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Status
                    </p>
                    <div className="flex items-center gap-2">
                      {item.status === "approved" ? (
                        <CheckCircleIcon className="w-5 h-5 text-green-500" />
                      ) : item.status === "rejected" ? (
                        <XCircleIcon className="w-5 h-5 text-red-500" />
                      ) : null}
                      <span className="font-medium capitalize">
                        {item.status ?? "-"}
                      </span>
                    </div>
                  </div>
                  <div>
                    <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Date
                    </p>
                    <p className="font-medium">
                      {new Date(item.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                </div>

                <div>
                  <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Method
                  </p>
                  <p className="font-medium capitalize">{item.method ?? "-"}</p>
                </div>

                {item.payoutBatchId && (
                  <div>
                    <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      PayPal Batch ID
                    </p>
                    <p className="font-medium">{item.payoutBatchId}</p>
                  </div>
                )}
              </div>
            </div>

            {/* Screenshot if exists */}
            {item.screenshot && (
              <div className="mt-4 flex flex-col items-center">
                <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">
                  Payment Proof
                </p>
                <img
                  src={item.screenshot}
                  alt="Transaction Screenshot"
                  className="rounded-lg border border-gray-300 dark:border-gray-600 max-w-xs max-h-48 object-contain shadow-sm hover:scale-105 transition-transform duration-200"
                />
              </div>
            )}

            {/* Admin note */}
            <div className="mt-4">
              <div className="flex items-center justify-between mb-2">
                <label className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Admin Note
                </label>
                <PencilIcon className="w-4 h-4 text-gray-400" />
              </div>
              <textarea
                defaultValue={item.adminNote || ""}
                onBlur={(e) => updateNote(item._id, e.target.value)}
                className="w-full p-3 rounded-lg bg-gray-50 dark:bg-gray-700/50 border border-gray-200 dark:border-gray-600 text-gray-700 dark:text-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                disabled={processingId === item._id}
                placeholder="Add admin notes here..."
              />
              {processingId === item._id && (
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  Saving note...
                </p>
              )}
            </div>
          </div>
        ))}

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

export default ProcessedTab;
