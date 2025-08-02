// src/api/axiosInstance.js
import axios from "axios";

const instance = axios.create({
  baseURL: process.env.REACT_APP_API_BASE_URL || "http://localhost:3001",
  // withCredentials: true, // Only needed for cookie-based auth
});

// Add the token to every request
instance.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("token"); // Make sure you store token on login
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

export default instance;
