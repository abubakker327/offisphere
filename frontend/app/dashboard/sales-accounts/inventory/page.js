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
      className="space-y-6 bg-gradient-to-br from-slate-50 via-indigo-50/70 to-cyan-50/60 p-1 rounded-3xl"
    >
      <div className="space-y-2">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-gradient-to-r from-indigo-600 via-purple-600 to-sky-500 text-white text-[11px] font-semibold shadow-sm shadow-indigo-200">
          <span className="h-1.5 w-1.5 rounded-full bg-white/90" />
          <span>Stock ledger</span>
        </div>
        <div>
          <h1 className="text-xl font-semibold text-slate-900">Inventory & Stock Ledger</h1>
          <p className="text-sm text-slate-600">
            Single source of truth for stock movements with warehouse and serial tracking.
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
            placeholder="Product ID"
            value={filters.product_id}
            onChange={(e) => onChange('product_id', e.target.value)}
          />
          <input
            className="px-3 py-2 rounded-xl border border-slate-200"
            placeholder="Warehouse ID"
            value={filters.warehouse_id}
            onChange={(e) => onChange('warehouse_id', e.target.value)}
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
                setFilters({ product_id: '', warehouse_id: '' });
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
                <th className="text-left px-2 py-2 font-semibold first:rounded-l-xl">Ref</th>
                <th className="text-left px-2 py-2 font-semibold">Product</th>
                <th className="text-left px-2 py-2 font-semibold">Warehouse</th>
                <th className="text-left px-2 py-2 font-semibold">Qty</th>
                <th className="text-left px-2 py-2 font-semibold last:rounded-r-xl">Serials</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={5} className="px-2 py-3 text-center text-slate-400">
                    Loading…
                  </td>
                </tr>
              ) : rows.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-2 py-3 text-center text-slate-400">
                    No ledger rows found.
                  </td>
                </tr>
              ) : (
                rows.map((row, idx) => (
                  <tr key={row.id} className={`rounded shadow-sm ${idx % 2 === 0 ? 'bg-indigo-50/70' : 'bg-slate-50'} hover:bg-indigo-50`}>
                    <td className="px-2 py-2 text-slate-900">
                      {row.ref_type} #{row.ref_id}
                    </td>
                    <td className="px-2 py-2 text-slate-600">
                      {row.products?.name || row.product_id}
                    </td>
                    <td className="px-2 py-2 text-slate-600">{row.warehouse_id || '-'}</td>
                    <td className="px-2 py-2 text-slate-600">{row.qty_delta}</td>
                    <td className="px-2 py-2 text-slate-600">
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
