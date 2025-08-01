// src/api/user.js
import axios from "./axiosInstance";

export const uploadAvatar = (file) => {
  const formData = new FormData();
  formData.append("avatar", file);
  return axios.post("/users/me/avatar", formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
};

// ✅ Use axios.defaults.baseURL to get the same base URL
export const getAvatarUrl = (userId) =>
  `${axios.defaults.baseURL}/users/${userId}/avatar`;
