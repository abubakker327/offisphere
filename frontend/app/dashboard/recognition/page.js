"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";

const API_BASE =
  process.env.NEXT_PUBLIC_API_BASE || "https://offisphere.onrender.com";

export default function RecognitionPage() {
  const [recognitions, setRecognitions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState({
    receiver_email: "",
    title: "",
    message: "",
    badge: "",
  });

  const fetchRecognitions = async () => {
    try {
      setLoading(true);
      const res = await fetch(`${API_BASE}/api/recognitions`, {
        credentials: "include",
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.message || "Error fetching recognitions");
      } else {
        setRecognitions(data || []);
        setError("");
      }
    } catch (err) {
      console.error("Fetch recognitions error:", err);
      setError("Error connecting to server");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRecognitions();
  }, []);

  const handleChange = (field, value) => {
    setForm((f) => ({ ...f, [field]: value }));
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    setError("");

    if (!form.receiver_email || !form.title) {
      setError("Receiver email and title are required");
      return;
    }

    try {
      setCreating(true);

      const res = await fetch(`${API_BASE}/api/recognitions`, {
        credentials: "include",
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(form),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.message || "Error creating recognition");
      } else {
        setForm({
          receiver_email: "",
          title: "",
          message: "",
          badge: "",
        });
        // prepend new recognition
        setRecognitions((prev) => [data, ...prev]);
      }
    } catch (err) {
      console.error("Create recognition error:", err);
      setError("Error connecting to server");
    } finally {
      setCreating(false);
    }
  };

  const formatDateTime = (value) =>
    value
      ? new Date(value).toLocaleString(undefined, {
          dateStyle: "medium",
          timeStyle: "short",
        })
      : "-";

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25 }}
      className="space-y-6 rounded-3xl bg-slate-50/70 p-4 md:p-6"
    >
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-blue-600 text-white text-xs font-semibold shadow-[0_8px_20px_rgba(124,58,237,0.25)]">
            <span>Team kudos</span>
          </div>
          <div>
            <h1 className="text-3xl font-semibold text-slate-900">
              Recognition
            </h1>
            <p className="text-sm text-slate-500">
              Send kudos to teammates and view recent recognitions.
            </p>
          </div>
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="bg-rose-50 border border-rose-100 text-rose-700 text-xs rounded-2xl px-4 py-3">
          {error}
        </div>
      )}

      {/* Create recognition card */}
      <motion.div
        whileHover={{ y: -2 }}
        className="rounded-3xl bg-white border border-slate-100 shadow-[0_20px_40px_rgba(15,23,42,0.08)] p-6"
      >
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-base font-semibold text-slate-900">
            Give recognition
          </h2>
          <span className="text-xs text-slate-400">
            A short note can make someone&apos;s day
          </span>
        </div>

        <form
          onSubmit={handleCreate}
          className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm"
        >
          <div className="space-y-1">
            <label className="text-xs text-slate-600">Receiver email</label>
            <input
              type="email"
              value={form.receiver_email}
              onChange={(e) => handleChange("receiver_email", e.target.value)}
              placeholder="employee@company.com"
              className="w-full px-4 py-3 rounded-2xl border border-slate-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              required
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs text-slate-600">Badge (optional)</label>
            <select
              value={form.badge}
              onChange={(e) => handleChange("badge", e.target.value)}
              className="w-full px-4 py-3 rounded-2xl border border-slate-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">None</option>
              <option value="Star">Star</option>
              <option value="Team Player">Team player</option>
              <option value="Leadership">Leadership</option>
              <option value="Going Extra Mile">Going extra mile</option>
            </select>
          </div>

          <div className="space-y-1 md:col-span-2">
            <label className="text-xs text-slate-600">Title</label>
            <input
              type="text"
              value={form.title}
              onChange={(e) => handleChange("title", e.target.value)}
              placeholder="For helping ship the Offisphere release"
              className="w-full px-4 py-3 rounded-2xl border border-slate-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              required
            />
          </div>

          <div className="space-y-1 md:col-span-2">
            <label className="text-xs text-slate-600">Message (optional)</label>
            <textarea
              rows={3}
              value={form.message}
              onChange={(e) => handleChange("message", e.target.value)}
              placeholder="Write a few words about what they did well"
              className="w-full px-4 py-3 rounded-2xl border border-slate-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
            />
          </div>

          <div className="md:col-span-2 flex justify-end">
            <motion.button
              type="submit"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.97 }}
              disabled={creating}
              className="px-5 py-2.5 rounded-2xl bg-blue-600 text-white text-sm font-medium shadow-lg shadow-blue-300/50 hover:bg-blue-700 disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {creating ? "Sending" : "Send recognition"}
            </motion.button>
          </div>
        </form>
      </motion.div>

      {/* Recent recognitions list */}
      <motion.div
        whileHover={{ y: -2 }}
        className="rounded-3xl bg-white border border-slate-100 shadow-[0_18px_40px_rgba(15,23,42,0.08)]"
      >
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
          <h2 className="text-base font-semibold text-slate-900">
            Recent recognitions
          </h2>
        </div>

        {loading ? (
          <div className="py-6 text-center text-xs text-slate-400">
            Loading recognitions
          </div>
        ) : recognitions.length === 0 ? (
          <div className="py-6 text-center text-xs text-slate-400">
            No recognitions yet. Be the first to send one!
          </div>
        ) : (
          <div className="space-y-3 px-6 py-4">
            {recognitions.map((r) => (
              <div
                key={r.id}
                className="flex flex-col md:flex-row md:items-center justify-between gap-2 rounded-2xl border border-slate-100 px-4 py-3 hover:bg-slate-50"
              >
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    {r.badge && (
                      <span className="text-xs px-2 py-0.5 rounded-full bg-blue-100 text-blue-700 border border-blue-200">
                        {r.badge}
                      </span>
                    )}
                    <p className="text-sm font-medium text-slate-900">
                      {r.title}
                    </p>
                  </div>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    From{" "}
                    <span className="font-medium">
                      {r.giver_name || r.giver_email || "Someone"}
                    </span>{" "}
                    to{" "}
                    <span className="font-medium">
                      {r.receiver_name || r.receiver_email || "a teammate"}
                    </span>
                  </p>
                  {r.message && (
                    <p className="text-xs text-slate-600 mt-1">{r.message}</p>
                  )}
                </div>
                <div className="text-[11px] text-slate-400 md:text-right">
                  {formatDateTime(r.created_at)}
                </div>
              </div>
            ))}
          </div>
        )}
      </motion.div>
    </motion.div>
  );
}
