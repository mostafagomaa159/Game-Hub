// src/components/adminTabs/ProcessedTab.js
import React, { useEffect, useState } from "react";
import axios from "../../api/axiosInstance";
import SkeletonCard from "../common/SkeletonCard";

const ITEMS_PER_PAGE = 5;

const ProcessedTab = ({
  searchTerm = "",
  sortBy = "date",
  sortOrder = "desc",
  currentPage = 1,
  setCurrentPage,
  setProcessedCount, // <- new prop from parent
}) => {
  const [processed, setProcessed] = useState([]);
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState(null);

  const fetchData = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("token");
      const headers = { Authorization: `Bearer ${token}` };
      const res = await axios.get("/transactions/processed", { headers });
      setProcessed(res.data || []);
      // update parent count on initial load if setter provided
      if (typeof setProcessedCount === "function") {
        setProcessedCount(Array.isArray(res.data) ? res.data.length : 0);
      }
    } catch (err) {
      console.error("Failed to fetch processed transactions", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const updateNote = async (id, note) => {
    setProcessingId(id);
    try {
      const token = localStorage.getItem("token");
      await axios.patch(
        `/transactions/${id}/note`,
        { note },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setProcessed((prev) =>
        prev.map((tx) => (tx._id === id ? { ...tx, adminNote: note } : tx))
      );
    } catch (err) {
      console.error("Failed to update note", err);
      alert("Failed to update note");
    } finally {
      setProcessingId(null);
    }
  };

  // Filtering
  const term = (searchTerm || "").toLowerCase();
  const filtered = processed.filter((tx) => {
    const owner = tx.userId?.name || tx.userId?.email || "";
    const email = tx.userId?.email || "";
    return (
      owner.toLowerCase().includes(term) || email.toLowerCase().includes(term)
    );
  });

  // Sorting
  filtered.sort((a, b) => {
    if (sortBy === "amount" || sortBy === "price") {
      const aval = a.amount || a.price || 0;
      const bval = b.amount || b.price || 0;
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [totalPages]);

  if (loading) {
    return (
      <div>
        {Array.from({ length: 3 }).map((_, i) => (
          <SkeletonCard key={i} />
        ))}
      </div>
    );
  }

  if (paginated.length === 0) {
    return <p className="text-gray-400">No processed transactions.</p>;
  }

  return (
    <div>
      {paginated.map((item) => (
        <div
          key={item._id}
          className="p-4 rounded-lg shadow-md mb-4 bg-gray-800"
        >
          <p>
            <strong>Name:</strong> {item.userId?.name}
          </p>
          <p>
            <strong>Email:</strong> {item.userId?.email}
          </p>
          <p>
            <strong>Amount:</strong> {item.amount} coins
          </p>
          <p>
            <strong>Status:</strong> {item.status}
          </p>
          <p>
            <strong>Type:</strong> {item.type}
          </p>
          <p>
            <strong>Method:</strong> {item.method}
          </p>

          <div className="mt-3">
            <label className="text-sm">Admin Note:</label>
            <textarea
              defaultValue={item.adminNote || ""}
              onBlur={(e) => updateNote(item._id, e.target.value)}
              className="w-full mt-1 p-2 rounded bg-gray-900 border border-gray-600"
              disabled={processingId === item._id}
            />
            {processingId === item._id && (
              <p className="text-sm text-gray-400 mt-1">Saving...</p>
            )}
          </div>
        </div>
      ))}

      {totalPages > 1 && (
        <div className="flex justify-center mt-4 gap-2">
          {Array.from({ length: totalPages }, (_, i) => i + 1).map((pg) => (
            <button
              key={pg}
              onClick={() => setCurrentPage?.(pg)}
              className={`px-3 py-1 rounded ${
                pg === currentPage
                  ? "bg-blue-600 text-white"
                  : "bg-gray-700 text-gray-300"
              }`}
            >
              {pg}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export default ProcessedTab;
