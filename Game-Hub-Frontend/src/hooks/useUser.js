// src/hooks/useUser.js
import { useState, useEffect } from "react";
import axios from "../api/axiosInstance";

const useUser = () => {
  const [userId, setUserId] = useState(null);

  useEffect(() => {
    const fetchUser = async () => {
      const token = localStorage.getItem("token");
      if (!token) {
        setUserId(null);
        return;
      }
      try {
        const res = await axios.get("/users/me");
        setUserId(res.data._id);
        localStorage.setItem("user", JSON.stringify(res.data));
      } catch (err) {
        console.warn("Invalid token or failed to fetch user:", err);
        setUserId(null);
        localStorage.removeItem("token");
        localStorage.removeItem("user");
      }
    };

    fetchUser();
  }, []);

  return { userId, setUserId };
};

export default useUser;
