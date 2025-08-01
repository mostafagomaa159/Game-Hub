import React, { useEffect, useState } from "react";
import axios from "../api/axiosInstance";

const MyTransactions = () => {
  const [transactions, setTransactions] = useState([]);
  const [tradeHistory, setTradeHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterType, setFilterType] = useState("all"); // all, deposit, withdraw, history

  useEffect(() => {
    const fetchData = async () => {
      try {
        const token = localStorage.getItem("token");
        const headers = { Authorization: `Bearer ${token}` };

        const [transactionsRes, tradeHistoryRes] = await Promise.all([
          axios.get("/transactions/me", { headers }),
          axios.get("/me/trade-history", { headers }),
        ]);

        setTransactions(transactionsRes.data);
        setTradeHistory(tradeHistoryRes.data);
      } catch (error) {
        console.error("Error fetching data", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const renderStatusButton = (status) => {
    const base = "px-3 py-1 rounded text-white w-fit";
    if (status === "approved")
      return <span className={`${base} bg-green-700`}>Approved</span>;
    if (status === "rejected")
      return <span className={`${base} bg-red-700`}>Rejected</span>;
    if (status === "pending")
      return <span className={`${base} bg-yellow-600`}>Pending</span>;
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

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-500 border-t-transparent"></div>
      </div>
    );
  }

  const list = filtered();

  return (
    <div className="p-4 text-white">
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
        >
          <option value="all">All</option>
          <option value="deposit">Deposits</option>
          <option value="withdraw">Withdrawals</option>
          <option value="history">Trade History</option>
        </select>
      </div>

      {list.length === 0 ? (
        <p>No data found.</p>
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
                <div className="flex justify-between">
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
                  <div className="flex items-center">
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
