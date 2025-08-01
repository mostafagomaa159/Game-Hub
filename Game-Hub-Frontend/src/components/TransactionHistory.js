// src/components/TransactionHistory.js
import React, { useEffect, useState } from "react";
import axios from "../api/axiosInstance";

const TransactionHistory = () => {
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchTransactions = async () => {
      setLoading(true);
      try {
        const res = await axios.get("/transactions/me");
        setTransactions(res.data);
      } catch (err) {
        setError(err.response?.data?.error || "Failed to load transactions.");
      } finally {
        setLoading(false);
      }
    };

    fetchTransactions();
  }, []);

  return (
    <div className="max-w-4xl mx-auto p-6 bg-white dark:bg-gray-800 rounded-2xl shadow-xl mt-10">
      <h2 className="text-2xl font-semibold mb-6 text-gray-800 dark:text-white">
        Your Transaction History
      </h2>

      {loading && <p>Loading transactions...</p>}
      {error && <p className="text-red-600 dark:text-red-400">{error}</p>}

      {!loading && !error && transactions.length === 0 && (
        <p>No transactions found.</p>
      )}

      {!loading && !error && transactions.length > 0 && (
        <table className="min-w-full border-collapse border border-gray-300 dark:border-gray-700">
          <thead>
            <tr className="bg-gray-100 dark:bg-gray-700">
              <th className="border border-gray-300 dark:border-gray-600 px-4 py-2 text-left">
                Type
              </th>
              <th className="border border-gray-300 dark:border-gray-600 px-4 py-2 text-left">
                Amount
              </th>
              <th className="border border-gray-300 dark:border-gray-600 px-4 py-2 text-left">
                Method
              </th>
              <th className="border border-gray-300 dark:border-gray-600 px-4 py-2 text-left">
                Status
              </th>
              <th className="border border-gray-300 dark:border-gray-600 px-4 py-2 text-left">
                Date
              </th>
            </tr>
          </thead>
          <tbody>
            {transactions.map((t) => (
              <tr
                key={t._id}
                className="odd:bg-white even:bg-gray-50 dark:odd:bg-gray-800 dark:even:bg-gray-700"
              >
                <td className="border border-gray-300 dark:border-gray-600 px-4 py-2 capitalize">
                  {t.type}
                </td>
                <td className="border border-gray-300 dark:border-gray-600 px-4 py-2">
                  {t.amount}
                </td>
                <td className="border border-gray-300 dark:border-gray-600 px-4 py-2 capitalize">
                  {t.method}
                </td>
                <td
                  className={`border border-gray-300 dark:border-gray-600 px-4 py-2 capitalize ${
                    t.status === "approved"
                      ? "text-green-600 dark:text-green-400"
                      : t.status === "pending"
                      ? "text-yellow-600 dark:text-yellow-400"
                      : "text-red-600 dark:text-red-400"
                  }`}
                >
                  {t.status}
                </td>
                <td className="border border-gray-300 dark:border-gray-600 px-4 py-2">
                  {new Date(t.createdAt).toLocaleString()}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
};

export default TransactionHistory;
