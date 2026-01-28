"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import Link from "next/link";

export default function AutomationsPage() {
  const [mounted, setMounted] = useState(false);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    attendance: { anomalies: 0, escalatedCount: 0 },
    timesheet: { escalations: 0, level_3: 0 },
    tasks: { overdue: 0, critical: 0, dependencies: 0 },
    payroll: { validationIssues: 0, blocked: 0 },
  });

  const API_BASE = process.env.NEXT_PUBLIC_API_BASE || "https://offisphere.onrender.com";

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted) return;
    const fetchStats = async () => {
      try {
        setLoading(true);

        // Fetch attendance stats
        const attRes = await fetch(`${API_BASE}/api/attendance/anomalies`, {
          credentials: "include",
        });
        const attData = attRes.ok ? await attRes.json() : [];

        // Fetch timesheet stats
        const tsRes = await fetch(`${API_BASE}/api/timesheets/escalations/stats`, {
          credentials: "include",
        });
        const tsData = tsRes.ok ? await tsRes.json() : {};

        // Fetch task stats
        const taskRes = await fetch(`${API_BASE}/api/tasks/stats/overdue`, {
          credentials: "include",
        });
        const taskData = taskRes.ok ? await taskRes.json() : {};

        // Fetch payroll stats
        const payRes = await fetch(`${API_BASE}/api/payroll/runs`, {
          credentials: "include",
        });
        const payData = payRes.ok ? await payRes.json() : [];

        setStats({
          attendance: {
            anomalies: attData.filter((a) => a.status !== "resolved").length,
            escalatedCount: attData.filter((a) => a.status === "escalated").length,
          },
          timesheet: {
            escalations: tsData.total_escalations || 0,
            level_3: tsData.level_3 || 0,
          },
          tasks: {
            overdue: taskData.total_overdue || 0,
            critical: taskData.level_3 || 0,
            dependencies: 0,
          },
          payroll: {
            validationIssues: payData.filter((p) => p.validation_status === "failed").length || 0,
            blocked: payData.filter((p) => p.is_blocked_for_anomalies).length || 0,
          },
        });
      } catch (err) {
        console.error("Error fetching stats:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
    const interval = setInterval(fetchStats, 30000); // Refresh every 30s
    return () => clearInterval(interval);
  }, [API_BASE, mounted]);

  const triggerToast = (type, message) => {
    window.dispatchEvent(
      new CustomEvent("offisphere-toast", {
        detail: { type, message },
      })
    );
  };

  if (!mounted) return null;

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <div className="border-b border-slate-200 bg-white">
        <div className="mx-auto max-w-7xl px-6 py-6">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-2xl bg-blue-100 text-blue-600 flex items-center justify-center">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-5 w-5"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <path d="M12 2L2 7v10c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V7l-10-5z" />
              </svg>
            </div>
            <div>
              <h1 className="text-3xl font-bold text-slate-900">Automation Dashboard</h1>
              <p className="text-sm text-slate-600">
                Monitor attendance, timesheets, tasks, and payroll automation
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="mx-auto max-w-7xl px-6 py-8">
        {/* KPI Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {/* Attendance Anomalies */}
          <Link href="/dashboard/automations/attendance">
            <motion.div
              whileHover={{ scale: 1.02 }}
              className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm hover:shadow-md transition-all cursor-pointer"
            >
              <div className="flex items-center justify-between mb-4">
                <div className="h-10 w-10 rounded-lg bg-red-100 text-red-600 flex items-center justify-center">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-5 w-5"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                  >
                    <path d="M12 2L2 7v10c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V7l-10-5z" />
                  </svg>
                </div>
                {stats.attendance.anomalies > 0 && (
                  <span className="inline-flex items-center rounded-full bg-red-100 px-2.5 py-0.5 text-xs font-medium text-red-700">
                    Alert
                  </span>
                )}
              </div>
              <h3 className="text-sm font-medium text-slate-600 mb-1">Attendance Anomalies</h3>
              <div className="text-3xl font-bold text-slate-900">{stats.attendance.anomalies}</div>
              <p className="text-xs text-slate-500 mt-2">
                {stats.attendance.escalatedCount} escalated
              </p>
            </motion.div>
          </Link>

          {/* Timesheet Escalations */}
          <Link href="/dashboard/automations/timesheet">
            <motion.div
              whileHover={{ scale: 1.02 }}
              className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm hover:shadow-md transition-all cursor-pointer"
            >
              <div className="flex items-center justify-between mb-4">
                <div className="h-10 w-10 rounded-lg bg-amber-100 text-amber-600 flex items-center justify-center">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-5 w-5"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                  >
                    <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                    <line x1="16" y1="2" x2="16" y2="6" />
                    <line x1="8" y1="2" x2="8" y2="6" />
                    <line x1="3" y1="10" x2="21" y2="10" />
                  </svg>
                </div>
                {stats.timesheet.level_3 > 0 && (
                  <span className="inline-flex items-center rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-medium text-amber-700">
                    Critical
                  </span>
                )}
              </div>
              <h3 className="text-sm font-medium text-slate-600 mb-1">Timesheet Escalations</h3>
              <div className="text-3xl font-bold text-slate-900">{stats.timesheet.escalations}</div>
              <p className="text-xs text-slate-500 mt-2">Level 3: {stats.timesheet.level_3}</p>
            </motion.div>
          </Link>

          {/* Task Overdue */}
          <Link href="/dashboard/automations/tasks">
            <motion.div
              whileHover={{ scale: 1.02 }}
              className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm hover:shadow-md transition-all cursor-pointer"
            >
              <div className="flex items-center justify-between mb-4">
                <div className="h-10 w-10 rounded-lg bg-orange-100 text-orange-600 flex items-center justify-center">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-5 w-5"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                  >
                    <path d="M9 11l3 3L22 4" />
                    <path d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                {stats.tasks.critical > 0 && (
                  <span className="inline-flex items-center rounded-full bg-orange-100 px-2.5 py-0.5 text-xs font-medium text-orange-700">
                    Urgent
                  </span>
                )}
              </div>
              <h3 className="text-sm font-medium text-slate-600 mb-1">Task Overdue</h3>
              <div className="text-3xl font-bold text-slate-900">{stats.tasks.overdue}</div>
              <p className="text-xs text-slate-500 mt-2">
                {stats.tasks.critical} days overdue
              </p>
            </motion.div>
          </Link>

          {/* Payroll Blocks */}
          <Link href="/dashboard/automations/payroll">
            <motion.div
              whileHover={{ scale: 1.02 }}
              className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm hover:shadow-md transition-all cursor-pointer"
            >
              <div className="flex items-center justify-between mb-4">
                <div className="h-10 w-10 rounded-lg bg-purple-100 text-purple-600 flex items-center justify-center">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-5 w-5"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                  >
                    <rect x="2" y="7" width="20" height="14" rx="2" ry="2" />
                    <path d="M16 21V5a2 2 0 00-2-2h-4a2 2 0 00-2 2v16" />
                  </svg>
                </div>
                {stats.payroll.blocked > 0 && (
                  <span className="inline-flex items-center rounded-full bg-purple-100 px-2.5 py-0.5 text-xs font-medium text-purple-700">
                    Blocked
                  </span>
                )}
              </div>
              <h3 className="text-sm font-medium text-slate-600 mb-1">Payroll Blocks</h3>
              <div className="text-3xl font-bold text-slate-900">{stats.payroll.blocked}</div>
              <p className="text-xs text-slate-500 mt-2">
                {stats.payroll.validationIssues} validation issues
              </p>
            </motion.div>
          </Link>
        </div>

        {/* Features Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Attendance Section */}
          <Link href="/dashboard/automations/attendance">
            <motion.div
              whileHover={{ scale: 1.01 }}
              className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm hover:shadow-md transition-all cursor-pointer"
            >
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h2 className="text-lg font-semibold text-slate-900">Attendance Anomalies</h2>
                  <p className="text-sm text-slate-600 mt-1">
                    RFID tracking, anomaly detection, LOP auto-calculation
                  </p>
                </div>
                <div className="h-12 w-12 rounded-xl bg-red-100 text-red-600 flex items-center justify-center flex-shrink-0">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-6 w-6"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                  >
                    <circle cx="12" cy="12" r="10" />
                    <polyline points="12 6 12 12 16 14" />
                  </svg>
                </div>
              </div>
              <div className="flex gap-2 pt-4 border-t border-slate-100">
                <span className="inline-flex items-center rounded-full bg-red-50 px-3 py-1 text-xs font-medium text-red-700">
                  Rule Engine
                </span>
                <span className="inline-flex items-center rounded-full bg-red-50 px-3 py-1 text-xs font-medium text-red-700">
                  Escalations
                </span>
              </div>
            </motion.div>
          </Link>

          {/* Timesheet Section */}
          <Link href="/dashboard/automations/timesheet">
            <motion.div
              whileHover={{ scale: 1.01 }}
              className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm hover:shadow-md transition-all cursor-pointer"
            >
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h2 className="text-lg font-semibold text-slate-900">Timesheet Escalation</h2>
                  <p className="text-sm text-slate-600 mt-1">
                    Hard cutoff at 20:00, 20:05, 20:10 with level-based notifications
                  </p>
                </div>
                <div className="h-12 w-12 rounded-xl bg-amber-100 text-amber-600 flex items-center justify-center flex-shrink-0">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-6 w-6"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                  >
                    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm.5-13H11v6l5.25 3.15.75-1.23-4.5-2.67z" />
                  </svg>
                </div>
              </div>
              <div className="flex gap-2 pt-4 border-t border-slate-100">
                <span className="inline-flex items-center rounded-full bg-amber-50 px-3 py-1 text-xs font-medium text-amber-700">
                  3-Level Cutoff
                </span>
                <span className="inline-flex items-center rounded-full bg-amber-50 px-3 py-1 text-xs font-medium text-amber-700">
                  Auto-Lock
                </span>
              </div>
            </motion.div>
          </Link>

          {/* Task Section */}
          <Link href="/dashboard/automations/tasks">
            <motion.div
              whileHover={{ scale: 1.01 }}
              className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm hover:shadow-md transition-all cursor-pointer"
            >
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h2 className="text-lg font-semibold text-slate-900">Task Overdue Automation</h2>
                  <p className="text-sm text-slate-600 mt-1">
                    Dependencies, auto-reopen, escalation levels (0, 3, 5 days)
                  </p>
                </div>
                <div className="h-12 w-12 rounded-xl bg-orange-100 text-orange-600 flex items-center justify-center flex-shrink-0">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-6 w-6"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                  >
                    <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
                  </svg>
                </div>
              </div>
              <div className="flex gap-2 pt-4 border-t border-slate-100">
                <span className="inline-flex items-center rounded-full bg-orange-50 px-3 py-1 text-xs font-medium text-orange-700">
                  Dependencies
                </span>
                <span className="inline-flex items-center rounded-full bg-orange-50 px-3 py-1 text-xs font-medium text-orange-700">
                  Auto-Reopen
                </span>
              </div>
            </motion.div>
          </Link>

          {/* Payroll Section */}
          <Link href="/dashboard/automations/payroll">
            <motion.div
              whileHover={{ scale: 1.01 }}
              className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm hover:shadow-md transition-all cursor-pointer"
            >
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h2 className="text-lg font-semibold text-slate-900">Payroll Coupling</h2>
                  <p className="text-sm text-slate-600 mt-1">
                    Attendance validation, dual approval, blocking mechanism
                  </p>
                </div>
                <div className="h-12 w-12 rounded-xl bg-purple-100 text-purple-600 flex items-center justify-center flex-shrink-0">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-6 w-6"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                  >
                    <path d="M12 2v20m10-10H2" />
                    <circle cx="12" cy="12" r="10" />
                  </svg>
                </div>
              </div>
              <div className="flex gap-2 pt-4 border-t border-slate-100">
                <span className="inline-flex items-center rounded-full bg-purple-50 px-3 py-1 text-xs font-medium text-purple-700">
                  Validation
                </span>
                <span className="inline-flex items-center rounded-full bg-purple-50 px-3 py-1 text-xs font-medium text-purple-700">
                  Dual Approval
                </span>
              </div>
            </motion.div>
          </Link>
        </div>

        {/* Info Box */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-blue-50 border border-blue-200 rounded-2xl p-6"
        >
          <div className="flex gap-4">
            <div className="h-10 w-10 rounded-lg bg-blue-100 text-blue-600 flex items-center justify-center flex-shrink-0 mt-0.5">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-5 w-5"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <circle cx="12" cy="12" r="10" />
                <line x1="12" y1="16" x2="12" y2="12" />
                <line x1="12" y1="8" x2="12.01" y2="8" />
              </svg>
            </div>
            <div>
              <h3 className="font-semibold text-blue-900 mb-1">Automation Status</h3>
              <p className="text-sm text-blue-800">
                All systems are operational. Data refreshes every 30 seconds. Click any card to view
                detailed information and take actions.
              </p>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
