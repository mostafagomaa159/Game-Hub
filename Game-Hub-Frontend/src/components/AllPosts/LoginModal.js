// src/components/AllPosts/LoginModal.js
import React from "react";

const LoginModal = ({ setShowLoginModal, modalRef }) => {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50">
      <div
        ref={modalRef}
        className="bg-white dark:bg-gray-900 rounded-xl shadow-lg p-6 w-80"
      >
        <h3 className="text-xl font-bold mb-4 text-gray-800 dark:text-white">
          Login Required
        </h3>
        <p className="text-gray-600 dark:text-gray-300 mb-6">
          You need to log in to perform this action.
        </p>
        <div className="flex justify-end gap-3">
          <button
            onClick={() => setShowLoginModal(false)}
            className="px-4 py-2 bg-gray-300 dark:bg-gray-700 dark:text-white rounded hover:bg-gray-400"
          >
            Cancel
          </button>
          <button
            onClick={() => (window.location.href = "/login")}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Go to Login
          </button>
        </div>
      </div>
    </div>
  );
};

export default React.memo(LoginModal);
