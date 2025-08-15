import React, { useState } from "react";
import { Link, Outlet, useLocation } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";

const links = [
  { label: "📜 Rules", path: "/about/rules" },

  { label: "🛡️ Privacy Policy", path: "/about/privacy-policy" },
  { label: "📄 Terms of Use", path: "/about/terms" },
  { label: "💬 Dispute Policy", path: "/about/dispute-policy" },
  { label: "⚠️ Disclaimer", path: "/about/disclaimer" },
  { label: "📬 Contact", path: "/about/contact" },
  { label: "ℹ️ About Us", path: "/about/about" },
  { label: "🆘 Help", path: "/about/help" },
];

const InfoCenter = () => {
  const { pathname } = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <div className="max-w-7xl mx-auto p-4">
      {/* Mobile Toggle */}
      <div className="md:hidden mb-4">
        <button
          onClick={() => setMenuOpen(!menuOpen)}
          className="w-full bg-gradient-to-r from-blue-500 to-indigo-600 text-white px-4 py-2 rounded-xl shadow-lg font-semibold"
        >
          {menuOpen ? "▲ Hide Menu" : "▼ Show Menu"}
        </button>
      </div>

      <div className="flex flex-col md:flex-row gap-6">
        {/* Sidebar */}
        <AnimatePresence>
          {(menuOpen || window.innerWidth >= 768) && (
            <motion.aside
              key="sidebar"
              initial={{ x: -250, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: -250, opacity: 0 }}
              transition={{ duration: 0.3, ease: "easeInOut" }}
              className="md:w-1/4 md:sticky md:top-4 h-fit"
            >
              <div className="backdrop-blur-lg bg-white/70 dark:bg-gray-800/70 border border-gray-200 dark:border-gray-700 rounded-2xl p-4 shadow-lg">
                <h2 className="text-lg font-bold mb-3 text-gray-700 dark:text-gray-200">
                  Info Center
                </h2>
                <ul className="space-y-2">
                  {links.map((link) => (
                    <li key={link.path}>
                      <Link
                        to={link.path}
                        onClick={() => setMenuOpen(false)}
                        className={`block px-3 py-2 rounded-lg transition font-medium ${
                          pathname === link.path
                            ? "bg-gradient-to-r from-blue-500 to-indigo-600 text-white shadow-md"
                            : "hover:bg-gray-200/70 dark:hover:bg-gray-700/70 text-gray-800 dark:text-gray-200"
                        }`}
                      >
                        {link.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            </motion.aside>
          )}
        </AnimatePresence>

        {/* Main Content */}
        <motion.main
          key={pathname}
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.25, ease: "easeOut" }}
          className="flex-1 backdrop-blur-lg bg-white/80 dark:bg-gray-900/80 border border-gray-200 dark:border-gray-700 rounded-2xl shadow-lg p-6"
        >
          <Outlet />
        </motion.main>
      </div>
    </div>
  );
};

export default InfoCenter;
