// DepositSuccess.js
import React, { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import axios from "../api/axiosInstance";
import { Clock, XCircle, Loader2 } from "lucide-react";

const DepositSuccess = () => {
  const [searchParams] = useSearchParams();
  const [status, setStatus] = useState("loading");
  const [depositInfo, setDepositInfo] = useState(null);
  const error = searchParams.get("error");

  useEffect(() => {
    const queryStatus = searchParams.get("status");
    const transactionId = searchParams.get("transactionId");

    if (queryStatus === "failed") {
      setStatus("failed");
      return;
    }

    if (transactionId) {
      axios
        .get("/transactions/me", {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        })
        .then((res) => {
          const tx = res.data.find((t) => t._id === transactionId);
          if (tx) {
            setDepositInfo(tx);
            setStatus("pending");
          } else {
            setStatus("failed");
          }
        })
        .catch(() => setStatus("failed"));
    } else {
      setStatus("failed");
    }
  }, [searchParams]);

  return (
    <div className="flex justify-center items-center min-h-screen bg-gradient-to-b from-gray-950 to-gray-900">
      <div className="w-full max-w-md p-8 bg-gray-800 rounded-2xl shadow-xl text-center">
        {/* LOADING */}
        {status === "loading" && (
          <div className="flex flex-col items-center gap-3">
            <Loader2 className="w-8 h-8 animate-spin text-blue-400" />
            <p className="text-gray-300 text-sm">
              Processing your payment, please wait...
            </p>
          </div>
        )}

        {/* PENDING */}
        {status === "pending" && (
          <div className="flex flex-col items-center gap-3">
            <Clock className="w-12 h-12 text-yellow-400" />
            <h2 className="text-xl font-semibold text-yellow-300">
              Payment Received
            </h2>
            {depositInfo?.amount && (
              <p className="text-gray-200">
                Amount: <span className="font-bold">{depositInfo.amount}</span>{" "}
                coins
              </p>
            )}
            {depositInfo?._id && (
              <p className="text-xs text-gray-400">
                Transaction ID: {depositInfo._id}
              </p>
            )}
            <p className="text-sm text-gray-300">
              Your deposit is{" "}
              <span className="font-bold">pending admin approval</span>. Coins
              will be added once approved.
            </p>
          </div>
        )}

        {/* FAILED */}
        {status === "failed" && (
          <div className="flex flex-col items-center gap-3">
            <XCircle className="w-12 h-12 text-red-500" />
            <h2 className="text-xl font-semibold text-red-400">
              Deposit Failed
            </h2>
            {error === "paypal_capture_failed" && (
              <p className="text-gray-400 text-sm">
                We couldn’t capture your PayPal payment. Please try again later.
              </p>
            )}
            {error === "missing_token" && (
              <p className="text-gray-400 text-sm">
                Payment session expired or invalid. Please start again.
              </p>
            )}
            {!error && (
              <p className="text-gray-400 text-sm">
                An unexpected error occurred. Please contact support if this
                continues.
              </p>
            )}
            <button
              onClick={() => (window.location.href = "/deposit")}
              className="mt-3 px-5 py-2 bg-blue-600 hover:bg-blue-700 transition rounded-lg text-white font-medium shadow"
            >
              Try Again
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default DepositSuccess;
