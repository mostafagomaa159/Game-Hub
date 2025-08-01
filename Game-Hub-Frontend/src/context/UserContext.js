// context/UserContext.js
import { createContext, useContext, useEffect, useState } from "react";
import axios from "../api/axiosInstance";

const UserContext = createContext();

export const useUser = () => useContext(UserContext);

export const UserProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loadingUser, setLoadingUser] = useState(true);

  const fetchUser = async () => {
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        setUser(null);
        setLoadingUser(false); // ✅ Don't forget this!
        return; // ✅ STOP here if no token
      }

      const response = await axios.get("/users/me", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const userData = response.data;

      if (!userData || typeof userData.isAdmin === "undefined") {
        console.warn("⚠️ User data or isAdmin missing:", userData);
        setUser(null);
        return;
      }

      setUser(userData);
    } catch (err) {
      console.error("❌ Failed to fetch user:", err);
      setUser(null);
    } finally {
      setLoadingUser(false);
    }
  };

  useEffect(() => {
    fetchUser();
  }, []);

  return (
    <UserContext.Provider value={{ user, loadingUser, fetchUser, setUser }}>
      {children}
    </UserContext.Provider>
  );
};
