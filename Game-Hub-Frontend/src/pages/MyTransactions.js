import React, { useEffect, useState } from "react";
import axios from "../api/axiosInstance";
import SkeletonCard from "../components/common/SkeletonCard";
import { FaThList, FaArrowDown, FaArrowUp, FaHistory } from "react-icons/fa";

const FILTERS = [
  { key: "all", label: "All", icon: <FaThList size={18} /> },
  { key: "deposit", label: "Deposits", icon: <FaArrowDown size={18} /> },
  { key: "withdraw", label: "Withdrawals", icon: <FaArrowUp size={18} /> },
  { key: "history", label: "Trade History", icon: <FaHistory size={18} /> },
];

const FilterTabs = ({ filterType, setFilterType }) => {
  const [underlineStyle, setUnderlineStyle] = useState({});
  const tabRefs = React.useRef({});

  useEffect(() => {
    const activeTab = tabRefs.current[filterType];
    if (activeTab) {
      setUnderlineStyle({
        left: activeTab.offsetLeft,
        width: activeTab.clientWidth,
      });
    }
  }, [filterType]);

  return (
    <div className="relative border-b border-gray-300 dark:border-gray-700 mb-6 select-none overflow-x-auto scrollbar-thin scrollbar-thumb-gray-400 scrollbar-track-gray-200 dark:scrollbar-thumb-gray-600 dark:scrollbar-track-gray-800">
      <div className="flex min-w-max gap-1 md:gap-3">
        {FILTERS.map(({ key, label, icon }) => (
          <button
            key={key}
            ref={(el) => (tabRefs.current[key] = el)}
            onClick={() => setFilterType(key)}
            className={`flex items-center gap-1 md:gap-2 whitespace-nowrap
              py-3 px-4 md:px-6 text-sm md:text-base font-semibold
              transition-colors duration-300 focus:outline-none
              ${
                filterType === key
                  ? "text-blue-600 dark:text-blue-400"
                  : "text-gray-600 hover:text-blue-600 dark:text-gray-400 dark:hover:text-blue-400"
              }`}
            style={{ minWidth: 80 }}
            aria-pressed={filterType === key}
            type="button"
          >
            {icon}
            <span>{label}</span>
          </button>
        ))}
      </div>

      {/* Underline */}
      <span
        className="absolute bottom-0 h-1 bg-blue-600 dark:bg-blue-400 rounded transition-all duration-300"
        style={{
          left: underlineStyle.left || 0,
          width: underlineStyle.width || 0,
        }}
      />
    </div>
  );
};

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
    const base = "px-3 py-1 rounded w-fit text-sm font-semibold text-white";
    if (status === "approved")
      return (
        <span className={`${base} bg-green-700 dark:bg-green-600`}>
          Approved
        </span>
      );
    if (status === "rejected")
      return (
        <span className={`${base} bg-red-700 dark:bg-red-600`}>Rejected</span>
      );
    if (status === "pending")
      return (
        <span className="px-3 py-1 rounded w-fit text-sm font-semibold bg-yellow-400 text-black dark:bg-yellow-500 dark:text-black">
          Pending
        </span>
      );
    return null;
  };

  const renderTradeStatus = (status) => {
    const base = "font-semibold inline-flex items-center gap-1";
    if (status === "completed")
      return (
        <span className={`${base} text-green-600 dark:text-green-400`}>
          ✅ Completed
        </span>
      );
    if (status === "cancelled")
      return (
        <span className={`${base} text-red-600 dark:text-red-400`}>
          ❌ Cancelled
        </span>
      );
    return status;
  };

  const filtered = () => {
    if (filterType === "history") return tradeHistory;
    if (filterType === "all") {
      const combined = [...transactions, ...tradeHistory];
      return combined.sort(
        (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
      );
    }
    return transactions.filter((tx) => tx.type === filterType);
  };

  const SKELETON_COUNT = 6;

  if (loading) {
    return (
      <div className="p-4 max-w-5xl mx-auto bg-white text-gray-900 dark:bg-gray-900 dark:text-white rounded-md shadow-md">
        <h2 className="text-2xl font-bold mb-4">My Transactions</h2>

        <FilterTabs filterType={filterType} setFilterType={setFilterType} />

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
    <div className="p-4 max-w-5xl mx-auto bg-white text-gray-900 dark:bg-gray-900 dark:text-white rounded-md shadow-md">
      <h2 className="text-2xl font-bold mb-4">My Transactions</h2>

      <FilterTabs filterType={filterType} setFilterType={setFilterType} />

      {list.length === 0 ? (
        <div className="text-center text-gray-500 dark:text-gray-400 text-lg mt-10">
          <div className="text-4xl animate-bounce mb-2">📭</div>
          No {filterType === "history" ? "trade history" : "transactions"}{" "}
          found.
        </div>
      ) : (
        <div className="grid gap-4">
          {list.map((item) => (
            <div
              key={item._id}
              className="bg-gray-100 text-gray-900 rounded shadow-md p-4 dark:bg-gray-800 dark:text-white"
            >
              {"description" in item ? (
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
                    {new Date(
                      item.updatedAt || item.createdAt
                    ).toLocaleString()}
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
                      <p className="text-sm text-yellow-600 dark:text-yellow-400 mt-1 max-w-xs">
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
