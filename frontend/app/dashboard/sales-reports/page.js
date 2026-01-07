'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';

export default function SalesReportsPage() {
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const API_BASE = 'http://localhost:5000';

  const formatCurrency = (value) => {
    const number = Number(value || 0);
    if (Number.isNaN(number)) return '₹0';
    return `₹${number.toLocaleString('en-IN')}`;
  };

  const formatDate = (value) =>
    value ? new Date(value).toLocaleDateString() : '—';

  useEffect(() => {
    const fetchSummary = async () => {
      try {
        const token = window.localStorage.getItem('offisphere_token');
        if (!token) {
          setError('Not authenticated');
          setLoading(false);
          return;
        }

        const res = await fetch(`${API_BASE}/api/sales/summary`, {
          headers: { Authorization: `Bearer ${token}` }
        });

        const data = await res.json();

        if (!res.ok) {
          setError(data.message || 'Error loading sales summary');
        } else {
          setSummary(data);
          setError('');
        }
      } catch (err) {
        console.error('Sales summary error:', err);
        setError('Error connecting to server');
      } finally {
        setLoading(false);
      }
    };

    fetchSummary();
  }, []);

  const totals = summary?.totals || {};
  const leadsByStatus = summary?.leadsByStatus || {};
  const paymentsByStatus = summary?.paymentsByStatus || {};
  const recentLeads = summary?.recentLeads || [];
  const recentPayments = summary?.recentPayments || [];

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25 }}
      className="space-y-6 bg-gradient-to-br from-slate-50 via-indigo-50/70 to-cyan-50/60 p-1 rounded-3xl"
    >
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-gradient-to-r from-indigo-600 via-purple-600 to-sky-500 text-white text-[11px] font-semibold shadow-sm shadow-indigo-200">
            <span className="h-1.5 w-1.5 rounded-full bg-white/90" />
            <span>Sales pulse</span>
          </div>
          <div>
            <h1 className="text-xl font-semibold text-slate-900">
              Sales reports
            </h1>
            <p className="text-sm text-slate-600">
              Pipeline, revenue and win-rate overview for Offisphere CRM.
            </p>
          </div>
        </div>
      </div>

      {error && (
        <div className="bg-rose-50 border border-rose-100 text-rose-700 text-xs rounded-2xl px-4 py-3">
          {error}
        </div>
      )}

      {/* Top KPI cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <motion.div
          whileHover={{ y: -2 }}
          className="relative overflow-hidden bg-white rounded-2xl border border-slate-100 shadow-sm p-4"
        >
          <div
            className="absolute inset-y-0 left-0 w-1 bg-gradient-to-b from-indigo-500 via-purple-500 to-cyan-500"
            aria-hidden="true"
          />
          <p className="text-[11px] uppercase tracking-wide text-slate-500 mb-1">
            Total leads
          </p>
          <p className="text-2xl font-semibold text-slate-900 mb-1">
            {loading ? '—' : totals.totalLeads ?? 0}
          </p>
          <p className="text-[11px] text-slate-400">
            Across all stages in your pipeline
          </p>
        </motion.div>

        <motion.div
          whileHover={{ y: -2 }}
          className="relative overflow-hidden bg-gradient-to-br from-indigo-500 to-purple-500 rounded-2xl text-white shadow-md p-4"
        >
          <div
            className="absolute inset-y-0 left-0 w-1 bg-white/40"
            aria-hidden="true"
          />
          <p className="text-[11px] uppercase tracking-wide text-indigo-100 mb-1">
            Pipeline value
          </p>
          <p className="text-2xl font-semibold mb-1">
            {loading
              ? '—'
              : formatCurrency(totals.totalPipelineValue || 0)}
          </p>
          <p className="text-[11px] text-indigo-100/80">
            Expected value of non-lost deals
          </p>
        </motion.div>

        <motion.div
          whileHover={{ y: -2 }}
          className="relative overflow-hidden bg-white rounded-2xl border border-emerald-100 shadow-sm p-4"
        >
          <div
            className="absolute inset-y-0 left-0 w-1 bg-gradient-to-b from-indigo-500 via-purple-500 to-cyan-500"
            aria-hidden="true"
          />
          <p className="text-[11px] uppercase tracking-wide text-emerald-600 mb-1">
            Won value
          </p>
          <p className="text-2xl font-semibold text-slate-900 mb-1">
            {loading
              ? '—'
              : formatCurrency(totals.totalWonValue || 0)}
          </p>
          <p className="text-[11px] text-slate-400">
            Expected value of won deals
          </p>
        </motion.div>

        <motion.div
          whileHover={{ y: -2 }}
          className="relative overflow-hidden bg-white rounded-2xl border border-slate-100 shadow-sm p-4"
        >
          <div
            className="absolute inset-y-0 left-0 w-1 bg-gradient-to-b from-indigo-500 via-purple-500 to-cyan-500"
            aria-hidden="true"
          />
          <p className="text-[11px] uppercase tracking-wide text-slate-500 mb-1">
            Payments received
          </p>
          <p className="text-2xl font-semibold text-slate-900 mb-1">
            {loading
              ? '—'
              : formatCurrency(totals.totalPaymentsReceived || 0)}
          </p>
          <p className="text-[11px] text-slate-400">
            From payments with status &quot;received&quot;
          </p>
        </motion.div>
      </div>

      {/* Win rate + breakdowns */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Win rate */}
        <motion.div
          whileHover={{ y: -2 }}
          className="relative overflow-hidden bg-white rounded-2xl border border-slate-100 shadow-sm p-4 flex flex-col justify-between"
        >
          <div
            className="absolute inset-y-0 left-0 w-1 bg-gradient-to-b from-indigo-500 via-purple-500 to-cyan-500"
            aria-hidden="true"
          />
          <div className="flex items-center justify-between mb-3">
            <div>
              <p className="text-[11px] uppercase tracking-wide text-slate-500">
                Win rate
              </p>
              <p className="text-3xl font-semibold text-slate-900">
                {loading ? '—' : `${totals.winRate ?? 0}%`}
              </p>
            </div>
          </div>
          <p className="text-[11px] text-slate-400">
            Calculated from won vs lost leads.
          </p>
        </motion.div>

        {/* Leads by status */}
        <motion.div
          whileHover={{ y: -2 }}
          className="relative overflow-hidden bg-white rounded-2xl border border-slate-100 shadow-sm p-4"
        >
          <div
            className="absolute inset-y-0 left-0 w-1 bg-gradient-to-b from-indigo-500 via-purple-500 to-cyan-500"
            aria-hidden="true"
          />
          <p className="text-sm font-semibold text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 via-purple-600 to-sky-500 mb-2">
            Leads by stage
          </p>
          <div className="space-y-1 text-xs">
            {Object.keys(leadsByStatus).length === 0 && !loading && (
              <p className="text-slate-400 text-xs">No leads yet.</p>
            )}
            {Object.entries(leadsByStatus).map(([stage, count]) => (
              <div
                key={stage}
                className="flex items-center justify-between"
              >
                <span className="capitalize text-slate-600">
                  {stage}
                </span>
                <span className="font-medium text-slate-900">
                  {count}
                </span>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Payments by status */}
        <motion.div
          whileHover={{ y: -2 }}
          className="relative overflow-hidden bg-white rounded-2xl border border-slate-100 shadow-sm p-4"
        >
          <div
            className="absolute inset-y-0 left-0 w-1 bg-gradient-to-b from-indigo-500 via-purple-500 to-cyan-500"
            aria-hidden="true"
          />
          <p className="text-sm font-semibold text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 via-purple-600 to-sky-500 mb-2">
            Payments by status
          </p>
          <div className="space-y-1 text-xs">
            {Object.keys(paymentsByStatus).length === 0 && !loading && (
              <p className="text-slate-400 text-xs">No payments yet.</p>
            )}
            {Object.entries(paymentsByStatus).map(([status, count]) => (
              <div
                key={status}
                className="flex items-center justify-between"
              >
                <span className="capitalize text-slate-600">
                  {status}
                </span>
                <span className="font-medium text-slate-900">
                  {count}
                </span>
              </div>
            ))}
          </div>
        </motion.div>
      </div>

      {/* Recent tables */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Recent leads */}
        <motion.div
          whileHover={{ y: -2 }}
          className="relative overflow-hidden bg-white rounded-2xl border border-slate-100 shadow-sm p-4"
        >
          <div
            className="absolute inset-y-0 left-0 w-1 bg-gradient-to-b from-indigo-500 via-purple-500 to-cyan-500"
            aria-hidden="true"
          />
          <div className="flex items-center justify-between mb-3">
            <p className="text-sm font-semibold text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 via-purple-600 to-sky-500">
              Recent leads
            </p>
          </div>

          <div className="overflow-x-auto text-xs">
            <table className="min-w-full border-separate border-spacing-y-2">
              <thead className="text-[11px] text-white">
                <tr className="bg-gradient-to-r from-indigo-600 via-purple-600 to-sky-500">
                  <th className="text-left px-3 py-2 font-semibold first:rounded-l-xl">Lead</th>
                  <th className="text-left px-3 py-2 font-semibold">Stage</th>
                  <th className="text-left px-3 py-2 font-semibold">Value</th>
                  <th className="text-left px-3 py-2 font-semibold last:rounded-r-xl">Created</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td
                      colSpan={4}
                      className="px-3 py-6 text-center text-slate-400"
                    >
                      Loading…
                    </td>
                  </tr>
                ) : recentLeads.length === 0 ? (
                  <tr>
                    <td
                      colSpan={4}
                      className="px-3 py-6 text-center text-slate-400"
                    >
                      No leads yet.
                    </td>
                  </tr>
                ) : (
                  recentLeads.map((lead, idx) => (
                    <tr
                      key={lead.id}
                      className={`rounded-xl shadow-sm ${idx % 2 === 0 ? 'bg-indigo-50/70' : 'bg-slate-50'} hover:bg-indigo-50`}
                    >
                      <td className="px-3 py-2 rounded-l-xl text-slate-900">
                        {lead.name}
                      </td>
                      <td className="px-3 py-2 text-[11px]">
                        <span className="px-2 py-1 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-100 capitalize">
                          {lead.status}
                        </span>
                      </td>
                      <td className="px-3 py-2 text-[11px] text-slate-600">
                        {lead.expected_value
                          ? formatCurrency(lead.expected_value)
                          : '—'}
                      </td>
                      <td className="px-3 py-2 rounded-r-xl text-[11px] text-slate-500">
                        {formatDate(lead.created_at)}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </motion.div>

        {/* Recent payments */}
        <motion.div
          whileHover={{ y: -2 }}
          className="relative overflow-hidden bg-white rounded-2xl border border-slate-100 shadow-sm p-4"
        >
          <div
            className="absolute inset-y-0 left-0 w-1 bg-gradient-to-b from-indigo-500 via-purple-500 to-cyan-500"
            aria-hidden="true"
          />
          <div className="flex items-center justify-between mb-3">
            <p className="text-sm font-semibold text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 via-purple-600 to-sky-500">
              Recent payments
            </p>
          </div>

          <div className="overflow-x-auto text-xs">
            <table className="min-w-full border-separate border-spacing-y-2">
              <thead className="text-[11px] text-white">
                <tr className="bg-gradient-to-r from-indigo-600 via-purple-600 to-sky-500">
                  <th className="text-left px-3 py-2 font-semibold first:rounded-l-xl">Lead</th>
                  <th className="text-left px-3 py-2 font-semibold">Amount</th>
                  <th className="text-left px-3 py-2 font-semibold">Status</th>
                  <th className="text-left px-3 py-2 font-semibold last:rounded-r-xl">Paid date</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td
                      colSpan={4}
                      className="px-3 py-6 text-center text-slate-400"
                    >
                      Loading…
                    </td>
                  </tr>
                ) : recentPayments.length === 0 ? (
                  <tr>
                    <td
                      colSpan={4}
                      className="px-3 py-6 text-center text-slate-400"
                    >
                      No payments yet.
                    </td>
                  </tr>
                ) : (
                  recentPayments.map((p, idx) => (
                    <tr
                      key={p.id}
                      className={`rounded-xl shadow-sm ${idx % 2 === 0 ? 'bg-indigo-50/70' : 'bg-slate-50'} hover:bg-indigo-50`}
                    >
                      <td className="px-3 py-2 rounded-l-xl text-slate-900">
                        {p.lead_name || '—'}
                      </td>
                      <td className="px-3 py-2 text-[11px] text-slate-600">
                        {formatCurrency(p.amount)}
                      </td>
                      <td className="px-3 py-2 text-[11px]">
                        <span className="px-2 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-100 capitalize">
                          {p.status}
                        </span>
                      </td>
                      <td className="px-3 py-2 rounded-r-xl text-[11px] text-slate-500">
                        {formatDate(p.paid_at || p.created_at)}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </motion.div>
      </div>
    </motion.div>
  );
}
