// src/pages/Dashboard.js
import React, { useCallback, useEffect, useState } from "react";
import axios from "../api/axiosInstance";
import { Edit2, Trash2 } from "lucide-react";
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

  // Fetch posts (uses res.data.posts when available)
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
      const { description, price, server, avaliable, discord } = editData;
      await axios.patch(`/newpost/${editData._id}`, {
        description,
        price: Number(price),
        server,
        avaliable,
        discord,
      });
      toast.success("Post updated successfully!");
      setEditData(null);
      // refresh
      await fetchPosts();
    } catch (err) {
      console.error(err);
      toast.error("Failed to update post.");
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
      console.error(err);
      toast.error("Failed to delete post.");
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

  // Number of skeleton rows to show; match postsPerPage but cap on very small screens
  const skeletonCount = postsPerPage;

  // Small spinner component (used in pagination and Save button)
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

  // Table-shaped skeleton row
  const TableSkeletonRow = ({ keyIndex }) => (
    <tr key={`sk-${keyIndex}`} className="animate-pulse">
      <td className="p-4">
        <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4" />
      </td>
      <td className="p-4">
        <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-6" />
      </td>
      <td className="p-4">
        <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-12" />
      </td>
      <td className="p-4">
        <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-20" />
      </td>
      <td className="p-4">
        <div className="flex gap-2">
          <div className="h-8 w-8 bg-gray-200 dark:bg-gray-700 rounded" />
          <div className="h-8 w-8 bg-gray-200 dark:bg-gray-700 rounded" />
        </div>
      </td>
    </tr>
  );

  return (
    <div className="min-h-screen bg-white dark:bg-darkBackground text-gray-800 dark:text-gray-200 p-6">
      <div className="max-w-6xl mx-auto">
        <ToastContainer />
        <h2 className="text-3xl font-bold mb-6">My Posts</h2>

        {/* Filters */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <input
            type="text"
            placeholder="Search description..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setCurrentPage(1);
            }}
            className="p-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-darkCard dark:text-white"
          />
          <input
            type="number"
            placeholder="Min Price"
            value={priceMin}
            onChange={(e) => setPriceMin(e.target.value)}
            className="p-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-darkCard dark:text-white"
          />
          <input
            type="number"
            placeholder="Max Price"
            value={priceMax}
            onChange={(e) => setPriceMax(e.target.value)}
            className="p-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-darkCard dark:text-white"
          />
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={availableOnly}
              onChange={(e) => setAvailableOnly(e.target.checked)}
              className="accent-blue-600"
            />
            Available Only
          </label>
        </div>

        {/* Table / Skeleton */}
        <div className="overflow-x-auto bg-white dark:bg-darkCard shadow-md rounded-lg">
          <table className="w-full table-auto">
            <thead className="bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-200 text-sm">
              <tr>
                <th className="p-4 text-left">Description</th>
                <th className="p-4 text-left">Available</th>
                <th className="p-4 text-left">Price</th>
                <th className="p-4 text-left">Server</th>
                <th className="p-4 text-left">Actions</th>
              </tr>
            </thead>

            <tbody className="text-sm divide-y">
              {loading ? (
                // render skeleton rows equal to postsPerPage
                <>
                  {Array.from({ length: skeletonCount }).map((_, i) => (
                    <TableSkeletonRow keyIndex={i} key={`skeleton-${i}`} />
                  ))}
                </>
              ) : error ? (
                <tr>
                  <td colSpan={5} className="p-6 text-red-600">
                    {error}
                  </td>
                </tr>
              ) : filteredPosts.length === 0 ? (
                <tr>
                  <td colSpan={5} className="p-6">
                    No posts found.
                  </td>
                </tr>
              ) : (
                currentPosts.map((post) => (
                  <tr
                    key={post._id}
                    className="hover:bg-gray-50 dark:hover:bg-gray-700 transition"
                  >
                    <td className="p-4">{post.description}</td>
                    <td className="p-4">{post.avaliable ? "Yes" : "No"}</td>
                    <td className="p-4">{post.price}</td>
                    <td className="p-4">{post.server}</td>
                    <td className="p-4 space-x-2">
                      <button
                        onClick={() => handleEdit(post)}
                        className="text-blue-600 hover:text-blue-800 transition"
                      >
                        <Edit2 className="inline w-5 h-5" />
                      </button>
                      <button
                        onClick={() => handleDelete(post._id)}
                        className="text-red-600 hover:text-red-800 transition"
                      >
                        <Trash2 className="inline w-5 h-5" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination with small spinner when loading */}
        <div className="mt-6 flex items-center justify-center space-x-2">
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
              className={`px-3 py-1 rounded-md border transition ${
                currentPage === i + 1
                  ? "bg-blue-600 text-white shadow"
                  : "bg-white dark:bg-gray-800 dark:text-white text-gray-700 hover:bg-blue-50 dark:hover:bg-gray-700"
              }`}
            >
              {i + 1}
            </button>
          ))}
        </div>

        {/* Edit Modal */}
        {editData && (
          <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center px-4">
            <div className="bg-white dark:bg-darkCard w-full max-w-lg p-6 rounded-xl shadow-lg">
              <h3 className="text-xl font-semibold mb-4">Edit Post</h3>
              <form onSubmit={handleEditSubmit} className="space-y-4">
                <input
                  type="text"
                  value={editData.description}
                  onChange={(e) =>
                    setEditData({ ...editData, description: e.target.value })
                  }
                  className="w-full p-2 border rounded-md dark:bg-gray-800 dark:text-white"
                  placeholder="Description"
                  required
                />
                <input
                  type="number"
                  value={editData.price}
                  onChange={(e) =>
                    setEditData({ ...editData, price: e.target.value })
                  }
                  className="w-full p-2 border rounded-md dark:bg-gray-800 dark:text-white"
                  placeholder="Price"
                  required
                />
                <input
                  type="text"
                  value={editData.server}
                  onChange={(e) =>
                    setEditData({ ...editData, server: e.target.value })
                  }
                  className="w-full p-2 border rounded-md dark:bg-gray-800 dark:text-white"
                  placeholder="Server"
                  required
                />
                <input
                  type="text"
                  value={editData.discord}
                  onChange={(e) =>
                    setEditData({ ...editData, discord: e.target.value })
                  }
                  className="w-full p-2 border rounded-md dark:bg-gray-800 dark:text-white"
                  placeholder="Discord (optional)"
                />
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={editData.avaliable}
                    onChange={(e) =>
                      setEditData({ ...editData, avaliable: e.target.checked })
                    }
                  />
                  Available
                </label>
                <div className="flex justify-end gap-2 pt-2">
                  <button
                    type="submit"
                    disabled={isSaving}
                    className={`flex items-center gap-2 bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 transition ${
                      isSaving ? "opacity-80 cursor-not-allowed" : ""
                    }`}
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
