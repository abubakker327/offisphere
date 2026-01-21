"use client";

import { useState } from "react";
import { motion } from "framer-motion";

const API_BASE =
  process.env.NEXT_PUBLIC_API_BASE || "https://offisphere.onrender.com";

export default function ExportsPage() {
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [error, setError] = useState("");
  const [downloading, setDownloading] = useState(null); // 'attendance' | 'timesheets' | 'payroll' | 'leaves' | null

  const handleDownload = async (type) => {
    setError("");
    setDownloading(type);

    try {
      const params = new URLSearchParams();
      if (fromDate) params.append("from", fromDate);
      if (toDate) params.append("to", toDate);

      const url = `${API_BASE}/api/exports/${type}${
        params.toString() ? `?${params.toString()}` : ""
      }`;

      const res = await fetch(url, {
        credentials: "include",
        headers: {},
      });

      if (!res.ok) {
        try {
          const data = await res.json();
          setError(data.message || `Error exporting ${type}`);
        } catch {
          setError(`Error exporting ${type}`);
        }
        setDownloading(null);
        return;
      }

      const blob = await res.blob();
      const downloadUrl = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = downloadUrl;
      a.download = `${type}_export_${fromDate || "all"}_${toDate || "all"}.csv`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(downloadUrl);
    } catch (err) {
      console.error(`Export ${type} error:`, err);
      setError(`Error exporting ${type}`);
    } finally {
      setDownloading(null);
    }
  };

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
            <span>Data exports</span>
          </div>
          <div>
            <h1 className="text-3xl font-semibold text-slate-900">Exports</h1>
            <p className="text-sm text-slate-500">
              Download attendance, timesheets, leaves and payroll data as CSV
              for reporting or backup.
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

      {/* Filters card */}
      <motion.div
        whileHover={{ y: -2 }}
        className="rounded-3xl bg-white border border-slate-100 shadow-[0_20px_40px_rgba(15,23,42,0.08)] p-6"
      >
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-base font-semibold text-slate-900">
            Date range filter
          </h2>
          <span className="text-xs text-slate-400">
            Uses created date / period dates
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-sm">
          <div className="space-y-1">
            <label className="text-xs text-slate-600">From date</label>
            <input
              type="date"
              value={fromDate}
              onChange={(e) => setFromDate(e.target.value)}
              className="w-full px-4 py-3 rounded-2xl border border-slate-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <div className="space-y-1">
            <label className="text-xs text-slate-600">To date</label>
            <input
              type="date"
              value={toDate}
              onChange={(e) => setToDate(e.target.value)}
              className="w-full px-4 py-3 rounded-2xl border border-slate-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <div className="space-y-1 flex items-end">
            <button
              type="button"
              onClick={() => {
                setFromDate("");
                setToDate("");
              }}
              className="px-5 py-2.5 rounded-2xl bg-slate-100 text-xs text-slate-600 hover:bg-slate-200"
            >
              Clear dates
            </button>
          </div>
        </div>
      </motion.div>

      {/* Export buttons */}
      <motion.div
        whileHover={{ y: -2 }}
        className="rounded-3xl bg-white border border-slate-100 shadow-[0_18px_40px_rgba(15,23,42,0.08)] p-6"
      >
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-base font-semibold text-slate-900">
            Export datasets
          </h2>
          <span className="text-xs text-slate-400">
            CSV files open in Excel, Sheets or BI tools
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-3 text-sm">
          {/* Attendance */}
          <motion.button
            whileHover={{ y: -2, scale: 1.01 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => handleDownload("attendance")}
            disabled={downloading === "attendance"}
            className="flex flex-col items-start px-4 py-4 rounded-2xl border border-slate-100 bg-white hover:bg-slate-50 text-left shadow-sm disabled:opacity-60 disabled:cursor-not-allowed"
          >
            <span className="text-xs font-semibold text-slate-900">
              Attendance CSV
            </span>
            <span className="text-[11px] text-slate-500">
              Check-ins / check-outs
            </span>
            <span className="mt-2 text-[11px] text-blue-600">
              {downloading === "attendance" ? "Preparing" : "Download"}
            </span>
          </motion.button>

          {/* Timesheets */}
          <motion.button
            whileHover={{ y: -2, scale: 1.01 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => handleDownload("timesheets")}
            disabled={downloading === "timesheets"}
            className="flex flex-col items-start px-4 py-4 rounded-2xl border border-slate-100 bg-white hover:bg-slate-50 text-left shadow-sm disabled:opacity-60 disabled:cursor-not-allowed"
          >
            <span className="text-xs font-semibold text-slate-900">
              Timesheets CSV
            </span>
            <span className="text-[11px] text-slate-500">
              Time entries / hours
            </span>
            <span className="mt-2 text-[11px] text-blue-600">
              {downloading === "timesheets" ? "Preparing" : "Download"}
            </span>
          </motion.button>

          {/* Leaves */}
          <motion.button
            whileHover={{ y: -2, scale: 1.01 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => handleDownload("leaves")}
            disabled={downloading === "leaves"}
            className="flex flex-col items-start px-4 py-4 rounded-2xl border border-slate-100 bg-white hover:bg-slate-50 text-left shadow-sm disabled:opacity-60 disabled:cursor-not-allowed"
          >
            <span className="text-xs font-semibold text-slate-900">
              Leaves CSV
            </span>
            <span className="text-[11px] text-slate-500">
              Leave requests & status
            </span>
            <span className="mt-2 text-[11px] text-blue-600">
              {downloading === "leaves" ? "Preparing" : "Download"}
            </span>
          </motion.button>

          {/* Payroll */}
          <motion.button
            whileHover={{ y: -2, scale: 1.01 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => handleDownload("payroll")}
            disabled={downloading === "payroll"}
            className="flex flex-col items-start px-4 py-4 rounded-2xl border border-slate-100 bg-white hover:bg-slate-50 text-left shadow-sm disabled:opacity-60 disabled:cursor-not-allowed"
          >
            <span className="text-xs font-semibold text-slate-900">
              Payroll runs CSV
            </span>
            <span className="text-[11px] text-slate-500">
              Periods, totals & status
            </span>
            <span className="mt-2 text-[11px] text-blue-600">
              {downloading === "payroll" ? "Preparing" : "Download"}
            </span>
          </motion.button>
        </div>
      </motion.div>
    </motion.div>
  );
}
