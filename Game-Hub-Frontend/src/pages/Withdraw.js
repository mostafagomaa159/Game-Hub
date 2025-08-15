import React, { useState } from "react";
import axios from "../api/axiosInstance";

const Withdraw = () => {
  const [amount, setAmount] = useState("");
  const [method, setMethod] = useState("paypal"); // default method
  const [paypalEmail, setPaypalEmail] = useState("");
  const [iban, setIban] = useState("");
  const [accountNumber, setAccountNumber] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  const handleWithdraw = async (e) => {
    e.preventDefault();
    setMessage("");

    // ✅ Minimum amount check
    if (!amount || Number(amount) < 10) {
      setMessage("Minimum withdrawal amount is 10 coins.");
      return;
    }

    setLoading(true);

    try {
      const payload = {
        amount: Number(amount),
        method,
      };

      if (method === "paypal") {
        payload.paypalEmail = paypalEmail;
      } else if (method === "bank") {
        payload.iban = iban;
        payload.accountNumber = accountNumber;
      }

      const res = await axios.post("/transactions/withdraw", payload);

      setMessage(res.data.message || "Withdrawal request sent!");
      setAmount("");
      setPaypalEmail("");
      setIban("");
      setAccountNumber("");
    } catch (err) {
      setMessage(err.response?.data?.error || "Failed to request withdrawal.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto p-6 bg-white dark:bg-gray-800 rounded-2xl shadow-xl">
      <h2 className="text-xl font-semibold mb-4 text-center text-gray-800 dark:text-white">
        Request Withdrawal
      </h2>
      <form onSubmit={handleWithdraw} className="space-y-4">
        <input
          type="number"
          placeholder="Amount to withdraw"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          className="w-full p-3 rounded-md border dark:border-gray-600 dark:bg-gray-900 dark:text-white"
          min="10"
          required
        />

        <select
          value={method}
          onChange={(e) => setMethod(e.target.value)}
          className="w-full p-3 rounded-md border dark:border-gray-600 dark:bg-gray-900 dark:text-white"
        >
          <option value="paypal">PayPal</option>
          <option value="bank">Bank</option>
        </select>

        {method === "paypal" && (
          <input
            type="email"
            placeholder="Your PayPal Email"
            value={paypalEmail}
            onChange={(e) => setPaypalEmail(e.target.value)}
            className="w-full p-3 rounded-md border dark:border-gray-600 dark:bg-gray-900 dark:text-white"
            required
          />
        )}

        {method === "bank" && (
          <>
            <input
              type="text"
              placeholder="IBAN"
              value={iban}
              onChange={(e) => setIban(e.target.value)}
              className="w-full p-3 rounded-md border dark:border-gray-600 dark:bg-gray-900 dark:text-white"
              required
            />
            <input
              type="text"
              placeholder="Account Number"
              value={accountNumber}
              onChange={(e) => setAccountNumber(e.target.value)}
              className="w-full p-3 rounded-md border dark:border-gray-600 dark:bg-gray-900 dark:text-white"
              required
            />
          </>
        )}

        <button
          type="submit"
          disabled={loading}
          className="w-full py-2 bg-yellow-500 hover:bg-yellow-600 text-white rounded-xl"
        >
          {loading ? "Requesting..." : "Request Withdrawal"}
        </button>
      </form>
      {message && (
        <p className="mt-4 text-center text-sm text-red-600 dark:text-red-400">
          {message}
        </p>
      )}
    </div>
  );
};

export default Withdraw;
