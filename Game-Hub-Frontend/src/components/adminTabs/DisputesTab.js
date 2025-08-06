import React, { useEffect, useState } from "react";
import axios from "../../api/axiosInstance";
import socket from "../../utils/socket";

import SkeletonCard from "../common/SkeletonCard";

const DisputesTab = () => {
  const [disputes, setDisputes] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchDisputes = async () => {
    try {
      setLoading(true);
      const res = await axios.get("/admin/disputes");
      setDisputes(res.data || []);
    } catch (err) {
      console.error("Failed to fetch disputes:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    socket.on("admin:dispute_created", fetchDisputes);
    socket.on("admin:dispute_resolved", fetchDisputes);

    return () => {
      socket.off("admin:dispute_created", fetchDisputes);
      socket.off("admin:dispute_resolved", fetchDisputes);
    };
  }, []);

  if (loading) {
    return (
      <div className="p-4">
        {[...Array(3)].map((_, i) => (
          <SkeletonCard
            key={i}
            variant="rectangular"
            height={80}
            className="mb-4"
          />
        ))}
      </div>
    );
  }

  if (!disputes.length) {
    return <div className="p-4 text-gray-500">No disputes found.</div>;
  }

  return (
    <div className="p-4">
      <h2 className="text-xl font-bold mb-4">Active Disputes</h2>
      <ul className="space-y-4">
        {disputes.map((dispute) => (
          <li
            key={dispute._id}
            className="p-4 border rounded-md shadow-sm bg-white dark:bg-gray-900"
          >
            <p>
              <strong>Post:</strong> {dispute.post?.description || "N/A"}
            </p>
            <p>
              <strong>Buyer:</strong> {dispute.buyer?.username}
            </p>
            <p>
              <strong>Seller:</strong> {dispute.seller?.username}
            </p>
            <p>
              <strong>Reason:</strong>{" "}
              {dispute.dispute?.reason || "Not specified"}
            </p>
            <p>
              <strong>Status:</strong> {dispute.status}
            </p>
            {/* Add resolve button if needed */}
          </li>
        ))}
      </ul>
    </div>
  );
};

export default DisputesTab;
