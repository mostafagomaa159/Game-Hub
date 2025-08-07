// src/components/adminTabs/DisputesTab.js
import React, { useEffect, useState, useCallback } from "react";
import axios from "../../api/axiosInstance";

const DisputesTab = () => {
  const [disputes, setDisputes] = useState([]);
  const [loading, setLoading] = useState(false);
  const [noteMap, setNoteMap] = useState({});

  const fetchDisputes = useCallback(async () => {
    setLoading(true);
    try {
      const res = await axios.get("/admin/disputes");
      setDisputes(res.data || []);
    } catch (err) {
      console.error("Failed to fetch disputes:", err);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchDisputes();
  }, [fetchDisputes]);

  const handleDecision = async (disputeId, decision) => {
    const note = noteMap[disputeId] || "";
    try {
      await axios.post(`/admin/disputes/${disputeId}/resolve`, {
        decision,
        note,
      });
      fetchDisputes(); // Refresh the list
    } catch (err) {
      console.error("Failed to resolve dispute:", err);
    }
  };

  const handleNoteChange = (id, value) => {
    setNoteMap((prev) => ({ ...prev, [id]: value }));
  };

  return (
    <div className="p-4">
      <h2 className="text-xl font-semibold mb-4">Open Disputes</h2>

      {loading && <p>Loading...</p>}

      {disputes.length === 0 && !loading && <p>No open disputes found.</p>}

      <div className="space-y-4">
        {disputes.map((dispute) => (
          <div key={dispute._id} className="border p-4 rounded shadow">
            <p>
              <strong>Trade ID:</strong> {dispute.tradeId}
            </p>
            <p>
              <strong>Buyer:</strong> {dispute.buyer?.email || "N/A"}
            </p>
            <p>
              <strong>Seller:</strong> {dispute.seller?.email || "N/A"}
            </p>
            <p>
              <strong>Reason:</strong> {dispute.reason}
            </p>
            <p>
              <strong>Chat Logs:</strong>{" "}
              {dispute.chatLogs?.join(", ") || "N/A"}
            </p>
            {dispute.videoUrls?.map((url, idx) => (
              <p key={idx}>
                <a
                  href={url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-500 underline"
                >
                  Video Evidence {idx + 1}
                </a>
              </p>
            ))}

            <textarea
              className="border p-2 mt-2 w-full"
              placeholder="Admin notes..."
              value={noteMap[dispute._id] || ""}
              onChange={(e) => handleNoteChange(dispute._id, e.target.value)}
            />

            <div className="mt-2 flex gap-2">
              <button
                onClick={() => handleDecision(dispute._id, "release")}
                className="bg-green-600 text-white px-4 py-2 rounded"
              >
                Release to Seller
              </button>
              <button
                onClick={() => handleDecision(dispute._id, "refund")}
                className="bg-red-600 text-white px-4 py-2 rounded"
              >
                Refund Buyer
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default DisputesTab;
