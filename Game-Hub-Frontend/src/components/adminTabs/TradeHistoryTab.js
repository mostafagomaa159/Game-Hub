// src/components/adminTabs/TradeHistoryTab.js
import React, { useEffect, useState } from "react";
import axios from "../../api/axiosInstance";
import SkeletonCard from "../common/SkeletonCard";

const ITEMS_PER_PAGE = 5;

const TradeHistoryTab = ({
  searchTerm = "",
  sortBy = "date",
  sortOrder = "desc",
  currentPage = 1,
  setCurrentPage,
}) => {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCancelledOnly, setShowCancelledOnly] = useState(false);

  useEffect(() => {
    const controller = new AbortController();

    const fetchData = async () => {
      try {
        setLoading(true);
        const token = localStorage.getItem("token");
        const headers = { Authorization: `Bearer ${token}` };
        const res = await axios.get("/admin/trade-history", {
          headers,
          signal: controller.signal,
        });
        setHistory(res.data || []);
      } catch (err) {
        if (axios.isCancel && axios.isCancel(err)) return;
        console.error("Failed to fetch trade history", err);
        alert("Failed to load trade history.");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
    return () => controller.abort();
  }, []);

  const exportToCSV = () => {
    const rows = [
      ["Seller", "Buyer", "Price", "Status", "Server", "Available", "Date"],
      ...filtered.map((tx) => [
        tx.owner?.name || "",
        tx.buyer?.name || "",
        tx.price ?? "",
        tx.tradeStatus || "",
        tx.server || "",
        tx.avaliable ? "Yes" : "No",
        new Date(tx.updatedAt).toLocaleString(),
      ]),
    ];
    const csv = rows.map((r) => r.join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = "trade_history.csv";
    a.click();
  };

  // Filtering
  const term = (searchTerm || "").toLowerCase();
  const filtered = history
    .filter((item) => {
      if (showCancelledOnly && item.tradeStatus !== "cancelled") return false;
      if (!showCancelledOnly && item.tradeStatus === "cancelled") {
        // if you want to hide cancelled by default, uncomment:
        // return false;
      }
      const owner = item.owner?.name || item.owner?.email || "";
      const buyer = item.buyer?.name || item.buyer?.email || "";
      return (
        owner.toLowerCase().includes(term) ||
        buyer.toLowerCase().includes(term) ||
        (item.owner?.email || "").toLowerCase().includes(term)
      );
    })
    .sort((a, b) => {
      if (sortBy === "amount" || sortBy === "price") {
        const aval = a.amount || a.price || 0;
        const bval = b.amount || b.price || 0;
        return sortOrder === "asc" ? aval - bval : bval - aval;
      } else {
        const at = new Date(a.updatedAt || a.createdAt).getTime();
        const bt = new Date(b.updatedAt || b.createdAt).getTime();
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
          <SkeletonCard key={i} isHistory />
        ))}
      </div>
    );
  }

  if (paginated.length === 0) {
    return <p className="text-gray-400">No trade history results.</p>;
  }

  return (
    <div>
      <div className="flex items-center gap-4 mb-4">
        <button
          onClick={exportToCSV}
          className="px-4 py-2 rounded bg-green-600"
        >
          Export CSV
        </button>
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={showCancelledOnly}
            onChange={(e) => setShowCancelledOnly(e.target.checked)}
          />
          Show only Cancelled
        </label>
      </div>

      {paginated.map((item) => (
        <div
          key={item._id}
          className="p-4 rounded-lg shadow-md mb-4 bg-gray-800"
        >
          <p>
            <strong>Seller:</strong> {item.owner?.name}
          </p>
          <p>
            <strong>Buyer:</strong> {item.buyer?.name || "N/A"}
          </p>
          <p>
            <strong>💰:</strong> {item.price}
          </p>
          <p className="flex items-center gap-2">
            <strong>Status:</strong>
            {item.tradeStatus === "completed" ? (
              <span className="text-green-500">Completed</span>
            ) : item.tradeStatus === "cancelled" ? (
              <span className="text-red-500">Cancelled</span>
            ) : (
              <span className="text-gray-400">Unknown</span>
            )}
          </p>
          <p>
            <strong>Server:</strong> {item.server || "N/A"}
          </p>
          <p>
            <strong>Date:</strong>{" "}
            {new Date(item.updatedAt || item.createdAt).toLocaleString()}
          </p>
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

export default TradeHistoryTab;
