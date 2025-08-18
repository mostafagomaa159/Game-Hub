// src/components/adminTabs/ProcessedTab.js
import React, { useEffect, useState } from "react";
import axios from "../../api/axiosInstance";
import SkeletonCard from "../common/SkeletonCard";

const ITEMS_PER_PAGE = 5;
const SKELETON_COUNT = 6; // keep layout stable while loading

const ProcessedTab = ({
  searchTerm = "",
  sortBy = "date",
  sortOrder = "desc",
  currentPage = 1,
  setCurrentPage,
  setProcessedCount, // optional setter from parent
}) => {
  const [processed, setProcessed] = useState([]);
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState(null);
  const [error, setError] = useState("");

  const fetchData = async (signal) => {
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
      if (typeof setProcessedCount === "function") {
        setProcessedCount(Array.isArray(data) ? data.length : 0);
      }
    } catch (err) {
      if (axios.isCancel && axios.isCancel(err)) return;
      console.error("Failed to fetch processed transactions", err);
      setError("Failed to load processed transactions. Please try again.");
    } finally {
      setLoading(false);
    }
  };

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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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
    const owner = (tx.userId?.name || tx.userId?.email || "").toLowerCase();
    const email = (tx.userId?.email || "").toLowerCase();
    if (!term) return true;
    return owner.includes(term) || email.includes(term);
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [totalPages]);

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
            onClick={retryFetch}
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
            No processed transactions.
          </div>

          <div className="mt-6 flex items-center justify-center gap-4">
            <button
              onClick={retryFetch}
              className="px-4 py-2 rounded bg-blue-600 hover:bg-blue-700 text-white dark:bg-blue-500 dark:hover:bg-blue-600 transition"
            >
              Retry
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Normal render
  return (
    <div className="py-4">
      <div className="max-w-6xl mx-auto px-3">
        <div className="space-y-4">
          {paginated.map((item) => (
            <div
              key={item._id}
              className="p-4 rounded-lg shadow-md mb-2 bg-white text-gray-900 border border-gray-100 dark:bg-gray-800 dark:text-gray-100 dark:border-gray-700"
            >
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <p className="text-sm">
                    <strong className="mr-2">Name:</strong>
                    <span className="font-medium">
                      {item.userId?.name || "N/A"}
                    </span>
                  </p>
                  <p className="text-sm mt-1">
                    <strong className="mr-2">Email:</strong>
                    <span className="font-medium">
                      {item.userId?.email || "N/A"}
                    </span>
                  </p>
                  <p className="text-sm mt-1">
                    <strong className="mr-2">Amount:</strong>
                    <span className="font-medium">
                      {item.amount ?? "-"} coins
                    </span>
                  </p>
                </div>

                <div className="text-sm text-right">
                  <p>
                    <strong className="mr-2">Status:</strong>
                    <span className="font-medium">{item.status ?? "-"}</span>
                  </p>
                  <p className="mt-1">
                    <strong className="mr-2">Type:</strong>
                    <span className="font-medium">{item.type ?? "-"}</span>
                  </p>
                  <p className="mt-1">
                    <strong className="mr-2">Method:</strong>
                    <span className="font-medium">{item.method ?? "-"}</span>
                  </p>
                </div>
              </div>
              {item.screenshot && (
                <div className="flex justify-center items-start">
                  <img
                    src={item.screenshot}
                    alt="Deposit Screenshot"
                    className="rounded-md border border-gray-300 dark:border-gray-600 max-w-xs max-h-48 object-contain shadow-sm hover:scale-105 transition-transform duration-200"
                  />
                </div>
              )}
              <div className="mt-3">
                <label className="text-sm text-gray-700 dark:text-gray-300">
                  Admin Note:
                </label>
                <textarea
                  defaultValue={item.adminNote || ""}
                  onBlur={(e) => updateNote(item._id, e.target.value)}
                  className="w-full mt-1 p-2 rounded bg-white border border-gray-200 text-gray-900 dark:bg-gray-900 dark:border-gray-700 dark:text-gray-100"
                  disabled={processingId === item._id}
                />
                {processingId === item._id && (
                  <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                    Saving...
                  </p>
                )}
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

export default ProcessedTab;
