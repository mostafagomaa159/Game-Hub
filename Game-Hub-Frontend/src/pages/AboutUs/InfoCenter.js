import React, { useState } from "react";
import { Link, Outlet, useLocation } from "react-router-dom";

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
    <div className="max-w-6xl mx-auto p-4">
      {/* Mobile toggle button */}
      <div className="md:hidden mb-4">
        <button
          onClick={() => setMenuOpen(!menuOpen)}
          className="w-full bg-gray-200 dark:bg-gray-800 text-gray-800 dark:text-gray-200 px-4 py-2 rounded-lg shadow"
        >
          {menuOpen ? "Hide Menu ▲" : "Show Menu ▼"}
        </button>
      </div>

      <div className="flex flex-col md:flex-row">
        {/* Sidebar */}
        {(menuOpen || window.innerWidth >= 768) && (
          <aside className="md:w-1/4 mb-4 md:mb-0 md:mr-8">
            <div className="bg-gray-100 dark:bg-gray-800 rounded-lg p-4 shadow">
              <h2 className="text-lg font-bold mb-3 text-gray-700 dark:text-gray-200">
                Info Center
              </h2>
              <ul className="space-y-2">
                {links.map((link) => (
                  <li key={link.path}>
                    <Link
                      to={link.path}
                      className={`block px-3 py-2 rounded-lg transition ${
                        pathname === link.path
                          ? "bg-blue-500 text-white"
                          : "hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-800 dark:text-gray-200"
                      }`}
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          </aside>
        )}

        {/* Main content */}
        <main className="flex-1 bg-white dark:bg-gray-900 rounded-lg shadow p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default InfoCenter;
