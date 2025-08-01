import React from "react";

const TransactionCard = ({ tx, onAction }) => {
  return (
    <div className="bg-zinc-900 text-white p-4 rounded-lg shadow-md space-y-2 border border-zinc-700">
      <div>
        <strong>User ID:</strong> {tx.userId}
      </div>
      <div>
        <strong>Amount:</strong> {tx.amount} coins
      </div>
      <div>
        <strong>Method:</strong> {tx.method}
      </div>
      <div>
        <strong>Status:</strong> {tx.status}
      </div>
      {tx.fraudFlag && <div className="text-red-500">⚠️ Possible Fraud</div>}
      <div>
        <button
          className="bg-green-600 hover:bg-green-700 px-3 py-1 rounded mr-2"
          onClick={() => onAction(tx._id, "approved")}
          disabled={tx.status !== "pending"}
        >
          Approve
        </button>
        <button
          className="bg-red-600 hover:bg-red-700 px-3 py-1 rounded"
          onClick={() => onAction(tx._id, "rejected")}
          disabled={tx.status !== "pending"}
        >
          Reject
        </button>
      </div>
    </div>
  );
};

export default TransactionCard;
