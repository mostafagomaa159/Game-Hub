import React, { useState } from "react";
import axios from "../api/axiosInstance";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

// React Icons imports for input adornments
import { FiEdit2, FiDollarSign, FiServer, FiCheckCircle } from "react-icons/fi";
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
    <div className="min-h-screen flex items-center justify-center bg-gray-100 dark:bg-gray-900 px-4 py-12 transition-colors duration-300">
      <div className="w-full max-w-md bg-white dark:bg-gray-800 shadow-2xl rounded-3xl p-8">
        <h2 className="text-3xl font-extrabold text-center mb-8 text-gray-900 dark:text-white">
          Create a New Post
        </h2>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Description */}
          <div>
            <label
              htmlFor="description"
              className="block mb-2 text-sm font-medium text-gray-700 dark:text-gray-300"
            >
              Description
            </label>
            <div className="relative flex items-center">
              <FiEdit2
                className="absolute left-3 text-gray-400 dark:text-gray-500"
                size={20}
              />
              <input
                type="text"
                id="description"
                name="description"
                value={formData.description}
                onChange={handleChange}
                required
                placeholder="Enter post description"
                className="pl-10 w-full py-3 border dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
              />
            </div>
          </div>

          {/* Price */}
          <div>
            <label
              htmlFor="price"
              className="block mb-2 text-sm font-medium text-gray-700 dark:text-gray-300"
            >
              Price (coins)
            </label>
            <div className="relative flex items-center">
              <FiDollarSign
                className="absolute left-3 text-gray-400 dark:text-gray-500"
                size={20}
              />
              <input
                type="number"
                id="price"
                name="price"
                value={formData.price}
                onChange={handleChange}
                required
                placeholder="Enter price"
                min={0}
                className="pl-10 w-full py-3 border dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
              />
            </div>
          </div>

          {/* Server */}
          <div>
            <label
              htmlFor="server"
              className="block mb-2 text-sm font-medium text-gray-700 dark:text-gray-300"
            >
              Server
            </label>
            <div className="relative flex items-center">
              <FiServer
                className="absolute left-3 text-gray-400 dark:text-gray-500"
                size={20}
              />
              <input
                type="text"
                id="server"
                name="server"
                value={formData.server}
                onChange={handleChange}
                required
                placeholder="Enter server name"
                className="pl-10 w-full py-3 border dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
              />
            </div>
          </div>

          {/* Discord */}
          <div>
            <label
              htmlFor="discord"
              className="block mb-2 text-sm font-medium text-gray-700 dark:text-gray-300"
            >
              Discord Username
            </label>
            <div className="relative flex items-center">
              <FaDiscord
                className="absolute left-3 text-gray-400 dark:text-gray-500"
                size={20}
              />
              <input
                type="text"
                id="discord"
                name="discord"
                value={formData.discord}
                onChange={handleChange}
                required
                placeholder="Enter Discord username"
                className="pl-10 w-full py-3 border dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
              />
            </div>
          </div>

          {/* Available checkbox */}
          <div className="flex items-center space-x-3">
            <input
              type="checkbox"
              id="avaliable"
              name="avaliable"
              checked={formData.avaliable}
              onChange={handleChange}
              className="h-5 w-5 text-blue-600 focus:ring-blue-500 border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:checked:bg-blue-600 rounded transition"
            />
            <label
              htmlFor="avaliable"
              className="text-sm text-gray-700 dark:text-gray-300 select-none flex items-center gap-2"
            >
              <FiCheckCircle
                size={18}
                className="text-blue-600 dark:text-blue-400"
              />
              Available
            </label>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            className="w-full bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 transition dark:bg-blue-500 dark:hover:bg-blue-600 font-semibold text-lg shadow-md"
          >
            Submit Post
          </button>
        </form>
      </div>
    </div>
  );
};

export default NewPostForm;
