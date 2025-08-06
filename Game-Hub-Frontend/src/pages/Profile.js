import React, { useState, useCallback } from "react";
import useSWR, { mutate as globalMutate } from "swr";
import axios from "../api/axiosInstance";
import { Link } from "react-router-dom";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

const fetcher = (url) => axios.get(url).then((r) => r.data);

const Profile = () => {
  const {
    data: user,
    error,
    isValidating,
  } = useSWR("/users/me", fetcher, {
    revalidateOnFocus: true,
    dedupingInterval: 5000,
    shouldRetryOnError: false,
  });

  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({ name: "", email: "", password: "" });
  const [showPassword, setShowPassword] = useState(false);
  const [saving, setSaving] = useState(false);

  const handleStartEditing = useCallback(() => {
    setForm({
      name: user?.name ?? "",
      email: user?.email ?? "",
      password: "",
    });
    setEditing(true);
  }, [user]);

  const handleCancel = useCallback(() => {
    setEditing(false);
    setForm((f) => ({ ...f, password: "" }));
  }, []);

  const handleChange = useCallback((e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  }, []);

  const handleToggleShowPassword = useCallback(
    () => setShowPassword((s) => !s),
    []
  );

  const handleUpdate = useCallback(
    async (e) => {
      e.preventDefault();
      setSaving(true);

      const payload = { name: form.name, email: form.email };
      if (form.password?.trim()) payload.password = form.password;

      try {
        await globalMutate(
          "/users/me",
          async (current) => {
            const res = await axios.patch("/users/me", payload);
            return res?.data ? res.data : { ...(current || {}), ...payload };
          },
          {
            optimisticData: { ...(user || {}), ...payload },
            rollbackOnError: true,
            revalidate: true,
          }
        );

        toast.success("✅ Profile updated successfully!");
        setEditing(false);
        setForm((f) => ({ ...f, password: "" }));
      } catch (err) {
        console.error("Profile update failed", err);
        toast.error("❌ Failed to update profile.");
      } finally {
        setSaving(false);
      }
    },
    [form, user]
  );

  if (!user && !error) {
    return (
      <div className="max-w-xl mx-auto mt-10 p-6 bg-white dark:bg-gray-900 rounded-2xl shadow-lg">
        <h2 className="text-2xl font-bold mb-6 text-center">👤 Profile</h2>
        <div className="animate-pulse space-y-4">
          <div className="h-6 bg-gray-200 dark:bg-gray-800 rounded w-3/4" />
          <div className="h-6 bg-gray-200 dark:bg-gray-800 rounded w-5/6" />
          <div className="h-6 bg-gray-200 dark:bg-gray-800 rounded w-1/3" />
        </div>
      </div>
    );
  }

  if (error && !user) {
    return (
      <div className="max-w-xl mx-auto mt-10 p-6 bg-white dark:bg-gray-900 rounded-2xl shadow-lg">
        <h2 className="text-2xl font-bold mb-6 text-center">👤 Profile</h2>
        <p className="text-red-500 mb-4">Failed to load profile.</p>
        <button
          onClick={() => globalMutate("/users/me")}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-xl mx-auto mt-10 p-6 bg-white dark:bg-gray-900 text-gray-900 dark:text-white rounded-2xl shadow-lg">
      <h2 className="text-2xl font-bold mb-6 text-center">👤 Profile</h2>

      {!editing && (
        <div className="space-y-4">
          <p>
            <strong>🧑 Name:</strong> {user?.name ?? "-"}
          </p>
          <p>
            <strong>📧 Email:</strong> {user?.email ?? "-"}
          </p>
          <p>
            <strong>💰 Coins:</strong> {user?.coins ?? 0}
          </p>

          <div className="flex gap-3 pt-4">
            <Link
              to="/deposit"
              className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-lg transition inline-block text-center"
            >
              💰 Deposit
            </Link>
            <Link
              to="/withdraw"
              className="bg-yellow-500 hover:bg-yellow-600 text-white px-4 py-2 rounded-lg transition inline-block text-center"
            >
              💸 Withdraw
            </Link>
          </div>

          <button
            onClick={handleStartEditing}
            className="w-full mt-6 bg-gray-800 hover:bg-gray-900 dark:bg-gray-700 dark:hover:bg-gray-800 text-white px-4 py-2 rounded-lg transition"
          >
            Update Profile
          </button>

          {isValidating && (
            <p className="text-sm text-gray-500 mt-2">Refreshing...</p>
          )}
        </div>
      )}

      {editing && (
        <form onSubmit={handleUpdate} className="space-y-4">
          <input
            name="name"
            type="text"
            value={form.name}
            onChange={handleChange}
            className="w-full p-3 rounded-md border dark:border-gray-600 dark:bg-gray-800 dark:text-white"
            required
            placeholder="Name"
            disabled={saving}
          />
          <input
            name="email"
            type="email"
            value={form.email}
            onChange={handleChange}
            className="w-full p-3 rounded-md border dark:border-gray-600 dark:bg-gray-800 dark:text-white"
            required
            placeholder="Email"
            disabled={saving}
          />
          <div className="relative">
            <input
              name="password"
              type={showPassword ? "text" : "password"}
              value={form.password}
              onChange={handleChange}
              className="w-full p-3 rounded-md border dark:border-gray-600 dark:bg-gray-800 dark:text-white pr-10"
              placeholder="New Password (leave blank to keep current)"
              disabled={saving}
            />
            <span
              onClick={handleToggleShowPassword}
              className="absolute right-3 top-3 cursor-pointer text-gray-600 dark:text-gray-300"
            >
              {showPassword ? "🙈" : "👁️"}
            </span>
          </div>

          <div className="flex justify-between gap-3">
            <button
              type="submit"
              className="w-full bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition disabled:opacity-60"
              disabled={saving}
            >
              {saving ? "Saving..." : "Save"}
            </button>
            <button
              onClick={handleCancel}
              className="w-full bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-lg transition"
              type="button"
              disabled={saving}
            >
              Cancel
            </button>
          </div>
        </form>
      )}
    </div>
  );
};

export default Profile;
