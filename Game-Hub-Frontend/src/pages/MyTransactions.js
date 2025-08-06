import React, { useEffect, useState } from "react";
import axios from "../api/axiosInstance";
import SkeletonCard from "../components/common/SkeletonCard";

const MyTransactions = () => {
  const [transactions, setTransactions] = useState([]);
  const [tradeHistory, setTradeHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterType, setFilterType] = useState("all"); // all, deposit, withdraw, history

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const token = localStorage.getItem("token");
        const headers = { Authorization: `Bearer ${token}` };

        const [transactionsRes, tradeHistoryRes] = await Promise.all([
          axios.get("/transactions/me", { headers }),
          axios.get("/me/trade-history", { headers }),
        ]);

        setTransactions(
          Array.isArray(transactionsRes.data) ? transactionsRes.data : []
        );
        setTradeHistory(
          Array.isArray(tradeHistoryRes.data) ? tradeHistoryRes.data : []
        );
      } catch (error) {
        console.error("Error fetching data", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const renderStatusButton = (status) => {
    const base = "px-3 py-1 rounded text-white w-fit text-sm";
    if (status === "approved")
      return <span className={`${base} bg-green-700`}>Approved</span>;
    if (status === "rejected")
      return <span className={`${base} bg-red-700`}>Rejected</span>;
    if (status === "pending")
      return (
        <span className={`${base} bg-yellow-600 text-black`}>Pending</span>
      );
    return null;
  };

  const renderTradeStatus = (status) => {
    const base = "font-semibold inline-flex items-center gap-1";
    if (status === "completed")
      return <span className={`${base} text-green-400`}>✅ Completed</span>;
    if (status === "cancelled")
      return <span className={`${base} text-red-400`}>❌ Cancelled</span>;
    return status;
  };

  const filtered = () => {
    if (filterType === "history") return tradeHistory;
    if (filterType === "all") return transactions;
    return transactions.filter((tx) => tx.type === filterType);
  };

  const SKELETON_COUNT = 6; // number of skeleton cards to show

  if (loading) {
    return (
      <div className="p-4 text-white max-w-5xl mx-auto">
        <h2 className="text-2xl font-bold mb-4">My Transactions</h2>

        <div className="mb-4">
          <label htmlFor="filter" className="mr-2">
            Filter by:
          </label>
          <select
            id="filter"
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className="p-2 rounded bg-gray-900 border border-gray-600 text-white"
            disabled
          >
            <option value="all">All</option>
            <option value="deposit">Deposits</option>
            <option value="withdraw">Withdrawals</option>
            <option value="history">Trade History</option>
          </select>
        </div>

        <div className="grid gap-4">
          {Array.from({ length: SKELETON_COUNT }).map((_, idx) => (
            <SkeletonCard key={idx} isHistory={filterType === "history"} />
          ))}
        </div>
      </div>
    );
  }

  const list = filtered();

  return (
    <div className="p-4 text-white max-w-5xl mx-auto">
      <h2 className="text-2xl font-bold mb-4">My Transactions</h2>

      <div className="mb-4 flex items-center gap-3">
        <label htmlFor="filter" className="mr-2">
          Filter by:
        </label>
        <select
          id="filter"
          value={filterType}
          onChange={(e) => setFilterType(e.target.value)}
          className="p-2 rounded bg-gray-900 border border-gray-600 text-white"
        >
          <option value="all">All</option>
          <option value="deposit">Deposits</option>
          <option value="withdraw">Withdrawals</option>
          <option value="history">Trade History</option>
        </select>
      </div>

      {list.length === 0 ? (
        <div className="text-center text-gray-400 text-lg mt-10">
          <div className="text-4xl animate-bounce mb-2">📭</div>
          No {filterType === "history" ? "trade history" : "transactions"}{" "}
          found.
        </div>
      ) : (
        <div className="grid gap-4">
          {list.map((item) => (
            <div key={item._id} className="bg-gray-800 p-4 rounded shadow-md">
              {filterType === "history" ? (
                <>
                  <p>
                    <strong>Item:</strong> {item.description}
                  </p>
                  <p>
                    <strong>Price:</strong> {item.price}
                  </p>
                  <p>
                    <strong>Server:</strong> {item.server}
                  </p>
                  <p>
                    <strong>Available:</strong> {item.avaliable ? "Yes" : "No"}
                  </p>
                  <p>
                    <strong>Owner:</strong> {item.owner?.name}
                  </p>
                  <p>
                    <strong>Buyer:</strong> {item.buyer?.name || "N/A"}
                  </p>
                  <p>
                    <strong>Status:</strong>{" "}
                    {renderTradeStatus(item.tradeStatus)}
                  </p>
                  <p>
                    <strong>Date:</strong>{" "}
                    {new Date(item.updatedAt).toLocaleString()}
                  </p>
                </>
              ) : (
                <div className="flex flex-col md:flex-row md:justify-between gap-3">
                  <div>
                    <p>
                      <strong>Amount:</strong> {item.amount} coins
                    </p>
                    <p>
                      <strong>Method:</strong> {item.method}
                    </p>
                    <p>
                      <strong>Date:</strong>{" "}
                      {new Date(item.createdAt).toLocaleString()}
                    </p>
                    {(item.adminNote || item.adminLog?.note) && (
                      <p className="text-sm text-yellow-300 mt-1 max-w-xs">
                        <strong>Status:</strong>{" "}
                        {item.adminNote || item.adminLog.note}
                      </p>
                    )}
                  </div>
                  <div className="flex items-center gap-3">
                    {renderStatusButton(item.status)}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default MyTransactions;
