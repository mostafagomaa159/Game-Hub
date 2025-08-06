// src/api/axiosInstance.js
import axios from "axios";

const instance = axios.create({
  baseURL: process.env.REACT_APP_API_BASE_URL || "http://localhost:3001",
  // withCredentials: true, // Only needed for cookie-based auth
  timeout: 30_000, // optional: keep requests from hanging
});

// Add the token to every request (keeps your current logic)
instance.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("token"); // Make sure you store token on login
    if (token) {
      config.headers = config.headers || {};
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// --- NEW: response interceptor to handle 401 automatically ---
instance.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error?.response?.status;

    if (status === 401) {
      // Clear local auth and redirect to login
      try {
        localStorage.removeItem("token");
        localStorage.removeItem("user");
      } catch (e) {
        console.warn("Failed clearing local storage after 401:", e);
      }

      // Optional: you can show a toast here if using react-toastify
      // import { toast } from 'react-toastify'; toast.error("Session expired. Please login again.");

      // Redirect to login page
      if (typeof window !== "undefined") {
        window.location.href = "/login";
      }
    }

    return Promise.reject(error);
  }
);

export default instance;
