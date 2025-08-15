import React, { useState } from "react";
import axios from "../api/axiosInstance";

const Deposit = () => {
  const [amount, setAmount] = useState("");
  const [method, setMethod] = useState("paypal");
  const [iban, setIban] = useState("");
  const [accountNumber, setAccountNumber] = useState("");
  const [status, setStatus] = useState("");
  const [loading, setLoading] = useState(false);

  const isValidIban = (iban) => /^[A-Z0-9]{15,34}$/.test(iban);
  const isValidAccountNumber = (acc) => /^[0-9]{6,20}$/.test(acc);

  const isBankInvalid =
    method === "bank" &&
    (!iban ||
      !accountNumber ||
      !isValidIban(iban) ||
      !isValidAccountNumber(accountNumber));

  const handleDeposit = async () => {
    setStatus("");

    if (!amount || Number(amount) <= 0) {
      setStatus("Please enter a valid amount.");
      return;
    }

    // ✅ Minimum deposit check
    if (Number(amount) < 10) {
      setStatus("Minimum deposit is 10 coins.");
      return;
    }

    if (isBankInvalid) {
      if (!iban && !accountNumber) {
        setStatus("IBAN and Account Number are required.");
      } else if (!isValidIban(iban) && !isValidAccountNumber(accountNumber)) {
        setStatus("Please enter a valid IBAN and account number.");
      } else if (!isValidIban(iban)) {
        setStatus("Please enter a valid IBAN.");
      } else if (!isValidAccountNumber(accountNumber)) {
        setStatus("Please enter a valid account number.");
      }
      return;
    }

    try {
      setLoading(true);

      if (method === "paypal") {
        const res = await axios.post(
          "/transactions/deposit/paypal",
          { amount: Number(amount) },
          {
            headers: {
              Authorization: `Bearer ${localStorage.getItem("token")}`,
            },
          }
        );
        window.location.href = res.data.approvalUrl;
      } else {
        await axios.post(
          "/transactions/deposit",
          {
            amount: Number(amount),
            method,
            iban,
            accountNumber,
          },
          {
            headers: {
              Authorization: `Bearer ${localStorage.getItem("token")}`,
            },
          }
        );

        setStatus("✅ Bank deposit recorded. Please send the money manually.");
        setAmount("");
        setIban("");
        setAccountNumber("");
      }
    } catch (err) {
      const msg = err.response?.data?.error || "Failed to process deposit.";
      const details = err.response?.data?.details || {};
      const ibanError = details?.iban?.message;
      const accError = details?.accountNumber?.message;

      if (ibanError && accError) {
        setStatus("Please enter a valid IBAN and account number.");
      } else if (ibanError) {
        setStatus("Please enter a valid IBAN.");
      } else if (accError) {
        setStatus("Please enter a valid account number.");
      } else {
        setStatus("❌ " + msg);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto p-6 bg-gray-900 text-white rounded-xl shadow-xl mt-10">
      <h2 className="text-xl font-semibold mb-4">Deposit Coins</h2>

      <input
        type="number"
        value={amount}
        onChange={(e) => setAmount(e.target.value)}
        className="w-full p-2 mb-4 rounded bg-gray-800 border border-gray-700 text-white placeholder-gray-400"
        placeholder="Enter amount"
        min="10"
      />

      <label className="block mb-1 text-gray-300">Select Payment Method:</label>
      <select
        value={method}
        onChange={(e) => setMethod(e.target.value)}
        className="w-full p-2 mb-4 rounded bg-gray-800 border border-gray-700 text-white"
      >
        <option value="paypal">PayPal</option>
        <option value="bank">Bank Transfer</option>
      </select>

      {method === "bank" && (
        <>
          <input
            type="text"
            value={iban}
            onChange={(e) => setIban(e.target.value)}
            className={`w-full p-2 mb-1 rounded bg-gray-800 border ${
              iban && !isValidIban(iban)
                ? "border-red-500 focus:outline-red-500"
                : "border-gray-700"
            } text-white placeholder-gray-400`}
            placeholder="IBAN"
          />
          {iban && !isValidIban(iban) && (
            <p className="text-red-400 text-sm mb-2">Invalid IBAN format</p>
          )}

          <input
            type="text"
            value={accountNumber}
            onChange={(e) => setAccountNumber(e.target.value)}
            className={`w-full p-2 mb-1 rounded bg-gray-800 border ${
              accountNumber && !isValidAccountNumber(accountNumber)
                ? "border-red-500 focus:outline-red-500"
                : "border-gray-700"
            } text-white placeholder-gray-400`}
            placeholder="Account Number"
          />
          {accountNumber && !isValidAccountNumber(accountNumber) && (
            <p className="text-red-400 text-sm mb-2">
              Invalid account number format
            </p>
          )}
        </>
      )}

      <button
        onClick={handleDeposit}
        disabled={!amount || Number(amount) <= 0 || loading || isBankInvalid}
        className="bg-blue-600 px-4 py-2 rounded hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-white"
      >
        {loading ? "Processing..." : "Deposit"}
      </button>
      <p className="text-yellow-400 text-sm mt-3">
        Note: Coins will be added once your payment is reviewed and approved by
        an admin.
      </p>

      {status && (
        <p
          className={`mt-4 ${
            status.startsWith("✅")
              ? "text-green-400"
              : status.startsWith("❌")
              ? "text-red-500"
              : "text-red-400"
          }`}
        >
          {status}
        </p>
      )}
    </div>
  );
};

export default Deposit;
