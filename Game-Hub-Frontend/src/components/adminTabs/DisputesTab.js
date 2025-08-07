import React, { useEffect, useState, useCallback } from "react";
import axios from "axios";

const DisputesTab = () => {
  const [disputes, setDisputes] = useState([]);
  const [loading, setLoading] = useState(false);
  const [decisionNote, setDecisionNote] = useState("");
  const [selectedDisputeId, setSelectedDisputeId] = useState(null);

  const fetchDisputes = useCallback(async () => {
    setLoading(true);
    try {
      const res = await axios.get("/admin/disputes");
      const data = Array.isArray(res.data) ? res.data : [];
      setDisputes(data);
    } catch (err) {
      console.error("Failed to fetch disputes:", err);
      setDisputes([]); // Fallback to empty array to avoid `.map()` crash
    }
    setLoading(false);
  }, []);

  const handleResolve = async (disputeId, decision) => {
    try {
      await axios.post(`/admin/disputes/${disputeId}/resolve`, {
        decision,
        note: decisionNote,
      });
      await fetchDisputes();
      setDecisionNote("");
      setSelectedDisputeId(null);
    } catch (err) {
      console.error("Failed to resolve dispute:", err);
    }
  };

  useEffect(() => {
    fetchDisputes();
  }, [fetchDisputes]);

  return (
    <div className="p-4">
      <h2 className="text-xl font-bold mb-4">Disputes</h2>
      {loading ? (
        <p>Loading disputes...</p>
      ) : disputes.length === 0 ? (
        <p>No disputes found.</p>
      ) : (
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
