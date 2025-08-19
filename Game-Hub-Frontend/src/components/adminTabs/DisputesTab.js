import React, { useEffect, useState, useCallback } from "react";
import axios from "../../api/axiosInstance";
import socket from "../../utils/socket";
import SkeletonCard from "../../components/common/SkeletonCard";
import {
  ArrowPathIcon,
  ExclamationTriangleIcon,
  ArrowLeftIcon,
  ArrowRightIcon,
  CheckCircleIcon,
  XCircleIcon,
  DocumentTextIcon,
} from "@heroicons/react/24/outline";

const ITEMS_PER_PAGE = 5;
const SKELETON_COUNT = 6;

const DisputesTab = ({
  searchTerm = "",
  sortBy = "date",
  sortOrder = "desc",
  currentPage = 1,
  setCurrentPage,
}) => {
  const [disputes, setDisputes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [decisionNote, setDecisionNote] = useState("");
  const [selectedDisputeId, setSelectedDisputeId] = useState(null);
  const [processingId, setProcessingId] = useState(null);

  const fetchDisputes = useCallback(async (signal) => {
    try {
      setError("");
      setLoading(true);
      const token = localStorage.getItem("token");
      if (!token) {
        setError("No auth token found. Please login.");
        setDisputes([]);
        setLoading(false);
        return;
      }

      const res = await axios.get("/admin/disputes", {
        headers: { Authorization: `Bearer ${token}` },
        signal,
      });

      setDisputes(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      if (axios.isCancel && axios.isCancel(err)) return;
      console.error("Failed to fetch disputes:", err);
      if (err.response?.status === 401) {
        setError("Unauthorized. Please login as admin.");
      } else if (err.response?.status === 403) {
        setError("Access denied. Admins only.");
      } else {
        setError("Failed to fetch disputes. Please try again later.");
      }
      setDisputes([]);
    } finally {
      setLoading(false);
    }
  }, []);

  const handleResolve = async (disputeId, action) => {
    setProcessingId(disputeId);
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        setError("No auth token found. Please login.");
        return;
      }

      await axios.post(
        `/admin/disputes/${disputeId}/resolve`,
        { action, note: decisionNote },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setDecisionNote("");
      setSelectedDisputeId(null);
      fetchDisputes();
    } catch (err) {
      console.error("Failed to resolve dispute:", err);
      setError("Failed to resolve dispute. Please try again.");
    } finally {
      setProcessingId(null);
    }
  };

  useEffect(() => {
    const controller = new AbortController();
    fetchDisputes(controller.signal);
    return () => controller.abort();
  }, [fetchDisputes]);

  useEffect(() => {
    socket.on("admin:disputes_updated", (data) => {
      setDisputes(data);
    });

    socket.on("admin:dispute_resolved", () => {
      fetchDisputes();
    });

    return () => {
      socket.off("admin:disputes_updated");
      socket.off("admin:dispute_resolved");
    };
  }, [fetchDisputes]);

  // Filtering
  const term = (searchTerm || "").toLowerCase();
  const filtered = disputes.filter((tx) => {
    const buyer = (tx?.buyer?.email || "").toLowerCase();
    const seller = (tx?.seller?.email || "").toLowerCase();
    if (!term) return true;
    return buyer.includes(term) || seller.includes(term);
  });

  // Sorting
  filtered.sort((a, b) => {
    if (sortBy === "amount") {
      const aval = Number(a.amount ?? 0);
      const bval = Number(b.amount ?? 0);
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

  const retryFetch = async () => {
    const controller = new AbortController();
    await fetchDisputes(controller.signal);
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
              No disputes found
            </div>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              Disputes will appear here when reported.
            </p>
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
        {paginated.map((tx) => (
          <div
            key={tx._id}
            className="p-5 rounded-xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 shadow-sm hover:shadow-md transition-shadow duration-200"
          >
            {/* Basic Info */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Buyer
                    </p>
                    <p className="font-medium">{tx?.buyer?.email || "N/A"}</p>
                  </div>
                  <div>
                    <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Seller
                    </p>
                    <p className="font-medium">{tx?.seller?.email || "N/A"}</p>
                  </div>
                  <div>
                    <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Amount
                    </p>
                    <p className="font-medium text-yellow-600 dark:text-yellow-500">
                      {tx?.amount ?? "-"} coins
                    </p>
                  </div>
                  <div>
                    <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Date
                    </p>
                    <p className="font-medium">
                      {new Date(tx.createdAt).toLocaleString()}
                    </p>
                  </div>
                </div>
                <div>
                  <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Description
                  </p>
                  <p className="font-medium">{tx?.post?.description || "-"}</p>
                </div>
              </div>

              {/* Reports */}
              <div className="space-y-4">
                {tx?.dispute?.buyerReport && (
                  <div className="bg-gray-50 dark:bg-gray-700/50 p-3 rounded-lg">
                    <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1">
                      Buyer Report
                    </p>
                    <div className="text-sm space-y-1">
                      <p>
                        <span className="font-medium">Reason:</span>{" "}
                        {tx.dispute.buyerReport.reason || "-"}
                      </p>
                      <p>
                        <span className="font-medium">Urgency:</span>{" "}
                        {tx.dispute.buyerReport.urgency || "-"}
                      </p>
                      {tx.dispute.buyerReport.evidenceUrl && (
                        <a
                          href={tx.dispute.buyerReport.evidenceUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1"
                        >
                          <DocumentTextIcon className="w-4 h-4" />
                          Buyer Evidence
                        </a>
                      )}
                    </div>
                  </div>
                )}

                {tx?.dispute?.sellerReport && (
                  <div className="bg-gray-50 dark:bg-gray-700/50 p-3 rounded-lg">
                    <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1">
                      Seller Report
                    </p>
                    <div className="text-sm space-y-1">
                      <p>
                        <span className="font-medium">Reason:</span>{" "}
                        {tx.dispute.sellerReport.reason || "-"}
                      </p>
                      <p>
                        <span className="font-medium">Urgency:</span>{" "}
                        {tx.dispute.sellerReport.urgency || "-"}
                      </p>
                      {tx.dispute.sellerReport.evidenceUrl && (
                        <a
                          href={tx.dispute.sellerReport.evidenceUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1"
                        >
                          <DocumentTextIcon className="w-4 h-4" />
                          Seller Evidence
                        </a>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Resolution Form */}
            <div className="mt-5">
              <div className="mb-3">
                <label className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Resolution Note
                </label>
                <textarea
                  placeholder="Enter resolution note (optional)"
                  value={selectedDisputeId === tx._id ? decisionNote : ""}
                  onChange={(e) => {
                    setSelectedDisputeId(tx._id);
                    setDecisionNote(e.target.value);
                  }}
                  className="w-full p-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-700/50 text-gray-800 dark:text-gray-200 text-sm resize-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                  rows={3}
                />
              </div>
              <div className="flex gap-3">
                <button
                  onClick={() => handleResolve(tx._id, "refund")}
                  disabled={processingId === tx._id}
                  className={`flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-lg text-white font-medium shadow-md transition-all duration-200 ${
                    processingId === tx._id
                      ? "bg-green-400 dark:bg-green-600 cursor-not-allowed"
                      : "bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800"
                  }`}
                >
                  <CheckCircleIcon className="w-5 h-5" />
                  Refund to Buyer
                </button>
                <button
                  onClick={() => handleResolve(tx._id, "release")}
                  disabled={processingId === tx._id}
                  className={`flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-lg text-white font-medium shadow-md transition-all duration-200 ${
                    processingId === tx._id
                      ? "bg-red-400 dark:bg-red-600 cursor-not-allowed"
                      : "bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800"
                  }`}
                >
                  <XCircleIcon className="w-5 h-5" />
                  Release to Seller
                </button>
              </div>
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

export default DisputesTab;
