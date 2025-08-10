// src/pages/Login.js
import React, { useEffect, useState } from "react";
import axios from "../api/axiosInstance";
import { useNavigate, Link } from "react-router-dom";
import SkeletonCard from "../components/common/SkeletonCard"; // adjust path if needed
import { useUser } from "../context/UserContext";

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [serverError, setServerError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const { setUser } = useUser();
  // field-level validation errors
  const [emailError, setEmailError] = useState("");
  const [passwordError, setPasswordError] = useState("");

  // controls the shake animation when auth fails
  const [shake, setShake] = useState(false);

  const navigate = useNavigate();

  // simple live validation for email & password
  useEffect(() => {
    if (!email) {
      setEmailError("");
      return;
    }
    setEmailError(EMAIL_REGEX.test(email) ? "" : "Invalid email format");
  }, [email]);

  useEffect(() => {
    if (!password) {
      setPasswordError("");
      return;
    }
    setPasswordError(
      password.length >= 6 ? "" : "Password must be at least 6 characters"
    );
  }, [password]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setServerError("");

    // final validation before submit
    if (!EMAIL_REGEX.test(email)) {
      setEmailError("Invalid email format");
      setShake(true);
      setTimeout(() => setShake(false), 500);
      return;
    }
    if (password.length < 6) {
      setPasswordError("Password must be at least 6 characters");
      setShake(true);
      setTimeout(() => setShake(false), 500);
      return;
    }

    setSubmitting(true);
    try {
      const res = await axios.post(
        "/users/login",
        { email, password },
        { headers: { "Content-Type": "application/json" } }
      );

      // If backend returns the user object, check isActive
      const returnedUser = res.data?.user ?? null;
      const token = res.data?.token ?? null;

      if (returnedUser) {
        // Defensive: coerce to boolean
        const active = !!returnedUser.isActive;
        if (!active) {
          // Account exists and is banned/disabled
          setServerError(
            "Your account is banned. Contact support if you think this is a mistake."
          );
          setShake(true);
          setTimeout(() => setShake(false), 600);
          // Do NOT store token or navigate
          return;
        }
      }

      // If backend didn't return user, we still rely on server-side auth.
      // Proceed only if token present; otherwise treat as failure.
      if (!token) {
        setServerError("Login failed: no token returned.");
        setShake(true);
        setTimeout(() => setShake(false), 600);
        return;
      }

      // Store token and user and navigate
      localStorage.setItem("token", token);
      if (returnedUser) {
        localStorage.setItem("user", JSON.stringify(returnedUser));
        setUser(returnedUser); // <-- Add this line!
      }

      navigate("/all-posts");
    } catch (err) {
      if (err.response) {
        // Prefer server messages, fallbacks
        const serverMsg =
          err.response.data?.message ||
          err.response.data?.error ||
          "Invalid credentials.";
        setServerError(serverMsg);
      } else if (err.request) {
        setServerError(
          "No response from server. Please check your connection."
        );
      } else {
        setServerError("An unexpected error occurred. Try again.");
      }

      setShake(true);
      setTimeout(() => setShake(false), 600);
    } finally {
      setSubmitting(false);
    }
  };

  // small helper to style input border on error
  const inputErrorClass = (err) =>
    err ? "border-red-400 ring-1 ring-red-300" : "";

  return (
    <>
      {/* add local CSS for shake animation */}
      <style>{`
        @keyframes shake {
          10%, 90% { transform: translate3d(-1px, 0, 0); }
          20%, 80% { transform: translate3d(2px, 0, 0); }
          30%, 50%, 70% { transform: translate3d(-4px, 0, 0); }
          40%, 60% { transform: translate3d(4px, 0, 0); }
        }
        .shake {
          animation: shake 0.6s cubic-bezier(.36,.07,.19,.97) both;
        }
      `}</style>

      <div className="flex items-center justify-center min-h-screen bg-gray-100 dark:bg-gray-900 px-4">
        <div
          // add shake class conditionally
          className={`w-full max-w-md p-8 bg-white dark:bg-gray-800 shadow-xl rounded-xl transition duration-300 ${
            shake ? "shake" : ""
          }`}
        >
          <h2 className="text-3xl font-bold text-center text-gray-800 dark:text-white mb-6">
            Welcome To <br /> GamesX Market 👋
          </h2>

          {/* Server-level error */}
          {serverError && (
            <div
              role="alert"
              className="mb-4 text-sm text-red-700 bg-red-100 dark:bg-red-400/10 dark:text-red-400 p-3 rounded text-center border border-red-300 dark:border-red-500"
            >
              {serverError}
            </div>
          )}

          <form
            onSubmit={handleSubmit}
            className="space-y-5"
            aria-live="polite"
            noValidate
          >
            <div>
              <label className="block mb-1 text-sm text-gray-700 dark:text-gray-300">
                Email
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                className={`w-full px-4 py-2 rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 ${inputErrorClass(
                  emailError
                )}`}
                disabled={submitting}
                autoComplete="username"
                aria-invalid={!!emailError}
                aria-describedby="email-help"
              />
              {/* inline hint */}
              <p
                id="email-help"
                className={`mt-1 text-xs ${
                  emailError ? "text-red-400" : "text-gray-400"
                }`}
              >
                {emailError || "Please enter correct email"}
              </p>
            </div>

            <div>
              <label className="block mb-1 text-sm text-gray-700 dark:text-gray-300">
                Password
              </label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className={`w-full px-4 py-2 pr-10 rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 ${inputErrorClass(
                    passwordError
                  )}`}
                  disabled={submitting}
                  autoComplete="current-password"
                  aria-invalid={!!passwordError}
                  aria-describedby="password-help"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((prev) => !prev)}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 dark:text-gray-300 text-xl"
                  disabled={submitting}
                >
                  {showPassword ? "🙈" : "👁️"}
                </button>
              </div>
              <p
                id="password-help"
                className={`mt-1 text-xs ${
                  passwordError ? "text-red-400" : "text-gray-400"
                }`}
              >
                {passwordError || "At least 6 characters"}
              </p>
            </div>

            <button
              type="submit"
              className={`w-full flex items-center justify-center gap-3 bg-blue-600 hover:bg-blue-700 transition text-white font-semibold py-2 rounded-md shadow-md ${
                submitting ? "opacity-90 cursor-wait" : ""
              }`}
              disabled={submitting}
            >
              {submitting && (
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
              )}
              <span>{submitting ? "Signing in..." : "Login"}</span>
            </button>
          </form>

          {/* show skeleton while submitting to give quick visual feedback */}
          {submitting && (
            <div className="mt-6">
              <SkeletonCard />
            </div>
          )}

          <p className="text-sm text-center text-gray-600 dark:text-gray-400 mt-5">
            Don't have an account?{" "}
            <Link
              to="/register"
              className="text-blue-600 dark:text-blue-400 hover:underline font-medium"
              style={{
                position: "relative",
                zIndex: 1,
                display: "inline-block",
                padding: "4px 0",
              }}
              onClick={(e) => {
                e.stopPropagation();
                e.preventDefault();
                navigate("/register");
              }}
            >
              Register here
            </Link>
          </p>
        </div>
      </div>
    </>
  );
}

export default Login;
