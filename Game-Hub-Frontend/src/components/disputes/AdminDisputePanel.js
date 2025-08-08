import React, { useEffect, useState } from "react";
import axios from "axios";
import { toast } from "react-toastify";
import DisputeCase from "./DisputeCase";

const AdminDisputePanel = () => {
  const [disputes, setDisputes] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [page, setPage] = useState(1);

  const refreshDisputes = async () => {
    setIsLoading(true);
    try {
      const { data } = await axios.get(`/api/admin/disputes?page=${page}`);
      setDisputes(data);
    } catch (error) {
      console.error("Failed to fetch disputes:", error);
      toast.error("Failed to load disputes");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    refreshDisputes();
  }, [page]);

  const handleResolve = async (tradeId, decision) => {
    try {
      await axios.patch(`/api/admin/disputes/${tradeId}/resolve`, { decision });
      toast.success(`Dispute resolved in favor of ${decision}`);
      await refreshDisputes();
    } catch (error) {
      toast.error(error.response?.data?.error || "Resolution failed");
    }
  };

  if (isLoading)
    return (
      <div className="space-y-4">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="animate-pulse bg-gray-200 h-24 rounded" />
        ))}
      </div>
    );

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold">Active Disputes</h2>

      {disputes.length === 0 ? (
        <p>No active disputes</p>
      ) : (
        <>
          {disputes.map((dispute) => (
            <DisputeCase
              key={dispute._id}
              dispute={dispute}
              onResolve={handleResolve}
            />
          ))}
          <div className="flex justify-between mt-4">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              className="px-4 py-2 bg-gray-200 rounded disabled:opacity-50"
            >
              Previous
            </button>
            <span>Page {page}</span>
            <button
              onClick={() => setPage((p) => p + 1)}
              disabled={disputes.length < 10}
              className="px-4 py-2 bg-gray-200 rounded disabled:opacity-50"
            >
              Next
            </button>
          </div>
        </>
      )}
    </div>
  );
};

export default AdminDisputePanel;
