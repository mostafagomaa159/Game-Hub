// src/api/auth.js
import axios from "./axiosInstance";

export const register = (name, email, password) =>
  axios.post("/users", { name, email, password });

export const login = (email, password) =>
  axios.post("/users/login", { email, password });

export const logout = () => axios.post("/users/logout");

export const getProfile = () => axios.get("/users/me");

export const updateProfile = (data) => axios.patch("/users/me", data);

export const deleteAccount = () => axios.delete("/users/me");
