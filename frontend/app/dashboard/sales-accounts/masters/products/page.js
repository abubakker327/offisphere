"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

const API_BASE =
  process.env.NEXT_PUBLIC_API_BASE || "https://offisphere.onrender.com";

const fetchWithAuth = async (path, options = {}) => {
  const res = await fetch(`${API_BASE}${path}`, {
    credentials: "include",
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(options.headers || {}),
    },
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data?.message || "Request failed");
  }
  return data;
};

export default function ProductsPage() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    name: "",
    sku: "",
    category: "",
    unit: "",
    gst_percent: 18,
    unit_price: "",
    has_serial: false,
  });

  const loadProducts = async () => {
    try {
      setLoading(true);
      const data = await fetchWithAuth("/api/sa/masters/products");
      setProducts(Array.isArray(data) ? data : []);
      setError("");
    } catch (err) {
      console.error(err);
      setError(err.message || "Error loading products");
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
          form.gst_percent === "" || Number.isNaN(Number(form.gst_percent))
            ? null
            : Number(form.gst_percent),
        unit_price:
          form.unit_price === "" || Number.isNaN(Number(form.unit_price))
            ? null
            : Number(form.unit_price),
      };
      await fetchWithAuth("/api/sa/masters/products", {
        method: "POST",
        body: JSON.stringify(payload),
      });
      setModalOpen(false);
      setForm({
        name: "",
        sku: "",
        category: "",
        unit: "",
        gst_percent: 18,
        unit_price: "",
        has_serial: false,
      });
      loadProducts();
    } catch (err) {
      console.error(err);
      setError(err.message || "Error saving product");
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
      className="space-y-4"
    >
      <div className="flex items-center justify-between px-1">
        <div>
          <h3 className="text-base font-semibold text-slate-900">Products</h3>
          <p className="text-xs text-slate-500">
            Panels, projectors, accessories with GST%, unit, serialization flag.
          </p>
        </div>
        <motion.button
          whileHover={{ scale: 1.03 }}
          whileTap={{ scale: 0.97 }}
          className="px-5 py-2.5 rounded-2xl text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 shadow-lg shadow-blue-300/40 transition-all"
          onClick={() => setModalOpen(true)}
        >
          Add product
        </motion.button>
      </div>

      {error && (
        <div className="mx-1 text-xs text-rose-600 bg-rose-50 border border-rose-100 rounded-xl px-3 py-2">
          {error}
        </div>
      )}

      <div className="rounded-3xl bg-white border border-slate-100 shadow-[0_18px_40px_rgba(15,23,42,0.08)] p-4">
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead className="bg-slate-50 text-xs text-slate-500 uppercase tracking-wider">
              <tr>
                <th className="text-left px-6 py-3 font-semibold">Name</th>
                <th className="text-left px-6 py-3 font-semibold">SKU</th>
                <th className="text-left px-6 py-3 font-semibold">Category</th>
                <th className="text-left px-6 py-3 font-semibold">GST %</th>
                <th className="text-left px-6 py-3 font-semibold">Unit</th>
                <th className="text-left px-6 py-3 font-semibold">
                  Serialized
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td
                    colSpan={6}
                    className="px-6 py-6 text-center text-slate-400 text-xs"
                  >
                    Loading products...
                  </td>
                </tr>
              ) : products.length === 0 ? (
                <tr>
                  <td
                    colSpan={6}
                    className="px-6 py-6 text-center text-slate-400 text-xs"
                  >
                    No products found.
                  </td>
                </tr>
              ) : (
                products.map((p) => (
                  <tr key={p.id} className="hover:bg-slate-50">
                    <td className="px-6 py-4 text-slate-900 font-medium">
                      {p.name || "-"}
                    </td>
                    <td className="px-6 py-4 text-slate-600">{p.sku || "-"}</td>
                    <td className="px-6 py-4 text-slate-600">
                      {p.category || "-"}
                    </td>
                    <td className="px-6 py-4 text-slate-600">
                      {p.gst_percent ?? p.gst_rate ?? "-"}
                    </td>
                    <td className="px-6 py-4 text-slate-600">
                      {p.unit || "-"}
                    </td>
                    <td className="px-6 py-4 text-slate-600 text-xs">
                      {p.has_serial || p.is_serialized ? (
                        <span className="text-blue-700 bg-blue-50 px-2 py-0.5 rounded-full border border-blue-100">
                          Yes
                        </span>
                      ) : (
                        <span className="text-slate-400">No</span>
                      )}
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
            className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/40 backdrop-blur-sm px-4"
          >
            <motion.div
              initial={{ opacity: 0, y: 20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 20, scale: 0.95 }}
              className="w-full max-w-lg bg-white rounded-3xl border border-slate-100 shadow-xl p-6 space-y-6"
            >
              <div className="flex items-start justify-between">
                <div>
                  <div className="inline-flex items-center gap-2 px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 text-[10px] font-bold uppercase tracking-wider border border-blue-100 mb-1">
                    Masters
                  </div>
                  <h3 className="text-xl font-semibold text-slate-900">
                    New product
                  </h3>
                  <p className="text-xs text-slate-500">
                    Define product details and tax slab.
                  </p>
                </div>
                <button
                  className="h-8 w-8 flex items-center justify-center rounded-full bg-slate-100 text-slate-400 hover:text-slate-600 hover:bg-slate-200 transition-colors"
                  onClick={() => setModalOpen(false)}
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-4 w-4"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div className="space-y-1">
                  <label className="text-xs text-slate-600">Product name</label>
                  <input
                    className="w-full px-4 py-3 rounded-2xl border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    value={form.name}
                    onChange={(e) => onChange("name", e.target.value)}
                    placeholder="e.g. BenQ Projector"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs text-slate-600">SKU / Code</label>
                  <input
                    className="w-full px-4 py-3 rounded-2xl border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    value={form.sku}
                    onChange={(e) => onChange("sku", e.target.value)}
                    placeholder="Reference code"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs text-slate-600">Category</label>
                  <input
                    className="w-full px-4 py-3 rounded-2xl border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    value={form.category}
                    onChange={(e) => onChange("category", e.target.value)}
                    placeholder="Hardware, license..."
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs text-slate-600">
                    Unit of measure
                  </label>
                  <input
                    className="w-full px-4 py-3 rounded-2xl border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    value={form.unit}
                    onChange={(e) => onChange("unit", e.target.value)}
                    placeholder="pcs, box, nos..."
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs text-slate-600">
                    GST percentage
                  </label>
                  <input
                    type="number"
                    className="w-full px-4 py-3 rounded-2xl border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    value={form.gst_percent}
                    onChange={(e) => onChange("gst_percent", e.target.value)}
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs text-slate-600">
                    Default unit price
                  </label>
                  <input
                    type="number"
                    className="w-full px-4 py-3 rounded-2xl border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    value={form.unit_price}
                    onChange={(e) => onChange("unit_price", e.target.value)}
                    placeholder="0.00"
                  />
                </div>
                <div className="flex items-center gap-3 p-3 rounded-2xl bg-slate-50 border border-slate-200 col-span-full">
                  <input
                    id="is_serialized"
                    type="checkbox"
                    checked={form.has_serial}
                    onChange={(e) => onChange("has_serial", e.target.checked)}
                    className="h-5 w-5 rounded border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                  />
                  <div className="flex flex-col">
                    <label
                      htmlFor="is_serialized"
                      className="text-xs font-semibold text-slate-700 cursor-pointer"
                    >
                      Serialized tracking
                    </label>
                    <p className="text-[11px] text-slate-500">
                      Enable serial number capture for each unit (required for
                      panels/projectors).
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
                <button
                  className="px-5 py-2.5 rounded-2xl text-xs font-medium bg-slate-100 text-slate-600 hover:bg-slate-200 transition-all"
                  onClick={() => setModalOpen(false)}
                >
                  Cancel
                </button>
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.97 }}
                  disabled={saving}
                  onClick={handleSave}
                  className="px-6 py-2.5 rounded-2xl text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 shadow-lg shadow-blue-300/50 disabled:opacity-60 transition-all"
                >
                  {saving ? "Creating..." : "Add product"}
                </motion.button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
