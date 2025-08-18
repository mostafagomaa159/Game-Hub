// src/components/common/ReportModal.js
import React, { useState } from "react";
import { XMarkIcon, ShieldExclamationIcon } from "@heroicons/react/24/outline";

const ReportModal = ({
  setShowReportModal,
  submitReport,
  selectedPost,
  reportSubmitting,
  onReportSuccess,
}) => {
  const [reportData, setReportData] = useState({
    videoUrl: "",
    reason: "",
    urgency: "medium",
  });
  const [errors, setErrors] = useState({});

  const validateForm = () => {
    const newErrors = {};

    if (!reportData.videoUrl.trim()) {
      newErrors.videoUrl = "Evidence URL is required";
    } else {
      try {
        new URL(reportData.videoUrl.trim());
      } catch {
        newErrors.videoUrl =
          "Please enter a valid URL (include http:// or https://)";
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setReportData((prev) => ({
      ...prev,
      [name]: value,
    }));

    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: undefined }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    const dataToSubmit = {
      videoUrls: [reportData.videoUrl.trim()],
      reason: reportData.reason.trim() || "No reason provided",
      urgency: reportData.urgency,
    };

    try {
      const result = await submitReport(selectedPost, dataToSubmit);
      if (result?.success && result.data?.post) {
        onReportSuccess?.(result.data.post);
        setReportData({ videoUrl: "", reason: "", urgency: "medium" });
        setShowReportModal(false);
      } else {
        console.error(result?.error || "Failed to submit report");
      }
    } catch (error) {
      console.error("Report submission error:", error);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 rounded-xl shadow-2xl w-full max-w-md relative max-h-[90vh] overflow-hidden flex flex-col border border-gray-200 dark:border-gray-700">
        {/* Sticky Header */}
        <div className="sticky top-0 z-20 bg-white dark:bg-gray-900 p-4 flex items-start border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-lg font-bold flex-1 pr-4 flex items-center gap-2">
            <ShieldExclamationIcon className="w-5 h-5 text-red-500" />
            Report Trade Issue
          </h2>
          <button
            onClick={() => setShowReportModal(false)}
            disabled={reportSubmitting}
            className="p-1.5 rounded-full bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 dark:focus:ring-offset-gray-900"
          >
            <XMarkIcon className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Evidence URL */}
            <div>
              <label
                htmlFor="videoUrl"
                className="block mb-2 text-sm font-medium text-gray-700 dark:text-gray-300"
              >
                Evidence URL <span className="text-red-500">*</span>
              </label>
              <input
                id="videoUrl"
                type="url"
                name="videoUrl"
                value={reportData.videoUrl}
                onChange={handleChange}
                placeholder="https://example.com/video.mp4"
                className={`w-full p-2.5 rounded-lg border text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-800 ${
                  errors.videoUrl
                    ? "border-red-500"
                    : "border-gray-300 dark:border-gray-600"
                }`}
                disabled={reportSubmitting}
                required
              />
              {errors.videoUrl && (
                <p className="mt-1 text-sm text-red-600">{errors.videoUrl}</p>
              )}
            </div>

            {/* Reason */}
            <div>
              <label
                htmlFor="reason"
                className="block mb-2 text-sm font-medium text-gray-700 dark:text-gray-300"
              >
                Reason
              </label>
              <textarea
                id="reason"
                name="reason"
                value={reportData.reason}
                onChange={handleChange}
                className="w-full p-2.5 rounded-lg border border-gray-300 dark:border-gray-600 focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-800 text-sm"
                rows={3}
                placeholder="Describe the issue..."
                disabled={reportSubmitting}
              />
            </div>

            {/* Urgency */}
            <div>
              <label
                htmlFor="urgency"
                className="block mb-2 text-sm font-medium text-gray-700 dark:text-gray-300"
              >
                Urgency Level
              </label>
              <select
                id="urgency"
                name="urgency"
                value={reportData.urgency}
                onChange={handleChange}
                className="w-full p-2.5 rounded-lg border border-gray-300 dark:border-gray-600 focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-800 text-sm"
                disabled={reportSubmitting}
              >
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
              </select>
            </div>
          </form>
        </div>

        {/* Sticky Footer */}
        <div className="sticky bottom-0 z-20 bg-white dark:bg-gray-900 p-4 border-t border-gray-200 dark:border-gray-700 flex justify-end gap-2">
          <button
            type="button"
            onClick={() => setShowReportModal(false)}
            disabled={reportSubmitting}
            className="px-4 py-2 rounded-lg text-sm font-medium bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 transition-all duration-200 disabled:opacity-70"
          >
            Cancel
          </button>
          <button
            type="submit"
            onClick={handleSubmit}
            disabled={reportSubmitting}
            className="px-4 py-2 rounded-lg text-sm font-medium bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white shadow-md hover:shadow-lg transition-all duration-200 disabled:opacity-70"
          >
            {reportSubmitting ? (
              <>
                <svg
                  className="animate-spin -ml-1 mr-2 h-4 w-4 text-white inline"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  ></circle>
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  ></path>
                </svg>
                Submitting...
              </>
            ) : (
              "Submit Report"
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ReportModal;
