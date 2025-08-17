import React, { useState } from "react";
import { toast } from "react-toastify";

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
      } catch (e) {
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
      console.log("submitReport result:", result);

      if (result?.success && result.data?.post) {
        const updatedPost = result.data.post;

        toast.success("Report submitted successfully");

        // ✅ Pass the updated post, not the whole result
        onReportSuccess?.(updatedPost);

        // reset form & close modal
        setReportData({ videoUrl: "", reason: "", urgency: "medium" });
        setShowReportModal(false);
      } else {
        toast.error(result?.error || "Failed to submit report");
      }
    } catch (error) {
      console.error("Report submission error:", error);
      toast.error("An error occurred while submitting report");
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-md shadow-xl">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-xl font-bold text-gray-900 dark:text-white">
            Report Trade Issue
          </h3>
          <button
            onClick={() => setShowReportModal(false)}
            disabled={reportSubmitting}
            className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
          >
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="mb-4">
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
              className={`w-full p-2 border rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                errors.videoUrl
                  ? "border-red-500"
                  : "border-gray-300 dark:border-gray-600"
              }`}
              required
              disabled={reportSubmitting}
            />
            {errors.videoUrl && (
              <p className="mt-1 text-sm text-red-600">{errors.videoUrl}</p>
            )}
          </div>

          <div className="mb-4">
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
              className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              rows={3}
              placeholder="Describe the issue..."
              disabled={reportSubmitting}
            />
          </div>

          <div className="mb-6">
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
              className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700"
              disabled={reportSubmitting}
            >
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
            </select>
          </div>

          <div className="flex justify-end gap-3">
            <button
              type="button"
              onClick={() => setShowReportModal(false)}
              className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 rounded-md hover:bg-gray-200 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
              disabled={reportSubmitting}
            >
              Cancel
            </button>
            <button
              type="submit"
              className={`px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 ${
                reportSubmitting ? "opacity-50 cursor-not-allowed" : ""
              }`}
              disabled={reportSubmitting}
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
        </form>
      </div>
    </div>
  );
};

export default ReportModal;
