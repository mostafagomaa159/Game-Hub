// src/pages/DisputeDetailsPage.js
import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axiosInstance from "../api/axiosInstance";

const DisputeDetailsPage = () => {
  const { id } = useParams(); // URL param: /dispute/:tradeId
  const navigate = useNavigate();

  const [dispute, setDispute] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchDispute = async () => {
      try {
        setLoading(true);
        const res = await axiosInstance.get(`/trade/${id}/dispute`);
        setDispute(res.data);
        setLoading(false);
      } catch (err) {
        console.error("Failed to fetch dispute:", err);
        setError(
          err.response?.data?.error || "Failed to fetch dispute details"
        );
        setLoading(false);
      }
    };

    if (id) fetchDispute();
  }, [id]);

  if (loading)
    return <p className="p-6 text-center">Loading dispute details...</p>;
  if (error) return <p className="p-6 text-center text-red-500">{error}</p>;
  if (!dispute) return <p className="p-6 text-center">No dispute found.</p>;

  return (
    <div className="max-w-3xl mx-auto p-6">
      <button
        onClick={() => navigate(-1)}
        className="mb-4 px-3 py-1 bg-gray-200 hover:bg-gray-300 rounded"
      >
        ← Back
      </button>

      <h1 className="text-2xl font-bold mb-4">Dispute Details</h1>

      <p className="mb-2">
        <strong>Status:</strong>{" "}
        <span className="capitalize">{dispute.status || "none"}</span>
      </p>

      {dispute.sellerReport && (
        <div className="mb-4 p-4 border rounded bg-gray-50 dark:bg-gray-800">
          <h2 className="font-semibold mb-2">Seller Report</h2>
          <p>
            <strong>Reason:</strong> {dispute.sellerReport.reason || "N/A"}
          </p>
          <p>
            <strong>Urgency:</strong> {dispute.sellerReport.urgency || "N/A"}
          </p>
          {dispute.sellerReport.evidenceUrl && (
            <p>
              <strong>Evidence:</strong>{" "}
              <a
                href={dispute.sellerReport.evidenceUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="underline text-blue-600"
              >
                View
              </a>
            </p>
          )}
        </div>
      )}

      {dispute.buyerReport && (
        <div className="mb-4 p-4 border rounded bg-gray-50 dark:bg-gray-800">
          <h2 className="font-semibold mb-2">Buyer Report</h2>
          <p>
            <strong>Reason:</strong> {dispute.buyerReport.reason || "N/A"}
          </p>
          <p>
            <strong>Urgency:</strong> {dispute.buyerReport.urgency || "N/A"}
          </p>
          {dispute.buyerReport.evidenceUrl && (
            <p>
              <strong>Evidence:</strong>{" "}
              <a
                href={dispute.buyerReport.evidenceUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="underline text-blue-600"
              >
                View
              </a>
            </p>
          )}
        </div>
      )}

      {dispute.adminDecision && (
        <div className="mb-4 p-4 border rounded bg-gray-50 dark:bg-gray-800">
          <h2 className="font-semibold mb-2">Admin Decision</h2>
          <p>
            <strong>Winner:</strong> {dispute.adminDecision.winner || "N/A"}
          </p>
          <p>
            <strong>Admin Note:</strong>{" "}
            {dispute.adminDecision.adminNote || "N/A"}
          </p>
          <p>
            <strong>Decided At:</strong>{" "}
            {dispute.adminDecision.decidedAt
              ? new Date(dispute.adminDecision.decidedAt).toLocaleString()
              : "N/A"}
          </p>
        </div>
      )}

      {dispute.expiresAt && (
        <p className="text-sm text-gray-500">
          Dispute expires at: {new Date(dispute.expiresAt).toLocaleString()}
        </p>
      )}
    </div>
  );
};

export default DisputeDetailsPage;
