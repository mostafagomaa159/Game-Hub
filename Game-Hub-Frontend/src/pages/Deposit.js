import React, { useState } from "react";
import axios from "../api/axiosInstance";
import { FaCopy } from "react-icons/fa";
const Deposit = () => {
  const [amount, setAmount] = useState("");
  const [method, setMethod] = useState("paypal");
  const [iban, setIban] = useState("");
  const [accountNumber, setAccountNumber] = useState("");
  const [status, setStatus] = useState("");
  const [loading, setLoading] = useState(false);
  const [showBankDetails, setShowBankDetails] = useState(false);

  // Your bank details (replace with your actual information)
  const bankDetails = {
    yourIban: "EG760037011308181130815055352",
    yourAccountNumber: "1130815055352",
    yourSwiftCode: "QNBAEGCXXXX",
  };
  const copyToClipboard = (text) => {
    navigator.clipboard
      .writeText(text)
      .then(() => {
        // You can add a temporary notification here if you want
        alert("Copied to clipboard!");
      })
      .catch((err) => {
        console.error("Failed to copy: ", err);
      });
  };
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
        // Show bank details popup before processing
        setShowBankDetails(true);

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
    <div className="max-w-md mx-auto p-6 bg-gray-900 text-white rounded-xl shadow-xl mt-10 relative">
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
        Note: Please make sure to pay all Bank Fees , Paypal Fees & transactions
        Fees, If u enter 100 coins and we recieve only 99euros, you will get
        only 99 coins.
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

      {/* Bank Details Popup */}
      {showBankDetails && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-gray-800 p-6 rounded-lg max-w-md w-full mx-4">
            <h3 className="text-xl font-semibold mb-4">
              Bank Transfer Details
            </h3>
            <div className="space-y-3">
              <div>
                <div className="flex justify-between items-center">
                  <p className="text-gray-400">IBAN:</p>
                  <button
                    onClick={() => copyToClipboard(bankDetails.yourIban)}
                    className="text-blue-400 hover:text-blue-300"
                    title="Copy to clipboard"
                  >
                    <FaCopy />
                  </button>
                </div>
                <p className="text-white font-mono">{bankDetails.yourIban}</p>
              </div>
              <div>
                <div className="flex justify-between items-center">
                  <p className="text-gray-400">Account Number:</p>
                  <button
                    onClick={() =>
                      copyToClipboard(bankDetails.yourAccountNumber)
                    }
                    className="text-blue-400 hover:text-blue-300"
                    title="Copy to clipboard"
                  >
                    <FaCopy />
                  </button>
                </div>
                <p className="text-white font-mono">
                  {bankDetails.yourAccountNumber}
                </p>
              </div>
              <div>
                <div className="flex justify-between items-center">
                  <p className="text-gray-400">SWIFT/BIC Code:</p>
                  <button
                    onClick={() => copyToClipboard(bankDetails.yourSwiftCode)}
                    className="text-blue-400 hover:text-blue-300"
                    title="Copy to clipboard"
                  >
                    <FaCopy />
                  </button>
                </div>
                <p className="text-white font-mono">
                  {bankDetails.yourSwiftCode}
                </p>
              </div>
              <div className="mt-4">
                <p className="text-yellow-400 text-sm">
                  Please make sure to pay all Bank Fees & transactions Fees, If
                  u enter 100 coins and we recieve only 99euros, you will get
                  only 99 coins.
                </p>
              </div>
            </div>
            <button
              onClick={() => setShowBankDetails(false)}
              className="mt-6 bg-blue-600 px-4 py-2 rounded hover:bg-blue-700 text-white w-full"
            >
              I've noted these details
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Deposit;
