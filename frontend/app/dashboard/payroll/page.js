'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';

const API_BASE =
  process.env.NEXT_PUBLIC_API_BASE || 'https://offisphere.onrender.com';

export default function PayrollPage() {
  const [runs, setRuns] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState({
    period_start: '',
    period_end: ''
  });

  const fetchRuns = async () => {
    try {
      setLoading(true);
      const token = window.localStorage.getItem('offisphere_token');
      if (!token) {
        setError('Not authenticated');
        setLoading(false);
        return;
      }

      const res = await fetch(`${API_BASE}/api/payroll/runs`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.message || 'Error fetching payroll runs');
      } else {
        setRuns(data || []);
        setError('');
      }
    } catch (err) {
      console.error('Fetch payroll runs error:', err);
      setError('Error connecting to server');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRuns();
  }, []);

  const handleCreate = async (e) => {
    e.preventDefault();
    setError('');

    if (!form.period_start || !form.period_end) {
      setError('Please select both start and end date');
      return;
    }

    try {
      setCreating(true);
      const token = window.localStorage.getItem('offisphere_token');
      const res = await fetch(`${API_BASE}/api/payroll/runs`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(form)
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.message || 'Error creating payroll run');
      } else {
        setForm({ period_start: '', period_end: '' });
        await fetchRuns();
      }
    } catch (err) {
      console.error('Create payroll run error:', err);
      setError('Error connecting to server');
    } finally {
      setCreating(false);
    }
  };

  const formatDate = (d) =>
    d ? new Date(d).toLocaleDateString() : '';

  const statusStyles = {
    draft:
      'bg-slate-100 text-slate-700 border border-slate-200',
    processing:
      'bg-amber-50 text-amber-700 border border-amber-100',
    completed:
      'bg-emerald-50 text-emerald-700 border border-emerald-100'
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
            <span>Payroll cycle</span>
          </div>
          <div>
            <h1 className="text-3xl font-semibold text-slate-900">
              Payroll
            </h1>
            <p className="text-sm text-slate-500">
              Create and track payroll runs for each pay period.
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

      {/* Create run form */}
      <motion.div
        whileHover={{ y: -2 }}
        className="rounded-3xl bg-white border border-slate-100 shadow-[0_20px_40px_rgba(15,23,42,0.08)] p-6"
      >
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-base font-semibold text-slate-900">
            New payroll run
          </h2>
          <span className="text-xs text-slate-400">
            Choose the start and end date for this pay cycle.
          </span>
        </div>

        <form
          onSubmit={handleCreate}
          className="grid grid-cols-1 sm:grid-cols-4 gap-3 text-sm items-end"
        >
          <div className="space-y-1">
            <label className="text-xs text-slate-600">Period start</label>
            <input
              type="date"
              value={form.period_start}
              onChange={(e) =>
                setForm((f) => ({ ...f, period_start: e.target.value }))
              }
              className="w-full px-4 py-3 rounded-2xl border border-slate-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <div className="space-y-1">
            <label className="text-xs text-slate-600">Period end</label>
            <input
              type="date"
              value={form.period_end}
              onChange={(e) =>
                setForm((f) => ({ ...f, period_end: e.target.value }))
              }
              className="w-full px-4 py-3 rounded-2xl border border-slate-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <div className="sm:col-span-2 flex justify-end">
            <motion.button
              type="submit"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.97 }}
              disabled={creating}
              className="px-5 py-2.5 rounded-2xl bg-blue-600 text-white text-sm font-medium shadow-lg shadow-blue-300/50 hover:bg-blue-700 disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {creating ? 'Creating' : 'Create run'}
            </motion.button>
          </div>
        </form>
      </motion.div>

      {/* Runs list */}
      <motion.div
        whileHover={{ y: -2 }}
        className="rounded-3xl bg-white border border-slate-100 shadow-[0_18px_40px_rgba(15,23,42,0.08)]"
      >
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
          <h2 className="text-base font-semibold text-slate-900">
            Payroll runs
          </h2>
        </div>

        <div className="overflow-x-auto text-sm">
          <table className="min-w-full text-sm">
            <thead className="bg-slate-50 text-xs text-slate-500 uppercase tracking-wider">
              <tr>
                <th className="text-left px-6 py-3 font-semibold">Period</th>
                <th className="text-left px-6 py-3 font-semibold">Status</th>
                <th className="text-left px-6 py-3 font-semibold">Total gross</th>
                <th className="text-left px-6 py-3 font-semibold">Total net</th>
                <th className="text-left px-6 py-3 font-semibold">Created</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td
                    colSpan={5}
                    className="px-6 py-6 text-center text-xs text-slate-400"
                  >
                    Loading payroll runs
                  </td>
                </tr>
              ) : runs.length === 0 ? (
                <tr>
                  <td
                    colSpan={5}
                    className="px-6 py-6 text-center text-xs text-slate-400"
                  >
                    No payroll runs yet.
                  </td>
                </tr>
              ) : (
                runs.map((run) => (
                  <tr
                    key={run.id}
                    className="hover:bg-slate-50"
                  >
                    <td className="px-6 py-4 text-slate-900 text-xs">
                      {formatDate(run.period_start)} &ndash;{' '}
                      {formatDate(run.period_end)}
                    </td>
                    <td className="px-6 py-4 text-xs">
                      <span
                        className={`px-2 py-1 rounded-full text-[11px] ${
                          statusStyles[run.status] ||
                          'bg-slate-100 text-slate-700 border border-slate-200'
                        }`}
                      >
                        {run.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-xs text-slate-700">
                      {Number(run.total_gross || 0).toLocaleString('en-IN')}
                    </td>
                    <td className="px-6 py-4 text-xs text-slate-700">
                      {Number(run.total_net || 0).toLocaleString('en-IN')}
                    </td>
                    <td className="px-6 py-4 text-xs text-slate-500">
                      {formatDate(run.created_at)}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </motion.div>
    </motion.div>
  );
}


