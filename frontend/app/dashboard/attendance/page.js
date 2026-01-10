'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';

export default function AttendancePage() {
  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState('');
  const [modalType, setModalType] = useState(null); // 'in' | 'out' | null

  const API_BASE = 'http://localhost:5000';

  const fetchAttendance = async () => {
    try {
      const token = window.localStorage.getItem('offisphere_token');
      if (!token) {
        setError('Not authenticated');
        setLoading(false);
        return;
      }

      const res = await fetch(`${API_BASE}/api/attendance`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.message || 'Error fetching attendance');
      } else {
        setEntries(Array.isArray(data) ? data : []);
        setError('');
      }
    } catch (err) {
      console.error('Attendance list error:', err);
      setError('Error connecting to server');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAttendance();
  }, []);

  const triggerToast = (type, message) => {
    window.dispatchEvent(
      new CustomEvent('offisphere-toast', {
        detail: { type, message }
      })
    );
  };

  const handleCheck = async (type) => {
    if (!modalType) return;
    setActionLoading(true);
    setError('');

    try {
      const token = window.localStorage.getItem('offisphere_token');
      if (!token) {
        setError('Not authenticated');
        setActionLoading(false);
        return;
      }

      const endpoint =
        type === 'in'
          ? `${API_BASE}/api/attendance/check-in`
          : `${API_BASE}/api/attendance/check-out`;

      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` }
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.message || 'Attendance action failed');
        triggerToast('error', data.message || 'Attendance action failed');
      } else {
        triggerToast(
          'success',
          type === 'in'
            ? 'Checked in successfully.'
            : 'Checked out successfully.'
        );
        setModalType(null);
        fetchAttendance();
      }
    } catch (err) {
      console.error('Attendance action error:', err);
      setError('Error connecting to server');
      triggerToast('error', 'Error connecting to server');
    } finally {
      setActionLoading(false);
    }
  };

  const formatDate = (value) =>
    value ? new Date(value).toLocaleDateString() : '--';
  const formatTime = (value) =>
    value
      ? new Date(value).toLocaleTimeString([], {
          hour: '2-digit',
          minute: '2-digit'
        })
      : '--';

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25 }}
      className="space-y-6 rounded-3xl bg-slate-50/70 p-4 md:p-6"
    >
      <div className="space-y-3">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-violet-600 text-white text-xs font-semibold shadow-[0_8px_20px_rgba(124,58,237,0.25)]">
          <span>Attendance log</span>
        </div>
        <div>
          <h1 className="text-3xl font-semibold text-slate-900">
            Attendance
          </h1>
          <p className="text-sm text-slate-500">
            Check in or out and review recent attendance entries.
          </p>
        </div>
      </div>

      {/* Today controls */}
      <div className="rounded-3xl bg-white border border-slate-100 shadow-[0_20px_40px_rgba(15,23,42,0.08)] p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="h-10 w-10 rounded-2xl bg-violet-600 text-white flex items-center justify-center">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-5 w-5"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <circle cx="12" cy="12" r="10" />
              <path d="M12 6v6l3 3" />
            </svg>
          </div>
          <div>
            <h2 className="text-lg font-semibold text-slate-900">
              Today&apos;s attendance
            </h2>
            <p className="text-xs text-slate-500">
              Record your check-in or check-out.
            </p>
          </div>
        </div>

        {error && (
          <div className="mb-3 text-xs text-rose-600 bg-rose-50 border border-rose-100 rounded-xl px-3 py-2">
            {error}
          </div>
        )}

        <div className="flex flex-wrap items-center gap-3">
          <motion.button
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            disabled={actionLoading}
            onClick={() => setModalType('in')}
            className="px-5 py-2.5 rounded-2xl text-xs font-semibold bg-violet-600 text-white shadow-lg shadow-violet-300/40 hover:bg-violet-700 disabled:opacity-60"
          >
            Check in
          </motion.button>

          <motion.button
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            disabled={actionLoading}
            onClick={() => setModalType('out')}
            className="px-5 py-2.5 rounded-2xl text-xs font-semibold bg-white text-slate-700 border border-slate-200 shadow-sm hover:border-violet-200 disabled:opacity-60"
          >
            Check out
          </motion.button>

          {actionLoading && (
            <span className="text-[11px] text-slate-500">Processing...</span>
          )}
        </div>
      </div>

      {/* Recent entries */}
      <div className="rounded-3xl bg-white border border-slate-100 shadow-[0_18px_40px_rgba(15,23,42,0.08)]">
        <div className="flex flex-wrap items-center justify-between gap-4 px-6 py-4 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-2xl bg-violet-100 text-violet-700 flex items-center justify-center">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-5 w-5"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M3 12h18" />
                <path d="M3 6h18" />
                <path d="M3 18h18" />
              </svg>
            </div>
            <div>
              <div className="text-lg font-semibold text-slate-900">
                Recent attendance
              </div>
              <div className="text-xs text-slate-500">
                {entries.length} records
              </div>
            </div>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead className="bg-slate-50 text-xs text-slate-500 uppercase tracking-wider">
              <tr>
                <th className="text-left px-6 py-3 font-semibold">Employee</th>
                <th className="text-left px-6 py-3 font-semibold">Date</th>
                <th className="text-left px-6 py-3 font-semibold">Check in</th>
                <th className="text-left px-6 py-3 font-semibold">Check out</th>
                <th className="text-left px-6 py-3 font-semibold">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td
                    colSpan={5}
                    className="px-6 py-8 text-center text-xs text-slate-400"
                  >
                    Loading attendance...
                  </td>
                </tr>
              ) : entries.length === 0 ? (
                <tr>
                  <td
                    colSpan={5}
                    className="px-6 py-8 text-center text-xs text-slate-400"
                  >
                    No attendance records found.
                  </td>
                </tr>
              ) : (
                entries.map((row) => (
                  <tr
                    key={row.id}
                    className="hover:bg-slate-50"
                  >
                    <td className="px-6 py-4 text-slate-900">
                      <div className="flex items-center gap-3">
                        <div className="h-9 w-9 rounded-full bg-violet-100 text-violet-700 flex items-center justify-center text-sm font-semibold">
                          {(row.employee_name || row.user_name || 'U')
                            .charAt(0)
                            .toUpperCase()}
                        </div>
                        <span className="text-sm font-semibold">
                          {row.employee_name || row.user_name || '--'}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-xs text-slate-600">
                      {formatDate(row.attendance_date || row.date)}
                    </td>
                    <td className="px-6 py-4 text-xs text-slate-600">
                      {formatTime(row.check_in)}
                    </td>
                    <td className="px-6 py-4 text-xs text-slate-600">
                      {formatTime(row.check_out)}
                    </td>
                    <td className="px-6 py-4 text-xs">
                      <span className="px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-100 font-medium">
                        {row.status || 'present'}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal */}
      {modalType && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm px-4">
          <motion.div
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ duration: 0.2 }}
            className="w-full max-w-md bg-white rounded-2xl shadow-2xl border border-slate-100 p-6 space-y-4"
          >
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs uppercase tracking-wide text-slate-400">
                  Confirm
                </p>
                <h3 className="text-lg font-semibold text-slate-900">
                  {modalType === 'in' ? 'Check in now?' : 'Check out now?'}
                </h3>
              </div>
              <button
                onClick={() => setModalType(null)}
                className="text-xs text-slate-500 hover:text-slate-700"
                aria-label="Close modal"
              >
                Close
              </button>
            </div>

            <p className="text-sm text-slate-600">
              We will record your {modalType === 'in' ? 'check-in time' : 'check-out time'} as of now.
            </p>

            <div className="flex justify-end gap-3 pt-2">
              <button
                onClick={() => setModalType(null)}
                className="px-4 py-2 rounded-2xl text-xs font-medium bg-slate-100 text-slate-700 hover:bg-slate-200"
              >
                Cancel
              </button>
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.97 }}
                disabled={actionLoading}
                onClick={() => handleCheck(modalType)}
                className="px-4 py-2 rounded-2xl text-xs font-semibold text-white bg-violet-600 shadow-md hover:bg-violet-700 disabled:opacity-60"
              >
                {actionLoading ? 'Processing...' : 'Confirm'}
              </motion.button>
            </div>
          </motion.div>
        </div>
      )}
    </motion.div>
  );
}

