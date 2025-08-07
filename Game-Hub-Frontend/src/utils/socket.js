// src/utils/socket.js
import { io } from "socket.io-client";

// Use environment variable or fallback to localhost for development
const socket = io(process.env.REACT_APP_SOCKET_URL || "http://localhost:3001", {
  withCredentials: true,
  transports: ["websocket", "polling"], // fallback support
});

export default socket;
