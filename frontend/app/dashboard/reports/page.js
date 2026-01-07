'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';

const API_BASE =
  process.env.NEXT_PUBLIC_API_BASE || 'http://localhost:5000';

export default function ReportsPage() {
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const cardVariants = {
    hidden: { opacity: 0, y: 8 },
    visible: (i) => ({
      opacity: 1,
      y: 0,
      transition: { delay: 0.05 * i, duration: 0.2 }
    })
  };

  const fetchSummary = async () => {
    try {
      setLoading(true);
      setError('');

      const token = window.localStorage.getItem('offisphere_token');
      if (!token) {
        setError('Not authenticated');
        setLoading(false);
        return;
      }

      const params = new URLSearchParams();
      if (fromDate) params.append('from', fromDate);
      if (toDate) params.append('to', toDate);

      const url = `${API_BASE}/api/reports/summary${
        params.toString() ? `?${params.toString()}` : ''
      }`;

      const res = await fetch(url, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.message || 'Error loading reports summary');
        setSummary(null);
      } else {
        setSummary(data);
      }
    } catch (err) {
      console.error('Reports summary error:', err);
      setError('Error connecting to server');
      setSummary(null);
    } finally {
      setLoading(false);
    }
  };

  // initial load (no date filter = all)
  useEffect(() => {
    fetchSummary();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const formatCurrency = (value) =>
    `₹${Number(value || 0).toLocaleString('en-IN')}`;

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25 }}
      className="space-y-6 bg-gradient-to-br from-slate-50 via-indigo-50/70 to-cyan-50/60 p-1 rounded-3xl"
    >
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-gradient-to-r from-indigo-600 via-purple-600 to-sky-500 text-white text-[11px] font-semibold shadow-sm shadow-indigo-200">
            <span className="h-1.5 w-1.5 rounded-full bg-white/90" />
            <span>Insights hub</span>
          </div>
          <div>
            <h1 className="text-xl font-semibold text-slate-900">
              Reports
            </h1>
            <p className="text-sm text-slate-600">
              Cross-module summary for attendance, leaves, timesheets, tasks
              and payroll over a selected period.
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

      {/* Filters */}
      <motion.div
        whileHover={{ y: -2 }}
        className="relative overflow-hidden bg-white/90 rounded-2xl border border-indigo-100/60 shadow-[0_14px_36px_rgba(0,0,0,0.06)] p-4 backdrop-blur"
      >
        <div
          className="absolute inset-y-0 left-0 w-1 bg-gradient-to-b from-indigo-500 via-purple-500 to-cyan-500"
          aria-hidden="true"
        />
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-semibold text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 via-purple-600 to-sky-500">
            Date range
          </h2>
          <span className="text-[11px] text-slate-400">
            Filters all metrics on this page
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 text-sm items-end">
          <div className="space-y-1">
            <label className="text-xs text-slate-500">From date</label>
            <input
              type="date"
              value={fromDate}
              onChange={(e) => setFromDate(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            />
          </div>
          <div className="space-y-1">
            <label className="text-xs text-slate-500">To date</label>
            <input
              type="date"
              value={toDate}
              onChange={(e) => setToDate(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            />
          </div>
          <div className="space-y-1 flex gap-2">
            <button
              type="button"
              onClick={() => {
                setFromDate('');
                setToDate('');
              }}
              className="h-10 mt-auto px-3 py-2 rounded-xl border border-slate-200 text-xs text-slate-600 hover:bg-slate-50"
            >
              Clear
            </button>
          </div>
          <div className="space-y-1 flex justify-end">
            <motion.button
              type="button"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.97 }}
              onClick={fetchSummary}
              disabled={loading}
              className="h-10 mt-auto px-4 py-2 rounded-full bg-gradient-to-r from-indigo-500 to-purple-500 text-white text-xs font-medium shadow disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {loading ? 'Updating…' : 'Apply filters'}
            </motion.button>
          </div>
        </div>
      </motion.div>

      {/* Metric cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {/* Attendance */}
        <motion.div
          custom={0}
          variants={cardVariants}
          initial="hidden"
          animate="visible"
          whileHover={{
            y: -4,
            boxShadow: '0 18px 40px rgba(14,165,233,0.18)'
          }}
          className="bg-gradient-to-br from-sky-500/10 via-sky-500/5 to-transparent rounded-2xl border border-sky-100 shadow-sm p-4"
        >
          <p className="text-xs font-medium text-sky-500 mb-2">
            Attendance (records)
          </p>
          <div className="text-2xl font-semibold text-slate-900">
            {summary?.attendance?.total ?? 0}
          </div>
          <div className="mt-2 text-[11px] text-slate-600 space-y-1">
            <p>
              Present:{' '}
              <span className="font-semibold text-emerald-600">
                {summary?.attendance?.present ?? 0}
              </span>
            </p>
            <p>
              Absent:{' '}
              <span className="font-semibold text-rose-600">
                {summary?.attendance?.absent ?? 0}
              </span>
            </p>
            <p>
              On leave:{' '}
              <span className="font-semibold text-indigo-600">
                {summary?.attendance?.on_leave ?? 0}
              </span>
            </p>
          </div>
        </motion.div>

        {/* Leaves */}
        <motion.div
          custom={1}
          variants={cardVariants}
          initial="hidden"
          animate="visible"
          whileHover={{
            y: -4,
            boxShadow: '0 18px 40px rgba(79,70,229,0.18)'
          }}
          className="bg-gradient-to-br from-indigo-500/10 via-indigo-500/5 to-transparent rounded-2xl border border-indigo-100 shadow-sm p-4"
        >
          <p className="text-xs font-medium text-indigo-500 mb-2">
            Leaves (requests)
          </p>
          <div className="text-2xl font-semibold text-slate-900">
            {summary?.leaves?.total ?? 0}
          </div>
          <div className="mt-2 text-[11px] text-slate-600 space-y-1">
            <p>
              Approved:{' '}
              <span className="font-semibold text-emerald-600">
                {summary?.leaves?.approved ?? 0}
              </span>
            </p>
            <p>
              Pending:{' '}
              <span className="font-semibold text-amber-600">
                {summary?.leaves?.pending ?? 0}
              </span>
            </p>
            <p>
              Rejected:{' '}
              <span className="font-semibold text-rose-600">
                {summary?.leaves?.rejected ?? 0}
              </span>
            </p>
          </div>
        </motion.div>

        {/* Timesheets */}
        <motion.div
          custom={2}
          variants={cardVariants}
          initial="hidden"
          animate="visible"
          whileHover={{
            y: -4,
            boxShadow: '0 18px 40px rgba(148,163,184,0.18)'
          }}
          className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4"
        >
          <p className="text-xs font-medium text-slate-500 mb-2">
            Timesheets
          </p>
          <div className="text-2xl font-semibold text-slate-900">
            {summary?.timesheets?.entries ?? 0}
          </div>
          <p className="mt-2 text-[11px] text-slate-500">
            Entries in selected period (use Exports for detailed analysis).
          </p>
        </motion.div>

        {/* Tasks */}
        <motion.div
          custom={3}
          variants={cardVariants}
          initial="hidden"
          animate="visible"
          whileHover={{
            y: -4,
            boxShadow: '0 18px 40px rgba(251,191,36,0.25)'
          }}
          className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4"
        >
          <p className="text-xs font-medium text-slate-500 mb-2">
            Tasks
          </p>
          <div className="text-2xl font-semibold text-slate-900">
            {summary?.tasks?.total ?? 0}
          </div>
          <div className="mt-2 text-[11px] text-slate-600 space-y-1">
            <p>
              Open:{' '}
              <span className="font-semibold text-sky-600">
                {summary?.tasks?.open ?? 0}
              </span>
            </p>
            <p>
              In progress:{' '}
              <span className="font-semibold text-indigo-600">
                {summary?.tasks?.in_progress ?? 0}
              </span>
            </p>
            <p>
              Completed:{' '}
              <span className="font-semibold text-emerald-600">
                {summary?.tasks?.completed ?? 0}
              </span>
            </p>
            <p>
              Overdue:{' '}
              <span className="font-semibold text-rose-600">
                {summary?.tasks?.overdue ?? 0}
              </span>
            </p>
          </div>
        </motion.div>
      </div>

      {/* Payroll & HR overview row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Payroll */}
        <motion.div
          custom={4}
          variants={cardVariants}
          initial="hidden"
          animate="visible"
          whileHover={{
            y: -4,
            boxShadow: '0 18px 40px rgba(16,185,129,0.22)'
          }}
          className="bg-gradient-to-br from-emerald-500/10 via-emerald-500/5 to-transparent rounded-2xl border border-emerald-100 shadow-sm p-4"
        >
          <p className="text-xs font-medium text-emerald-600 mb-2">
            Payroll runs
          </p>
          <div className="text-2xl font-semibold text-slate-900">
            {summary?.payroll?.runs ?? 0}
          </div>
          <div className="mt-2 text-[11px] text-slate-600 space-y-1">
            <p>
              Total gross:{' '}
              <span className="font-semibold text-slate-900">
                {formatCurrency(summary?.payroll?.total_gross ?? 0)}
              </span>
            </p>
            <p>
              Total net:{' '}
              <span className="font-semibold text-slate-900">
                {formatCurrency(summary?.payroll?.total_net ?? 0)}
              </span>
            </p>
          </div>
        </motion.div>

        {/* HR snapshot */}
        <motion.div
          custom={5}
          variants={cardVariants}
          initial="hidden"
          animate="visible"
          whileHover={{ y: -4 }}
          className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4"
        >
          <p className="text-xs font-medium text-slate-500 mb-2">
            HR snapshot
          </p>
          <p className="text-[11px] text-slate-500">
            Combine this with the main Dashboard for a quick HR + Finance
            overview. Exports can be used for deeper reporting in Excel or BI
            tools.
          </p>
          <ul className="mt-2 text-[11px] text-slate-600 space-y-1">
            <li>• Attendance health (present vs absent)</li>
            <li>• Leave volume & approval ratios</li>
            <li>• Task load & completion</li>
            <li>• Payroll totals for the selected period</li>
          </ul>
        </motion.div>

        {/* Notes / tips */}
        <motion.div
          custom={6}
          variants={cardVariants}
          initial="hidden"
          animate="visible"
          whileHover={{ y: -4 }}
          className="bg-slate-900 rounded-2xl border border-slate-800 shadow-sm p-4 text-slate-100"
        >
          <p className="text-xs font-medium text-amber-300 mb-2">
            Tips
          </p>
          <ul className="text-[11px] space-y-1.5">
            <li>
              • Use a **month** range to match payroll cycles.
            </li>
            <li>
              • Compare different ranges manually (e.g. this month vs last
              month) to see trends.
            </li>
            <li>
              • For team-level breakdowns, use the module pages + filters, or
              download CSVs from Exports.
            </li>
          </ul>
        </motion.div>
      </div>
    </motion.div>
  );
}
