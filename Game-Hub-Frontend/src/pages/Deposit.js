import React, { useState } from "react";
import axios from "../api/axiosInstance";
import { FaCopy, FaChevronDown, FaChevronUp } from "react-icons/fa";

const Deposit = () => {
  const [amount, setAmount] = useState("");
  const [method, setMethod] = useState("paypal");
  const [iban, setIban] = useState("");
  const [accountNumber, setAccountNumber] = useState("");
  const [screenshot, setScreenshot] = useState(""); // base64 string
  const [status, setStatus] = useState("");
  const [loading, setLoading] = useState(false);
  const [showBankDetails, setShowBankDetails] = useState(false);

  const bankDetails = {
    yourIban: "EG760037011308181130815055352",
    yourAccountNumber: "1130815055352",
    yourSwiftCode: "QNBAEGCXXXX",
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text).then(
      () => alert("Copied to clipboard!"),
      (err) => console.error("Failed to copy: ", err)
    );
  };

  const isValidIban = (iban) => /^[A-Z0-9]{15,34}$/.test(iban);
  const isValidAccountNumber = (acc) => /^[0-9]{6,20}$/.test(acc);

  const isBankInvalid =
    method === "bank" &&
    (!iban ||
      !accountNumber ||
      !isValidIban(iban) ||
      !isValidAccountNumber(accountNumber));

  const isScreenshotMissing = !screenshot;

  const handleScreenshotUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onloadend = () => {
      setScreenshot(reader.result.toString()); // base64 string
    };
    reader.readAsDataURL(file);
  };

  const handleDeposit = async () => {
    setStatus("");

    if (!amount || Number(amount) <= 0) {
      setStatus("Please enter a valid amount.");
      return;
    }

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

    if (!screenshot) {
      setStatus("Please upload a screenshot of your transaction.");
      return;
    }

    try {
      setLoading(true);

      const payload = {
        amount: Number(amount),
        screenshot, // base64 screenshot
      };

      if (method === "paypal") {
        payload.method = "paypal"; // optional, backend already knows
        const res = await axios.post("/transactions/deposit/paypal", payload, {
          headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
        });

        setStatus("✅ PayPal deposit recorded.");
        setAmount("");
        setScreenshot("");

        if (res.data.approvalUrl) {
          window.location.href = res.data.approvalUrl;
        }
      } else {
        // Bank deposit
        payload.method = "bank";
        payload.iban = iban;
        payload.accountNumber = accountNumber;

        await axios.post("/transactions/deposit", payload, {
          headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
        });

        setStatus("✅ Bank deposit recorded. Please send the money manually.");
        setAmount("");
        setIban("");
        setAccountNumber("");
        setScreenshot("");
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

      {/* Collapsible Bank Details */}
      {method === "bank" && (
        <div className="mb-4">
          <button
            className="w-full flex justify-between items-center bg-gray-800 p-2 rounded"
            onClick={() => setShowBankDetails(!showBankDetails)}
          >
            <span className="text-gray-300 font-semibold">
              Our Bank Details
            </span>
            {showBankDetails ? <FaChevronUp /> : <FaChevronDown />}
          </button>

          {showBankDetails && (
            <div className="bg-gray-700 p-3 mt-2 rounded space-y-2">
              {["IBAN", "Account Number", "SWIFT/BIC"].map((label, idx) => (
                <div key={idx} className="flex justify-between items-center">
                  <p className="text-gray-400">{label}:</p>
                  <button
                    onClick={() =>
                      copyToClipboard(
                        label === "IBAN"
                          ? bankDetails.yourIban
                          : label === "Account Number"
                          ? bankDetails.yourAccountNumber
                          : bankDetails.yourSwiftCode
                      )
                    }
                    className="text-blue-400 hover:text-blue-300"
                  >
                    <FaCopy />
                  </button>
                </div>
              ))}
              <p className="text-white font-mono">{bankDetails.yourIban}</p>
              <p className="text-white font-mono">
                {bankDetails.yourAccountNumber}
              </p>
              <p className="text-white font-mono">
                {bankDetails.yourSwiftCode}
              </p>
            </div>
          )}
        </div>
      )}

      {/* User input for bank info */}
      {method === "bank" && (
        <>
          <input
            type="text"
            value={iban}
            onChange={(e) => setIban(e.target.value)}
            className={`w-full p-2 mb-1 rounded bg-gray-800 border ${
              iban && !isValidIban(iban) ? "border-red-500" : "border-gray-700"
            } text-white placeholder-gray-400`}
            placeholder="Your IBAN"
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
                ? "border-red-500"
                : "border-gray-700"
            } text-white placeholder-gray-400`}
            placeholder="Your Account Number"
          />
          {accountNumber && !isValidAccountNumber(accountNumber) && (
            <p className="text-red-400 text-sm mb-2">
              Invalid account number format
            </p>
          )}
        </>
      )}

      {/* Screenshot upload */}
      {/* Screenshot upload */}
      <div className="mb-4">
        <label className="block mb-1 text-gray-300">Upload Screenshot:</label>
        <input
          type="file"
          accept="image/*"
          onChange={handleScreenshotUpload}
          className="w-full text-white"
        />

        {/* Preview */}
        {screenshot && (
          <div className="relative mt-2">
            <img
              src={screenshot}
              alt="Screenshot Preview"
              className="w-full h-auto rounded-md border border-gray-700"
            />
            <button
              type="button"
              onClick={() => setScreenshot("")}
              className="absolute top-1 right-1 bg-red-600 text-white rounded-full p-1 hover:bg-red-700"
            >
              ✕
            </button>
          </div>
        )}
      </div>

      <button
        onClick={handleDeposit}
        disabled={
          !amount ||
          Number(amount) <= 0 ||
          loading ||
          isBankInvalid ||
          isScreenshotMissing
        }
        className="bg-blue-600 px-4 py-2 rounded hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-white"
      >
        {loading ? "Processing..." : "Deposit"}
      </button>

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
