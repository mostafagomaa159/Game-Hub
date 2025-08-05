// Full updated AdminDashboard.js with PayPal Batch ID display and fraud highlighting
import React, { useEffect, useState } from "react";
import axios from "../api/axiosInstance";
import { CheckCircle, XCircle } from "lucide-react";
import { useNavigate } from "react-router-dom";

const ITEMS_PER_PAGE = 5;

const AdminDashboard = () => {
  const [transactions, setTransactions] = useState([]);
  const [processedTransactions, setProcessedTransactions] = useState([]);
  const [tradeHistory, setTradeHistory] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [activeTab, setActiveTab] = useState("deposits");
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [sortBy, setSortBy] = useState("date");
  const [sortOrder, setSortOrder] = useState("desc");
  const [pendingCounts, setPendingCounts] = useState({
    deposits: 0,
    withdrawals: 0,
  });
  const [showCancelled, setShowCancelled] = useState(false);

  const navigate = useNavigate();

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const token = localStorage.getItem("token");
        const headers = { Authorization: `Bearer ${token}` };

        const userRes = await axios.get("/users/me", { headers });
        if (!userRes.data.isAdmin) {
          alert("Unauthorized access.");
          return navigate("/");
        }
        const [
          pendingDepositsRes,
          pendingWithdrawalsRes,
          processedRes,
          tradeHistoryRes,
        ] = await Promise.all([
          axios.get("/transactions/pending-deposits", { headers }),
          axios.get("/transactions/pending-withdrawals", { headers }),
          axios.get("/transactions/processed", { headers }),
          axios.get("/admin/trade-history", { headers }),
        ]);

        setPendingCounts({
          deposits: pendingDepositsRes.data.length,
          withdrawals: pendingWithdrawalsRes.data.length,
        });

        if (activeTab === "deposits") {
          setTransactions(pendingDepositsRes.data);
        } else if (activeTab === "withdrawals") {
          setTransactions(pendingWithdrawalsRes.data);
        }

        setProcessedTransactions(processedRes.data);
        setTradeHistory(tradeHistoryRes.data);
      } catch (err) {
        console.error("Admin fetch failed", err);
        alert("Error loading dashboard.");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [activeTab, navigate]);

  const handleAction = async (id, action, type) => {
    setProcessingId(id);
    try {
      const token = localStorage.getItem("token");

      const url =
        type === "deposit"
          ? `/transactions/${id}/approve-deposit`
          : `/transactions/${id}/approve`;

      await axios.patch(
        url,
        {
          status: action === "approve" ? "approved" : "rejected",
          adminNote: `Marked as ${action} by admin`,
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setTransactions((prev) => prev.filter((tx) => tx._id !== id));
      alert(`Transaction ${action}`);
    } catch (err) {
      console.error("Action failed", err);
      alert("Action failed");
    } finally {
      setProcessingId(null);
    }
  };

  const updateNote = async (id, note) => {
    try {
      const token = localStorage.getItem("token");
      await axios.patch(
        `/transactions/${id}/note`,
        { note },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setProcessedTransactions((prev) =>
        prev.map((tx) => (tx._id === id ? { ...tx, adminNote: note } : tx))
      );
    } catch (err) {
      console.error("Failed to update note", err);
      alert("Failed to update note");
    }
  };

  const filtered = (list) =>
    list
      .filter((item) => {
        if (activeTab === "history") {
          if (!showCancelled && item.tradeStatus !== "completed") return false;
          if (
            showCancelled &&
            !["completed", "cancelled"].includes(item.tradeStatus)
          )
            return false;
        }

        const owner = item.owner?.name || item.userId?.name || "";
        const buyer = item.buyer?.name || "";
        const email = item.owner?.email || item.userId?.email || "";
        return (
          owner.toLowerCase().includes(searchTerm.toLowerCase()) ||
          buyer.toLowerCase().includes(searchTerm.toLowerCase()) ||
          email.toLowerCase().includes(searchTerm.toLowerCase())
        );
      })
      .sort((a, b) => {
        const aVal =
          sortBy === "amount" || sortBy === "price"
            ? a.amount || a.price
            : new Date(a.createdAt || a.updatedAt);
        const bVal =
          sortBy === "amount" || sortBy === "price"
            ? b.amount || b.price
            : new Date(b.createdAt || b.updatedAt);
        return sortOrder === "asc" ? aVal - bVal : bVal - aVal;
      });

  const paginate = (list) => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    return list.slice(start, start + ITEMS_PER_PAGE);
  };

  const exportToCSV = () => {
    const rows = [
      ["Owner", "Buyer", "Price", "Status", "Server", "Availability", "Date"],
      ...filtered(tradeHistory).map((tx) => [
        tx.owner?.name || "",
        tx.buyer?.name || "",
        tx.price,
        tx.tradeStatus,
        tx.server || "",
        tx.avaliable ? "Yes" : "No",
        new Date(tx.updatedAt).toLocaleString(),
      ]),
    ];
    const csv = rows.map((row) => row.join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = "trade_history.csv";
    a.click();
  };

  const activeList =
    activeTab === "processed"
      ? processedTransactions
      : activeTab === "history"
      ? tradeHistory
      : transactions;

  const list = filtered(activeList);
  const paginated = paginate(list);
  const totalPages = Math.ceil(list.length / ITEMS_PER_PAGE);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen bg-black">
        <div className="animate-spin rounded-full h-16 w-16 border-4 border-blue-500 border-t-transparent"></div>
      </div>
    );
  }

  return (
    <div className="p-4 text-white">
      <h1 className="text-2xl font-bold mb-4">Admin Dashboard</h1>

      <div className="flex gap-2 mb-4 flex-wrap">
        {["deposits", "withdrawals", "processed", "history"].map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-2 rounded ${
              activeTab === tab ? "bg-blue-600" : "bg-gray-700 text-gray-300"
            }`}
          >
            {tab === "deposits" &&
              `Pending Deposits (${pendingCounts.deposits})`}
            {tab === "withdrawals" &&
              `Pending Withdrawals (${pendingCounts.withdrawals})`}
            {tab === "processed" &&
              `Processed (${processedTransactions.length})`}
            {tab === "history" && "Trade History"}
          </button>
        ))}

        {activeTab === "history" && (
          <>
            <button
              onClick={exportToCSV}
              className="ml-auto px-4 py-2 rounded bg-green-600"
            >
              Export CSV
            </button>
            <label className="ml-4 flex items-center gap-2">
              <input
                type="checkbox"
                checked={showCancelled}
                onChange={(e) => setShowCancelled(e.target.checked)}
              />
              Show Cancelled
            </label>
          </>
        )}
      </div>

      <div className="flex gap-4 mb-4">
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => {
            setSearchTerm(e.target.value);
            setCurrentPage(1);
          }}
          placeholder="Search by name/email"
          className="p-2 rounded w-full bg-gray-900 border border-gray-600"
        />
        <select
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value)}
          className="p-2 rounded bg-gray-900 border border-gray-600"
        >
          <option value="date">Sort by Date</option>
          <option value="amount">Sort by Amount</option>
          <option value="price">Sort by Price</option>
        </select>
        <select
          value={sortOrder}
          onChange={(e) => setSortOrder(e.target.value)}
          className="p-2 rounded bg-gray-900 border border-gray-600"
        >
          <option value="desc">Desc</option>
          <option value="asc">Asc</option>
        </select>
      </div>

      {paginated.length === 0 ? (
        <p className="text-gray-400">No results.</p>
      ) : (
        paginated.map((item) => (
          <div
            key={item._id}
            className={`p-4 rounded-lg shadow-md mb-4 ${
              item.fraudFlag &&
              (activeTab === "withdrawals" || activeTab === "processed")
                ? "bg-red-900 border border-red-500"
                : "bg-gray-800"
            }`}
          >
            {activeTab === "history" ? (
              <>
                <p>
                  <strong>Seller Name:</strong> {item.owner?.name}
                </p>
                <p>
                  <strong>Buyer Name:</strong> {item.buyer?.name || "N/A"}
                </p>
                <p>
                  <strong>💰:</strong> {item.price}
                </p>
                <p className="flex items-center gap-2">
                  <strong>Status:</strong>
                  {item.tradeStatus === "completed" ? (
                    <span className="text-green-500 flex items-center gap-1">
                      <CheckCircle size={16} /> Completed
                    </span>
                  ) : item.tradeStatus === "cancelled" ? (
                    <span className="text-red-500 flex items-center gap-1">
                      <XCircle size={16} /> Cancelled
                    </span>
                  ) : (
                    <span className="text-gray-400">Unknown</span>
                  )}
                </p>
                <p>
                  <strong>Server:</strong> {item.server || "N/A"}
                </p>
                <p>
                  <strong>Date:</strong>{" "}
                  {new Date(item.updatedAt).toLocaleString()}
                </p>
              </>
            ) : (
              <>
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
                {item.type === "withdraw" &&
                  item.method === "paypal" &&
                  item.payoutBatchId && (
                    <p>
                      <strong>PayPal Batch ID:</strong> {item.payoutBatchId}
                    </p>
                  )}
                {item.fraudFlag && (
                  <p className="text-red-400 font-semibold">
                    ⚠️ Marked as Potential Fraud
                  </p>
                )}
                {activeTab !== "processed" && (
                  <div className="mt-2 flex gap-2">
                    <button
                      onClick={() =>
                        handleAction(item._id, "approve", item.type)
                      }
                      disabled={processingId === item._id}
                      className="bg-green-600 px-4 py-2 rounded"
                    >
                      {processingId === item._id ? "..." : "Approve"}
                    </button>
                    <button
                      onClick={() =>
                        handleAction(item._id, "reject", item.type)
                      }
                      disabled={processingId === item._id}
                      className="bg-red-600 px-4 py-2 rounded"
                    >
                      {processingId === item._id ? "..." : "Reject"}
                    </button>
                  </div>
                )}
                {activeTab === "processed" && (
                  <div className="mt-3">
                    <label className="text-sm">Admin Note:</label>
                    <textarea
                      defaultValue={item.adminNote || ""}
                      onBlur={(e) => updateNote(item._id, e.target.value)}
                      className="w-full mt-1 p-2 rounded bg-gray-900 border border-gray-600"
                    />
                  </div>
                )}
              </>
            )}
          </div>
        ))
      )}

      {totalPages > 1 && (
        <div className="flex justify-center mt-4 gap-2">
          {Array.from({ length: totalPages }, (_, i) => i + 1).map((pg) => (
            <button
              key={pg}
              onClick={() => setCurrentPage(pg)}
              className={`px-3 py-1 rounded ${
                currentPage === pg
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

export default AdminDashboard;
