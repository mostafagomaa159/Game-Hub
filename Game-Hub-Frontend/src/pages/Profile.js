import React, { useState, useEffect } from "react";
import axios from "../api/axiosInstance";
import { Link } from "react-router-dom";

const Profile = () => {
  const [user, setUser] = useState({});
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const fetchUser = async () => {
    try {
      const res = await axios.get("/users/me");
      setUser(res.data);
      setName(res.data.name);
      setEmail(res.data.email);
    } catch (err) {
      console.error("Failed to fetch user", err);
    }
  };

  useEffect(() => {
    fetchUser();
  }, []);

  const handleUpdate = async (e) => {
    e.preventDefault();
    try {
      const updateData = { name, email };
      if (password.trim() !== "") {
        updateData.password = password;
      }

      await axios.patch("/users/me", updateData);
      setEditing(false);
      setPassword("");
      fetchUser();
    } catch (err) {
      console.error("Failed to update user", err);
    }
  };

  return (
    <div className="max-w-xl mx-auto mt-10 p-6 bg-white dark:bg-gray-900 text-gray-900 dark:text-white rounded-2xl shadow-lg">
      <h2 className="text-2xl font-bold mb-6 text-center">👤 Profile</h2>

      {!editing && (
        <div className="space-y-4">
          <p>
            <strong>🧑 Name:</strong> {user.name}
          </p>
          <p>
            <strong>📧 Email:</strong> {user.email}
          </p>
          <p>
            <strong>💰 Coins:</strong> {user.coins ?? 0}
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
            onClick={() => setEditing(true)}
            className="w-full mt-6 bg-gray-800 hover:bg-gray-900 dark:bg-gray-700 dark:hover:bg-gray-800 text-white px-4 py-2 rounded-lg transition"
          >
            Update Profile
          </button>
        </div>
      )}

      {editing && (
        <form onSubmit={handleUpdate} className="space-y-4">
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full p-3 rounded-md border dark:border-gray-600 dark:bg-gray-800 dark:text-white"
            required
            placeholder="Name"
          />
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full p-3 rounded-md border dark:border-gray-600 dark:bg-gray-800 dark:text-white"
            required
            placeholder="Email"
          />
          <div className="relative">
            <input
              type={showPassword ? "text" : "password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full p-3 rounded-md border dark:border-gray-600 dark:bg-gray-800 dark:text-white pr-10"
              placeholder="New Password (leave blank to keep current)"
            />
            <span
              onClick={() => setShowPassword((prev) => !prev)}
              className="absolute right-3 top-3 cursor-pointer text-gray-600 dark:text-gray-300"
            >
              {showPassword ? "🙈" : "👁️"}
            </span>
          </div>

          <div className="flex justify-between gap-3">
            <button
              type="submit"
              className="w-full bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition"
            >
              Save
            </button>
            <button
              onClick={() => {
                setEditing(false);
                setPassword("");
              }}
              className="w-full bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-lg transition"
              type="button"
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
