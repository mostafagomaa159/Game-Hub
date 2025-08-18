import { useEffect, useState, useRef } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import axios from "../api/axiosInstance";
import {
  LogOut,
  LogIn,
  User,
  PlusCircle,
  FileText,
  Home,
  Moon,
  Sun,
  ShieldCheck,
  Send,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { useUser } from "../context/UserContext";
import { motion, AnimatePresence } from "framer-motion";

const Navbar = () => {
  const { user, loadingUser: loading, fetchUser, setUser } = useUser();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [darkMode, setDarkMode] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  const menuRef = useRef();
  const userMenuRef = useRef();

  // Animation variants
  const menuVariants = {
    hidden: {
      opacity: 0,
      y: -10,
      scale: 0.98,
      transition: { duration: 0.15, ease: [0.4, 0, 0.2, 1] },
    },
    visible: {
      opacity: 1,
      y: 0,
      scale: 1,
      transition: { duration: 0.15, ease: [0.4, 0, 0.2, 1] },
    },
  };

  const mobileMenuVariants = {
    hidden: { opacity: 0, height: 0 },
    visible: { opacity: 1, height: "auto" },
    exit: { opacity: 0, height: 0 },
  };

  // Close mobile menu when route changes
  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [location.pathname]);

  // Theme init
  useEffect(() => {
    const savedTheme = localStorage.getItem("theme");
    const prefersDark =
      savedTheme === "dark" ||
      (!savedTheme &&
        window.matchMedia("(prefers-color-scheme: dark)").matches);
    setDarkMode(prefersDark);
    document.documentElement.classList.toggle("dark", prefersDark);
  }, []);

  // Close menus on outside click
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (
        isMobileMenuOpen &&
        menuRef.current &&
        !menuRef.current.contains(e.target)
      ) {
        setIsMobileMenuOpen(false);
      }
      if (
        isUserMenuOpen &&
        userMenuRef.current &&
        !userMenuRef.current.contains(e.target)
      ) {
        setIsUserMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isMobileMenuOpen, isUserMenuOpen]);

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
      setIsUserMenuOpen(false);
    }
  };

  useEffect(() => {
    fetchUser();
  }, [fetchUser]);

  // Navigation links
  const navLinks = [];

  if (user) {
    navLinks.push(
      // { to: "/profile", label: "Profile", icon: <User size={18} /> },
      { to: "/dashboard", label: "My Posts", icon: <Home size={18} /> },
      { to: "/newpost", label: "Create Post", icon: <PlusCircle size={18} /> },
      {
        to: "/requests",
        label: "Requests & Chat",
        icon: <Send size={18} />,
        badge: false,
      }
    );

    if (user.isAdmin) {
      navLinks.push({
        to: "/admin",
        label: "Admin Dashboard",
        icon: <ShieldCheck size={18} />,
      });
    }
  }

  // Animated hamburger menu icon
  const Hamburger = ({ open }) => (
    <button
      aria-label={open ? "Close menu" : "Open menu"}
      aria-expanded={open}
      className="relative w-8 h-8 flex flex-col justify-center items-center group"
      onClick={() => setIsMobileMenuOpen((v) => !v)}
      type="button"
    >
      <span
        className={`block absolute h-[2px] w-6 bg-current rounded-full transform transition duration-300 ease-in-out ${
          open ? "rotate-45 translate-y-0" : "-translate-y-2"
        }`}
      />
      <span
        className={`block absolute h-[2px] w-6 bg-current rounded-full transition-all duration-300 ease-in-out ${
          open ? "opacity-0 translate-x-4" : "opacity-100"
        }`}
      />
      <span
        className={`block absolute h-[2px] w-6 bg-current rounded-full transform transition duration-300 ease-in-out ${
          open ? "-rotate-45 translate-y-0" : "translate-y-2"
        }`}
      />
    </button>
  );

  return (
    <nav
      className="bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 px-4 py-3 shadow-sm border-b border-gray-200 dark:border-gray-800 sticky top-0 z-50 backdrop-blur-sm bg-opacity-95 dark:bg-opacity-95"
      role="navigation"
      aria-label="Main navigation"
    >
      <div className="max-w-7xl mx-auto flex justify-between items-center">
        {/* Left side */}
        <div className="flex items-center space-x-4">
          {/* Mobile hamburger */}
          <div className="md:hidden">
            <Hamburger open={isMobileMenuOpen} />
          </div>

          {/* Logo */}
          <Link
            to="/"
            className="font-bold text-xl tracking-tight flex items-center gap-2 text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 transition-colors"
            aria-label="Go to homepage"
          >
            <span className="hidden sm:inline">Generic-Shop</span>
          </Link>

          {/* Desktop nav */}
          <div className="hidden md:flex space-x-1">
            {navLinks.map(({ to, label, icon, badge }) => (
              <Link
                key={to}
                to={to}
                className={`flex items-center space-x-2 px-3 py-2 rounded-md transition-colors font-medium relative group ${
                  location.pathname === to
                    ? "text-blue-600 dark:text-blue-400"
                    : "text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400"
                }`}
              >
                {icon}
                <span className="relative">
                  {label}
                  <span
                    className={`absolute left-0 -bottom-1 h-0.5 bg-blue-600 dark:bg-blue-400 transition-all duration-300 ease-in-out ${
                      location.pathname === to
                        ? "w-full"
                        : "w-0 group-hover:w-full"
                    }`}
                  />
                </span>
                {badge && (
                  <span className="absolute top-1 right-1 inline-flex items-center justify-center w-4 h-4 text-xs font-bold leading-none text-white bg-red-600 rounded-full">
                    !
                  </span>
                )}
              </Link>
            ))}
          </div>
        </div>

        {/* Right side */}
        <div className="flex items-center space-x-4">
          {/* Dark mode toggle */}
          <button
            onClick={toggleDarkMode}
            className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500"
            aria-label={
              darkMode ? "Switch to Light Mode" : "Switch to Dark Mode"
            }
            type="button"
          >
            {darkMode ? (
              <Sun size={20} className="text-yellow-400" />
            ) : (
              <Moon size={20} className="text-gray-700 dark:text-gray-300" />
            )}
          </button>

          {loading ? (
            <div className="h-10 w-20 bg-gray-200 dark:bg-gray-700 rounded-md animate-pulse"></div>
          ) : user ? (
            <div className="relative" ref={userMenuRef}>
              {/* User avatar & name */}
              <button
                onClick={() => setIsUserMenuOpen((v) => !v)}
                className="flex items-center space-x-2 focus:outline-none focus:ring-2 focus:ring-blue-500 rounded-full"
                aria-haspopup="true"
                aria-expanded={isUserMenuOpen}
                aria-label="User menu"
                type="button"
              >
                <div className="w-9 h-9 bg-gradient-to-br from-blue-600 to-blue-400 rounded-full flex items-center justify-center text-white font-bold uppercase select-none shadow-sm">
                  {user.name?.[0] || "U"}
                </div>
                <span className="hidden md:inline font-medium max-w-[120px] truncate">
                  {user.name}
                </span>
                {user && (
                  <div className="flex items-center bg-gray-100 dark:bg-gray-800 rounded-full px-3 py-1.5 text-sm font-medium">
                    <span className="text-yellow-600 dark:text-yellow-400 mr-1">
                      💰
                    </span>
                    <span className="text-gray-700 dark:text-gray-300">
                      {user.coins || 0}
                    </span>
                  </div>
                )}
                {isUserMenuOpen ? (
                  <ChevronUp size={16} className="hidden md:block" />
                ) : (
                  <ChevronDown size={16} className="hidden md:block" />
                )}
              </button>

              {/* User dropdown */}
              <AnimatePresence>
                {isUserMenuOpen && (
                  <motion.div
                    variants={menuVariants}
                    initial="hidden"
                    animate="visible"
                    exit="hidden"
                    className="absolute right-0 mt-2 w-56 origin-top-right bg-white dark:bg-gray-800 rounded-lg shadow-xl ring-1 ring-black/10 dark:ring-white/10 z-50 overflow-hidden divide-y divide-gray-100 dark:divide-gray-700"
                    role="menu"
                  >
                    <div className="py-1">
                      <div className="px-4 py-3 flex items-center border-b border-gray-100 dark:border-gray-700">
                        <div className="w-8 h-8 bg-gradient-to-br from-blue-600 to-blue-400 rounded-full flex items-center justify-center text-white font-bold uppercase select-none mr-3">
                          {user.name?.[0] || "U"}
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
                            {user.name}
                          </p>
                          <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                            {user.email}
                          </p>
                        </div>
                      </div>
                    </div>
                    <div className="py-1">
                      <Link
                        to="/profile"
                        className="flex items-center px-4 py-2.5 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
                        role="menuitem"
                        onClick={() => setIsUserMenuOpen(false)}
                      >
                        <User
                          size={16}
                          className="mr-3 text-gray-400 dark:text-gray-500"
                        />
                        Profile
                      </Link>
                      {user.isAdmin && (
                        <Link
                          to="/admin"
                          className="flex items-center px-4 py-2.5 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
                          role="menuitem"
                          onClick={() => setIsUserMenuOpen(false)}
                        >
                          <ShieldCheck
                            size={16}
                            className="mr-3 text-gray-400 dark:text-gray-500"
                          />
                          Admin Dashboard
                        </Link>
                      )}

                      {!user.isAdmin && (
                        <Link
                          to="/my-transactions"
                          className="flex items-center px-4 py-2.5 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
                          role="menuitem"
                          onClick={() => setIsUserMenuOpen(false)}
                        >
                          <FileText
                            size={16}
                            className="mr-3 text-gray-400 dark:text-gray-500"
                          />
                          My Transactions
                        </Link>
                      )}
                    </div>
                    <div className="py-1">
                      <button
                        onClick={handleLogout}
                        className="w-full flex items-center px-4 py-2.5 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                        role="menuitem"
                      >
                        <LogOut size={16} className="mr-3" />
                        Logout
                      </button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          ) : (
            <Link
              to="/login"
              className="bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded-md text-sm flex items-center space-x-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors text-white shadow-sm"
              aria-label="Login"
            >
              <LogIn size={16} />
              <span>Login</span>
            </Link>
          )}
        </div>
      </div>

      {/* Mobile menu */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div
            ref={menuRef}
            variants={mobileMenuVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            transition={{ duration: 0.2, ease: "easeInOut" }}
            className="md:hidden overflow-hidden"
          >
            <div className="pt-2 pb-4 space-y-2 border-t border-gray-200 dark:border-gray-800 mt-3 bg-white/95 dark:bg-gray-900/95 backdrop-blur-sm">
              {!user && (
                <Link
                  to="/login"
                  className="block px-4 py-3 mx-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white flex items-center space-x-3"
                >
                  <LogIn size={18} />
                  <span>Login</span>
                </Link>
              )}

              <Link
                to="/"
                className={`block px-4 py-3 mx-2 rounded-lg flex items-center space-x-3 relative group ${
                  location.pathname === "/"
                    ? "text-blue-600 dark:text-blue-400"
                    : "text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400"
                }`}
              >
                <Home size={20} />
                <span className="relative">
                  Home
                  <span
                    className={`absolute left-0 -bottom-1 h-0.5 bg-blue-600 dark:bg-blue-400 transition-all duration-300 ease-in-out ${
                      location.pathname === "/"
                        ? "w-full"
                        : "w-0 group-hover:w-full"
                    }`}
                  />
                </span>
              </Link>

              {navLinks.map(({ to, label, icon }) => (
                <Link
                  key={to}
                  to={to}
                  className={`block px-4 py-3 mx-2 rounded-lg flex items-center space-x-3 relative group ${
                    location.pathname === to
                      ? "text-blue-600 dark:text-blue-400"
                      : "text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400"
                  }`}
                >
                  {icon}
                  <span className="relative">
                    {label}
                    <span
                      className={`absolute left-0 -bottom-1 h-0.5 bg-blue-600 dark:bg-blue-400 transition-all duration-300 ease-in-out ${
                        location.pathname === to
                          ? "w-full"
                          : "w-0 group-hover:w-full"
                      }`}
                    />
                  </span>
                </Link>
              ))}
              {user && (
                <button
                  onClick={handleLogout}
                  className="w-full text-left px-4 py-3 mx-2 rounded-lg text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/30 flex items-center space-x-3"
                >
                  <LogOut size={18} />
                  <span>Logout</span>
                </button>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
};

export default Navbar;
