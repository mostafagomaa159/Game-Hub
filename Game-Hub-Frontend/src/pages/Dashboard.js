// src/pages/Dashboard.js
import React, { useCallback, useEffect, useState } from "react";
import axios from "../api/axiosInstance";
import {
  FiEdit2,
  FiTrash2,
  FiCheckCircle,
  FiSearch,
  FiDollarSign,
  FiServer,
} from "react-icons/fi";
import { FaDiscord } from "react-icons/fa";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

const Dashboard = () => {
  const [posts, setPosts] = useState([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [priceMin, setPriceMin] = useState("");
  const [priceMax, setPriceMax] = useState("");
  const [availableOnly, setAvailableOnly] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [editData, setEditData] = useState(null);
  const [isSaving, setIsSaving] = useState(false);

  const postsPerPage = 5;

  const fetchPosts = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const token = localStorage.getItem("token");
      const res = await axios.get("/newpost", {
        params: {
          page: currentPage,
          limit: postsPerPage,
          search,
          priceMax,
          priceMin,
          availableOnly,
        },
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const dataPosts = res.data?.posts ?? res.data;
      setPosts(Array.isArray(dataPosts) ? dataPosts : []);
    } catch (err) {
      console.error(err);
      setError("Failed to fetch posts. Please log in.");
      setPosts([]);
    } finally {
      setLoading(false);
    }
  }, [currentPage, postsPerPage, search, priceMax, priceMin, availableOnly]);

  useEffect(() => {
    fetchPosts();
  }, [fetchPosts]);

  const handleEdit = (post) => setEditData({ ...post });

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      const { description, price, server, avaliable, discord, tradeStatus } =
        editData;

      await axios.patch(`/newpost/${editData._id}`, {
        description,
        price: Number(price),
        server,
        avaliable,
        discord,
        tradeStatus,
      });

      toast.success("Post updated successfully!");
      setEditData(null);

      // Update state instantly for a smoother UI
      setPosts((prev) =>
        prev.map((p) => (p._id === editData._id ? { ...p, ...editData } : p))
      );
    } catch (err) {
      const errorMessage =
        err.response?.data?.error || "Failed to update post.";
      toast.error(errorMessage); // ✅ Show backend restriction error
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this post?")) return;
    try {
      await axios.delete(`/newpost/${id}`);
      setPosts((prev) => prev.filter((p) => p._id !== id));
      toast.success("Post deleted.");
    } catch (err) {
      const errorMessage =
        err.response?.data?.error || "Failed to delete post.";
      toast.error(errorMessage); // ✅ Will show "You can only delete if tradeStatus is..."
    }
  };

  const filteredPosts = posts.filter((post) => {
    const matchesSearch = (post.description || "")
      .toLowerCase()
      .includes(search.toLowerCase());
    const matchesPrice =
      (!priceMin || post.price >= parseFloat(priceMin)) &&
      (!priceMax || post.price <= parseFloat(priceMax));
    const matchesAvailable = !availableOnly || post.avaliable;
    return matchesSearch && matchesPrice && matchesAvailable;
  });

  const indexOfLast = currentPage * postsPerPage;
  const indexOfFirst = indexOfLast - postsPerPage;
  const currentPosts = filteredPosts.slice(indexOfFirst, indexOfLast);
  const totalPages = Math.max(
    1,
    Math.ceil(filteredPosts.length / postsPerPage)
  );

  const SmallSpinner = ({ className = "inline-block w-4 h-4 mr-2" }) => (
    <svg
      className={`${className} animate-spin`}
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
    >
      <circle
        className="opacity-25"
        cx="12"
        cy="12"
        r="10"
        stroke="currentColor"
        strokeWidth="4"
      ></circle>
      <path
        className="opacity-75"
        fill="currentColor"
        d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"
      ></path>
    </svg>
  );

  const TableSkeletonRow = ({ keyIndex }) => (
    <tr key={`sk-${keyIndex}`} className="animate-pulse">
      {Array.from({ length: 6 }).map((_, idx) => (
        <td key={idx} className="p-4">
          <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4" />
        </td>
      ))}
    </tr>
  );

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-darkBackground text-gray-900 dark:text-gray-100 p-6 transition-colors duration-300">
      <div className="max-w-6xl mx-auto">
        <ToastContainer position="top-center" autoClose={3000} theme="dark" />

        <h2 className="text-3xl font-extrabold mb-6 text-center md:text-left">
          My Posts
        </h2>

        {/* Filters */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <div className="relative">
            <FiSearch
              className="absolute top-1/2 left-3 transform -translate-y-1/2 text-gray-400 dark:text-gray-500"
              size={20}
            />
            <input
              type="text"
              placeholder="Search description..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setCurrentPage(1);
              }}
              className="pl-10 p-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-darkCard dark:text-white"
            />
          </div>

          <div className="relative">
            <FiDollarSign
              className="absolute top-1/2 left-3 transform -translate-y-1/2 text-gray-400 dark:text-gray-500"
              size={20}
            />
            <input
              type="number"
              placeholder="Min Price"
              value={priceMin}
              onChange={(e) => setPriceMin(e.target.value)}
              className="pl-10 p-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-darkCard dark:text-white"
              min="0"
            />
          </div>

          <div className="relative">
            <FiDollarSign
              className="absolute top-1/2 left-3 transform -translate-y-1/2 text-gray-400 dark:text-gray-500"
              size={20}
            />
            <input
              type="number"
              placeholder="Max Price"
              value={priceMax}
              onChange={(e) => setPriceMax(e.target.value)}
              className="pl-10 p-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-darkCard dark:text-white"
              min="0"
            />
          </div>

          <label className="flex items-center gap-2 text-sm select-none cursor-pointer">
            <input
              type="checkbox"
              checked={availableOnly}
              onChange={(e) => setAvailableOnly(e.target.checked)}
              className="accent-blue-600"
            />
            Available Only
          </label>
        </div>

        {/* Table */}
        <div className="overflow-x-auto bg-white dark:bg-darkCard shadow-md rounded-lg">
          <table className="w-full table-auto border-collapse">
            <thead className="bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-200 text-sm">
              <tr>
                <th className="p-4 text-center w-1/3">Description</th>
                <th className="p-4 text-center w-[80px]">Available</th>
                <th className="p-4 text-center w-[80px]">Price</th>
                <th className="p-4 text-center w-[150px]">Server</th>
                <th className="p-4 text-center w-[120px]">Trade Status</th>
                <th className="p-4 text-center w-[120px]">Actions</th>
              </tr>
            </thead>

            <tbody className="text-sm divide-y">
              {loading ? (
                Array.from({ length: postsPerPage }).map((_, i) => (
                  <TableSkeletonRow keyIndex={i} key={`skeleton-${i}`} />
                ))
              ) : error ? (
                <tr>
                  <td colSpan={6} className="p-6 text-red-600 text-center">
                    {error}
                  </td>
                </tr>
              ) : filteredPosts.length === 0 ? (
                <tr>
                  <td
                    colSpan={6}
                    className="p-6 text-center text-gray-600 dark:text-gray-400"
                  >
                    No posts found.
                  </td>
                </tr>
              ) : (
                currentPosts.map((post) => (
                  <tr
                    key={post._id}
                    className="hover:bg-gray-50 dark:hover:bg-gray-700 transition"
                  >
                    <td
                      className="p-2 max-w-[200px] truncate"
                      title={post.description}
                    >
                      {post.description}
                    </td>
                    <td className="p-4 flex items-center gap-1 justify-center">
                      {post.avaliable ? (
                        <FiCheckCircle className="text-green-500" />
                      ) : (
                        "❌"
                      )}
                    </td>
                    <td className="p-3 text-center">💰{post.price}</td>
                    <td className="p-4 flex items-center gap-2 justify-center">
                      <FaDiscord
                        className="text-indigo-600 dark:text-indigo-400"
                        size={18}
                      />
                      {post.server}
                    </td>
                    <td className="p-4 text-center">
                      <span
                        className={`px-2 py-1 rounded text-xs font-semibold
                    ${
                      post.tradeStatus === "completed"
                        ? "bg-green-100 text-green-700"
                        : post.tradeStatus === "pending"
                        ? "bg-yellow-100 text-yellow-700"
                        : post.tradeStatus === "cancelled"
                        ? "bg-red-100 text-red-700"
                        : "bg-gray-100 text-gray-700"
                    }`}
                      >
                        {post.tradeStatus || "—"}
                      </span>
                    </td>
                    <td className="p-4 flex justify-center gap-2">
                      <button
                        onClick={() => handleEdit(post)}
                        disabled={
                          ![
                            "completed",
                            "cancelled",
                            "resolved",
                            "released",
                            "refunded",
                          ].includes(post.tradeStatus)
                        }
                        className={`w-8 h-8 flex items-center justify-center rounded transition ${
                          ![
                            "completed",
                            "cancelled",
                            "resolved",
                            "released",
                            "refunded",
                          ].includes(post.tradeStatus)
                            ? "bg-gray-500 cursor-not-allowed opacity-50"
                            : "bg-blue-600 hover:bg-blue-700 text-white"
                        }`}
                        aria-label="Edit post"
                      >
                        <FiEdit2 className="w-4 h-4" />
                      </button>

                      <button
                        onClick={() => handleDelete(post._id)}
                        disabled={
                          ![
                            "completed",
                            "cancelled",
                            "resolved",
                            "released",
                            "refunded",
                          ].includes(post.tradeStatus)
                        }
                        className={`w-8 h-8 flex items-center justify-center rounded transition ${
                          ![
                            "completed",
                            "cancelled",
                            "resolved",
                            "released",
                            "refunded",
                          ].includes(post.tradeStatus)
                            ? "bg-gray-500 cursor-not-allowed opacity-50"
                            : "bg-red-500 hover:bg-red-600 text-white"
                        }`}
                        aria-label="Delete post"
                      >
                        <FiTrash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="mt-6 flex items-center justify-center space-x-2 flex-wrap">
          {loading && (
            <div className="flex items-center text-sm text-gray-500 mr-2">
              <SmallSpinner className="inline-block w-4 h-4 mr-2" />
              loading...
            </div>
          )}
          {Array.from({ length: totalPages }, (_, i) => (
            <button
              key={i}
              onClick={() => setCurrentPage(i + 1)}
              className={`px-3 py-1 rounded-md border transition mb-2 ${
                currentPage === i + 1
                  ? "bg-blue-600 text-white shadow"
                  : "bg-white dark:bg-gray-800 dark:text-white text-gray-700 hover:bg-blue-50 dark:hover:bg-gray-700"
              }`}
              aria-label={`Go to page ${i + 1}`}
            >
              {i + 1}
            </button>
          ))}
        </div>

        {/* Edit Modal */}
        {editData && (
          <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center px-4">
            <div className="bg-white dark:bg-darkCard w-full max-w-lg p-6 rounded-xl shadow-lg">
              <h3 className="text-xl font-semibold mb-4 text-gray-900 dark:text-gray-100">
                Edit Post
              </h3>
              <form onSubmit={handleEditSubmit} className="space-y-4">
                <div className="relative">
                  <FiEdit2
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                    size={20}
                  />
                  <input
                    type="text"
                    value={editData.description}
                    onChange={(e) =>
                      setEditData({ ...editData, description: e.target.value })
                    }
                    className="w-full p-2 border rounded-md dark:bg-gray-800 dark:text-white pl-10 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Description"
                    required
                  />
                </div>
                <div className="relative">
                  <FiDollarSign
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                    size={20}
                  />
                  <input
                    type="number"
                    value={editData.price}
                    onChange={(e) =>
                      setEditData({ ...editData, price: e.target.value })
                    }
                    className="w-full p-2 border rounded-md dark:bg-gray-800 dark:text-white pl-10 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Price"
                    required
                  />
                </div>
                <div className="relative">
                  <FiServer
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                    size={20}
                  />
                  <input
                    type="text"
                    value={editData.server}
                    onChange={(e) =>
                      setEditData({ ...editData, server: e.target.value })
                    }
                    className="w-full p-2 border rounded-md dark:bg-gray-800 dark:text-white pl-10 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Server"
                    required
                  />
                </div>
                <div className="relative">
                  <FaDiscord
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                    size={20}
                  />
                  <input
                    type="text"
                    value={editData.discord}
                    onChange={(e) =>
                      setEditData({ ...editData, discord: e.target.value })
                    }
                    className="w-full p-2 border rounded-md dark:bg-gray-800 dark:text-white pl-10 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Discord (optional)"
                  />
                </div>

                {/* Trade Status Dropdown */}
                <div>
                  <label className="block mb-1 text-sm font-medium text-gray-700 dark:text-gray-300">
                    Trade Status
                  </label>

                  {["available", "completed", "refunded", "cancelled"].includes(
                    (editData.tradeStatus || "").toLowerCase()
                  ) ? (
                    // Editable dropdown with only available/completed
                    <select
                      value={editData.tradeStatus || ""}
                      onChange={(e) =>
                        setEditData({
                          ...editData,
                          tradeStatus: e.target.value,
                        })
                      }
                      className="w-full p-2 border rounded-md dark:bg-gray-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="available">Available</option>
                      <option value="cancelled">Cancelled</option>
                    </select>
                  ) : (
                    // Read-only display
                    <span
                      className={`inline-block px-3 py-2 rounded-md text-sm font-semibold
        ${
          editData.tradeStatus === "completed"
            ? "bg-green-100 text-green-700"
            : editData.tradeStatus === "pending"
            ? "bg-yellow-100 text-yellow-700"
            : editData.tradeStatus === "cancelled"
            ? "bg-red-100 text-red-700"
            : "bg-gray-100 text-gray-700"
        }`}
                    >
                      {editData.tradeStatus || "—"}
                    </span>
                  )}
                </div>
                <label className="flex items-center gap-2 select-none cursor-pointer">
                  <input
                    type="checkbox"
                    checked={editData.avaliable}
                    onChange={(e) =>
                      setEditData({ ...editData, avaliable: e.target.checked })
                    }
                    className="accent-blue-600"
                  />
                  Available
                </label>

                <div className="flex justify-end gap-2 pt-2">
                  <button
                    type="submit"
                    disabled={isSaving}
                    className="flex items-center gap-2 bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 transition disabled:opacity-70"
                  >
                    {isSaving && (
                      <SmallSpinner className="inline-block w-4 h-4" />
                    )}
                    Save
                  </button>
                  <button
                    type="button"
                    onClick={() => setEditData(null)}
                    className="bg-gray-500 text-white px-4 py-2 rounded hover:bg-gray-600 transition"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Dashboard;
