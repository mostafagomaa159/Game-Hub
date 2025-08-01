// src/api/user.js
import axios from "./axiosInstance";

export const uploadAvatar = (file) => {
  const formData = new FormData();
  formData.append("avatar", file);
  return axios.post("/users/me/avatar", formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
};

export const getAvatarUrl = (userId) =>
  `http://localhost:3001/users/${userId}/avatar`;
