"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import Link from "next/link";

export default function AttendanceAnomaliesPage() {
  const [mounted, setMounted] = useState(false);
  const [anomalies, setAnomalies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all"); // all, unresolved, escalated
  const [selectedAnomaly, setSelectedAnomaly] = useState(null);

  const API_BASE = process.env.NEXT_PUBLIC_API_BASE || "https://offisphere.onrender.com";

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted) return;
    const fetchAnomalies = async () => {
      try {
        setLoading(true);
        const res = await fetch(`${API_BASE}/api/attendance/anomalies`, {
          credentials: "include",
        });
        const data = res.ok ? await res.json() : [];
        setAnomalies(data);
      } catch (err) {
        console.error("Error fetching anomalies:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchAnomalies();
    const interval = setInterval(fetchAnomalies, 30000);
    return () => clearInterval(interval);
  }, [API_BASE, mounted]);

  const filteredAnomalies = anomalies.filter((a) => {
    if (filter === "unresolved") return a.status !== "resolved";
    if (filter === "escalated") return a.status === "escalated";
    return true;
  });

  const getStatusColor = (status) => {
    switch (status) {
      case "pending":
        return "bg-yellow-100 text-yellow-800";
      case "escalated":
        return "bg-red-100 text-red-800";
      case "resolved":
        return "bg-green-100 text-green-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getAnomalyIcon = (type) => {
    switch (type) {
      case "missing_checkout":
        return "⏁";
      case "duplicate_checkin":
        return "⧉";
      case "abnormal_hours":
        return "⧌";
      default:
        return "⚠";
    }
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
            <div className="h-10 w-10 rounded-2xl bg-red-100 text-red-600 flex items-center justify-center">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10" />
                <line x1="12" y1="8" x2="12" y2="16" />
                <line x1="8" y1="12" x2="16" y2="12" />
              </svg>
            </div>
            <div>
              <h1 className="text-3xl font-bold text-slate-900">Attendance Anomalies</h1>
              <p className="text-sm text-slate-600">RFID tracking and detection system</p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="mx-auto max-w-7xl px-6 py-8">
        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <div className="bg-white rounded-2xl border border-slate-200 p-6">
            <h3 className="text-sm font-medium text-slate-600 mb-2">Total Anomalies</h3>
            <div className="text-3xl font-bold text-slate-900">
              {anomalies.length}
            </div>
            <p className="text-xs text-slate-500 mt-2">All-time records</p>
          </div>
          <div className="bg-white rounded-2xl border border-slate-200 p-6">
            <h3 className="text-sm font-medium text-slate-600 mb-2">Unresolved</h3>
            <div className="text-3xl font-bold text-red-600">
              {anomalies.filter((a) => a.status !== "resolved").length}
            </div>
            <p className="text-xs text-slate-500 mt-2">Pending action</p>
          </div>
          <div className="bg-white rounded-2xl border border-slate-200 p-6">
            <h3 className="text-sm font-medium text-slate-600 mb-2">Escalated</h3>
            <div className="text-3xl font-bold text-orange-600">
              {anomalies.filter((a) => a.status === "escalated").length}
            </div>
            <p className="text-xs text-slate-500 mt-2">Manager notification</p>
          </div>
        </div>

        {/* Filter Buttons */}
        <div className="flex gap-2 mb-6">
          {["all", "unresolved", "escalated"].map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                filter === f
                  ? "bg-blue-600 text-white"
                  : "bg-white border border-slate-200 text-slate-700 hover:border-slate-300"
              }`}
            >
              {f.charAt(0).toUpperCase() + f.slice(1)}
            </button>
          ))}
        </div>

        {/* Anomalies List */}
        <div className="space-y-3">
          {loading ? (
            <div className="text-center py-12">
              <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-slate-200 border-t-blue-600"></div>
              <p className="text-slate-600 mt-3">Loading anomalies...</p>
            </div>
          ) : filteredAnomalies.length === 0 ? (
            <div className="text-center py-12 bg-white rounded-2xl border border-slate-200">
              <div className="text-4xl mb-2">✓</div>
              <p className="text-slate-600">No anomalies found</p>
            </div>
          ) : (
            filteredAnomalies.map((anomaly, idx) => (
              <motion.div
                key={anomaly.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.05 }}
                onClick={() => setSelectedAnomaly(anomaly)}
                className="bg-white rounded-2xl border border-slate-200 p-6 hover:shadow-md transition-all cursor-pointer"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <span className="text-2xl">{getAnomalyIcon(anomaly.anomaly_type)}</span>
                      <div>
                        <h3 className="font-semibold text-slate-900">
                          {anomaly.anomaly_type?.replace(/_/g, " ").toUpperCase()}
                        </h3>
                        <p className="text-xs text-slate-500">
                          Employee ID: {anomaly.employee_id} | Date: {new Date(anomaly.created_at).toISOString().split('T')[0]}
                        </p>
                      </div>
                    </div>
                    <p className="text-sm text-slate-600 mt-2">
                      <strong>Details:</strong> {anomaly.description || "No description provided"}
                    </p>
                  </div>
                  <div className="text-right">
                    <span className={`inline-block px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(anomaly.status)}`}>
                      {anomaly.status?.toUpperCase()}
                    </span>
                    {anomaly.manager_response && (
                      <p className="text-xs text-slate-500 mt-2">
                        Manager: {anomaly.manager_response}
                      </p>
                    )}
                  </div>
                </div>
              </motion.div>
            ))
          )}
        </div>
      </div>

      {/* Detail Modal */}
      {selectedAnomaly && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50" onClick={() => setSelectedAnomaly(null)}>
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            onClick={(e) => e.stopPropagation()}
            className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl"
          >
            <h2 className="text-xl font-bold text-slate-900 mb-4">Anomaly Details</h2>
            <div className="space-y-3 mb-6">
              <div>
                <p className="text-xs text-slate-500">TYPE</p>
                <p className="text-sm font-medium text-slate-900">
                  {selectedAnomaly.anomaly_type?.replace(/_/g, " ").toUpperCase()}
                </p>
              </div>
              <div>
                <p className="text-xs text-slate-500">EMPLOYEE ID</p>
                <p className="text-sm font-medium text-slate-900">{selectedAnomaly.employee_id}</p>
              </div>
              <div>
                <p className="text-xs text-slate-500">STATUS</p>
                <p className="text-sm font-medium text-slate-900">
                  <span className={`inline-block px-2 py-1 rounded text-xs ${getStatusColor(selectedAnomaly.status)}`}>
                    {selectedAnomaly.status?.toUpperCase()}
                  </span>
                </p>
              </div>
              <div>
                <p className="text-xs text-slate-500">CREATED</p>
                <p className="text-sm font-medium text-slate-900" suppressHydrationWarning>
                  {new Date(selectedAnomaly.created_at).toISOString()}
                </p>
              </div>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => setSelectedAnomaly(null)}
                className="flex-1 px-4 py-2 rounded-lg border border-slate-200 text-slate-700 hover:bg-slate-50 transition-all"
              >
                Close
              </button>
              <button
                onClick={() => {
                  // TODO: Add action to resolve or escalate
                  setSelectedAnomaly(null);
                }}
                className="flex-1 px-4 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 transition-all"
              >
                Take Action
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}
