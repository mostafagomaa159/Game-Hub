// src/components/AllPosts/ReportModal.js
import React from "react";

const ReportModal = ({
  setShowReportModal,
  reportUrl,
  setReportUrl,
  reportSubmitting,
  submitReport,
  selectedPost,
}) => {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-60">
      <div className="bg-white dark:bg-darkCard text-black dark:text-white rounded-2xl shadow-xl w-full max-w-md p-6 relative">
        <button
          onClick={() => setShowReportModal(false)}
          className="absolute top-2 right-2 text-gray-500 hover:text-gray-800 dark:hover:text-white text-xl"
        >
          &times;
        </button>

        <h3 className="text-lg font-semibold mb-2">Report Trade</h3>
        <p className="text-sm text-gray-600 mb-3">
          Please paste a video URL (evidence). An admin will review the dispute.
        </p>

        <label className="block text-sm mb-1">Video URL</label>
        <input
          type="text"
          value={reportUrl}
          onChange={(e) => setReportUrl(e.target.value)}
          placeholder="https://..."
          className="w-full p-2 rounded border mb-3 bg-white dark:bg-darkCard"
        />

        <div className="flex justify-end gap-2">
          <button
            onClick={() => setShowReportModal(false)}
            className="px-3 py-2 rounded bg-gray-200 dark:bg-gray-800"
          >
            Cancel
          </button>
          <button
            onClick={submitReport}
            disabled={reportSubmitting}
            className="px-4 py-2 rounded bg-red-600 hover:bg-red-700 text-white"
          >
            {reportSubmitting ? "Submitting..." : "Submit Report"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default React.memo(ReportModal);
