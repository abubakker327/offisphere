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

export default function InventoryPage() {
  const [rows, setRows] = useState([]);
  const [error, setError] = useState('');
  const [filters, setFilters] = useState({ product_id: '', warehouse_id: '' });
  const [loading, setLoading] = useState(true);

  const loadLedger = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (filters.product_id) params.set('product_id', filters.product_id);
      if (filters.warehouse_id) params.set('warehouse_id', filters.warehouse_id);
      const qs = params.toString() ? `?${params.toString()}` : '';
      const data = await fetchWithAuth(`/api/sa/inventory/stock-ledger${qs}`);
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
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-violet-600 text-white text-xs font-semibold shadow-[0_8px_20px_rgba(124,58,237,0.25)]">
          <span>Stock ledger</span>
        </div>
        <div>
          <h1 className="text-3xl font-semibold text-slate-900">Inventory & Stock Ledger</h1>
          <p className="text-sm text-slate-500">
            Single source of truth for stock movements with warehouse and serial tracking.
          </p>
        </div>
      </div>

      <div className="rounded-3xl bg-white border border-slate-100 shadow-[0_20px_40px_rgba(15,23,42,0.08)] p-6 space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-sm">
          <input
            className="px-4 py-3 rounded-2xl border border-slate-200 bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent"
            placeholder="Product ID"
            value={filters.product_id}
            onChange={(e) => onChange('product_id', e.target.value)}
          />
          <input
            className="px-4 py-3 rounded-2xl border border-slate-200 bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent"
            placeholder="Warehouse ID"
            value={filters.warehouse_id}
            onChange={(e) => onChange('warehouse_id', e.target.value)}
          />
          <div className="flex gap-2">
            <button
              onClick={loadLedger}
              className="px-5 py-2.5 rounded-2xl text-sm font-medium text-white bg-violet-600 hover:bg-violet-700"
            >
              Apply
            </button>
            <button
              onClick={() => {
                setFilters({ product_id: '', warehouse_id: '' });
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
                <th className="text-left px-6 py-3 font-semibold">Ref</th>
                <th className="text-left px-6 py-3 font-semibold">Product</th>
                <th className="text-left px-6 py-3 font-semibold">Warehouse</th>
                <th className="text-left px-6 py-3 font-semibold">Qty</th>
                <th className="text-left px-6 py-3 font-semibold">Serials</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={5} className="px-6 py-6 text-center text-xs text-slate-400">
                    Loading
                  </td>
                </tr>
              ) : rows.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-6 text-center text-xs text-slate-400">
                    No ledger rows found.
                  </td>
                </tr>
              ) : (
                rows.map((row) => (
                  <tr key={row.id} className="hover:bg-slate-50">
                    <td className="px-6 py-4 text-slate-900">
                      {row.ref_type} #{row.ref_id}
                    </td>
                    <td className="px-6 py-4 text-slate-600">
                      {row.products?.name || row.product_id}
                    </td>
                    <td className="px-6 py-4 text-slate-600">{row.warehouse_id || '-'}</td>
                    <td className="px-6 py-4 text-slate-600">{row.qty_delta}</td>
                    <td className="px-6 py-4 text-slate-600">
                      {Array.isArray(row.serials) ? row.serials.join(', ') : ''}
                    </td>
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
