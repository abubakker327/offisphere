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
      className="space-y-6"
    >
      <div>
        <h1 className="text-xl font-semibold text-slate-900">
          Attendance
        </h1>
        <p className="text-sm text-slate-500">
          Check in / out and review recent attendance entries.
        </p>
      </div>

      {/* Today controls */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4">
        <h2 className="text-sm font-semibold text-slate-900 mb-3">
          Today&apos;s attendance
        </h2>

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
            className="px-4 py-2 rounded-full text-xs font-medium bg-gradient-to-r from-indigo-500 to-purple-500 text-white shadow-md hover:shadow-lg disabled:opacity-60"
          >
            Check in
          </motion.button>

          <motion.button
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            disabled={actionLoading}
            onClick={() => setModalType('out')}
            className="px-4 py-2 rounded-full text-xs font-medium bg-white text-slate-700 border border-slate-200 hover:bg-slate-50 disabled:opacity-60"
          >
            Check out
          </motion.button>

          {actionLoading && (
            <span className="text-[11px] text-slate-500">Processing…</span>
          )}
        </div>
      </div>

      {/* Recent entries */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-semibold text-slate-900">
            Recent attendance
          </h2>
        </div>

        <div className="overflow-x-auto text-sm">
          <table className="min-w-full border-separate border-spacing-y-2">
            <thead>
              <tr className="text-xs text-slate-400">
                <th className="text-left px-3 py-1">Employee</th>
                <th className="text-left px-3 py-1">Date</th>
                <th className="text-left px-3 py-1">Check in</th>
                <th className="text-left px-3 py-1">Check out</th>
                <th className="text-left px-3 py-1">Status</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td
                    colSpan={5}
                    className="px-3 py-6 text-center text-xs text-slate-400"
                  >
                    Loading attendance…
                  </td>
                </tr>
              ) : entries.length === 0 ? (
                <tr>
                  <td
                    colSpan={5}
                    className="px-3 py-6 text-center text-xs text-slate-400"
                  >
                    No attendance records found.
                  </td>
                </tr>
              ) : (
                entries.map((row) => (
                  <tr
                    key={row.id}
                    className="bg-slate-50 rounded-xl hover:bg-slate-100"
                  >
                    <td className="px-3 py-2 rounded-l-xl text-slate-900">
                      {row.employee_name || row.user_name || '--'}
                    </td>
                    <td className="px-3 py-2 text-xs text-slate-600">
                      {formatDate(row.attendance_date || row.date)}
                    </td>
                    <td className="px-3 py-2 text-xs text-slate-600">
                      {formatTime(row.check_in)}
                    </td>
                    <td className="px-3 py-2 text-xs text-slate-600">
                      {formatTime(row.check_out)}
                    </td>
                    <td className="px-3 py-2 rounded-r-xl text-xs">
                      <span className="px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-100">
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
            initial={{ opacity: 0, y: 10, scale: 0.98 }}
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
                className="text-slate-400 hover:text-slate-600"
                aria-label="Close modal"
              >
                ×
              </button>
            </div>

            <p className="text-sm text-slate-600">
              We will record your {modalType === 'in' ? 'check-in time' : 'check-out time'} as of now.
            </p>

            <div className="flex justify-end gap-3 pt-2">
              <button
                onClick={() => setModalType(null)}
                className="px-4 py-2 rounded-full text-xs font-medium bg-slate-100 text-slate-700 hover:bg-slate-200"
              >
                Cancel
              </button>
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.97 }}
                disabled={actionLoading}
                onClick={() => handleCheck(modalType)}
                className="px-4 py-2 rounded-full text-xs font-semibold text-white bg-gradient-to-r from-indigo-500 to-purple-500 shadow-md hover:shadow-lg disabled:opacity-60"
              >
                {actionLoading ? 'Processing…' : 'Confirm'}
              </motion.button>
            </div>
          </motion.div>
        </div>
      )}
    </motion.div>
  );
}
