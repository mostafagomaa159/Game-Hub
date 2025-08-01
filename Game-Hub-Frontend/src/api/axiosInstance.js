// src/api/axiosInstance.js
import axios from "axios";

const instance = axios.create({
  baseURL: "https://game-hub-backend-application-524e6ef2f7e7.herokuapp.com", // Your backend base URL
  withCredentials: true, // ✅ only needed for cookie/session-based auth
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
