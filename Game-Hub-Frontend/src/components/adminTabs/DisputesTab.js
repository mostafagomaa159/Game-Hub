import React, { useEffect, useState, useCallback } from "react";
import axios from "../../api/axiosInstance";
import socket from "../../utils/socket";
import SkeletonCard from "../../components/common/SkeletonCard";

const DisputesTab = () => {
  const [disputes, setDisputes] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [decisionNote, setDecisionNote] = useState("");
  const [selectedDisputeId, setSelectedDisputeId] = useState(null);

  const fetchDisputes = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const token = localStorage.getItem("token");
      if (!token) {
        setError("No auth token found. Please login.");
        setDisputes([]);
        setLoading(false);
        return;
      }

      const res = await axios.get("/admin/disputes", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      setDisputes(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      console.error("Failed to fetch disputes:", err);
      if (err.response?.status === 401) {
        setError("Unauthorized. Please login as admin.");
      } else if (err.response?.status === 403) {
        setError("Access denied. Admins only.");
      } else {
        setError("Failed to fetch disputes. Please try again later.");
      }
      setDisputes([]);
    }

    setLoading(false);
  }, []);

  const handleResolve = async (disputeId, action) => {
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        setError("No auth token found. Please login.");
        return;
      }

      await axios.post(
        `/admin/disputes/${disputeId}/resolve`,
        { action, note: decisionNote },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      setDecisionNote("");
      setSelectedDisputeId(null);
    } catch (err) {
      console.error("Failed to resolve dispute:", err);
      setError("Failed to resolve dispute. Please try again.");
    }
  };

  useEffect(() => {
    fetchDisputes();
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

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <h2 className="text-2xl font-bold mb-6 text-gray-800 dark:text-gray-100">
        Disputes
      </h2>

      {loading && (
        <div className="space-y-4">
          <SkeletonCard variant="post" count={3} />
        </div>
      )}

      {error && (
        <p className="text-red-600 dark:text-red-400 font-medium mb-4">
          {error}
        </p>
      )}

      {!loading && !error && disputes.length === 0 && (
        <div className="flex flex-col items-center justify-center py-20 text-center text-gray-600 dark:text-gray-400">
          <div className="text-6xl animate-bounce mb-3 select-none">📭</div>
          <p className="text-lg font-medium">No disputes found</p>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Disputes will appear here when reported.
          </p>
        </div>
      )}

      {!loading && !error && disputes.length > 0 && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {disputes.map((tx) => (
            <div
              key={tx._id}
              className="rounded-2xl shadow-md border border-gray-200 dark:border-gray-700 bg-white dark:bg-darkCard p-6 transition hover:shadow-lg"
            >
              <div className="space-y-2 text-sm text-gray-700 dark:text-gray-300">
                <p>
                  <span className="font-semibold">Buyer:</span>{" "}
                  {tx?.buyer?.email || "N/A"}
                </p>
                <p>
                  <span className="font-semibold">Seller:</span>{" "}
                  {tx?.seller?.email || "N/A"}
                </p>
                <p>
                  <span className="font-semibold">Description:</span>{" "}
                  {tx?.post?.description}
                </p>
                <p>
                  <span className="font-semibold">Amount:</span> {tx?.amount}{" "}
                  coins
                </p>
              </div>

              {/* Buyer Report */}
              {tx?.dispute?.buyerReport && (
                <div className="mt-4 bg-gray-50 dark:bg-gray-800 p-3 rounded-lg">
                  <p className="font-semibold text-gray-800 dark:text-gray-200">
                    Buyer Report:
                  </p>
                  <p>Reason: {tx.dispute.buyerReport.reason}</p>
                  <p>Urgency: {tx.dispute.buyerReport.urgency}</p>
                  {tx.dispute.buyerReport.evidenceUrl && (
                    <a
                      href={tx.dispute.buyerReport.evidenceUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 dark:text-blue-400 underline"
                    >
                      Evidence Link
                    </a>
                  )}
                </div>
              )}

              {/* Seller Report */}
              {tx?.dispute?.sellerReport && (
                <div className="mt-4 bg-gray-50 dark:bg-gray-800 p-3 rounded-lg">
                  <p className="font-semibold text-gray-800 dark:text-gray-200">
                    Seller Report:
                  </p>
                  <p>Reason: {tx.dispute.sellerReport.reason}</p>
                  <p>Urgency: {tx.dispute.sellerReport.urgency}</p>
                  {tx.dispute.sellerReport.evidenceUrl && (
                    <a
                      href={tx.dispute.sellerReport.evidenceUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 dark:text-blue-400 underline"
                    >
                      Evidence Link
                    </a>
                  )}
                </div>
              )}

              {/* Resolution Form */}
              <div className="mt-4">
                <textarea
                  placeholder="Enter resolution note (optional)"
                  value={selectedDisputeId === tx._id ? decisionNote : ""}
                  onChange={(e) => {
                    setSelectedDisputeId(tx._id);
                    setDecisionNote(e.target.value);
                  }}
                  className="w-full p-3 rounded-lg border border-gray-300 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 text-gray-800 dark:text-gray-200 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
                  rows={3}
                />
                <div className="flex flex-col sm:flex-row gap-3 mt-3">
                  <button
                    onClick={() => handleResolve(tx._id, "refund")}
                    className="flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-green-600 text-white font-medium hover:bg-green-700 transition"
                  >
                    <span>💸</span> Refund to Buyer
                  </button>
                  <button
                    onClick={() => handleResolve(tx._id, "release")}
                    className="flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-red-600 text-white font-medium hover:bg-red-700 transition"
                  >
                    <span>📤</span> Release to Seller
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default DisputesTab;
