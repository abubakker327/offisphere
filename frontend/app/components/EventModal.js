"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";

export default function EventModal({ isOpen, onClose, onSubmit, initialEvent }) {
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    start_time: "",
    end_time: "",
    visibility: "public",
  });
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (initialEvent) {
      setFormData({
        title: "",
        description: "",
        start_time: initialEvent.start || "",
        end_time: initialEvent.end || "",
        visibility: "public",
      });
    }
  }, [initialEvent]);

  const validate = () => {
    const newErrors = {};
    if (!formData.title.trim()) newErrors.title = "Title is required";
    if (!formData.start_time) newErrors.start_time = "Start time is required";
    if (!formData.end_time) newErrors.end_time = "End time is required";

    if (formData.start_time && formData.end_time) {
      if (new Date(formData.end_time) <= new Date(formData.start_time)) {
        newErrors.end_time = "End time must be after start time";
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;

    setSubmitting(true);
    try {
      // The datetime-local input gives us local time in the format "YYYY-MM-DDTHH:mm"
      // We need to convert it to UTC properly accounting for the user's timezone offset
      const startLocalStr = formData.start_time;
      const endLocalStr = formData.end_time;

      // Parse the datetime-local values
      const startDate = new Date(startLocalStr);
      const endDate = new Date(endLocalStr);

      // Get the timezone offset in minutes and convert to milliseconds
      const tzOffset = new Date().getTimezoneOffset() * 60 * 1000;

      // Adjust the dates to account for the timezone offset
      // by subtracting the offset to get the actual UTC time
      const startUTC = new Date(startDate.getTime() - tzOffset);
      const endUTC = new Date(endDate.getTime() - tzOffset);

      const submitData = {
        title: formData.title,
        description: formData.description,
        start_time: startUTC.toISOString(),
        end_time: endUTC.toISOString(),
        visibility: formData.visibility,
      };

      console.log("Submitting event:", {
        local_start: startLocalStr,
        offset_minutes: new Date().getTimezoneOffset(),
        utc_start: submitData.start_time,
      });

      await onSubmit(submitData);
      setFormData({
        title: "",
        description: "",
        start_time: "",
        end_time: "",
        visibility: "public",
      });
    } catch (err) {
      console.error("Form submission error:", err);
    } finally {
      setSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <motion.div
      className="fixed inset-0 bg-black/30 backdrop-blur-sm z-50 flex items-center justify-center p-4"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <motion.div
        className="bg-white rounded-2xl shadow-lg max-w-md w-full p-6 space-y-4"
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
      >
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-slate-900">Create Event</h2>
          <button
            onClick={onClose}
            className="p-1 text-slate-400 hover:text-slate-600"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M18 6L6 18M6 6l12 12" strokeLinecap="round"></path>
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Title */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Event Title
            </label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) =>
                setFormData({ ...formData, title: e.target.value })
              }
              className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                errors.title
                  ? "border-red-300 bg-red-50"
                  : "border-slate-200 bg-white"
              }`}
              placeholder="Team meeting"
            />
            {errors.title && (
              <p className="text-xs text-red-600 mt-1">{errors.title}</p>
            )}
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Description (optional)
            </label>
            <textarea
              value={formData.description}
              onChange={(e) =>
                setFormData({ ...formData, description: e.target.value })
              }
              className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
              placeholder="Add details..."
              rows="3"
            />
          </div>

          {/* Start Time */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Start Time
            </label>
            <input
              type="datetime-local"
              value={formData.start_time}
              onChange={(e) =>
                setFormData({ ...formData, start_time: e.target.value })
              }
              className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                errors.start_time
                  ? "border-red-300 bg-red-50"
                  : "border-slate-200 bg-white"
              }`}
            />
            {errors.start_time && (
              <p className="text-xs text-red-600 mt-1">{errors.start_time}</p>
            )}
          </div>

          {/* End Time */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              End Time
            </label>
            <input
              type="datetime-local"
              value={formData.end_time}
              onChange={(e) =>
                setFormData({ ...formData, end_time: e.target.value })
              }
              className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                errors.end_time
                  ? "border-red-300 bg-red-50"
                  : "border-slate-200 bg-white"
              }`}
            />
            {errors.end_time && (
              <p className="text-xs text-red-600 mt-1">{errors.end_time}</p>
            )}
          </div>

          {/* Visibility */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Visibility
            </label>
            <select
              value={formData.visibility}
              onChange={(e) =>
                setFormData({ ...formData, visibility: e.target.value })
              }
              className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
            >
              <option value="public">Public (All users can see)</option>
              <option value="private">Private (Only admins/managers)</option>
            </select>
          </div>

          {/* Buttons */}
          <div className="flex gap-2 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 text-sm font-medium text-slate-700 bg-slate-100 rounded-lg hover:bg-slate-200 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="flex-1 px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {submitting ? "Creating..." : "Create Event"}
            </button>
          </div>
        </form>
      </motion.div>
    </motion.div>
  );
}
