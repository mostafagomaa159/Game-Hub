import React, { useState } from "react";
import axios from "../api/axiosInstance";
import {
  ArrowPathIcon,
  BanknotesIcon,
  CreditCardIcon,
  EnvelopeIcon,
  IdentificationIcon,
} from "@heroicons/react/24/outline";

const Withdraw = () => {
  const [amount, setAmount] = useState("");
  const [method, setMethod] = useState("paypal");
  const [paypalEmail, setPaypalEmail] = useState("");
  const [iban, setIban] = useState("");
  const [accountNumber, setAccountNumber] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  const handleWithdraw = async (e) => {
    e.preventDefault();
    setMessage("");

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
      setMessage(
        res.data.message ||
          "Withdrawal request submitted. Waiting for admin approval."
      );
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
    <div className="max-w-md mx-auto bg-white dark:bg-gray-800 rounded-xl shadow-md overflow-hidden border border-gray-200 dark:border-gray-700">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-700 dark:from-blue-700 dark:to-blue-800 p-6">
        <h2 className="text-xl font-bold text-white text-center">
          Request Withdrawal
        </h2>
      </div>

      {/* Form */}
      <form onSubmit={handleWithdraw} className="p-6 space-y-4">
        {/* Amount */}
        <div className="space-y-1">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
            Amount (Minimum 10 coins)
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <BanknotesIcon className="h-5 w-5 text-gray-400 dark:text-gray-500" />
            </div>
            <input
              type="number"
              placeholder="Enter amount"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="block w-full pl-10 pr-3 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
              min="10"
              required
            />
          </div>
        </div>

        {/* Method */}
        <div className="space-y-1">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
            Withdrawal Method
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <CreditCardIcon className="h-5 w-5 text-gray-400 dark:text-gray-500" />
            </div>
            <select
              value={method}
              onChange={(e) => setMethod(e.target.value)}
              className="block w-full pl-10 pr-3 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition appearance-none"
            >
              <option value="paypal">PayPal</option>
              <option value="bank">Bank Transfer</option>
            </select>
          </div>
        </div>

        {/* PayPal Email */}
        {method === "paypal" && (
          <div className="space-y-1">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              PayPal Email
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <EnvelopeIcon className="h-5 w-5 text-gray-400 dark:text-gray-500" />
              </div>
              <input
                type="email"
                placeholder="your@paypal.com"
                value={paypalEmail}
                onChange={(e) => setPaypalEmail(e.target.value)}
                className="block w-full pl-10 pr-3 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                required
              />
            </div>
          </div>
        )}

        {/* Bank Details */}
        {method === "bank" && (
          <>
            <div className="space-y-1">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                IBAN
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <IdentificationIcon className="h-5 w-5 text-gray-400 dark:text-gray-500" />
                </div>
                <input
                  type="text"
                  placeholder="IBAN"
                  value={iban}
                  onChange={(e) => setIban(e.target.value)}
                  className="block w-full pl-10 pr-3 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                  required
                />
              </div>
            </div>
            <div className="space-y-1">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Account Number
              </label>
              <input
                type="text"
                placeholder="Account Number"
                value={accountNumber}
                onChange={(e) => setAccountNumber(e.target.value)}
                className="block w-full px-3 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                required
              />
            </div>
          </>
        )}

        {/* Submit Button */}
        <button
          type="submit"
          disabled={loading}
          className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-lg bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-medium shadow-md hover:shadow-lg transition-all duration-200 disabled:opacity-70 disabled:cursor-not-allowed"
        >
          {loading ? (
            <>
              <ArrowPathIcon className="w-5 h-5 animate-spin" />
              Processing...
            </>
          ) : (
            "Request Withdrawal"
          )}
        </button>

        {/* Note */}
        <p className="text-sm text-yellow-600 dark:text-yellow-400 mt-2">
          Note: Make sure to enter valid information. Transaction fees may
          apply.
        </p>

        {/* Message */}
        {message && (
          <div
            className={`mt-4 p-3 rounded-lg text-sm ${
              message.includes("Failed") || message.includes("Minimum")
                ? "bg-red-50 dark:bg-red-900/30 text-red-700 dark:text-red-300 border-l-4 border-red-500"
                : "bg-green-50 dark:bg-green-900/30 text-green-700 dark:text-green-300 border-l-4 border-green-500"
            }`}
          >
            {message}
          </div>
        )}
      </form>
    </div>
  );
};

export default Withdraw;
