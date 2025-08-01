// src/api/axiosInstance.js
import axios from "axios";

const instance = axios.create({
  baseURL: "http://localhost:3001", // Your backend base URL
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
