// src/hooks/usePosts.js
import { useState, useEffect } from "react";
import axios from "../api/axiosInstance";

const usePosts = () => {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchAllPosts = async () => {
      setLoading(true);
      try {
        const res = await axios.get("/all");
        setPosts(Array.isArray(res.data) ? res.data : []);
      } catch (err) {
        console.error("Fetch /all error:", err);
        setError("Failed to load posts.");
      } finally {
        setLoading(false);
      }
    };

    fetchAllPosts();
  }, []);

  return { posts, loading, error, setPosts };
};

export default usePosts;
