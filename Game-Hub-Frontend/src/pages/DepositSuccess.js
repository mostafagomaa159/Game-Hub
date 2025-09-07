// DepositSuccess.js
import React, { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import axios from "../api/axiosInstance";

const DepositSuccess = () => {
  const [searchParams] = useSearchParams();
  const [status, setStatus] = useState("loading");
  const [depositInfo, setDepositInfo] = useState(null);

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
    <div className="max-w-md mx-auto mt-10 p-6 text-white bg-gray-900 rounded-xl shadow-xl text-center">
      {status === "loading" && (
        <p className="animate-pulse text-gray-300">
          ⏳ Processing your payment...
        </p>
      )}

      {status === "pending" && (
        <>
          <p className="text-yellow-300 text-lg font-semibold mb-2">
            ✅ Payment received!
          </p>
          {depositInfo?.amount && (
            <p className="text-sm text-gray-200 mb-1">
              Amount: <span className="font-bold">{depositInfo.amount}</span>{" "}
              coins
            </p>
          )}
          {depositInfo?._id && (
            <p className="text-xs text-gray-400 mb-2">
              Transaction ID: {depositInfo._id}
            </p>
          )}
          <p className="text-sm text-gray-300">
            Your deposit is now{" "}
            <span className="font-bold">pending admin approval</span>. Coins
            will be added once approved.
          </p>
        </>
      )}

      {status === "failed" && (
        <p className="text-red-400 text-lg font-semibold">
          ❌ Deposit failed. Please try again or contact support.
        </p>
      )}
    </div>
  );
};

export default DepositSuccess;
