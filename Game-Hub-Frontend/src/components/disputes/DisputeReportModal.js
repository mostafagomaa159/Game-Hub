import React, { useState, useEffect } from "react";
import PropTypes from "prop-types";
import { useSocket } from "../context/SocketContext";
import axios from "axios";
import { toast } from "react-toastify";

const DisputeReportModal = ({ trade, user, onClose, onReportSubmitted }) => {
  const [form, setForm] = useState({ reason: "", urgency: "medium" });
  const [file, setFile] = useState(null);
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const socket = useSocket();

  useEffect(() => {
    document.querySelector("textarea")?.focus();
  }, []);

  const validateForm = () => {
    const newErrors = {};
    if (!form.reason.trim()) newErrors.reason = "Reason is required";
    if (!file && !form.evidenceUrl) newErrors.evidence = "Evidence is required";
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const uploadEvidence = async () => {
    const formData = new FormData();
    formData.append("evidence", file);
    const { data } = await axios.post("/api/upload", formData);
    return data.url;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;
    setIsSubmitting(true);

    try {
      const evidenceUrl = file ? await uploadEvidence() : form.evidenceUrl;
      const { data } = await axios.post(`/api/trade/${trade._id}/report`, {
        ...form,
        evidenceUrl,
        reporterRole: trade.buyer._id === user._id ? "buyer" : "seller",
      });

      if (socket) {
        socket.emit(
          "dispute:created",
          {
            tradeId: trade._id,
            reporter: user._id,
            otherParty:
              trade.buyer._id === user._id ? trade.seller._id : trade.buyer._id,
          },
          (ack) => {
            if (ack?.error) console.error("Socket error:", ack.error);
          }
        );
      }

      toast.success("Dispute reported successfully!");
      onReportSubmitted(data.updatedTrade);
      onClose();
    } catch (error) {
      toast.error(error.response?.data?.error || "Failed to submit report");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget) onClose();
  };

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4"
      onClick={handleBackdropClick}
      role="dialog"
      aria-modal="true"
    >
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md">
        <div className="p-6">
          <h3 id="modal-title" className="text-xl font-bold mb-4">
            Report Trade Issue
          </h3>

          <form onSubmit={handleSubmit}>
            <div className="mb-4">
              <label className="block text-sm font-medium mb-1">
                Reason for Dispute *
              </label>
              <textarea
                value={form.reason}
                onChange={(e) => setForm({ ...form, reason: e.target.value })}
                className="w-full p-2 border rounded"
                rows={3}
                required
              />
              {errors.reason && (
                <p className="mt-1 text-sm text-red-600">{errors.reason}</p>
              )}
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium mb-1">
                Upload Evidence *
              </label>
              <input
                type="file"
                onChange={(e) => setFile(e.target.files[0])}
                className="w-full p-2 border rounded"
                accept="image/*,video/*,.pdf"
              />
              {errors.evidence && (
                <p className="mt-1 text-sm text-red-600">{errors.evidence}</p>
              )}
            </div>

            <div className="mb-6">
              <label className="block text-sm font-medium mb-1">
                Urgency Level
              </label>
              <select
                value={form.urgency}
                onChange={(e) => setForm({ ...form, urgency: e.target.value })}
                className="w-full p-2 border rounded"
              >
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
              </select>
            </div>

            <div className="flex justify-end space-x-3">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 border rounded"
                disabled={isSubmitting}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
                disabled={isSubmitting}
              >
                {isSubmitting ? "Submitting..." : "Submit Report"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

DisputeReportModal.propTypes = {
  trade: PropTypes.shape({
    _id: PropTypes.string.isRequired,
    buyer: PropTypes.shape({ _id: PropTypes.string.isRequired }).isRequired,
    seller: PropTypes.shape({ _id: PropTypes.string.isRequired }).isRequired,
  }).isRequired,
  user: PropTypes.shape({ _id: PropTypes.string.isRequired }).isRequired,
  onClose: PropTypes.func.isRequired,
  onReportSubmitted: PropTypes.func.isRequired,
};

export default DisputeReportModal;
