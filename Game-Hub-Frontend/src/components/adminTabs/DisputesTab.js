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

  // Fetch disputes on mount
  useEffect(() => {
    fetchDisputes();
  }, [fetchDisputes]);

  // Socket.IO listeners for live updates
  useEffect(() => {
    socket.on("admin:disputes_updated", (data) => {
      setDisputes(data);
    });

    socket.on("admin:dispute_resolved", (update) => {
      fetchDisputes();
    });

    return () => {
      socket.off("admin:disputes_updated");
      socket.off("admin:dispute_resolved");
    };
  }, [fetchDisputes]);

  return (
    <div className="p-4">
      <h2 className="text-xl font-bold mb-4">Disputes</h2>

      {loading && (
        <div className="space-y-4">
          <SkeletonCard variant="post" count={3} />
        </div>
      )}

      {error && <p className="text-red-500 mb-4">{error}</p>}

      {!loading && !error && disputes.length === 0 && (
        <div className="flex flex-col items-center justify-center py-20 text-center text-gray-600 dark:text-gray-300">
          <div className="text-6xl animate-bounce mb-3 select-none">📭</div>
          <div className="text-lg font-medium">No disputes found.</div>
        </div>
      )}

      {!loading && !error && disputes.length > 0 && (
        <div className="grid grid-cols-1 gap-4">
          {disputes.map((tx) => (
            <div
              key={tx._id}
              className="p-4 border rounded bg-gray-900 text-white"
            >
              <p>
                <strong>Buyer:</strong> {tx?.buyer?.email || "N/A"}
              </p>
              <p>
                <strong>Seller:</strong> {tx?.seller?.email || "N/A"}
              </p>
              <p>
                <strong>Amount:</strong> {tx?.amount} coins
              </p>

              {/* Buyer Report */}
              {tx?.dispute?.buyerReport && (
                <div className="mt-2">
                  <p className="font-semibold">Buyer Report:</p>
                  <p>Reason: {tx.dispute.buyerReport.reason}</p>
                  <p>Urgency: {tx.dispute.buyerReport.urgency}</p>
                  {tx.dispute.buyerReport.evidenceUrl && (
                    <a
                      href={tx.dispute.buyerReport.evidenceUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-400 underline"
                    >
                      Evidence Link
                    </a>
                  )}
                </div>
              )}

              {/* Seller Report */}
              {tx?.dispute?.sellerReport && (
                <div className="mt-2">
                  <p className="font-semibold">Seller Report:</p>
                  <p>Reason: {tx.dispute.sellerReport.reason}</p>
                  <p>Urgency: {tx.dispute.sellerReport.urgency}</p>
                  {tx.dispute.sellerReport.evidenceUrl && (
                    <a
                      href={tx.dispute.sellerReport.evidenceUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-400 underline"
                    >
                      Evidence Link
                    </a>
                  )}
                </div>
              )}

              <div className="mt-2">
                <textarea
                  placeholder="Enter resolution note (optional)"
                  value={selectedDisputeId === tx._id ? decisionNote : ""}
                  onChange={(e) => {
                    setSelectedDisputeId(tx._id);
                    setDecisionNote(e.target.value);
                  }}
                  className="w-full p-2 rounded bg-gray-800 text-white border border-gray-700"
                />
                <div className="flex gap-2 mt-2">
                  <button
                    onClick={() => handleResolve(tx._id, "refund")}
                    className="px-3 py-1 bg-green-600 text-white rounded hover:bg-green-700"
                  >
                    Refund Buyer
                  </button>
                  <button
                    onClick={() => handleResolve(tx._id, "release")}
                    className="px-3 py-1 bg-red-600 text-white rounded hover:bg-red-700"
                  >
                    Release to Seller
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
