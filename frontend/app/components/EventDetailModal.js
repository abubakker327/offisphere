"use client";

import { useState } from "react";
import { motion } from "framer-motion";

export default function EventDetailModal({
  isOpen,
  onClose,
  event,
  onUpdate,
  onDelete,
  canEdit,
}) {
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    title: event.title || "",
    description: event.extendedProps?.description || "",
    start_time: event.start || "",
    end_time: event.end || "",
  });
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await onUpdate(event.id, formData);
      setIsEditing(false);
    } catch (err) {
      console.error("Update error:", err);
    } finally {
      setSubmitting(false);
    }
  };

  if (!isOpen) return null;

  const startDate = new Date(event.start || "");
  const endDate = new Date(event.end || "");

  return (
    <motion.div
      className="fixed inset-0 bg-black/30 backdrop-blur-sm z-50 flex items-center justify-center p-4"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <motion.div
        className="bg-white rounded-2xl shadow-lg max-w-md w-full p-6 space-y-4 max-h-96 overflow-y-auto"
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
      >
        {/* Header */}
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-slate-900">
            {isEditing ? "Edit Event" : "Event Details"}
          </h2>
          <button
            onClick={onClose}
            className="p-1 text-slate-400 hover:text-slate-600"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M18 6L6 18M6 6l12 12" strokeLinecap="round"></path>
            </svg>
          </button>
        </div>

        {!isEditing ? (
          // View mode
          <div className="space-y-4">
            <div>
              <h3 className="text-sm font-medium text-slate-500">Title</h3>
              <p className="text-lg font-semibold text-slate-900 mt-1">
                {event.title}
              </p>
            </div>

            {event.extendedProps?.description && (
              <div>
                <h3 className="text-sm font-medium text-slate-500">
                  Description
                </h3>
                <p className="text-slate-700 mt-1">
                  {event.extendedProps.description}
                </p>
              </div>
            )}

            <div>
              <h3 className="text-sm font-medium text-slate-500">Start Time</h3>
              <p className="text-slate-900 mt-1">
                {startDate.toLocaleString()}
              </p>
            </div>

            <div>
              <h3 className="text-sm font-medium text-slate-500">End Time</h3>
              <p className="text-slate-900 mt-1">{endDate.toLocaleString()}</p>
            </div>

            <div>
              <h3 className="text-sm font-medium text-slate-500">Visibility</h3>
              <p className="text-slate-900 mt-1 capitalize">
                {event.extendedProps?.visibility || "Public"}
              </p>
            </div>

            {/* Action buttons */}
            {canEdit && (
              <div className="flex gap-2 pt-4">
                <button
                  onClick={() => setIsEditing(true)}
                  className="flex-1 px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Edit
                </button>
                <button
                  onClick={() => {
                    if (confirm("Are you sure you want to delete this event?")) {
                      onDelete(event.id);
                    }
                  }}
                  className="flex-1 px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700 transition-colors"
                >
                  Delete
                </button>
                <button
                  onClick={onClose}
                  className="flex-1 px-4 py-2 text-sm font-medium text-slate-700 bg-slate-100 rounded-lg hover:bg-slate-200 transition-colors"
                >
                  Close
                </button>
              </div>
            )}
            
            {!canEdit && (
              <div className="flex gap-2 pt-4">
                <button
                  onClick={() => {
                    if (confirm("Are you sure you want to delete this event?")) {
                      onDelete(event.id);
                    }
                  }}
                  className="flex-1 px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700 transition-colors"
                >
                  Delete
                </button>
                <button
                  onClick={onClose}
                  className="flex-1 px-4 py-2 text-sm font-medium text-slate-700 bg-slate-100 rounded-lg hover:bg-slate-200 transition-colors"
                >
                  Close
                </button>
              </div>
            )}
          </div>
        ) : (
          // Edit mode
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Title
              </label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) =>
                  setFormData({ ...formData, title: e.target.value })
                }
                className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Description
              </label>
              <textarea
                value={formData.description}
                onChange={(e) =>
                  setFormData({ ...formData, description: e.target.value })
                }
                className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                rows="3"
              />
            </div>

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
                className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

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
                className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div className="flex gap-2 pt-4">
              <button
                type="button"
                onClick={() => setIsEditing(false)}
                className="flex-1 px-4 py-2 text-sm font-medium text-slate-700 bg-slate-100 rounded-lg hover:bg-slate-200 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="flex-1 px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
              >
                {submitting ? "Saving..." : "Save Changes"}
              </button>
            </div>
          </form>
        )}
      </motion.div>
    </motion.div>
  );
}
