import React, { useEffect, useState, useCallback } from "react";
import axios from "../../api/axiosInstance";

const DisputesTab = () => {
  const [disputes, setDisputes] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchDisputes = useCallback(async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        console.error("❌ No token found in localStorage");
        setDisputes([]);
        setLoading(false);
        return;
      }

      const res = await axios.get("/admin/disputes", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = Array.isArray(res.data) ? res.data : [];
      setDisputes(data);
    } catch (err) {
      console.error("❌ Failed to fetch disputes:", err);
      setDisputes([]);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchDisputes();
  }, [fetchDisputes]);

  if (loading) return <p>Loading disputes...</p>;

  return (
    <div>
      <h2>Disputes</h2>
      {disputes.length === 0 ? (
        <p>No disputes found.</p>
      ) : (
        <table>
          <thead>
            <tr>
              <th>ID</th>
              <th>Reason</th>
              <th>Post</th>
              <th>User</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {disputes.map((dispute) => (
              <tr key={dispute._id}>
                <td>{dispute._id}</td>
                <td>{dispute.reason}</td>
                <td>{dispute.post?.description || "N/A"}</td>
                <td>{dispute.user?.username || "Unknown"}</td>
                <td>{dispute.status}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
};

export default DisputesTab;
