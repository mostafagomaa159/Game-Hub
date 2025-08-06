// src/components/adminTabs/UsersTab.js
import React, { useCallback, useEffect, useState } from "react";
import axios from "../../api/axiosInstance";
import SkeletonCard from "../../components/common/SkeletonCard";

const PAGE_SIZE = 12;

export default function UsersTab({
  searchTerm,
  sortBy,
  sortOrder,
  currentPage,
  setCurrentPage,
}) {
  const [loading, setLoading] = useState(false);
  const [users, setUsers] = useState([]);
  const [total, setTotal] = useState(0);

  const [selectedUser, setSelectedUser] = useState(null);
  const [showEditUser, setShowEditUser] = useState(false);

  const [selectedUserPosts, setSelectedUserPosts] = useState([]);
  const [showPostsPanel, setShowPostsPanel] = useState(false);
  const [postsLoading, setPostsLoading] = useState(false);

  // fetch users (headers created inside to avoid stale token / lint warnings)
  const fetchUsers = useCallback(async () => {
    // inside fetchUsers
    console.log(
      "fetchUsers -> baseURL",
      axios.defaults.baseURL,
      "token",
      localStorage.getItem("token")
    );

    try {
      setLoading(true);
      const token = localStorage.getItem("token");
      const headers = { Authorization: `Bearer ${token}` };

      const q = encodeURIComponent(searchTerm || "");
      const res = await axios.get(
        `/admin/users?search=${q}&page=${currentPage}&limit=${PAGE_SIZE}`,
        { headers }
      );

      setUsers(res.data.users || []);
      setTotal(res.data.total ?? 0);
    } catch (err) {
      // if admin route not found, fallback to public /users (quick dev fallback)
      if (err?.response?.status === 404) {
        try {
          const token = localStorage.getItem("token");
          const headers = { Authorization: `Bearer ${token}` };
          const fallback = await axios.get(`/users`, { headers });
          setUsers(fallback.data || []);
          setTotal((fallback.data && fallback.data.length) || 0);
          return;
        } catch (err2) {
          console.error("fallback /users also failed", err2);
        }
      }
      console.error("fetchUsers", err);
    } finally {
      setLoading(false);
    }
  }, [searchTerm, currentPage]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const fetchUserPosts = async (userId) => {
    try {
      setPostsLoading(true);
      const token = localStorage.getItem("token");
      const headers = { Authorization: `Bearer ${token}` };

      const res = await axios.get(`/admin/users/${userId}/posts`, { headers });
      setSelectedUserPosts(res.data.posts || []);
      setShowPostsPanel(true);
    } catch (err) {
      console.error("fetchUserPosts", err);
    } finally {
      setPostsLoading(false);
    }
  };

  const toggleUserActive = async (user) => {
    try {
      // optimistic UI
      setUsers((prev) =>
        prev.map((u) =>
          u._id === user._id ? { ...u, isActive: !u.isActive } : u
        )
      );

      const token = localStorage.getItem("token");
      const headers = { Authorization: `Bearer ${token}` };

      await axios.patch(
        `/admin/users/${user._1d}/toggle-active`.replace("1d", "id"),
        { active: !user.isActive },
        { headers }
      );
    } catch (err) {
      console.error("toggleUserActive", err);
      fetchUsers();
    }
  };

  const saveUser = async (userId, payload) => {
    try {
      setLoading(true);
      const token = localStorage.getItem("token");
      const headers = { Authorization: `Bearer ${token}` };

      const res = await axios.put(`/admin/users/${userId}`, payload, {
        headers,
      });
      setUsers((prev) =>
        prev.map((u) => (u._id === userId ? res.data.user : u))
      );
      setShowEditUser(false);
      setSelectedUser(null);
    } catch (err) {
      console.error("saveUser", err);
    } finally {
      setLoading(false);
    }
  };

  const savePost = async (postId, payload) => {
    try {
      const token = localStorage.getItem("token");
      const headers = { Authorization: `Bearer ${token}` };

      await axios.put(`/admin/posts/${postId}`, payload, { headers });
      setSelectedUserPosts((prev) =>
        prev.map((p) => (p._1d === postId ? { ...p, ...payload } : p))
      );
    } catch (err) {
      console.error("savePost", err);
    }
  };

  const deletePost = async (postId) => {
    if (!window.confirm("Delete this post permanently?")) return;
    try {
      const token = localStorage.getItem("token");
      const headers = { Authorization: `Bearer ${token}` };

      await axios.delete(`/admin/posts/${postId}`, { headers });
      setSelectedUserPosts((prev) => prev.filter((p) => p._id !== postId));
    } catch (err) {
      console.error("deletePost", err);
    }
  };

  const EditUserForm = ({ user }) => {
    const [form, setForm] = useState({
      name: user.name || "",
      email: user.email || "",
      role: user.role || "user",
      isActive: !!user.isActive,
    });

    const submit = (e) => {
      e.preventDefault();
      saveUser(user._id, form);
    };

    return (
      <form onSubmit={submit} className="bg-gray-800 p-4 rounded">
        <div className="mb-2">
          <label className="block text-sm">Name</label>
          <input
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            className="w-full p-2 rounded bg-gray-900"
          />
        </div>
        <div className="mb-2">
          <label className="block text-sm">Email</label>
          <input
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
            className="w-full p-2 rounded bg-gray-900"
          />
        </div>
        <div className="mb-2">
          <label className="block text-sm">Role</label>
          <select
            value={form.role}
            onChange={(e) => setForm({ ...form, role: e.target.value })}
            className="w-full p-2 rounded bg-gray-900"
          >
            <option value="user">User</option>
            <option value="seller">Seller</option>
            <option value="admin">Admin</option>
          </select>
        </div>
        <div className="flex gap-2">
          <button className="px-3 py-1 rounded bg-blue-600" type="submit">
            Save
          </button>
          <button
            type="button"
            onClick={() => {
              setShowEditUser(false);
              setSelectedUser(null);
            }}
            className="px-3 py-1 rounded bg-gray-600"
          >
            Cancel
          </button>
        </div>
      </form>
    );
  };

  return (
    <div className="p-2">
      <h2 className="text-xl font-semibold mb-3">Users</h2>

      {loading ? (
        <div>
          {Array.from({ length: 6 }).map((_, i) => (
            <SkeletonCard key={i} />
          ))}
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {users.map((user) => (
              <div
                key={user._id}
                className="bg-gray-800 p-3 rounded flex justify-between items-start"
              >
                <div>
                  <div className="font-semibold">
                    {user.name}{" "}
                    {user.role === "admin" && (
                      <span className="text-sm ml-2">(admin)</span>
                    )}
                  </div>
                  <div className="text-sm text-gray-300">{user.email}</div>
                  <div className="text-xs text-gray-400">ID: {user._id}</div>
                  <div className="text-xs text-gray-400">
                    Role: {user.role || "user"}
                  </div>
                </div>

                <div className="flex flex-col gap-2 items-end">
                  <button
                    onClick={() => {
                      setSelectedUser(user);
                      setShowEditUser(true);
                    }}
                    className="px-2 py-1 rounded bg-blue-600 text-sm"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => toggleUserActive(user)}
                    className="px-2 py-1 rounded text-sm"
                  >
                    {user.isActive ? "Disable" : "Enable"}
                  </button>
                  <button
                    onClick={() => fetchUserPosts(user._id)}
                    className="px-2 py-1 rounded bg-gray-700 text-sm"
                  >
                    View posts
                  </button>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-4 flex justify-between items-center">
            <div className="text-sm text-gray-400">Total users: {total}</div>
            <div className="flex gap-2">
              <button
                onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                disabled={currentPage === 1}
                className="px-3 py-1 rounded bg-gray-700"
              >
                Prev
              </button>
              <div className="px-3 py-1 rounded bg-gray-900">
                Page {currentPage}
              </div>
              <button
                onClick={() => setCurrentPage(currentPage + 1)}
                className="px-3 py-1 rounded bg-gray-700"
              >
                Next
              </button>
            </div>
          </div>
        </>
      )}

      {showEditUser && selectedUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="w-full max-w-2xl">
            <div className="bg-gray-900 p-4 rounded">
              <div className="flex justify-between items-center mb-3">
                <h3 className="text-lg font-semibold">Edit User</h3>
                <button
                  onClick={() => {
                    setShowEditUser(false);
                    setSelectedUser(null);
                  }}
                  className="px-2 py-1 rounded bg-gray-700"
                >
                  Close
                </button>
              </div>
              <EditUserForm user={selectedUser} />
            </div>
          </div>
        </div>
      )}

      {showPostsPanel && (
        <div className="fixed inset-0 z-40 flex">
          <div className="w-full md:w-2/3 lg:w-1/2 bg-gray-900 p-4 overflow-y-auto">
            <div className="flex justify-between items-center mb-3">
              <h3 className="text-lg font-semibold">User Posts</h3>
              <button
                onClick={() => {
                  setShowPostsPanel(false);
                  setSelectedUserPosts([]);
                }}
                className="px-2 py-1 rounded bg-gray-700"
              >
                Close
              </button>
            </div>

            {postsLoading ? (
              <div>Loading posts...</div>
            ) : selectedUserPosts.length === 0 ? (
              <div className="text-sm text-gray-400">No posts found.</div>
            ) : (
              <div className="space-y-3">
                {selectedUserPosts.map((post) => (
                  <div key={post._id} className="bg-gray-800 p-3 rounded">
                    <div className="flex justify-between">
                      <div>
                        <div className="font-semibold">
                          {post.title || post.description?.slice(0, 60)}
                        </div>
                        <div className="text-sm text-gray-300">
                          {post.description?.slice(0, 200)}
                        </div>
                        <div className="text-xs text-gray-400">
                          Post ID: {post._id}
                        </div>
                      </div>
                      <div className="flex flex-col gap-2">
                        <button
                          onClick={() => {
                            const newTitle = prompt(
                              "Edit title",
                              post.title || ""
                            );
                            if (newTitle !== null)
                              savePost(post._id, { title: newTitle });
                          }}
                          className="px-2 py-1 rounded bg-blue-600 text-sm"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => deletePost(post._id)}
                          className="px-2 py-1 rounded bg-red-600 text-sm"
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
          <div
            className="flex-1"
            onClick={() => {
              setShowPostsPanel(false);
              setSelectedUserPosts([]);
            }}
          />
        </div>
      )}
    </div>
  );
}
