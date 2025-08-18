// src/components/adminTabs/DepositsTab.js
import React, { useEffect, useState, useCallback } from "react";
import axios from "../../api/axiosInstance";
import SkeletonCard from "../common/SkeletonCard";

const ITEMS_PER_PAGE = 5;
const SKELETON_COUNT = 6;

const DepositsTab = ({
  searchTerm = "",
  sortBy = "date",
  sortOrder = "desc",
  currentPage = 1,
  setCurrentPage,
  setPendingCounts,
}) => {
  const [transactions, setTransactions] = useState([]);
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
        const res = await axios.get("/transactions/pending-deposits", {
          headers,
          signal,
        });
        const data = res.data || [];
        setTransactions(data);
        setPendingCounts?.((prev) => ({
          ...prev,
          deposits: data?.length ?? 0,
        }));
      } catch (err) {
        if (axios.isCancel && axios.isCancel(err)) return;
        console.error("Failed to fetch pending deposits", err);
        setError("Failed to load pending deposits. Please try again.");
      } finally {
        setLoading(false);
      }
    },
    [setPendingCounts]
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

  const handleAction = async (id, action) => {
    setProcessingId(id);
    try {
      const token = localStorage.getItem("token");
      await axios.patch(
        `/transactions/${id}/approve-deposit`,
        {
          status: action === "approve" ? "approved" : "rejected",
          adminNote: `Marked ${action}`,
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setTransactions((prev) => prev.filter((t) => t._id !== id));
      setPendingCounts?.((prev) => ({
        ...prev,
        deposits: Math.max(0, (prev?.deposits || 1) - 1),
      }));
    } catch (err) {
      console.error("Action failed", err);
      alert("Action failed");
    } finally {
      setProcessingId(null);
    }
  };

  // Filtering
  const term = (searchTerm || "").toLowerCase();
  const filtered = transactions.filter((tx) => {
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
            No pending deposits.
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
      <div className="max-w-6xl mx-auto px-3 space-y-4">
        {paginated.map((item) => (
          <div
            key={item._id}
            className="p-4 rounded-xl shadow-lg bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 flex flex-col gap-4 hover:shadow-xl transition-shadow duration-200"
          >
            {/* Info + Screenshot */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Left: User info */}
              <div className="space-y-1 text-sm">
                <p>
                  <strong>Name:</strong> {item.userId?.name || "N/A"}
                </p>
                <p>
                  <strong>Email:</strong> {item.userId?.email || "N/A"}
                </p>
                <p>
                  <strong>Amount:</strong> {item.amount ?? "-"} coins
                </p>
                <p>
                  <strong>Status:</strong> {item.status ?? "-"}
                </p>
                <p>
                  <strong>Method:</strong> {item.method ?? "-"}
                </p>
                {item.method === "paypal" && item.paypalEmail && (
                  <p>
                    <strong>PayPal Email:</strong> {item.paypalEmail}
                  </p>
                )}
                {item.method === "bank" && (
                  <>
                    <p>
                      <strong>IBAN:</strong> {item.iban || "-"}
                    </p>
                    <p>
                      <strong>Account Number:</strong>{" "}
                      {item.accountNumber || "-"}
                    </p>
                  </>
                )}
              </div>

              {/* Right: Screenshot */}
              {item.screenshot && (
                <div className="flex justify-center items-start">
                  <img
                    src={item.screenshot}
                    alt="Deposit Screenshot"
                    className="rounded-md border border-gray-300 dark:border-gray-600 max-w-xs max-h-48 object-contain shadow-sm hover:scale-105 transition-transform duration-200"
                  />
                </div>
              )}
            </div>

            {/* Bottom: Action buttons */}
            <div className="flex gap-2 mt-3 justify-start">
              <button
                onClick={() => handleAction(item._id, "approve")}
                disabled={processingId === item._id}
                className={`px-4 py-2 rounded text-white transition ${
                  processingId === item._id
                    ? "bg-green-400 dark:bg-green-500"
                    : "bg-green-600 hover:bg-green-700 dark:bg-green-500 dark:hover:bg-green-600"
                }`}
              >
                {processingId === item._id ? "..." : "Approve"}
              </button>
              <button
                onClick={() => handleAction(item._id, "reject")}
                disabled={processingId === item._id}
                className={`px-4 py-2 rounded text-white transition ${
                  processingId === item._id
                    ? "bg-red-400 dark:bg-red-500"
                    : "bg-red-600 hover:bg-red-700 dark:bg-red-500 dark:hover:bg-red-600"
                }`}
              >
                {processingId === item._id ? "..." : "Reject"}
              </button>
            </div>
          </div>
        ))}

        {/* Pagination */}
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

export default DepositsTab;
