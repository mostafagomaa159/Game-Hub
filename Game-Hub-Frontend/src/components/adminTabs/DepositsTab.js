// src/components/adminTabs/DepositsTab.js
import React, { useEffect, useState } from "react";
import axios from "../../api/axiosInstance";
import SkeletonCard from "../common/SkeletonCard";

const ITEMS_PER_PAGE = 5;

const DepositsTab = ({
  searchTerm = "",
  sortBy = "date",
  sortOrder = "desc",
  currentPage = 1,
  setCurrentPage,
  setPendingCounts,
}) => {
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState(null);

  useEffect(() => {
    const controller = new AbortController();
    const signal = controller.signal;

    const fetchData = async () => {
      try {
        setLoading(true);
        const token = localStorage.getItem("token");
        const headers = { Authorization: `Bearer ${token}` };
        const res = await axios.get("/transactions/pending-deposits", {
          headers,
          signal,
        });
        setTransactions(res.data || []);
        setPendingCounts?.((prev) => ({
          ...prev,
          deposits: res.data?.length ?? 0,
        }));
      } catch (err) {
        if (axios.isCancel && axios.isCancel(err)) return;
        console.error("Failed to fetch pending deposits", err);
        alert("Failed to load pending deposits.");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
    return () => controller.abort();
  }, [setPendingCounts]);

  const handleAction = async (id, action) => {
    setProcessingId(id);
    try {
      const token = localStorage.getItem("token");
      await axios.patch(
        `/transactions/${id}/approve-deposit`,
        {
          status: action === "approve" ? "approved" : "rejected",
          adminNote: `Marked ${action}`,
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setTransactions((prev) => prev.filter((t) => t._id !== id));
      setPendingCounts?.((prev) => ({
        ...prev,
        deposits: Math.max(0, (prev.deposits || 1) - 1),
      }));
    } catch (err) {
      console.error("Action failed", err);
      alert("Action failed");
    } finally {
      setProcessingId(null);
    }
  };

  // Filtering
  const term = (searchTerm || "").toLowerCase();
  const filtered = transactions.filter((tx) => {
    const owner = tx.userId?.name || "";
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
      const at = new Date(a.createdAt).getTime();
      const bt = new Date(b.createdAt).getTime();
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
    // If current page is out of range after filtering, reset to 1
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
    return <p className="text-gray-400">No pending deposits.</p>;
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
            <strong>Method:</strong> {item.method}
          </p>

          {item.method === "paypal" && item.paypalEmail && (
            <p>
              <strong>PayPal Email:</strong> {item.paypalEmail}
            </p>
          )}

          {item.method === "bank" && (
            <>
              <p>
                <strong>IBAN:</strong> {item.iban}
              </p>
              <p>
                <strong>Account Number:</strong> {item.accountNumber}
              </p>
            </>
          )}

          <div className="mt-2 flex gap-2">
            <button
              onClick={() => handleAction(item._id, "approve")}
              disabled={processingId === item._id}
              className="bg-green-600 px-4 py-2 rounded"
            >
              {processingId === item._id ? "..." : "Approve"}
            </button>
            <button
              onClick={() => handleAction(item._id, "reject")}
              disabled={processingId === item._id}
              className="bg-red-600 px-4 py-2 rounded"
            >
              {processingId === item._id ? "..." : "Reject"}
            </button>
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

export default DepositsTab;
