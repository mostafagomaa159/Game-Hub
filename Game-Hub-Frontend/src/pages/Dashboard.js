import React, { useEffect, useState } from "react";
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
  const postsPerPage = 5;

  useEffect(() => {
    fetchPosts();
  }, []);

  const fetchPosts = async () => {
    try {
      const token = localStorage.getItem("token");
      const res = await axios.get("/newpost", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      setPosts(res.data);
      setLoading(false);
    } catch (err) {
      console.error(err);
      setError("Failed to fetch posts. Please log in.");
      setLoading(false);
    }
  };

  const handleEdit = (post) => setEditData({ ...post });

  const handleEditSubmit = async (e) => {
    e.preventDefault();
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
      fetchPosts();
    } catch (err) {
      console.error(err);
      toast.error("Failed to update post.");
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
    const matchesSearch = post.description
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
  const totalPages = Math.ceil(filteredPosts.length / postsPerPage);

  return (
    <div className="min-h-screen bg-white dark:bg-darkBackground text-gray-800 dark:text-gray-200 p-6">
      <div className="max-w-6xl mx-auto">
        <ToastContainer />
        <h2 className="text-3xl font-bold mb-6">Your Posts</h2>

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

        {/* Table */}
        {loading ? (
          <p>Loading...</p>
        ) : error ? (
          <p className="text-red-600">{error}</p>
        ) : filteredPosts.length === 0 ? (
          <p>No posts found.</p>
        ) : (
          <>
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
                  {currentPosts.map((post) => (
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
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            <div className="mt-6 flex justify-center space-x-2">
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
          </>
        )}

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
                    className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 transition"
                  >
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
