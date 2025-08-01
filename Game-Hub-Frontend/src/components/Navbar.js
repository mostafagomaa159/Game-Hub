import { useEffect, useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import axios from "../api/axiosInstance";
import {
  LogOut,
  LogIn,
  User,
  PlusCircle,
  FileText,
  Menu,
  X,
  Home,
  Moon,
  Sun,
  ArrowDownCircle,
  ArrowUpCircle,
  ShieldCheck,
} from "lucide-react";
import { useUser } from "../context/UserContext";

const Navbar = () => {
  const { user, loadingUser: loading, fetchUser, setUser } = useUser();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [darkMode, setDarkMode] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const savedTheme = localStorage.getItem("theme");
    const prefersDark =
      savedTheme === "dark" ||
      (!savedTheme &&
        window.matchMedia("(prefers-color-scheme: dark)").matches);
    setDarkMode(prefersDark);
    document.documentElement.classList.toggle("dark", prefersDark);
  }, []);

  const toggleDarkMode = () => {
    const isDark = !darkMode;
    setDarkMode(isDark);
    document.documentElement.classList.toggle("dark", isDark);
    localStorage.setItem("theme", isDark ? "dark" : "light");
  };

  const handleLogout = async () => {
    try {
      await axios.post("/users/logout", null, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      });
    } catch (error) {
      console.error("Logout failed:", error.response?.data || error.message);
    } finally {
      localStorage.removeItem("token");
      setUser(null);
      navigate("/login");
    }
  };

  useEffect(() => {
    fetchUser();
  }, [location.pathname, fetchUser]);

  const navLinks = [];

  if (user) {
    navLinks.push(
      { to: "/dashboard", label: "Dashboard", icon: <Home size={16} /> },
      { to: "/deposit", label: "Deposit", icon: <ArrowDownCircle size={16} /> },
      { to: "/withdraw", label: "Withdraw", icon: <ArrowUpCircle size={16} /> },
      { to: "/newpost", label: "Create Post", icon: <PlusCircle size={16} /> },
      { to: "/profile", label: "Profile", icon: <User size={16} /> }
    );

    if (!user.isAdmin) {
      navLinks.push({
        to: "/my-transactions",
        label: "My Transactions",
        icon: <FileText size={16} />,
      });
    }

    if (user.isAdmin) {
      navLinks.push({
        to: "/admin",
        label: "Admin Dashboard",
        icon: <ShieldCheck size={16} />,
      });
    }
  }

  return (
    <nav className="bg-white dark:bg-[#0e0e0e] text-black dark:text-white px-4 py-3 shadow-lg border-b border-gray-200 dark:border-neutral-800">
      <div className="max-w-7xl mx-auto flex justify-between items-center">
        <div className="flex items-center space-x-4">
          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="md:hidden text-gray-600 dark:text-gray-300 hover:text-black dark:hover:text-white"
          >
            {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
          <Link
            to="/"
            className="font-bold text-lg tracking-wide hidden md:block text-blue-500 hover:text-blue-600"
          >
            GamesX Market
          </Link>

          <div className="md:flex space-x-6 hidden">
            {navLinks.map(({ to, label, icon }) => (
              <Link
                key={to}
                to={to}
                className="flex items-center space-x-1 hover:text-yellow-500 transition"
              >
                {icon}
                <span>{label}</span>
              </Link>
            ))}
          </div>
        </div>

        <div className="flex items-center space-x-4">
          <button
            onClick={toggleDarkMode}
            className="hover:text-yellow-500 transition"
            aria-label="Toggle Dark Mode"
          >
            {darkMode ? <Sun size={18} /> : <Moon size={18} />}
          </button>

          {loading ? (
            <span className="text-sm text-gray-500 dark:text-gray-300">
              Loading...
            </span>
          ) : user ? (
            <>
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center text-sm font-bold">
                  {user.name?.[0]?.toUpperCase() || "U"}
                </div>
                <div className="text-sm">
                  <p className="font-medium">{user.name}</p>
                  <p className="text-xs text-yellow-500">💰 {user.coins}</p>
                </div>
              </div>
              <button
                onClick={handleLogout}
                className="bg-red-600 hover:bg-red-700 px-3 py-1 rounded-md text-sm flex items-center space-x-1"
              >
                <LogOut size={16} />
                <span>Logout</span>
              </button>
            </>
          ) : (
            <Link
              to="/login"
              className="bg-blue-600 hover:bg-blue-700 px-3 py-1 rounded-md text-sm flex items-center space-x-1"
            >
              <LogIn size={16} />
              <span>Login</span>
            </Link>
          )}
        </div>
      </div>

      {isMobileMenuOpen && (
        <div className="md:hidden mt-3 space-y-2 border-t border-gray-200 dark:border-neutral-800 pt-3">
          {navLinks.map(({ to, label, icon }) => (
            <Link
              key={to}
              to={to}
              onClick={() => setIsMobileMenuOpen(false)}
              className="block px-4 py-2 hover:bg-gray-100 dark:hover:bg-neutral-800 transition rounded-md flex items-center space-x-2"
            >
              {icon}
              <span>{label}</span>
            </Link>
          ))}
        </div>
      )}
    </nav>
  );
};

export default Navbar;
