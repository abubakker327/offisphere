'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';

const API_BASE = process.env.NEXT_PUBLIC_API_BASE || 'http://localhost:5000';

const fetchWithAuth = async (path, options = {}) => {
  const token =
    typeof window !== 'undefined'
      ? window.localStorage.getItem('offisphere_token')
      : null;
  const res = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(options.headers || {})
    }
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data?.message || 'Request failed');
  }
  return data;
};

export default function AccountingPage() {
  const [rows, setRows] = useState([]);
  const [filters, setFilters] = useState({ ledger: '', ref_type: '' });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const loadLedger = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (filters.ledger) params.set('ledger', filters.ledger);
      if (filters.ref_type) params.set('ref_type', filters.ref_type);
      const qs = params.toString() ? `?${params.toString()}` : '';
      const data = await fetchWithAuth(`/api/sa/accounting/ledger${qs}`);
      setRows(Array.isArray(data) ? data : []);
      setError('');
    } catch (err) {
      setError(err.message || 'Error loading ledger');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadLedger();
  }, []);

  const onChange = (field, value) => {
    setFilters((p) => ({ ...p, [field]: value }));
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
      className="space-y-6 bg-gradient-to-br from-slate-50 via-indigo-50/70 to-cyan-50/60 p-1 rounded-3xl"
    >
      <div className="space-y-2">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-gradient-to-r from-indigo-600 via-purple-600 to-sky-500 text-white text-[11px] font-semibold shadow-sm shadow-indigo-200">
          <span className="h-1.5 w-1.5 rounded-full bg-white/90" />
          <span>Ledger view</span>
        </div>
        <div>
          <h1 className="text-xl font-semibold text-slate-900">Accounting</h1>
          <p className="text-sm text-slate-600">
            Ledger entries with enforced debit/credit balance. Filter by ledger or reference type.
          </p>
        </div>
      </div>

      <div className="relative overflow-hidden bg-white/90 rounded-2xl border border-indigo-100/60 shadow-[0_14px_36px_rgba(0,0,0,0.06)] p-4 space-y-3 backdrop-blur">
        <div
          className="absolute inset-y-0 left-0 w-1 bg-gradient-to-b from-indigo-500 via-purple-500 to-cyan-500"
          aria-hidden="true"
        />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-2 text-xs">
          <input
            className="px-3 py-2 rounded-xl border border-slate-200"
            placeholder="Ledger (e.g. AR_Customer)"
            value={filters.ledger}
            onChange={(e) => onChange('ledger', e.target.value)}
          />
          <input
            className="px-3 py-2 rounded-xl border border-slate-200"
            placeholder="Ref type (INVOICE/GRN/PAYMENT_IN/...)"
            value={filters.ref_type}
            onChange={(e) => onChange('ref_type', e.target.value)}
          />
          <div className="flex gap-2">
            <button
              onClick={loadLedger}
              className="px-3 py-2 rounded-xl text-xs font-semibold text-white bg-slate-900"
            >
              Apply
            </button>
            <button
              onClick={() => {
                setFilters({ ledger: '', ref_type: '' });
                loadLedger();
              }}
              className="px-3 py-2 rounded-xl text-xs font-semibold text-slate-700 border border-slate-200"
            >
              Clear
            </button>
          </div>
        </div>

        {error && (
          <div className="text-[11px] text-rose-600 bg-rose-50 border border-rose-100 rounded-lg px-3 py-2">
            {error}
          </div>
        )}

        <div className="overflow-x-auto text-xs">
          <table className="min-w-full border-separate border-spacing-y-1">
            <thead className="text-[11px] text-white">
              <tr className="bg-gradient-to-r from-indigo-600 via-purple-600 to-sky-500">
                <th className="text-left px-2 py-2 font-semibold first:rounded-l-xl">Ledger</th>
                <th className="text-left px-2 py-2 font-semibold">Ref</th>
                <th className="text-left px-2 py-2 font-semibold">Debit</th>
                <th className="text-left px-2 py-2 font-semibold last:rounded-r-xl">Credit</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={4} className="px-2 py-3 text-center text-slate-400">
                    Loading…
                  </td>
                </tr>
              ) : rows.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-2 py-3 text-center text-slate-400">
                    No ledger rows found.
                  </td>
                </tr>
              ) : (
                rows.map((row, idx) => (
                  <tr key={row.id} className={`rounded shadow-sm ${idx % 2 === 0 ? 'bg-indigo-50/70' : 'bg-slate-50'} hover:bg-indigo-50`}>
                    <td className="px-2 py-2 text-slate-900">{row.ledger}</td>
                    <td className="px-2 py-2 text-slate-600">
                      {row.ref_type} #{row.ref_id}
                    </td>
                    <td className="px-2 py-2 text-slate-600">{row.debit}</td>
                    <td className="px-2 py-2 text-slate-600">{row.credit}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </motion.div>
  );
}
