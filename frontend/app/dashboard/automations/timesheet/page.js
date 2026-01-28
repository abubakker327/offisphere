"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import Link from "next/link";

export default function TimesheetEscalationPage() {
  const [mounted, setMounted] = useState(false);
  const [escalations, setEscalations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all"); // all, level_1, level_2, level_3
  const [selectedItem, setSelectedItem] = useState(null);

  const API_BASE = process.env.NEXT_PUBLIC_API_BASE || "https://offisphere.onrender.com";

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted) return;
    const fetchEscalations = async () => {
      try {
        setLoading(true);
        const res = await fetch(`${API_BASE}/api/timesheets/escalations`, {
          credentials: "include",
        });
        const data = res.ok ? await res.json() : [];
        setEscalations(data);
      } catch (err) {
        console.error("Error fetching escalations:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchEscalations();
    const interval = setInterval(fetchEscalations, 15000); // Refresh every 15s
    return () => clearInterval(interval);
  }, [API_BASE, mounted]);

  const filteredEscalations = escalations.filter((e) => {
    if (filter === "all") return true;
    return e.escalation_level === parseInt(filter.split("_")[1]);
  });

  const getLevelColor = (level) => {
    switch (level) {
      case 1:
        return "bg-yellow-100 text-yellow-800 border-yellow-200";
      case 2:
        return "bg-orange-100 text-orange-800 border-orange-200";
      case 3:
        return "bg-red-100 text-red-800 border-red-200";
      default:
        return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  const getLevelLabel = (level) => {
    switch (level) {
      case 1:
        return "Level 1 - Warning";
      case 2:
        return "Level 2 - Urgent";
      case 3:
        return "Level 3 - Critical";
      default:
        return "Unknown";
    }
  };

  const getTimeRemaining = (level) => {
    const times = {
      1: "Time until 20:00",
      2: "Time until 20:05",
      3: "Timesheet locked at 20:10",
    };
    return times[level] || "N/A";
  };

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <div className="border-b border-slate-200 bg-white">
        <div className="mx-auto max-w-7xl px-6 py-6">
          <Link href="/dashboard/automations" className="text-sm text-blue-600 hover:text-blue-700 mb-4 inline-block">
            ← Back to Dashboard
          </Link>
          <div className="flex items-center gap-3 mt-2">
            <div className="h-10 w-10 rounded-2xl bg-amber-100 text-amber-600 flex items-center justify-center">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                <line x1="16" y1="2" x2="16" y2="6" />
                <line x1="8" y1="2" x2="8" y2="6" />
                <line x1="3" y1="10" x2="21" y2="10" />
              </svg>
            </div>
            <div>
              <h1 className="text-3xl font-bold text-slate-900">Timesheet Escalation</h1>
              <p className="text-sm text-slate-600">Hard cutoff at 20:00, 20:05, 20:10</p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="mx-auto max-w-7xl px-6 py-8">
        {/* Escalation Levels Info */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <motion.div
            whileHover={{ scale: 1.02 }}
            className="bg-yellow-50 border-2 border-yellow-200 rounded-2xl p-6 cursor-pointer"
            onClick={() => setFilter("all")}
          >
            <div className="text-2xl font-bold text-yellow-600 mb-2">Level 1</div>
            <p className="text-sm text-yellow-800 mb-3">⏰ 20:00 - First Warning</p>
            <p className="text-xs text-yellow-700">
              {escalations.filter((e) => e.escalation_level === 1).length} timesheets
            </p>
          </motion.div>

          <motion.div
            whileHover={{ scale: 1.02 }}
            className="bg-orange-50 border-2 border-orange-200 rounded-2xl p-6 cursor-pointer"
            onClick={() => setFilter("level_2")}
          >
            <div className="text-2xl font-bold text-orange-600 mb-2">Level 2</div>
            <p className="text-sm text-orange-800 mb-3">🔔 20:05 - Urgent Notice</p>
            <p className="text-xs text-orange-700">
              {escalations.filter((e) => e.escalation_level === 2).length} timesheets
            </p>
          </motion.div>

          <motion.div
            whileHover={{ scale: 1.02 }}
            className="bg-red-50 border-2 border-red-200 rounded-2xl p-6 cursor-pointer"
            onClick={() => setFilter("level_3")}
          >
            <div className="text-2xl font-bold text-red-600 mb-2">Level 3</div>
            <p className="text-sm text-red-800 mb-3">🚫 20:10 - Locked</p>
            <p className="text-xs text-red-700">
              {escalations.filter((e) => e.escalation_level === 3).length} timesheets
            </p>
          </motion.div>
        </div>

        {/* Filter Buttons */}
        <div className="flex gap-2 mb-6 flex-wrap">
          {["all", "level_1", "level_2", "level_3"].map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                filter === f
                  ? "bg-blue-600 text-white"
                  : "bg-white border border-slate-200 text-slate-700 hover:border-slate-300"
              }`}
            >
              {f === "all" ? "All" : `Level ${f.split("_")[1]}`}
            </button>
          ))}
        </div>

        {/* Info Alert */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-blue-50 border border-blue-200 rounded-2xl p-4 mb-6 flex gap-3"
        >
          <div className="h-5 w-5 rounded-full bg-blue-600 text-white flex items-center justify-center text-xs flex-shrink-0 mt-0.5">
            ℹ
          </div>
          <div className="text-sm text-blue-900">
            <strong>Daily Cutoff Times:</strong> Timesheets must be submitted by 20:00, notified at 20:05, locked at 20:10. This system runs automatically.
          </div>
        </motion.div>

        {/* Escalations List */}
        <div className="space-y-3">
          {loading ? (
            <div className="text-center py-12">
              <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-slate-200 border-t-blue-600"></div>
              <p className="text-slate-600 mt-3">Loading escalations...</p>
            </div>
          ) : filteredEscalations.length === 0 ? (
            <div className="text-center py-12 bg-white rounded-2xl border border-slate-200">
              <div className="text-4xl mb-2">✓</div>
              <p className="text-slate-600">No escalations at this level</p>
            </div>
          ) : (
            filteredEscalations.map((item, idx) => (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.05 }}
                onClick={() => setSelectedItem(item)}
                className={`rounded-2xl border-2 p-6 cursor-pointer transition-all hover:shadow-md ${getLevelColor(item.escalation_level)}`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <span className="text-2xl">📋</span>
                      <div>
                        <h3 className="font-semibold">
                          Timesheet for {item.employee_name || `Employee ${item.employee_id}`}
                        </h3>
                        <p className="text-xs opacity-75">
                          Period: {item.period_start} to {item.period_end}
                        </p>
                      </div>
                    </div>
                    <p className="text-sm mt-2">
                      <strong>Status:</strong> {item.status || "Pending Submission"}
                    </p>
                  </div>
                  <div className="text-right">
                    <div className="inline-block px-3 py-1 rounded-full text-sm font-medium bg-white bg-opacity-50 mb-2">
                      {getLevelLabel(item.escalation_level)}
                    </div>
                    <p className="text-xs opacity-75 mt-2">{getTimeRemaining(item.escalation_level)}</p>
                  </div>
                </div>
              </motion.div>
            ))
          )}
        </div>
      </div>

      {/* Detail Modal */}
      {selectedItem && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50" onClick={() => setSelectedItem(null)}>
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            onClick={(e) => e.stopPropagation()}
            className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl"
          >
            <h2 className="text-xl font-bold text-slate-900 mb-4">Timesheet Details</h2>
            <div className="space-y-3 mb-6">
              <div>
                <p className="text-xs text-slate-500">EMPLOYEE</p>
                <p className="text-sm font-medium text-slate-900">{selectedItem.employee_name || selectedItem.employee_id}</p>
              </div>
              <div>
                <p className="text-xs text-slate-500">PERIOD</p>
                <p className="text-sm font-medium text-slate-900">
                  {selectedItem.period_start} to {selectedItem.period_end}
                </p>
              </div>
              <div>
                <p className="text-xs text-slate-500">ESCALATION LEVEL</p>
                <p className={`text-sm font-medium inline-block px-2 py-1 rounded ${getLevelColor(selectedItem.escalation_level)}`}>
                  {getLevelLabel(selectedItem.escalation_level)}
                </p>
              </div>
              <div>
                <p className="text-xs text-slate-500">STATUS</p>
                <p className="text-sm font-medium text-slate-900">{selectedItem.status || "Pending"}</p>
              </div>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => setSelectedItem(null)}
                className="flex-1 px-4 py-2 rounded-lg border border-slate-200 text-slate-700 hover:bg-slate-50 transition-all"
              >
                Close
              </button>
              <button
                onClick={() => {
                  // TODO: Quick submit action
                  setSelectedItem(null);
                }}
                className="flex-1 px-4 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 transition-all"
              >
                Submit Now
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}
