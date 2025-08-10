// src/components/adminTabs/UsersTab.js
import React, { useCallback, useEffect, useState } from "react";
import axios from "../../api/axiosInstance";
import SkeletonCard from "../../components/common/SkeletonCard";
import { toast } from "react-toastify";
import {
  FiEdit2,
  FiTrash2,
  FiChevronLeft,
  FiChevronRight,
  FiX,
  FiCheck,
  FiUser,
  FiDollarSign,
  FiServer,
  FiMessageSquare,
  FiMoreVertical,
  FiArrowLeft,
} from "react-icons/fi";

const PAGE_SIZE = 12;

function coerceBool(val) {
  if (val === undefined || val === null) return false;
  if (typeof val === "boolean") return val;
  if (typeof val === "string") {
    const s = val.toLowerCase();
    return s === "true" || s === "1" || s === "yes";
  }
  if (typeof val === "number") return val !== 0;
  return !!val;
}

export default function UsersTab({
  searchTerm,
  sortBy,
  sortOrder,
  currentPage,
  setCurrentPage,
}) {
  // --- global state
  const [loading, setLoading] = useState(false);
  const [users, setUsers] = useState([]);
  const [totalPages, setTotalPages] = useState(null);

  const [selectedUser, setSelectedUser] = useState(null);
  const [showEditUser, setShowEditUser] = useState(false);

  const [selectedUserPosts, setSelectedUserPosts] = useState([]);
  const [showPostsPanel, setShowPostsPanel] = useState(false);
  const [postsLoading, setPostsLoading] = useState(false);

  // track loading for post-level admin actions
  const [actionLoadingMap, setActionLoadingMap] = useState({});
  const [editPostData, setEditPostData] = useState(null);

  // --- fetch users
  const fetchUsers = useCallback(
    async (page = currentPage) => {
      try {
        setLoading(true);
        const q = encodeURIComponent(searchTerm || "");
        const res = await axios.get(
          `/admin/users?search=${q}&page=${page}&limit=${PAGE_SIZE}`
        );
        const data = res?.data || {};
        const fetched = data.users || data.data || [];
        setUsers(fetched);
        if (data.totalPages) setTotalPages(Number(data.totalPages));
        else if (data.total && data.limit)
          setTotalPages(Math.ceil(data.total / data.limit));
        else setTotalPages(null);
      } catch (err) {
        console.error("fetchUsers", err);
        toast.error("Failed to load users");
      } finally {
        setLoading(false);
      }
    },
    [searchTerm, currentPage]
  );

  useEffect(() => {
    if (setCurrentPage) setCurrentPage(1);
  }, [searchTerm, setCurrentPage]);

  useEffect(() => {
    fetchUsers(currentPage);
  }, [fetchUsers, currentPage]);

  // --- fetch posts for a user
  const fetchUserPosts = async (userId, page = 1) => {
    try {
      setPostsLoading(true);
      const res = await axios.get(
        `/admin/users/${userId}/posts?page=${page}&limit=50`
      );
      const data = res?.data || {};
      const posts = data.posts || data.data || [];
      setSelectedUserPosts(posts);
      setShowPostsPanel(true);
    } catch (err) {
      console.error("fetchUserPosts", err);
      toast.error("Failed to load user posts");
    } finally {
      setPostsLoading(false);
    }
  };

  // --- helper to set per-post action loading flags
  const setActionLoading = (postId, val) =>
    setActionLoadingMap((prev) => ({ ...prev, [postId]: !!val }));

  // --- Force release a post (admin)
  const forceReleasePost = async (postId) => {
    if (
      !window.confirm(
        "Force release this trade now? This will release funds to the seller."
      )
    )
      return;
    try {
      setActionLoading(postId, true);
      const res = await axios.post(`/admin/trades/${postId}/force-release`);
      toast.success(res?.data?.message || "Trade force released");
      // refresh posts list to show updated tradeStatus
      if (selectedUser) await fetchUserPosts(selectedUser._id);
      fetchUsers(currentPage);
    } catch (err) {
      console.error("forceReleasePost", err);
      toast.error(err?.response?.data?.error || "Force release failed");
    } finally {
      setActionLoading(postId, false);
    }
  };

  // --- Refund / cancel a post (admin)
  const refundPost = async (postId) => {
    if (!window.confirm("Refund this trade (return coins to buyer)?")) return;
    try {
      setActionLoading(postId, true);
      const res = await axios.post(`/admin/trades/${postId}/refund`);
      toast.success(res?.data?.message || "Trade refunded");
      // refresh posts list and users
      if (selectedUser) await fetchUserPosts(selectedUser._id);
      fetchUsers(currentPage);
    } catch (err) {
      console.error("refundPost", err);
      toast.error(err?.response?.data?.error || "Refund failed");
    } finally {
      setActionLoading(postId, false);
    }
  };

  // --- toggle active
  const toggleUserActive = async (user) => {
    // optimistic UI
    setUsers((prev) =>
      prev.map((u) =>
        u._id === user._id ? { ...u, isActive: !coerceBool(u.isActive) } : u
      )
    );
    try {
      const payload = { active: !coerceBool(user.isActive) };
      const res = await axios.patch(
        `/admin/users/${user._id}/toggle-active`,
        payload
      );
      if (res?.data?.user) {
        setUsers((prev) =>
          prev.map((u) => (u._id === user._id ? res.data.user : u))
        );
      } else {
        fetchUsers();
      }
    } catch (err) {
      console.error("toggleUserActive", err);
      fetchUsers();
    }
  };

  // --- save user
  const ALLOWED_USER_UPDATES = [
    "name",
    "email",
    "role",
    "coins",
    "isActive",
    "isAdmin",
  ];
  const saveUser = async (userId, form) => {
    try {
      // Build payload strictly from allowed keys
      const payload = {};
      ALLOWED_USER_UPDATES.forEach((k) => {
        if (form[k] !== undefined && form[k] !== null) {
          if (k === "coins") payload.coins = Number(form.coins) || 0;
          else if (k === "isActive" || k === "isAdmin") payload[k] = !!form[k];
          else payload[k] = form[k];
        }
      });

      const res = await axios.put(`/admin/users/${userId}`, payload);
      const updated = res?.data?.user || res?.data;
      if (updated) {
        setUsers((prev) => prev.map((u) => (u._id === userId ? updated : u)));
        setShowEditUser(false);
        setSelectedUser(null);
        toast.success("User updated successfully");
      } else {
        fetchUsers();
      }
    } catch (err) {
      console.error("saveUser", err);
      const invalid = err?.response?.data?.invalid;
      if (invalid) {
        toast.error(`Invalid fields: ${invalid.join(", ")}`);
      } else if (err?.response?.data?.error) {
        toast.error(err.response.data.error);
      } else {
        toast.error("Failed to update user");
      }
      fetchUsers();
    }
  };

  // --- save post
  const POST_ALLOWED = [
    "avaliable",
    "description",
    "price",
    "discord",
    "server",
    "isActive",
    "good_response",
    "bad_response",
    "tradeStatus",
  ];

  const savePost = async (postId, formPayload) => {
    try {
      const payload = {};
      POST_ALLOWED.forEach((k) => {
        if (formPayload[k] !== undefined && formPayload[k] !== null) {
          if (k === "price") payload.price = Number(formPayload.price) || 0;
          else if (k === "avaliable" || k === "isActive")
            payload[k] = !!formPayload[k];
          else if (k === "good_response" || k === "bad_response")
            payload[k] = Number(formPayload[k]) || 0;
          else payload[k] = formPayload[k];
        }
      });

      if (
        formPayload.available !== undefined &&
        payload.avaliable === undefined
      ) {
        payload.avaliable = !!formPayload.available;
      }

      const res = await axios.put(`/admin/posts/${postId}`, payload);
      const updated = res?.data || null;
      if (updated) {
        setSelectedUserPosts((prev) =>
          prev.map((p) => (p._id === postId ? updated : p))
        );
        setEditPostData(null);
        toast.success("Post updated successfully");
      } else {
        setSelectedUserPosts((prev) =>
          prev.map((p) => (p._id === postId ? { ...p, ...payload } : p))
        );
        setEditPostData(null);
        toast.success("Post updated successfully");
      }
    } catch (err) {
      console.error("savePost", err);
      const invalid = err?.response?.data?.invalid;
      if (invalid) {
        toast.error(`Invalid fields: ${invalid.join(", ")}`);
      } else if (err?.response?.data?.error) {
        toast.error(err.response.data.error);
      } else {
        toast.error("Failed to update post");
      }
    }
  };

  // --- delete post
  const deletePost = async (postId) => {
    if (!window.confirm("Delete this post permanently?")) return;
    try {
      await axios.delete(`/admin/posts/${postId}`);
      setSelectedUserPosts((prev) => prev.filter((p) => p._id !== postId));
      toast.success("Post deleted successfully");
    } catch (err) {
      console.error("deletePost", err);
      toast.error("Failed to delete post");
    }
  };

  // --- UI components
  const Avatar = ({ user }) => {
    const initials =
      (user?.name || "")
        .split(" ")
        .map((s) => s[0])
        .slice(0, 2)
        .join("")
        .toUpperCase() || "?";
    return (
      <div className="h-10 w-10 rounded-full bg-gradient-to-br from-gray-200 to-gray-300 dark:from-gray-700 dark:to-gray-600 flex items-center justify-center text-sm font-semibold text-gray-800 dark:text-gray-100">
        {user?.avatarUrl ? (
          <img
            src={user.avatarUrl}
            alt={user.name}
            className="h-10 w-10 rounded-full object-cover"
          />
        ) : (
          <span>{initials}</span>
        )}
      </div>
    );
  };

  const RoleBadge = ({ user }) => {
    const isAdmin = !!user?.isAdmin;
    const role = user?.role || (isAdmin ? "admin" : "user");
    const colorMap = {
      admin:
        "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300",
      seller:
        "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300",
      user: "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300",
    };
    return (
      <span
        className={`text-xs px-2 py-1 rounded-full ${
          colorMap[role] || colorMap.user
        }`}
      >
        {role}
      </span>
    );
  };

  const StatusBadge = ({ active }) => (
    <span
      className={`px-2 py-1 rounded-full text-xs ${
        active
          ? "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300"
          : "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300"
      }`}
    >
      {active ? "Active" : "Banned"}
    </span>
  );

  const TradeStatusBadge = ({ status }) => {
    const statusMap = {
      available: {
        class:
          "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300",
        text: "Available",
      },
      pending: {
        class:
          "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300",
        text: "Pending",
      },
      completed: {
        class:
          "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300",
        text: "Completed",
      },
      cancelled: {
        class: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300",
        text: "Cancelled",
      },
      pending_release: {
        class:
          "bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300",
        text: "Pending Release",
      },
    };

    const statusInfo = statusMap[status] || {
      class: "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300",
      text: status || "Unknown",
    };

    return (
      <span className={`px-2 py-1 rounded-full text-xs ${statusInfo.class}`}>
        {statusInfo.text}
      </span>
    );
  };

  /* ---------------------------
     Edit User Form
     --------------------------- */
  const EditUserForm = ({ user }) => {
    const [form, setForm] = useState({
      name: user.name || "",
      email: user.email || "",
      role: user.role || (user.isAdmin ? "admin" : "user"),
      coins: user.coins ?? 0,
      paypalEmail: user.paypalEmail || "",
      isActive: coerceBool(user.isActive),
      isAdmin: !!user.isAdmin,
    });
    const [saving, setSaving] = useState(false);
    const [savedOk, setSavedOk] = useState(false);

    const submit = async (e) => {
      e.preventDefault();
      try {
        setSaving(true);
        await saveUser(user._id, form);
        setSavedOk(true);
        setTimeout(() => setSavedOk(false), 1300);
      } finally {
        setSaving(false);
      }
    };

    return (
      <form
        onSubmit={submit}
        className="bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 rounded-lg shadow-xl overflow-hidden border border-gray-200 dark:border-gray-700 w-full max-w-md"
      >
        <div className="p-5 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700/50">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold flex items-center gap-2">
              <FiUser className="text-blue-500" /> Edit User
            </h3>
            <button
              type="button"
              onClick={() => {
                setShowEditUser(false);
                setSelectedUser(null);
              }}
              className="text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"
            >
              <FiX size={20} />
            </button>
          </div>
          <div className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            ID: {user._id?.slice(-6)}
          </div>
        </div>

        <div className="p-5 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Name
            </label>
            <input
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              className="w-full px-3 py-2 rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Email
            </label>
            <input
              type="email"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              className="w-full px-3 py-2 rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Role
              </label>
              <select
                value={form.role}
                onChange={(e) => setForm({ ...form, role: e.target.value })}
                className="w-full px-3 py-2 rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="user">User</option>
                <option value="seller">Seller</option>
                <option value="admin">Admin</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Coins
              </label>
              <input
                type="number"
                min="0"
                value={form.coins}
                onChange={(e) =>
                  setForm({ ...form, coins: Number(e.target.value) })
                }
                className="w-full px-3 py-2 rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>

          <div className="flex items-center gap-4">
            <label className="inline-flex items-center">
              <input
                type="checkbox"
                checked={form.isActive}
                onChange={(e) =>
                  setForm({ ...form, isActive: e.target.checked })
                }
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700"
              />
              <span className="ml-2 text-sm text-gray-700 dark:text-gray-300">
                Active
              </span>
            </label>
            <label className="inline-flex items-center">
              <input
                type="checkbox"
                checked={form.isAdmin}
                onChange={(e) =>
                  setForm({ ...form, isAdmin: e.target.checked })
                }
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700"
              />
              <span className="ml-2 text-sm text-gray-700 dark:text-gray-300">
                Admin
              </span>
            </label>
          </div>
        </div>

        <div className="px-5 py-4 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700/50 flex justify-end gap-3">
          <button
            type="button"
            onClick={() => {
              setShowEditUser(false);
              setSelectedUser(null);
            }}
            className="px-4 py-2 rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={saving}
            className="px-4 py-2 rounded-md border border-transparent bg-blue-600 text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-70 flex items-center justify-center min-w-[80px]"
          >
            {saving ? (
              <svg
                className="animate-spin h-4 w-4 text-white"
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
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                ></path>
              </svg>
            ) : savedOk ? (
              <FiCheck className="mr-1" />
            ) : null}
            {savedOk ? "Saved" : saving ? "Saving..." : "Save"}
          </button>
        </div>
      </form>
    );
  };

  /* ---------------------------
     EDIT POST FORM
     --------------------------- */
  const EditPostForm = ({ post }) => {
    const [form, setForm] = useState({
      avaliable: post.avaliable ?? post.available ?? false,
      description: post.description || "",
      price: post.price ?? 0,
      discord: post.discord || "",
      server: post.server || "",
      good_response: post.good_response ?? 0,
      bad_response: post.bad_response ?? 0,
      tradeStatus: post.tradeStatus || "available",
      isActive: post.isActive ?? false,
    });

    const [saving, setSaving] = useState(false);
    const [savedOk, setSavedOk] = useState(false);
    const [errors, setErrors] = useState({});

    const validate = () => {
      const e = {};
      if (!form.description || form.description.trim().length < 3)
        e.description = "Description is too short";
      if (Number.isNaN(Number(form.price))) e.price = "Invalid price";
      else if (Number(form.price) < 0) e.price = "Price must be >= 0";
      return e;
    };

    const submit = async (e) => {
      e?.preventDefault?.();
      const eobj = validate();
      setErrors(eobj);
      if (Object.keys(eobj).length) return;

      setSaving(true);
      try {
        await savePost(post._id, form);
        setSavedOk(true);
        setTimeout(() => setSavedOk(false), 1400);
      } catch (err) {
        console.error("EditPostForm submit:", err);
      } finally {
        setSaving(false);
      }
    };

    if (saving) {
      return (
        <div className="p-4">
          <SkeletonCard variant="form" />
        </div>
      );
    }

    return (
      <div className="w-full max-w-4xl mx-auto bg-white dark:bg-gray-800 rounded-xl shadow-xl overflow-hidden border border-gray-200 dark:border-gray-700">
        {/* Header */}
        <div className="p-4 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700/50 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setEditPostData(null)}
              className="p-1 rounded-md hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-300"
            >
              <FiArrowLeft size={20} />
            </button>
            <div>
              <h3 className="text-lg font-semibold">Edit Post</h3>
              <div className="text-xs text-gray-500 dark:text-gray-400">
                ID: {post._id}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <TradeStatusBadge status={form.tradeStatus} />
            <button
              onClick={() => setEditPostData(null)}
              className="p-1 rounded-md hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-300"
            >
              <FiX size={20} />
            </button>
          </div>
        </div>

        {/* Form */}
        <form
          onSubmit={submit}
          className="p-4 grid grid-cols-1 lg:grid-cols-3 gap-4"
        >
          {/* Left column */}
          <div className="lg:col-span-2 space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Description
              </label>
              <textarea
                value={form.description}
                onChange={(e) =>
                  setForm({ ...form, description: e.target.value })
                }
                rows={6}
                className={`w-full px-3 py-2 rounded-md border ${
                  errors.description
                    ? "border-red-500"
                    : "border-gray-300 dark:border-gray-600"
                } bg-white dark:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent`}
                required
              />
              {errors.description && (
                <p className="mt-1 text-sm text-red-600">
                  {errors.description}
                </p>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Price
                </label>
                <div className="relative rounded-md shadow-sm">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <FiDollarSign className="text-gray-400" />
                  </div>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={form.price}
                    onChange={(e) =>
                      setForm({ ...form, price: e.target.value })
                    }
                    className={`block w-full pl-8 pr-3 py-2 rounded-md border ${
                      errors.price
                        ? "border-red-500"
                        : "border-gray-300 dark:border-gray-600"
                    } bg-white dark:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent`}
                  />
                </div>
                {errors.price && (
                  <p className="mt-1 text-sm text-red-600">{errors.price}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Server
                </label>
                <div className="relative rounded-md shadow-sm">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <FiServer className="text-gray-400" />
                  </div>
                  <input
                    value={form.server}
                    onChange={(e) =>
                      setForm({ ...form, server: e.target.value })
                    }
                    className="block w-full pl-8 pr-3 py-2 rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Discord
                </label>
                <div className="relative rounded-md shadow-sm">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <FiMessageSquare className="text-gray-400" />
                  </div>
                  <input
                    value={form.discord}
                    onChange={(e) =>
                      setForm({ ...form, discord: e.target.value })
                    }
                    className="block w-full pl-8 pr-3 py-2 rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Right column */}
          <div className="space-y-4">
            <div className="bg-gray-50 dark:bg-gray-700/30 p-4 rounded-md border border-gray-200 dark:border-gray-700">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    Available
                  </label>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={form.avaliable}
                      onChange={(e) =>
                        setForm({ ...form, avaliable: e.target.checked })
                      }
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-600 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-500 peer-checked:bg-blue-600"></div>
                  </label>
                </div>

                <div className="flex items-center justify-between">
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    Active
                  </label>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={form.isActive}
                      onChange={(e) =>
                        setForm({ ...form, isActive: e.target.checked })
                      }
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-600 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-500 peer-checked:bg-blue-600"></div>
                  </label>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Good Responses
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={form.good_response}
                    onChange={(e) =>
                      setForm({ ...form, good_response: e.target.value })
                    }
                    className="w-full px-3 py-2 rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Bad Responses
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={form.bad_response}
                    onChange={(e) =>
                      setForm({ ...form, bad_response: e.target.value })
                    }
                    className="w-full px-3 py-2 rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Trade Status
                  </label>
                  <select
                    value={form.tradeStatus}
                    onChange={(e) =>
                      setForm({ ...form, tradeStatus: e.target.value })
                    }
                    className="w-full px-3 py-2 rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="available">Available</option>
                    <option value="pending">Pending</option>
                    <option value="completed">Completed</option>
                    <option value="cancelled">Cancelled</option>
                    <option value="pending_release">Pending Release</option>
                  </select>
                </div>
              </div>
            </div>

            <div className="bg-gray-50 dark:bg-gray-700/30 p-4 rounded-md border border-gray-200 dark:border-gray-700">
              <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Preview
              </h4>
              <div className="text-sm text-gray-600 dark:text-gray-400 mb-3 line-clamp-3">
                {form.description?.slice(0, 200) || "(no description)"}
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-600 dark:text-gray-400">Price:</span>
                <span className="font-medium">
                  {form.price ? `$${form.price}` : "-"}
                </span>
              </div>
              <div className="flex items-center justify-between text-sm mt-1">
                <span className="text-gray-600 dark:text-gray-400">
                  Status:
                </span>
                <TradeStatusBadge status={form.tradeStatus} />
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="lg:col-span-3 pt-4 border-t border-gray-200 dark:border-gray-700 flex justify-end gap-3">
            <button
              type="button"
              onClick={() => setEditPostData(null)}
              className="px-4 py-2 rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="px-4 py-2 rounded-md border border-transparent bg-blue-600 text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-70 flex items-center justify-center min-w-[100px]"
            >
              {saving ? (
                <>
                  <svg
                    className="animate-spin -ml-1 mr-2 h-4 w-4 text-white"
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
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    ></path>
                  </svg>
                  Saving...
                </>
              ) : savedOk ? (
                <>
                  <FiCheck className="mr-1" /> Saved
                </>
              ) : (
                "Save Changes"
              )}
            </button>
          </div>
        </form>
      </div>
    );
  };

  // pagination helpers
  const gotoPrev = () => {
    if (currentPage > 1 && setCurrentPage) setCurrentPage(currentPage - 1);
  };
  const gotoNext = () => {
    if (totalPages && currentPage >= totalPages) return;
    if (setCurrentPage) setCurrentPage(currentPage + 1);
  };

  // --- main render
  return (
    <div className="p-4 md:p-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
            User Management
          </h2>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Manage all platform users and their posts
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="text-sm text-gray-600 dark:text-gray-400">
            {loading ? (
              <span className="inline-flex items-center gap-2">
                <svg
                  className="animate-spin h-4 w-4 text-gray-400"
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
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  ></path>
                </svg>
                Loading...
              </span>
            ) : (
              `${users.length} user${users.length !== 1 ? "s" : ""}`
            )}
          </div>
        </div>
      </div>

      {/* USERS GRID */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <SkeletonCard key={i} variant="user" />
          ))}
        </div>
      ) : users.length === 0 ? (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-8 text-center border border-gray-200 dark:border-gray-700">
          <div className="mx-auto h-16 w-16 text-gray-400 dark:text-gray-500">
            <FiUser className="w-full h-full" />
          </div>
          <h3 className="mt-2 text-lg font-medium text-gray-900 dark:text-white">
            No users found
          </h3>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            {searchTerm
              ? "Try a different search term"
              : "There are currently no users"}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {users.map((user) => (
            <div
              key={user._id}
              className="bg-white dark:bg-gray-800 rounded-lg shadow-sm hover:shadow-md transition-shadow border border-gray-200 dark:border-gray-700 overflow-hidden"
            >
              <div className="p-4">
                <div className="flex items-start gap-3">
                  <Avatar user={user} />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <h3 className="font-semibold text-gray-900 dark:text-white truncate">
                        {user.name}
                      </h3>
                      <RoleBadge user={user} />
                    </div>
                    <p className="text-sm text-gray-600 dark:text-gray-400 truncate mt-1">
                      {user.email}
                    </p>

                    <div className="mt-3 flex items-center gap-2 flex-wrap">
                      <StatusBadge active={coerceBool(user.isActive)} />
                      <span className="text-xs text-gray-600 dark:text-gray-400">
                        Coins:{" "}
                        <span className="font-medium text-gray-900 dark:text-white">
                          {user.coins ?? 0}
                        </span>
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="px-4 pb-4">
                <div className="hidden md:flex items-center gap-2">
                  <button
                    onClick={() => {
                      setSelectedUser(user);
                      setShowEditUser(true);
                    }}
                    className="flex-1 px-3 py-1.5 rounded-md text-sm font-medium bg-blue-600 hover:bg-blue-700 text-white flex items-center justify-center gap-1"
                  >
                    <FiEdit2 size={14} /> Edit
                  </button>
                  <button
                    onClick={() => toggleUserActive(user)}
                    className="flex-1 px-3 py-1.5 rounded-md text-sm font-medium bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-800 dark:text-gray-200 flex items-center justify-center gap-1"
                  >
                    {coerceBool(user.isActive) ? (
                      <>
                        <FiX size={14} /> Ban
                      </>
                    ) : (
                      <>
                        <FiCheck size={14} /> Unban
                      </>
                    )}
                  </button>
                  <button
                    onClick={() => fetchUserPosts(user._id)}
                    className="flex-1 px-3 py-1.5 rounded-md text-sm font-medium bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-800 dark:text-gray-200 flex items-center justify-center gap-1"
                  >
                    <FiMessageSquare size={14} /> Posts
                  </button>
                </div>

                {/* Mobile actions */}
                <div className="md:hidden">
                  <div className="relative">
                    <button
                      className="w-full px-3 py-1.5 rounded-md text-sm font-medium bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-800 dark:text-gray-200 flex items-center justify-center gap-1"
                      onClick={() => {
                        const el = document.getElementById(
                          `actions-${user._id}`
                        );
                        if (el) el.classList.toggle("hidden");
                      }}
                    >
                      <span>Actions</span>
                      <FiMoreVertical size={14} />
                    </button>

                    <div
                      id={`actions-${user._id}`}
                      className="hidden absolute z-10 mt-1 w-full rounded-md shadow-lg bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700"
                    >
                      <div className="py-1">
                        <button
                          onClick={() => {
                            setSelectedUser(user);
                            setShowEditUser(true);
                            document
                              .getElementById(`actions-${user._id}`)
                              ?.classList.add("hidden");
                          }}
                          className="block w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                        >
                          <span className="flex items-center gap-2">
                            <FiEdit2 size={14} /> Edit Profile
                          </span>
                        </button>
                        <button
                          onClick={() => {
                            toggleUserActive(user);
                            document
                              .getElementById(`actions-${user._id}`)
                              ?.classList.add("hidden");
                          }}
                          className="block w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                        >
                          <span className="flex items-center gap-2">
                            {coerceBool(user.isActive) ? (
                              <>
                                <FiX size={14} /> Ban User
                              </>
                            ) : (
                              <>
                                <FiCheck size={14} /> Unban User
                              </>
                            )}
                          </span>
                        </button>
                        <button
                          onClick={() => {
                            fetchUserPosts(user._id);
                            document
                              .getElementById(`actions-${user._id}`)
                              ?.classList.add("hidden");
                          }}
                          className="block w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                        >
                          <span className="flex items-center gap-2">
                            <FiMessageSquare size={14} /> View Posts
                          </span>
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Pagination */}
      {users.length > 0 && (
        <div className="mt-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="text-sm text-gray-600 dark:text-gray-400">
            {totalPages
              ? `Page ${currentPage} of ${totalPages}`
              : `Page ${currentPage}`}
          </div>
          <div className="flex gap-2">
            <button
              onClick={gotoPrev}
              disabled={currentPage <= 1}
              className="px-4 py-2 rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1"
            >
              <FiChevronLeft size={18} /> Prev
            </button>
            <button
              onClick={gotoNext}
              disabled={totalPages && currentPage >= totalPages}
              className="px-4 py-2 rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1"
            >
              Next <FiChevronRight size={18} />
            </button>
          </div>
        </div>
      )}

      {/* Edit User Modal */}
      {showEditUser && selectedUser && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            <div
              className="fixed inset-0 transition-opacity"
              aria-hidden="true"
              onClick={() => {
                setShowEditUser(false);
                setSelectedUser(null);
              }}
            >
              <div className="absolute inset-0 bg-gray-500 dark:bg-gray-900 opacity-75"></div>
            </div>
            <span
              className="hidden sm:inline-block sm:align-middle sm:h-screen"
              aria-hidden="true"
            >
              &#8203;
            </span>
            <div className="inline-block align-bottom bg-white dark:bg-gray-800 rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
              <EditUserForm user={selectedUser} />
            </div>
          </div>
        </div>
      )}

      {/* Posts Panel */}
      {showPostsPanel && (
        <div className="fixed inset-0 z-40 overflow-hidden">
          <div className="absolute inset-0 overflow-hidden">
            <div
              className="absolute inset-0 bg-gray-500 dark:bg-gray-900 bg-opacity-75 dark:bg-opacity-75 transition-opacity"
              onClick={() => {
                setShowPostsPanel(false);
                setSelectedUserPosts([]);
              }}
            ></div>
            <div className="fixed inset-y-0 right-0 pl-10 max-w-full flex">
              <div className="w-screen max-w-md md:max-w-2xl">
                <div className="h-full flex flex-col bg-white dark:bg-gray-800 shadow-xl overflow-y-scroll border-l border-gray-200 dark:border-gray-700">
                  <div className="flex-1">
                    {/* Header */}
                    <div className="px-4 py-6 sm:px-6 bg-gray-50 dark:bg-gray-700/50 border-b border-gray-200 dark:border-gray-700">
                      <div className="flex items-center justify-between">
                        <h2 className="text-lg font-medium text-gray-900 dark:text-white">
                          User Posts
                        </h2>
                        <div className="ml-3 h-7 flex items-center">
                          <button
                            onClick={() => {
                              setShowPostsPanel(false);
                              setSelectedUserPosts([]);
                            }}
                            className="bg-white dark:bg-gray-700 rounded-md text-gray-400 dark:text-gray-300 hover:text-gray-500 dark:hover:text-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
                          >
                            <span className="sr-only">Close panel</span>
                            <FiX className="h-6 w-6" />
                          </button>
                        </div>
                      </div>
                      <div className="mt-1">
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                          {selectedUser?.name || "User"}
                        </p>
                      </div>
                    </div>

                    {/* Content */}
                    <div className="p-4 sm:p-6">
                      {postsLoading ? (
                        <div className="space-y-4">
                          {Array.from({ length: 3 }).map((_, i) => (
                            <SkeletonCard key={i} variant="post" />
                          ))}
                        </div>
                      ) : selectedUserPosts.length === 0 ? (
                        <div className="text-center py-8">
                          <div className="mx-auto h-16 w-16 text-gray-400 dark:text-gray-500">
                            <FiMessageSquare className="w-full h-full" />
                          </div>
                          <h3 className="mt-2 text-lg font-medium text-gray-900 dark:text-white">
                            No posts found
                          </h3>
                          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                            This user hasn't created any posts yet
                          </p>
                        </div>
                      ) : (
                        <div className="space-y-4">
                          {selectedUserPosts.map((post) => (
                            <div
                              key={post._id}
                              className="bg-white dark:bg-gray-700/30 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden"
                            >
                              <div className="p-4">
                                <div className="flex items-start justify-between">
                                  <div className="flex-1 min-w-0">
                                    <h4 className="font-medium text-gray-900 dark:text-white line-clamp-2">
                                      {post.description?.slice(0, 100) ||
                                        "(no title)"}
                                    </h4>
                                    <p className="mt-1 text-sm text-gray-600 dark:text-gray-400 line-clamp-2">
                                      {post.description?.slice(0, 200) ||
                                        "(no description)"}
                                    </p>
                                  </div>
                                  <div className="ml-4 flex-shrink-0">
                                    <div className="text-lg font-semibold text-gray-900 dark:text-white">
                                      ${post.price ?? "0"}
                                    </div>
                                    <div className="mt-1">
                                      <TradeStatusBadge
                                        status={post.tradeStatus}
                                      />
                                    </div>
                                  </div>
                                </div>

                                <div className="mt-3 flex flex-wrap gap-2 text-xs text-gray-600 dark:text-gray-400">
                                  <div className="flex items-center gap-1">
                                    <FiServer size={12} />
                                    <span>{post.server || "-"}</span>
                                  </div>
                                  <div className="flex items-center gap-1">
                                    <FiMessageSquare size={12} />
                                    <span>{post.discord || "-"}</span>
                                  </div>
                                  {post.tradeStatus === "pending_release" &&
                                    post.releaseAt && (
                                      <div className="flex items-center gap-1">
                                        <span>
                                          Release:{" "}
                                          {new Date(
                                            post.releaseAt
                                          ).toLocaleString()}
                                        </span>
                                      </div>
                                    )}
                                </div>
                              </div>

                              <div className="px-4 py-3 bg-gray-50 dark:bg-gray-800/50 border-t border-gray-200 dark:border-gray-700 flex justify-between gap-2">
                                <div className="flex gap-2">
                                  <button
                                    onClick={() => setEditPostData(post)}
                                    className="px-3 py-1 text-sm rounded-md bg-blue-600 hover:bg-blue-700 text-white flex items-center gap-1"
                                  >
                                    <FiEdit2 size={14} /> Edit
                                  </button>
                                  <button
                                    onClick={() => deletePost(post._id)}
                                    className="px-3 py-1 text-sm rounded-md bg-red-600 hover:bg-red-700 text-white flex items-center gap-1"
                                  >
                                    <FiTrash2 size={14} /> Delete
                                  </button>
                                </div>

                                {post.tradeStatus === "pending_release" && (
                                  <div className="flex gap-2">
                                    <button
                                      onClick={() => forceReleasePost(post._id)}
                                      disabled={!!actionLoadingMap[post._id]}
                                      className="px-3 py-1 text-sm rounded-md bg-green-600 hover:bg-green-700 text-white flex items-center gap-1 disabled:opacity-70"
                                    >
                                      {actionLoadingMap[post._id]
                                        ? "Processing..."
                                        : "Force Release"}
                                    </button>
                                    <button
                                      onClick={() => refundPost(post._id)}
                                      disabled={!!actionLoadingMap[post._id]}
                                      className="px-3 py-1 text-sm rounded-md bg-yellow-600 hover:bg-yellow-700 text-white flex items-center gap-1 disabled:opacity-70"
                                    >
                                      {actionLoadingMap[post._id]
                                        ? "Processing..."
                                        : "Refund"}
                                    </button>
                                  </div>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Edit Post Modal */}
      {editPostData && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            <div
              className="fixed inset-0 transition-opacity"
              aria-hidden="true"
              onClick={() => setEditPostData(null)}
            >
              <div className="absolute inset-0 bg-gray-500 dark:bg-gray-900 opacity-75"></div>
            </div>
            <span
              className="hidden sm:inline-block sm:align-middle sm:h-screen"
              aria-hidden="true"
            >
              &#8203;
            </span>
            <div className="inline-block align-bottom bg-white dark:bg-gray-800 rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-4xl sm:w-full">
              <EditPostForm post={editPostData} />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
