// src/api/transactions.js
import axios from "./axiosInstance";

export const getMyTransactions = () => axios.get("/transactions/me");

export const deposit = (amount, method) =>
  axios.post("/transactions/deposit", { amount, method });

export const withdraw = (amount, method, paypalEmail, iban, accountNumber) =>
  axios.post("/transactions/withdraw", {
    amount,
    method,
    paypalEmail,
    iban,
    accountNumber,
  });

// Admin endpoints
export const getWithdrawals = (status = "pending", page = 1, limit = 10) =>
  axios.get("/transactions/withdrawals", {
    params: { status, page, limit },
  });

export const approveWithdrawal = (id, status, adminNote) =>
  axios.patch(`/transactions/${id}/approve`, { status, adminNote });
