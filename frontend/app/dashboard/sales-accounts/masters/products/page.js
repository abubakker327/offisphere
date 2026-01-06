'use client';

import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

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

export default function ProductsPage() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    name: '',
    sku: '',
    category: '',
    unit: '',
    gst_percent: 18,
    unit_price: '',
    has_serial: false
  });

  const loadProducts = async () => {
    try {
      setLoading(true);
      const data = await fetchWithAuth('/api/sa/masters/products');
      setProducts(Array.isArray(data) ? data : []);
      setError('');
    } catch (err) {
      console.error(err);
      setError(err.message || 'Error loading products');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProducts();
  }, []);

  const handleSave = async () => {
    try {
      setSaving(true);
      const payload = {
        ...form,
        gst_percent:
          form.gst_percent === '' || Number.isNaN(Number(form.gst_percent))
            ? null
            : Number(form.gst_percent),
        unit_price:
          form.unit_price === '' || Number.isNaN(Number(form.unit_price))
            ? null
            : Number(form.unit_price)
      };
      await fetchWithAuth('/api/sa/masters/products', {
        method: 'POST',
        body: JSON.stringify(payload)
      });
      setModalOpen(false);
      setForm({
        name: '',
        sku: '',
        category: '',
        unit: '',
        gst_percent: 18,
        unit_price: '',
        has_serial: false
      });
      loadProducts();
    } catch (err) {
      console.error(err);
      setError(err.message || 'Error saving product');
    } finally {
      setSaving(false);
    }
  };

  const onChange = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
      className="space-y-6"
    >
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-slate-900">Products</h1>
          <p className="text-sm text-slate-500">
            Panels, projectors, accessories with GST%, unit, serialization flag.
          </p>
        </div>
        <motion.button
          whileHover={{ scale: 1.03 }}
          whileTap={{ scale: 0.97 }}
          className="px-4 py-2 rounded-xl text-xs font-semibold text-white bg-gradient-to-r from-indigo-500 to-purple-500 shadow"
          onClick={() => setModalOpen(true)}
        >
          Add product
        </motion.button>
      </div>

      {error && (
        <div className="text-xs text-rose-600 bg-rose-50 border border-rose-100 rounded-xl px-3 py-2">
          {error}
        </div>
      )}

      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4">
        <div className="overflow-x-auto text-sm">
          <table className="min-w-full border-separate border-spacing-y-2">
            <thead>
              <tr className="text-xs text-slate-400">
                <th className="text-left px-3 py-1">Name</th>
                <th className="text-left px-3 py-1">SKU</th>
                <th className="text-left px-3 py-1">Category</th>
                <th className="text-left px-3 py-1">GST %</th>
                <th className="text-left px-3 py-1">Unit</th>
                <th className="text-left px-3 py-1">Serialized</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td
                    colSpan={6}
                    className="px-3 py-6 text-center text-xs text-slate-400"
                  >
                    Loading products...
                  </td>
                </tr>
              ) : products.length === 0 ? (
                <tr>
                  <td
                    colSpan={6}
                    className="px-3 py-6 text-center text-xs text-slate-400"
                  >
                    No products found.
                  </td>
                </tr>
              ) : (
                products.map((p) => (
                  <tr
                    key={p.id}
                    className="bg-slate-50 rounded-xl hover:bg-slate-100"
                  >
                    <td className="px-3 py-2 rounded-l-xl text-slate-900">
                      {p.name || '-'}
                    </td>
                    <td className="px-3 py-2 text-xs text-slate-600">
                      {p.sku || '-'}
                    </td>
                    <td className="px-3 py-2 text-xs text-slate-600">
                      {p.category || '-'}
                    </td>
                    <td className="px-3 py-2 text-xs text-slate-600">
                      {p.gst_percent ?? p.gst_rate ?? '-'}
                    </td>
                    <td className="px-3 py-2 text-xs text-slate-600">
                      {p.unit || '-'}
                    </td>
                    <td className="px-3 py-2 rounded-r-xl text-xs text-slate-600">
                      {p.has_serial || p.is_serialized ? 'Yes' : 'No'}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <AnimatePresence>
        {modalOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm px-4"
          >
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 10 }}
              className="w-full max-w-lg bg-white rounded-2xl border border-slate-100 shadow-2xl p-5 space-y-4"
            >
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-xs uppercase tracking-wide text-slate-400">
                    Create
                  </p>
                  <h3 className="text-lg font-semibold text-slate-900">
                    New product
                  </h3>
                </div>
                <button
                  className="text-slate-400 hover:text-slate-600"
                  onClick={() => setModalOpen(false)}
                >
                  Close
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                <div className="space-y-1">
                  <label className="text-xs text-slate-600">Name</label>
                  <input
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white text-sm"
                    value={form.name}
                    onChange={(e) => onChange('name', e.target.value)}
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs text-slate-600">SKU</label>
                  <input
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white text-sm"
                    value={form.sku}
                    onChange={(e) => onChange('sku', e.target.value)}
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs text-slate-600">Category</label>
                  <input
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white text-sm"
                    value={form.category}
                    onChange={(e) => onChange('category', e.target.value)}
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs text-slate-600">Unit</label>
                  <input
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white text-sm"
                    value={form.unit}
                    onChange={(e) => onChange('unit', e.target.value)}
                    placeholder="pcs, box, nos..."
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs text-slate-600">GST %</label>
                  <input
                    type="number"
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white text-sm"
                    value={form.gst_percent}
                    onChange={(e) => onChange('gst_percent', e.target.value)}
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs text-slate-600">Unit price</label>
                  <input
                    type="number"
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white text-sm"
                    value={form.unit_price}
                    onChange={(e) => onChange('unit_price', e.target.value)}
                    placeholder="0.00"
                  />
                </div>
                <div className="flex items-center gap-2 pt-6">
                  <input
                    id="is_serialized"
                    type="checkbox"
                    checked={form.has_serial}
                    onChange={(e) => onChange('has_serial', e.target.checked)}
                    className="h-4 w-4"
                  />
                  <label htmlFor="is_serialized" className="text-xs text-slate-600">
                    Serialized (panels/projectors)
                  </label>
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  className="px-4 py-2 rounded-full text-xs font-medium bg-slate-100 text-slate-700 hover:bg-slate-200"
                  onClick={() => setModalOpen(false)}
                >
                  Cancel
                </button>
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.97 }}
                  disabled={saving}
                  onClick={handleSave}
                  className="px-4 py-2 rounded-full text-xs font-semibold text-white bg-gradient-to-r from-indigo-500 to-purple-500 shadow-md hover:shadow-lg disabled:opacity-60"
                >
                  {saving ? 'Saving...' : 'Save product'}
                </motion.button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
