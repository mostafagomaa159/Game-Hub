// src/api/posts.js
import axios from "./axiosInstance";

export const createPost = (title, content) =>
  axios.post("/newpost", { title, content });

export const getPosts = () => axios.get("/newpost");

export const updatePost = (id, data) => axios.patch(`/newpost/${id}`, data);

export const deletePost = (id) => axios.delete(`/newpost/${id}`);
