import React, { useState } from "react";
import axios from "../api/axiosInstance";
import {
  ArrowPathIcon,
  BanknotesIcon,
  CreditCardIcon,
  IdentificationIcon,
  DocumentTextIcon,
  XMarkIcon,
  ChevronDownIcon,
  ChevronUpIcon,
  ClipboardDocumentIcon,
} from "@heroicons/react/24/outline";

const Deposit = () => {
  const [amount, setAmount] = useState("");
  const [method, setMethod] = useState("paypal");
  const [iban, setIban] = useState("");
  const [accountNumber, setAccountNumber] = useState("");
  const [screenshot, setScreenshot] = useState("");
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
      setScreenshot(reader.result.toString());
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
        screenshot,
      };

      if (method === "paypal") {
        payload.method = "paypal";
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
    <div className="max-w-md mx-auto bg-white dark:bg-gray-800 rounded-xl shadow-md overflow-hidden border border-gray-200 dark:border-gray-700">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-700 dark:from-blue-700 dark:to-blue-800 p-6">
        <h2 className="text-xl font-bold text-white text-center">
          Deposit Coins
        </h2>
      </div>

      {/* Form */}
      <div className="p-6 space-y-4">
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
            Payment Method
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

        {/* Bank Details */}
        {method === "bank" && (
          <>
            <div className="space-y-1">
              <button
                type="button"
                onClick={() => setShowBankDetails(!showBankDetails)}
                className="w-full flex justify-between items-center p-3 rounded-lg bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 transition-colors"
              >
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Our Bank Details
                </span>
                {showBankDetails ? (
                  <ChevronUpIcon className="h-5 w-5 text-gray-500 dark:text-gray-400" />
                ) : (
                  <ChevronDownIcon className="h-5 w-5 text-gray-500 dark:text-gray-400" />
                )}
              </button>

              {showBankDetails && (
                <div className="bg-gray-50 dark:bg-gray-700/50 p-4 rounded-lg border border-gray-200 dark:border-gray-600 space-y-3">
                  {[
                    { label: "IBAN", value: bankDetails.yourIban },
                    {
                      label: "Account Number",
                      value: bankDetails.yourAccountNumber,
                    },
                    { label: "SWIFT/BIC", value: bankDetails.yourSwiftCode },
                  ].map((item, idx) => (
                    <div key={idx} className="space-y-1">
                      <div className="flex justify-between items-center">
                        <span className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                          {item.label}
                        </span>
                        <button
                          onClick={() => copyToClipboard(item.value)}
                          className="text-blue-500 hover:text-blue-600 dark:text-blue-400 dark:hover:text-blue-300 transition-colors"
                          title="Copy to clipboard"
                        >
                          <ClipboardDocumentIcon className="h-4 w-4" />
                        </button>
                      </div>
                      <p className="font-mono text-sm text-gray-800 dark:text-gray-200 break-all">
                        {item.value}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* User Bank Info */}
            <div className="space-y-3">
              <div className="space-y-1">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Your IBAN
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <IdentificationIcon className="h-5 w-5 text-gray-400 dark:text-gray-500" />
                  </div>
                  <input
                    type="text"
                    value={iban}
                    onChange={(e) => setIban(e.target.value)}
                    className={`block w-full pl-10 pr-3 py-2.5 border ${
                      iban && !isValidIban(iban)
                        ? "border-red-500"
                        : "border-gray-300 dark:border-gray-600"
                    } rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition`}
                    placeholder="Your IBAN"
                  />
                </div>
                {iban && !isValidIban(iban) && (
                  <p className="text-sm text-red-500 dark:text-red-400">
                    Invalid IBAN format
                  </p>
                )}
              </div>

              <div className="space-y-1">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Your Account Number
                </label>
                <input
                  type="text"
                  value={accountNumber}
                  onChange={(e) => setAccountNumber(e.target.value)}
                  className={`block w-full px-3 py-2.5 border ${
                    accountNumber && !isValidAccountNumber(accountNumber)
                      ? "border-red-500"
                      : "border-gray-300 dark:border-gray-600"
                  } rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition`}
                  placeholder="Your Account Number"
                />
                {accountNumber && !isValidAccountNumber(accountNumber) && (
                  <p className="text-sm text-red-500 dark:text-red-400">
                    Invalid account number format
                  </p>
                )}
              </div>
            </div>
          </>
        )}

        {/* Screenshot Upload */}
        <div className="space-y-1">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
            Payment Proof
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <DocumentTextIcon className="h-5 w-5 text-gray-400 dark:text-gray-500" />
            </div>
            <input
              type="file"
              accept="image/*"
              onChange={handleScreenshotUpload}
              className="block w-full pl-10 pr-3 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition file:mr-2 file:py-1 file:px-2 file:rounded file:border-0 file:text-sm file:font-medium file:bg-gray-100 file:text-gray-700 hover:file:bg-gray-200 dark:file:bg-gray-600 dark:file:text-gray-200"
            />
          </div>

          {screenshot && (
            <div className="relative mt-2">
              <img
                src={screenshot}
                alt="Payment proof preview"
                className="w-full h-auto rounded-lg border border-gray-300 dark:border-gray-600"
              />
              <button
                type="button"
                onClick={() => setScreenshot("")}
                className="absolute top-2 right-2 p-1 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors"
              >
                <XMarkIcon className="h-4 w-4" />
              </button>
            </div>
          )}
        </div>

        {/* Submit Button */}
        <button
          onClick={handleDeposit}
          disabled={
            !amount ||
            Number(amount) <= 0 ||
            loading ||
            isBankInvalid ||
            isScreenshotMissing
          }
          className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-lg bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-medium shadow-md hover:shadow-lg transition-all duration-200 disabled:opacity-70 disabled:cursor-not-allowed"
        >
          {loading ? (
            <>
              <ArrowPathIcon className="w-5 h-5 animate-spin" />
              Processing...
            </>
          ) : (
            "Deposit Coins"
          )}
        </button>

        {/* Status Message */}
        {status && (
          <div
            className={`p-3 rounded-lg text-sm ${
              status.startsWith("✅")
                ? "bg-green-50 dark:bg-green-900/30 text-green-700 dark:text-green-300 border-l-4 border-green-500"
                : "bg-red-50 dark:bg-red-900/30 text-red-700 dark:text-red-300 border-l-4 border-red-500"
            }`}
          >
            {status}
          </div>
        )}
      </div>
    </div>
  );
};

export default Deposit;
