// src/components/adminTabs/UsersTab.js
import React, { useCallback, useEffect, useState } from "react";
import axios from "../../api/axiosInstance";
import SkeletonCard from "../../components/common/SkeletonCard";

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
    } finally {
      setPostsLoading(false);
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

        // If you want immediate logout for the target user, backend should issue a socket/message.
        // Frontend cannot force other users to logout unless they check token validity.
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

      console.debug("PUT /admin/users payload:", payload);
      const res = await axios.put(`/admin/users/${userId}`, payload);
      const updated = res?.data?.user || res?.data;
      if (updated) {
        setUsers((prev) => prev.map((u) => (u._id === userId ? updated : u)));
        setShowEditUser(false);
        setSelectedUser(null);
      } else {
        fetchUsers();
      }
    } catch (err) {
      console.error("saveUser", err);
      const invalid = err?.response?.data?.invalid;
      if (invalid) console.error("Server response invalid:", invalid);
      else if (err?.response?.data)
        console.error("Server response:", err.response.data);
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
    // Build payload from allowed fields only
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

      // map available -> avaliable if UI used different spelling
      if (
        formPayload.available !== undefined &&
        payload.avaliable === undefined
      ) {
        payload.avaliable = !!formPayload.available;
      }

      console.debug("PUT /admin/posts payload:", payload);
      const res = await axios.put(`/admin/posts/${postId}`, payload);
      const updated = res?.data || null;
      if (updated) {
        setSelectedUserPosts((prev) =>
          prev.map((p) => (p._id === postId ? updated : p))
        );
        setEditPostData(null);
      } else {
        setSelectedUserPosts((prev) =>
          prev.map((p) => (p._id === postId ? { ...p, ...payload } : p))
        );
        setEditPostData(null);
      }
    } catch (err) {
      console.error("savePost", err);
      const invalid = err?.response?.data?.invalid;
      if (invalid) console.error("Server response invalid:", invalid);
    }
  };

  // --- delete post
  const deletePost = async (postId) => {
    if (!window.confirm("Delete this post permanently?")) return;
    try {
      await axios.delete(`/admin/posts/${postId}`);
      setSelectedUserPosts((prev) => prev.filter((p) => p._id !== postId));
    } catch (err) {
      console.error("deletePost", err);
    }
  };

  // --- UI helpers
  const Avatar = ({ user }) => {
    const initials =
      (user?.name || "")
        .split(" ")
        .map((s) => s[0])
        .slice(0, 2)
        .join("")
        .toUpperCase() || "?";
    return (
      <div className="h-12 w-12 rounded-full bg-gradient-to-br from-gray-200 to-gray-300 dark:from-gray-700 dark:to-gray-600 flex items-center justify-center text-sm font-semibold text-gray-800 dark:text-gray-100">
        {user?.avatarUrl ? (
          <img
            src={user.avatarUrl}
            alt={user.name}
            className="h-12 w-12 rounded-full object-cover"
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
    return (
      <span className="text-xs px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-800 dark:bg-indigo-600/20 dark:text-indigo-300">
        {role}
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
        className="bg-white text-gray-900 dark:bg-gray-900 dark:text-gray-100 border border-gray-100 dark:border-gray-700 rounded-lg shadow-lg p-5 w-full max-w-md"
      >
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold">Edit user</h3>
          <div className="text-sm text-gray-500 dark:text-gray-400">
            {user._id?.slice(-6)}
          </div>
        </div>

        <label className="block text-sm text-gray-600 dark:text-gray-300">
          Name
        </label>
        <input
          value={form.name}
          onChange={(e) => setForm({ ...form, name: e.target.value })}
          className="w-full mt-1 p-2 rounded bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
        />

        <label className="block text-sm text-gray-600 dark:text-gray-300 mt-3">
          Email
        </label>
        <input
          value={form.email}
          onChange={(e) => setForm({ ...form, email: e.target.value })}
          className="w-full mt-1 p-2 rounded bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
        />

        <div className="grid grid-cols-2 gap-3 mt-3">
          <div>
            <label className="block text-sm text-gray-600 dark:text-gray-300">
              Role (legacy)
            </label>
            <select
              value={form.role}
              onChange={(e) => setForm({ ...form, role: e.target.value })}
              className="w-full mt-1 p-2 rounded bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700"
            >
              <option value="user">User</option>
              <option value="seller">Seller</option>
              <option value="admin">Admin</option>
            </select>
          </div>

          <div>
            <label className="block text-sm text-gray-600 dark:text-gray-300">
              Coins
            </label>
            <input
              type="number"
              value={form.coins}
              onChange={(e) =>
                setForm({ ...form, coins: Number(e.target.value) })
              }
              className="w-full mt-1 p-2 rounded bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700"
            />
          </div>
        </div>

        <div className="flex items-center gap-4 mt-3">
          <label className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
            <input
              type="checkbox"
              checked={form.isActive}
              onChange={(e) => setForm({ ...form, isActive: e.target.checked })}
              className="rounded"
            />{" "}
            Active
          </label>
          <label className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
            <input
              type="checkbox"
              checked={form.isAdmin}
              onChange={(e) => setForm({ ...form, isAdmin: e.target.checked })}
              className="rounded"
            />{" "}
            Admin
          </label>
        </div>

        <div className="mt-4 flex justify-end gap-2">
          <button
            type="button"
            onClick={() => {
              setShowEditUser(false);
              setSelectedUser(null);
            }}
            className="px-3 py-2 rounded bg-gray-200 hover:bg-gray-300 dark:bg-gray-800 dark:hover:bg-gray-700"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={saving}
            className="px-4 py-2 rounded bg-blue-600 hover:bg-blue-700 text-white flex items-center gap-2 disabled:opacity-70"
          >
            {saving ? (
              <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                />
              </svg>
            ) : null}
            {savedOk ? "Saved" : "Save"}
          </button>
        </div>
      </form>
    );
  };

  /* ---------------------------
     EDIT POST FORM — shows form skeleton while saving
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

    // validation
    const validate = () => {
      const e = {};
      if (!form.description || form.description.trim().length < 3)
        e.description = "Description is too short";
      if (Number.isNaN(Number(form.price)) || Number(form.price) < 0)
        e.price = "Price must be >= 0";
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

    // When saving, show a form-like skeleton and disable inputs
    if (saving) {
      return (
        <div className="p-4">
          <SkeletonCard variant="form" />
        </div>
      );
    }

    // Render actual form when not saving
    return (
      <div className="w-full max-w-4xl mx-auto">
        <div className="bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 rounded-xl shadow-xl overflow-hidden border border-gray-100 dark:border-gray-700">
          {/* header */}
          <div className="flex items-center justify-between p-4 border-b border-gray-100 dark:border-gray-800">
            <div>
              <h3 className="text-lg font-semibold">Edit Post</h3>
              <div className="text-xs text-gray-500 dark:text-gray-400">
                ID: {post._id}
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div
                className={`text-sm px-3 py-1 rounded-full ${
                  form.tradeStatus === "available"
                    ? "bg-green-100 text-green-800 dark:bg-green-600/20 dark:text-green-300"
                    : form.tradeStatus === "pending"
                    ? "bg-yellow-100 text-yellow-800 dark:bg-yellow-600/20 dark:text-yellow-300"
                    : form.tradeStatus === "completed"
                    ? "bg-blue-100 text-blue-800 dark:bg-blue-600/20 dark:text-blue-300"
                    : "bg-red-100 text-red-800 dark:bg-red-600/20 dark:text-red-300"
                }`}
              >
                {form.tradeStatus}
              </div>
              <button
                onClick={() => setEditPostData(null)}
                className="text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white p-2 rounded-md bg-gray-100 dark:bg-gray-800/40"
                aria-label="Close"
              >
                ✕
              </button>
            </div>
          </div>

          {/* form */}
          <form
            onSubmit={submit}
            className="p-4 grid grid-cols-1 lg:grid-cols-3 gap-4"
          >
            {/* left / main (desc + meta) */}
            <div className="lg:col-span-2 space-y-3">
              <label className="block text-sm text-gray-700 dark:text-gray-300">
                Description
              </label>
              <textarea
                value={form.description}
                onChange={(e) =>
                  setForm({ ...form, description: e.target.value })
                }
                rows={6}
                className={`w-full p-3 rounded bg-gray-50 dark:bg-gray-800 border ${
                  errors.description
                    ? "border-red-500"
                    : "border-gray-200 dark:border-gray-700"
                } focus:outline-none focus:ring-2 focus:ring-blue-500`}
              />
              {errors.description && (
                <div className="text-xs text-red-500">{errors.description}</div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div>
                  <label className="block text-sm text-gray-700 dark:text-gray-300">
                    Price
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={String(form.price)}
                    onChange={(e) =>
                      setForm({ ...form, price: e.target.value })
                    }
                    className={`w-full p-2 rounded bg-gray-50 dark:bg-gray-800 border ${
                      errors.price
                        ? "border-red-500"
                        : "border-gray-200 dark:border-gray-700"
                    } focus:outline-none focus:ring-2 focus:ring-blue-500`}
                  />
                  {errors.price && (
                    <div className="text-xs text-red-500">{errors.price}</div>
                  )}
                </div>

                <div>
                  <label className="block text-sm text-gray-700 dark:text-gray-300">
                    Server
                  </label>
                  <input
                    value={form.server}
                    onChange={(e) =>
                      setForm({ ...form, server: e.target.value })
                    }
                    className="w-full p-2 rounded bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm text-gray-700 dark:text-gray-300">
                    Discord
                  </label>
                  <input
                    value={form.discord}
                    onChange={(e) =>
                      setForm({ ...form, discord: e.target.value })
                    }
                    className="w-full p-2 rounded bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
            </div>

            {/* right / meta */}
            <aside className="space-y-3">
              <div className="bg-gray-50 dark:bg-gray-800 p-3 rounded border border-gray-200 dark:border-gray-700">
                <label className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300 mb-2">
                  <input
                    type="checkbox"
                    checked={form.avaliable}
                    onChange={(e) =>
                      setForm({ ...form, avaliable: e.target.checked })
                    }
                  />{" "}
                  Available
                </label>
                <label className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300 mb-2">
                  <input
                    type="checkbox"
                    checked={form.isActive}
                    onChange={(e) =>
                      setForm({ ...form, isActive: e.target.checked })
                    }
                  />{" "}
                  Active
                </label>

                <div className="mt-2">
                  <label className="block text-sm text-gray-700 dark:text-gray-300 mb-1">
                    Good responses
                  </label>
                  <input
                    type="number"
                    value={String(form.good_response)}
                    onChange={(e) =>
                      setForm({ ...form, good_response: e.target.value })
                    }
                    className="w-full p-2 rounded bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700"
                  />
                </div>

                <div className="mt-2">
                  <label className="block text-sm text-gray-700 dark:text-gray-300 mb-1">
                    Bad responses
                  </label>
                  <input
                    type="number"
                    value={String(form.bad_response)}
                    onChange={(e) =>
                      setForm({ ...form, bad_response: e.target.value })
                    }
                    className="w-full p-2 rounded bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700"
                  />
                </div>

                <div className="mt-3">
                  <label className="block text-sm text-gray-700 dark:text-gray-300 mb-1">
                    Trade status
                  </label>
                  <select
                    value={form.tradeStatus}
                    onChange={(e) =>
                      setForm({ ...form, tradeStatus: e.target.value })
                    }
                    className="w-full p-2 rounded bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700"
                  >
                    <option value="available">available</option>
                    <option value="pending">pending</option>
                    <option value="completed">completed</option>
                    <option value="cancelled">cancelled</option>
                  </select>
                </div>
              </div>

              <div className="bg-gray-50 dark:bg-gray-800 p-3 rounded border border-gray-200 dark:border-gray-700 text-sm">
                <div className="font-medium text-gray-800 dark:text-gray-200 mb-2">
                  Preview
                </div>
                <div className="text-xs text-gray-600 dark:text-gray-300 mb-2">
                  {form.description?.slice(0, 120) || "(no description)"}
                </div>
                <div className="flex items-center justify-between">
                  <div className="text-sm text-gray-600 dark:text-gray-300">
                    Price
                  </div>
                  <div className="font-medium">{form.price ?? "-"}</div>
                </div>
                <div className="flex items-center justify-between mt-1">
                  <div className="text-sm text-gray-600 dark:text-gray-300">
                    Available
                  </div>
                  <div className="text-sm">{form.avaliable ? "Yes" : "No"}</div>
                </div>
              </div>
            </aside>

            {/* actions row — span full width */}
            <div className="lg:col-span-3 flex items-center justify-end gap-2 mt-1">
              <button
                type="button"
                onClick={() => setEditPostData(null)}
                className="px-3 py-2 rounded bg-gray-200 dark:bg-gray-800 hover:bg-gray-300 dark:hover:bg-gray-700"
              >
                Cancel
              </button>

              <button
                type="submit"
                disabled={saving}
                className={`px-4 py-2 rounded text-white ${
                  saving ? "bg-blue-500/70" : "bg-blue-600 hover:bg-blue-700"
                }`}
              >
                {saving ? (
                  <span className="inline-flex items-center gap-2">
                    <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                      />
                    </svg>{" "}
                    Saving...
                  </span>
                ) : savedOk ? (
                  <span>✔ Saved</span>
                ) : (
                  "Save changes"
                )}
              </button>
            </div>
          </form>
        </div>
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
    <div className="p-3">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
          Users
        </h2>
        <div className="text-sm text-gray-600 dark:text-gray-400">
          {loading ? "Loading..." : `${users.length} shown`}
        </div>
      </div>

      {/* USERS GRID */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <SkeletonCard key={i} variant="user" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {users.map((user) => (
            <article
              key={user._id}
              className="bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 border border-gray-100 dark:border-gray-700 rounded-lg p-4 flex flex-col justify-between shadow-sm hover:shadow-md transition"
            >
              <div className="flex items-start gap-3">
                <Avatar user={user} />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <h3 className="font-semibold text-sm truncate">
                      {user.name}
                    </h3>
                    <RoleBadge user={user} />
                  </div>
                  <p className="text-xs text-gray-600 dark:text-gray-400 truncate mt-1">
                    {user.email}
                  </p>

                  <div className="mt-3 flex items-center gap-2 text-xs">
                    <span
                      className={`px-2 py-1 rounded-full ${
                        coerceBool(user.isActive)
                          ? "bg-green-100 text-green-800 dark:bg-green-600/20 dark:text-green-300"
                          : "bg-red-100 text-red-800 dark:bg-red-600/20 dark:text-red-300"
                      }`}
                    >
                      {coerceBool(user.isActive) ? "Active" : "Banned"}
                    </span>
                    <span className="text-gray-600 dark:text-gray-400">
                      coins:{" "}
                      <span className="font-medium text-gray-900 dark:text-gray-100">
                        {user.coins ?? 0}
                      </span>
                    </span>
                  </div>
                </div>
              </div>

              <div className="mt-4 flex items-center justify-between gap-2">
                <div className="hidden md:flex gap-2">
                  <button
                    onClick={() => {
                      setSelectedUser(user);
                      setShowEditUser(true);
                    }}
                    className="px-3 py-1 rounded bg-blue-600 hover:bg-blue-700 text-white text-sm"
                  >
                    Edit Profile
                  </button>
                  <button
                    onClick={() => toggleUserActive(user)}
                    className="px-3 py-1 rounded bg-gray-200 dark:bg-gray-800 hover:bg-gray-300 dark:hover:bg-gray-700 text-sm"
                  >
                    {coerceBool(user.isActive) ? "Ban" : "Unban"}
                  </button>
                  <button
                    onClick={() => fetchUserPosts(user._id)}
                    className="px-3 py-1 rounded bg-gray-200 dark:bg-gray-800 hover:bg-gray-300 dark:hover:bg-gray-700 text-sm"
                  >
                    Edit Posts
                  </button>
                </div>

                {/* small-screen actions */}
                <div className="md:hidden w-full flex justify-end">
                  <div className="relative inline-block text-left">
                    <button
                      className="inline-flex justify-center w-full rounded px-3 py-1 bg-gray-200 dark:bg-gray-800 text-sm"
                      onClick={() => {
                        const el = document.getElementById(
                          `actions-${user._id}`
                        );
                        if (el) el.classList.toggle("hidden");
                      }}
                    >
                      Actions
                      <svg
                        className="ml-2 h-4 w-4"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth="2"
                          d="M19 9l-7 7-7-7"
                        />
                      </svg>
                    </button>

                    <div
                      id={`actions-${user._id}`}
                      className="hidden absolute right-0 mt-2 w-44 bg-white dark:bg-gray-900 rounded shadow z-20 border border-gray-100 dark:border-gray-700"
                    >
                      <button
                        onClick={() => {
                          setSelectedUser(user);
                          setShowEditUser(true);
                          document
                            .getElementById(`actions-${user._id}`)
                            ?.classList.add("hidden");
                        }}
                        className="w-full text-left px-3 py-2 text-sm text-gray-900 dark:text-gray-100"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => {
                          toggleUserActive(user);
                          document
                            .getElementById(`actions-${user._id}`)
                            ?.classList.add("hidden");
                        }}
                        className="w-full text-left px-3 py-2 text-sm text-gray-900 dark:text-gray-100"
                      >
                        {coerceBool(user.isActive) ? "Ban" : "Unban"}
                      </button>
                      <button
                        onClick={() => {
                          fetchUserPosts(user._id);
                          document
                            .getElementById(`actions-${user._id}`)
                            ?.classList.add("hidden");
                        }}
                        className="w-full text-left px-3 py-2 text-sm text-gray-900 dark:text-gray-100"
                      >
                        Posts
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </article>
          ))}
        </div>
      )}

      {/* pagination */}
      <div className="mt-4 flex items-center justify-between gap-3">
        <div className="text-sm text-gray-600 dark:text-gray-400">
          {totalPages
            ? `Page ${currentPage} of ${totalPages}`
            : `Page ${currentPage}`}
        </div>
        <div className="flex gap-2">
          <button
            onClick={gotoPrev}
            disabled={currentPage <= 1}
            className="px-3 py-1 rounded bg-gray-200 dark:bg-gray-800 disabled:opacity-50"
          >
            Prev
          </button>
          <button
            onClick={gotoNext}
            className="px-3 py-1 rounded bg-gray-200 dark:bg-gray-800"
          >
            Next
          </button>
        </div>
      </div>

      {/* Edit User Modal */}
      {showEditUser && selectedUser && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center"
          aria-modal="true"
          role="dialog"
        >
          <div
            className="absolute inset-0 bg-black/40"
            onClick={(e) => {
              if (e.target === e.currentTarget) {
                setShowEditUser(false);
                setSelectedUser(null);
              }
            }}
          />
          <div className="relative p-4 w-full max-w-md">
            <EditUserForm user={selectedUser} />
          </div>
        </div>
      )}

      {/* Posts slide-over */}
      {showPostsPanel && (
        <div className="fixed inset-0 z-40 flex">
          <div
            className="w-full md:w-2/3 lg:w-1/2 bg-white dark:bg-gray-900 p-4 overflow-y-auto border-l border-gray-100 dark:border-gray-700"
            aria-live="polite"
          >
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                User posts
              </h3>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    setShowPostsPanel(false);
                    setSelectedUserPosts([]);
                  }}
                  className="px-2 py-1 rounded bg-gray-200 dark:bg-gray-800"
                >
                  Close
                </button>
              </div>
            </div>

            {postsLoading ? (
              <div className="space-y-3">
                {Array.from({ length: 4 }).map((_, i) => (
                  <SkeletonCard key={i} variant="post" />
                ))}
              </div>
            ) : selectedUserPosts.length === 0 ? (
              <div className="text-gray-600 dark:text-gray-400">
                No posts found.
              </div>
            ) : (
              <div className="space-y-3">
                {selectedUserPosts.map((post) => (
                  <div
                    key={post._id}
                    className="bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 rounded-lg p-4 hover:shadow-lg transition border border-gray-100 dark:border-gray-700"
                  >
                    <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex-1 min-w-0">
                            <h4 className="font-semibold text-sm truncate">
                              {post.description?.slice(0, 90) || "(no title)"}
                            </h4>
                            <p className="text-xs text-gray-600 dark:text-gray-400 mt-1 line-clamp-3">
                              {post.description?.slice(0, 220) ||
                                "(no description)"}
                            </p>
                          </div>

                          <div className="flex flex-col items-end gap-2">
                            <div className="text-sm font-semibold bg-gray-100 dark:bg-gray-900 px-3 py-1 rounded">
                              {post.price ?? "-"}
                            </div>
                            <div
                              className={`text-xs px-2 py-0.5 rounded ${
                                post.tradeStatus === "available"
                                  ? "bg-green-100 text-green-800 dark:bg-green-600/20 dark:text-green-300"
                                  : post.tradeStatus === "pending"
                                  ? "bg-yellow-100 text-yellow-800 dark:bg-yellow-600/20 dark:text-yellow-300"
                                  : post.tradeStatus === "completed"
                                  ? "bg-blue-100 text-blue-800 dark:bg-blue-600/20 dark:text-blue-300"
                                  : "bg-red-100 text-red-800 dark:bg-red-600/20 dark:text-red-300"
                              }`}
                            >
                              {post.tradeStatus ?? "-"}
                            </div>
                            <div className="text-xs text-gray-600 dark:text-gray-400">
                              {post.avaliable ?? post.available
                                ? "Available"
                                : "Not available"}
                            </div>
                          </div>
                        </div>

                        <div className="mt-3 text-xs text-gray-600 dark:text-gray-400 flex flex-wrap gap-3">
                          <div>Server: {post.server ?? "-"}</div>
                          <div>Discord: {post.discord ?? "-"}</div>
                        </div>
                      </div>

                      <div className="flex-shrink-0 flex flex-col gap-2 pt-2 md:pt-0">
                        <button
                          onClick={() => setEditPostData(post)}
                          className="px-3 py-1 rounded bg-blue-600 hover:bg-blue-700 text-white text-sm"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => deletePost(post._id)}
                          className="px-3 py-1 rounded bg-red-600 hover:bg-red-700 text-white text-sm"
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

          {/* click area to close */}
          <div
            className="flex-1"
            onClick={() => {
              setShowPostsPanel(false);
              setSelectedUserPosts([]);
            }}
          />
        </div>
      )}

      {/* Edit Post Modal */}
      {editPostData && (
        // full-screen on small screens, centered on medium/large
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3">
          <div
            className="absolute inset-0 bg-black/40"
            onClick={() => setEditPostData(null)}
          />
          <div className="relative w-full max-w-4xl mx-auto">
            <div className="h-full overflow-y-auto p-2">
              <EditPostForm post={editPostData} />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
