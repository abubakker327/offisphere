'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';

const API_BASE = process.env.NEXT_PUBLIC_API_BASE || 'https://offisphere.onrender.com';

const fetchWithAuth = async (path, options = {}) => {
  const res = await fetch(`${API_BASE}${path}`, {
        credentials: 'include',
    ...options,
    headers: {
      'Content-Type': 'application/json',
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
      className="space-y-6 rounded-3xl bg-slate-50/70 p-4 md:p-6"
    >
      <div className="space-y-2">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-blue-600 text-white text-xs font-semibold shadow-[0_8px_20px_rgba(124,58,237,0.25)]">
          <span>Ledger view</span>
        </div>
        <div>
          <h1 className="text-3xl font-semibold text-slate-900">Accounting</h1>
          <p className="text-sm text-slate-500">
            Ledger entries with enforced debit/credit balance. Filter by ledger or reference type.
          </p>
        </div>
      </div>

      <div className="rounded-3xl bg-white border border-slate-100 shadow-[0_20px_40px_rgba(15,23,42,0.08)] p-6 space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-sm">
          <input
            className="px-4 py-3 rounded-2xl border border-slate-200 bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="Ledger (e.g. AR_Customer)"
            value={filters.ledger}
            onChange={(e) => onChange('ledger', e.target.value)}
          />
          <input
            className="px-4 py-3 rounded-2xl border border-slate-200 bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="Ref type (INVOICE/GRN/PAYMENT_IN/...)"
            value={filters.ref_type}
            onChange={(e) => onChange('ref_type', e.target.value)}
          />
          <div className="flex gap-2">
            <button
              onClick={loadLedger}
              className="px-5 py-2.5 rounded-2xl text-sm font-medium text-white bg-blue-600 hover:bg-blue-700"
            >
              Apply
            </button>
            <button
              onClick={() => {
                setFilters({ ledger: '', ref_type: '' });
                loadLedger();
              }}
              className="px-5 py-2.5 rounded-2xl text-sm font-medium text-slate-600 bg-slate-100 hover:bg-slate-200"
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

        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead className="bg-slate-50 text-xs text-slate-500 uppercase tracking-wider">
              <tr>
                <th className="text-left px-6 py-3 font-semibold">Ledger</th>
                <th className="text-left px-6 py-3 font-semibold">Ref</th>
                <th className="text-left px-6 py-3 font-semibold">Debit</th>
                <th className="text-left px-6 py-3 font-semibold">Credit</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={4} className="px-6 py-6 text-center text-xs text-slate-400">
                    Loading
                  </td>
                </tr>
              ) : rows.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-6 py-6 text-center text-xs text-slate-400">
                    No ledger rows found.
                  </td>
                </tr>
              ) : (
                rows.map((row) => (
                  <tr key={row.id} className="hover:bg-slate-50">
                    <td className="px-6 py-4 text-slate-900">{row.ledger}</td>
                    <td className="px-6 py-4 text-slate-600">
                      {row.ref_type} #{row.ref_id}
                    </td>
                    <td className="px-6 py-4 text-slate-600">{row.debit}</td>
                    <td className="px-6 py-4 text-slate-600">{row.credit}</td>
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






