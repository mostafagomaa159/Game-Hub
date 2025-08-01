// DepositSuccess.js
import React, { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import axios from "../api/axiosInstance";

const DepositSuccess = () => {
  const [searchParams] = useSearchParams();
  const [status, setStatus] = useState("loading");

  useEffect(() => {
    const token = searchParams.get("token");
    const queryStatus = searchParams.get("status");

    if (queryStatus === "failed") {
      setStatus("failed");
      return;
    }

    if (token) {
      axios
        .get(`/transactions/deposit/paypal/capture?token=${token}`, {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        })
        .then(() => setStatus("pending"))
        .catch(() => setStatus("failed"));
    } else {
      setStatus("failed");
    }
  }, [searchParams]);

  return (
    <div className="max-w-md mx-auto mt-10 p-6 text-white bg-gray-900 rounded-xl shadow-xl text-center">
      {status === "loading" && <p>⏳ Processing your payment...</p>}

      {status === "pending" && (
        <>
          <p className="text-yellow-300 text-lg font-semibold mb-2">
            ✅ Payment received!
          </p>
          <p className="text-sm text-gray-300">
            Your deposit is now pending admin approval. Coins will be added once
            approved.
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
