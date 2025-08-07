import React, { useEffect, useState, useCallback } from "react";
import axios from "../../api/axiosInstance";

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

  const handleResolve = async (disputeId, decision) => {
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        setError("No auth token found. Please login.");
        return;
      }

      await axios.post(
        `/admin/disputes/${disputeId}/resolve`,
        {
          decision,
          note: decisionNote,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      await fetchDisputes();
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

  return (
    <div className="p-4">
      <h2 className="text-xl font-bold mb-4">Disputes</h2>

      {loading && <p>Loading disputes...</p>}

      {error && <p className="text-red-500 mb-4">{error}</p>}

      {!loading && !error && disputes.length === 0 && <p>No disputes found.</p>}

      {!loading && !error && disputes.length > 0 && (
        <div className="grid grid-cols-1 gap-4">
          {disputes.map((dispute) => (
            <div
              key={dispute._id}
              className="p-4 border rounded bg-gray-900 text-white"
            >
              <p>
                <strong>Buyer:</strong> {dispute?.buyer?.email || "N/A"}
              </p>
              <p>
                <strong>Seller:</strong> {dispute?.seller?.email || "N/A"}
              </p>
              <p>
                <strong>Reason:</strong> {dispute?.reason}
              </p>
              {dispute?.chatLogs?.length > 0 && (
                <>
                  <p>
                    <strong>Chat Logs:</strong>
                  </p>
                  <ul className="pl-4 list-disc">
                    {dispute.chatLogs.map((log, idx) => (
                      <li key={idx}>{log}</li>
                    ))}
                  </ul>
                </>
              )}
              {dispute?.videoUrls?.length > 0 && (
                <>
                  <p>
                    <strong>Video Evidence:</strong>
                  </p>
                  <ul className="pl-4 list-disc">
                    {dispute.videoUrls.map((url, idx) => (
                      <li key={idx}>
                        <a
                          href={url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-400 underline"
                        >
                          {url}
                        </a>
                      </li>
                    ))}
                  </ul>
                </>
              )}
              <div className="mt-2">
                <textarea
                  placeholder="Enter resolution note (optional)"
                  value={selectedDisputeId === dispute._id ? decisionNote : ""}
                  onChange={(e) => {
                    setSelectedDisputeId(dispute._id);
                    setDecisionNote(e.target.value);
                  }}
                  className="w-full p-2 rounded bg-gray-800 text-white border border-gray-700"
                />
                <div className="flex gap-2 mt-2">
                  <button
                    onClick={() => handleResolve(dispute._id, "buyer")}
                    className="px-3 py-1 bg-green-600 text-white rounded hover:bg-green-700"
                  >
                    Resolve for Buyer
                  </button>
                  <button
                    onClick={() => handleResolve(dispute._id, "seller")}
                    className="px-3 py-1 bg-red-600 text-white rounded hover:bg-red-700"
                  >
                    Resolve for Seller
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
