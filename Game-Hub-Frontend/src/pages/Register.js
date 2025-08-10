// src/pages/Register.js
import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import axios from "../api/axiosInstance";
import SkeletonCard from "../components/common/SkeletonCard"; // adjust path if needed
import { useUser } from "../context/UserContext";

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const Register = () => {
  const navigate = useNavigate();
  const { user } = useUser(); // get user from context
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
  });
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  // field-level errors
  const [emailError, setEmailError] = useState("");
  const [passwordError, setPasswordError] = useState("");

  // Redirect only if user is logged in (authenticated)
  useEffect(() => {
    if (user) {
      navigate("/");
    }
  }, [user, navigate]);

  useEffect(() => {
    // live validation for email
    if (!formData.email) setEmailError("");
    else
      setEmailError(
        EMAIL_REGEX.test(formData.email) ? "" : "Invalid email format"
      );
  }, [formData.email]);

  useEffect(() => {
    if (!formData.password) setPasswordError("");
    else
      setPasswordError(
        formData.password.length >= 6
          ? ""
          : "Password must be at least 6 characters"
      );
  }, [formData.password]);

  const handleChange = (e) => {
    setFormData((p) => ({ ...p, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (!EMAIL_REGEX.test(formData.email)) {
      setEmailError("Invalid email format");
      return;
    }
    if (formData.password.length < 6) {
      setPasswordError("Password must be at least 6 characters");
      return;
    }

    setSubmitting(true);

    try {
      formData.isActive = true;
      const res = await axios.post("/users", formData);
      localStorage.setItem("token", res.data.token);
      if (res.data.user)
        localStorage.setItem("user", JSON.stringify(res.data.user));
      navigate("/");
    } catch (err) {
      if (err.response?.data?.error) setError(err.response.data.error);
      else if (err.response?.data?.message) setError(err.response.data.message);
      else setError("Registration failed. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="flex justify-center items-center min-h-screen bg-gray-100 dark:bg-gray-900 transition duration-300 px-4">
      <div className="w-full max-w-md">
        <div className="bg-white dark:bg-gray-900 shadow-xl rounded-2xl p-8 border dark:border-gray-700">
          <h2 className="text-3xl font-bold mb-6 text-center text-gray-800 dark:text-white">
            Create Account
          </h2>

          {/* Server / submission error */}
          {error && (
            <div className="mb-4 p-3 bg-red-100 dark:bg-red-800 text-red-600 dark:text-red-100 rounded-md text-sm text-center">
              {error}
            </div>
          )}

          {/* Show skeleton while submitting */}
          {submitting ? (
            <div className="space-y-3">
              {/* You can show a grid of skeletons or a single one; using 2 for nicer layout */}
              <div className="grid grid-cols-1 gap-3">
                <SkeletonCard />
                <SkeletonCard />
              </div>

              <div className="mt-4 flex justify-center">
                <div className="animate-spin rounded-full h-8 w-8 border-4 border-blue-500 border-t-transparent" />
              </div>
            </div>
          ) : (
            <form
              onSubmit={handleSubmit}
              className="space-y-4"
              autoComplete="off"
              noValidate
            >
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Name
                </label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  required
                  className="mt-1 w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  disabled={submitting}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Email
                </label>
                <input
                  autoComplete="new-password"
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  required
                  className={`mt-1 w-full px-4 py-2 border rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    emailError
                      ? "border-red-400 ring-1 ring-red-300"
                      : "border-gray-300 dark:border-gray-600"
                  }`}
                  disabled={submitting}
                  aria-invalid={!!emailError}
                />
                <p
                  className={`mt-1 text-xs ${
                    emailError ? "text-red-400" : "text-gray-400"
                  }`}
                >
                  {emailError || "We'll use this email to log you in"}
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Password
                </label>
                <div className="relative">
                  <input
                    autoComplete="new-password"
                    type={showPassword ? "text" : "password"}
                    name="password"
                    value={formData.password}
                    onChange={handleChange}
                    required
                    className={`mt-1 w-full px-4 py-2 pr-10 border rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                      passwordError
                        ? "border-red-400 ring-1 ring-red-300"
                        : "border-gray-300 dark:border-gray-600"
                    }`}
                    disabled={submitting}
                    aria-invalid={!!passwordError}
                  />
                  <span
                    onClick={() => setShowPassword((prev) => !prev)}
                    className="absolute right-3 top-3 text-xl cursor-pointer text-gray-500 dark:text-gray-300 select-none"
                    aria-hidden
                  >
                    {showPassword ? "🙈" : "👁️"}
                  </span>
                </div>
                <p
                  className={`mt-1 text-xs ${
                    passwordError ? "text-red-400" : "text-gray-400"
                  }`}
                >
                  {passwordError || "At least 6 characters"}
                </p>
              </div>

              <button
                type="submit"
                className="w-full flex items-center justify-center gap-3 bg-blue-600 hover:bg-blue-700 text-white py-2 rounded-lg transition duration-200"
                disabled={submitting}
              >
                {submitting ? (
                  <>
                    <svg
                      className="animate-spin h-5 w-5 text-white"
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                      aria-hidden="true"
                    >
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                      />
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"
                      />
                    </svg>
                    <span>Registering...</span>
                  </>
                ) : (
                  "Register"
                )}
              </button>
            </form>
          )}

          <p className="mt-6 text-center text-sm text-gray-600 dark:text-gray-400">
            Already have an account?{" "}
            <Link
              to="/login"
              className="text-blue-600 dark:text-blue-400 hover:underline"
            >
              Login
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Register;
