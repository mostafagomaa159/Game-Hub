import React, { useState } from "react";
import axios from "../api/axiosInstance";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import {
  FiEdit2,
  FiDollarSign,
  FiServer,
  FiCheckCircle,
  FiPlus,
} from "react-icons/fi";
import { FaDiscord } from "react-icons/fa";

const NewPostForm = () => {
  const [formData, setFormData] = useState({
    description: "",
    avaliable: true,
    price: "",
    server: "",
    discord: "",
  });

  const navigate = useNavigate();

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const token = localStorage.getItem("token");
    if (!token) {
      toast.error("You must be logged in.");
      return;
    }

    try {
      await axios.post("/newpost", formData);
      toast.success("Post created successfully!");
      setTimeout(() => navigate("/"), 1500);
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to create post.");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 px-4 py-8 transition-colors duration-200">
      <div className="w-full max-w-md bg-white dark:bg-gray-800 shadow-lg rounded-xl overflow-hidden border border-gray-200 dark:border-gray-700">
        {/* Form Header */}
        <div className="bg-gradient-to-r from-blue-600 to-blue-700 dark:from-blue-700 dark:to-blue-800 p-6">
          <h2 className="text-2xl font-bold text-white text-center">
            Create New Post
          </h2>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {/* Description */}
          <div className="space-y-1">
            <label
              htmlFor="description"
              className="block text-sm font-medium text-gray-700 dark:text-gray-300"
            >
              Description
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <FiEdit2 className="h-5 w-5 text-gray-400 dark:text-gray-500" />
              </div>
              <input
                type="text"
                id="description"
                name="description"
                value={formData.description}
                onChange={handleChange}
                required
                placeholder="What are you offering?"
                className="block w-full pl-10 pr-3 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
              />
            </div>
          </div>

          {/* Price */}
          <div className="space-y-1">
            <label
              htmlFor="price"
              className="block text-sm font-medium text-gray-700 dark:text-gray-300"
            >
              Price (Coins)
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <FiDollarSign className="h-5 w-5 text-gray-400 dark:text-gray-500" />
              </div>
              <input
                type="number"
                id="price"
                name="price"
                value={formData.price}
                onChange={handleChange}
                required
                placeholder="0"
                min={0}
                className="block w-full pl-10 pr-3 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
              />
            </div>
          </div>

          {/* Server */}
          <div className="space-y-1">
            <label
              htmlFor="server"
              className="block text-sm font-medium text-gray-700 dark:text-gray-300"
            >
              Server
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <FiServer className="h-5 w-5 text-gray-400 dark:text-gray-500" />
              </div>
              <input
                type="text"
                id="server"
                name="server"
                value={formData.server}
                onChange={handleChange}
                required
                placeholder="Server name"
                className="block w-full pl-10 pr-3 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
              />
            </div>
          </div>

          {/* Discord */}
          <div className="space-y-1">
            <label
              htmlFor="discord"
              className="block text-sm font-medium text-gray-700 dark:text-gray-300"
            >
              Discord
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <FaDiscord className="h-5 w-5 text-gray-400 dark:text-gray-500" />
              </div>
              <input
                type="text"
                id="discord"
                name="discord"
                value={formData.discord}
                onChange={handleChange}
                required
                placeholder="Your Discord username"
                className="block w-full pl-10 pr-3 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
              />
            </div>
          </div>

          {/* Availability */}
          <div className="flex items-center">
            <input
              type="checkbox"
              id="avaliable"
              name="avaliable"
              checked={formData.avaliable}
              onChange={handleChange}
              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 dark:border-gray-600 rounded transition"
            />
            <label
              htmlFor="avaliable"
              className="ml-2 block text-sm text-gray-700 dark:text-gray-300 flex items-center gap-2"
            >
              <FiCheckCircle className="text-blue-600 dark:text-blue-400" />
              Currently Available
            </label>
          </div>

          {/* Submit Button */}
          <div className="pt-2">
            <button
              type="submit"
              className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-lg bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-medium shadow-md hover:shadow-lg transition-all duration-200"
            >
              <FiPlus className="w-5 h-5" />
              Create Post
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default NewPostForm;
