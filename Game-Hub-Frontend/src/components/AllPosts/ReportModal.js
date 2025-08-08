// src/components/AllPosts/ReportModal.js
import React, { useState } from "react";

const ReportModal = ({
  setShowReportModal,
  submitReport,
  selectedPost,
  reportSubmitting, // loading state
}) => {
  const [reportData, setReportData] = useState({
    videoUrl: "",
    reason: "",
    urgency: "medium",
  });

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Prepare payload with videoUrls array as backend expects
    const dataToSubmit = {
      videoUrls: [reportData.videoUrl.trim()],
      reason: reportData.reason.trim() || "No reason provided",
      urgency: reportData.urgency,
    };

    console.log("Submitting report with data:", dataToSubmit);
    const success = await submitReport(selectedPost, dataToSubmit);
    console.log("Report submission success:", success);

    if (success) {
      setShowReportModal(false);
      setReportData({ videoUrl: "", reason: "", urgency: "medium" });
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-md">
        <h3 className="text-xl font-bold mb-4">Report Trade Issue</h3>

        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label className="block mb-2">Evidence URL (required)</label>
            <input
              type="url"
              value={reportData.videoUrl}
              onChange={(e) =>
                setReportData({ ...reportData, videoUrl: e.target.value })
              }
              placeholder="https://example.com/video.mp4"
              className="w-full p-2 border rounded"
              required
              disabled={reportSubmitting}
            />
          </div>

          <div className="mb-4">
            <label className="block mb-2">Reason</label>
            <textarea
              value={reportData.reason}
              onChange={(e) =>
                setReportData({ ...reportData, reason: e.target.value })
              }
              className="w-full p-2 border rounded"
              rows={3}
              disabled={reportSubmitting}
            />
          </div>

          <div className="mb-4">
            <label className="block mb-2">Urgency</label>
            <select
              value={reportData.urgency}
              onChange={(e) =>
                setReportData({ ...reportData, urgency: e.target.value })
              }
              className="w-full p-2 border rounded"
              disabled={reportSubmitting}
            >
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
            </select>
          </div>

          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setShowReportModal(false)}
              className="px-4 py-2 bg-gray-300 rounded"
              disabled={reportSubmitting}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 disabled:opacity-50"
              disabled={reportSubmitting}
            >
              {reportSubmitting ? "Submitting..." : "Submit Report"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ReportModal;
