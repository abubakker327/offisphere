'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';

const API_BASE = process.env.NEXT_PUBLIC_API_BASE || 'https://offisphere.onrender.com';

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

export default function ProcurementPage() {
  const [pos, setPos] = useState([]);
  const [grns, setGrns] = useState([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [savingPO, setSavingPO] = useState(false);
  const [savingGRN, setSavingGRN] = useState(false);
  const [products, setProducts] = useState([]);
  const [vendors, setVendors] = useState([]);
  const [poItems, setPoItems] = useState([]);

  const [poForm, setPoForm] = useState({
    vendor_id: '',
    warehouse_id: '',
    product_id: '',
    qty: 1,
    unit_price: 0,
    gst_rate: 18
  });

  const [grnForm, setGrnForm] = useState({
    po_id: '',
    warehouse_id: '',
    product_id: '',
    qty_received: 1,
    serials: ''
  });

  const loadData = async () => {
    try {
      setLoading(true);
      const [poList, grnList, productList, vendorList] = await Promise.all([
        fetchWithAuth('/api/sa/procurement/po'),
        fetchWithAuth('/api/sa/inventory/stock-ledger'), // fallback if no GRN list; will display incoming
        fetchWithAuth('/api/sa/masters/products'),
        fetchWithAuth('/api/sa/masters/vendors')
      ]);
      setPos(Array.isArray(poList) ? poList : []);
      setGrns(Array.isArray(grnList) ? grnList.filter((r) => r.ref_type === 'GRN') : []);
      setProducts(Array.isArray(productList) ? productList : []);
      setVendors(Array.isArray(vendorList) ? vendorList : []);
      setError('');
    } catch (err) {
      setError(err.message || 'Error loading procurement data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleSelectPoForGrn = async (poId) => {
    setGrnForm((p) => ({ ...p, po_id: poId }));
    setPoItems([]);
    if (!poId) return;
    try {
      const items = await fetchWithAuth(`/api/sa/procurement/po/${poId}/items`);
      const list = Array.isArray(items) ? items : [];
      setPoItems(list);
      if (list[0]?.product_id) {
        setGrnForm((p) => ({ ...p, product_id: list[0].product_id }));
      }
    } catch (err) {
      console.error('Failed to load PO items', err);
    }
  };

  const vendorName = (id) => {
    const v = vendors.find((x) => x.id === id);
    return v ? v.name || v.full_name || id : id;
  };
  const productName = (id) => {
    const p = products.find((x) => x.id === id);
    return p ? `${p.name} (${p.sku || 'sku'})` : id;
  };

  const handleSavePO = async () => {
    try {
      setSavingPO(true);
      await fetchWithAuth('/api/sa/procurement/po', {
        method: 'POST',
        body: JSON.stringify({
          vendor_id: poForm.vendor_id,
          warehouse_id: poForm.warehouse_id,
          items: [
            {
              product_id: poForm.product_id,
              qty: Number(poForm.qty),
              unit_price: Number(poForm.unit_price),
              gst_rate: Number(poForm.gst_rate)
            }
          ]
        })
      });
      setPoForm({
        vendor_id: '',
        warehouse_id: '',
        product_id: '',
        qty: 1,
        unit_price: 0,
        gst_rate: 18
      });
      loadData();
    } catch (err) {
      setError(err.message || 'Error creating PO');
    } finally {
      setSavingPO(false);
    }
  };

  const handleSaveGRN = async () => {
    try {
      setSavingGRN(true);
      const serialArr = grnForm.serials
        ? grnForm.serials.split(',').map((s) => s.trim()).filter(Boolean)
        : [];
      await fetchWithAuth('/api/sa/procurement/grn', {
        method: 'POST',
        body: JSON.stringify({
          po_id: grnForm.po_id,
          warehouse_id: grnForm.warehouse_id,
          items: [
            {
              product_id: grnForm.product_id,
              qty: Number(grnForm.qty_received),
              serials: serialArr
            }
          ]
        })
      });
      setGrnForm({
        po_id: '',
        warehouse_id: '',
        product_id: '',
        qty_received: 1,
        serials: ''
      });
      loadData();
    } catch (err) {
      setError(err.message || 'Error creating GRN');
    } finally {
      setSavingGRN(false);
    }
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
          <span>Procurement desk</span>
        </div>
        <div>
          <h1 className="text-3xl font-semibold text-slate-900">Procurement</h1>
          <p className="text-sm text-slate-500">
            Create Purchase Orders and receive Goods (GRN) with GST and serial capture.
          </p>
        </div>
      </div>

      {error && (
        <div className="text-xs text-rose-600 bg-rose-50 border border-rose-100 rounded-xl px-3 py-2">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="rounded-3xl bg-white border border-slate-100 shadow-[0_20px_40px_rgba(15,23,42,0.08)] p-6 space-y-4">
          <h3 className="text-base font-semibold text-slate-900">New Purchase Order</h3>
          <div className="grid grid-cols-1 gap-2 text-xs">
            <div className="space-y-1">
              <label className="text-xs text-slate-600">Vendor</label>
              <select
                className="w-full px-4 py-3 rounded-2xl border border-slate-200 bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                value={poForm.vendor_id}
                onChange={(e) => setPoForm((p) => ({ ...p, vendor_id: e.target.value }))}
              >
                <option value="">Select vendor</option>
                {vendors.map((v) => (
                  <option key={v.id} value={v.id}>
                    {v.name || v.full_name || v.id}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-1">
              <label className="text-xs text-slate-600">Warehouse ID</label>
              <input
                className="w-full px-4 py-3 rounded-2xl border border-slate-200 bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Warehouse ID"
                value={poForm.warehouse_id}
                onChange={(e) => setPoForm((p) => ({ ...p, warehouse_id: e.target.value }))}
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs text-slate-600">Product</label>
              <select
                className="w-full px-4 py-3 rounded-2xl border border-slate-200 bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                value={poForm.product_id}
                onChange={(e) => setPoForm((p) => ({ ...p, product_id: e.target.value }))}
              >
                <option value="">Select product</option>
                {products.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name} ({p.sku || 'sku'})
                  </option>
                ))}
              </select>
            </div>
            <div className="grid grid-cols-3 gap-2">
              <div className="space-y-1">
                <label className="text-xs text-slate-600">Qty</label>
                <input
                  type="number"
                  className="w-full px-4 py-3 rounded-2xl border border-slate-200 bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Qty"
                  value={poForm.qty}
                  onChange={(e) => setPoForm((p) => ({ ...p, qty: e.target.value }))}
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs text-slate-600">Unit price</label>
                <input
                  type="number"
                  className="w-full px-4 py-3 rounded-2xl border border-slate-200 bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Unit price"
                  value={poForm.unit_price}
                  onChange={(e) => setPoForm((p) => ({ ...p, unit_price: e.target.value }))}
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs text-slate-600">GST %</label>
                <input
                  type="number"
                  className="w-full px-4 py-3 rounded-2xl border border-slate-200 bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="GST %"
                  value={poForm.gst_rate}
                  onChange={(e) => setPoForm((p) => ({ ...p, gst_rate: e.target.value }))}
                />
              </div>
            </div>
          </div>
          <div className="flex justify-end">
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.97 }}
              disabled={savingPO}
              onClick={handleSavePO}
              className="px-5 py-2.5 rounded-2xl text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-60"
            >
              {savingPO ? 'Saving' : 'Create PO'}
            </motion.button>
          </div>
          <div className="text-xs text-slate-400">
            Endpoint: POST /api/sa/procurement/po
          </div>
        </div>

        <div className="rounded-3xl bg-white border border-slate-100 shadow-[0_20px_40px_rgba(15,23,42,0.08)] p-6 space-y-4">
          <h3 className="text-base font-semibold text-slate-900">Receive Goods (GRN)</h3>
          <div className="grid grid-cols-1 gap-2 text-xs">
            <div className="space-y-1">
              <label className="text-xs text-slate-600">PO</label>
              <select
                className="w-full px-4 py-3 rounded-2xl border border-slate-200 bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                value={grnForm.po_id}
                onChange={(e) => handleSelectPoForGrn(e.target.value)}
              >
                <option value="">Select PO</option>
                {pos.map((po) => (
                  <option key={po.id} value={po.id}>
                    {po.id}
                  </option>
                ))}
              </select>
            </div>
            <input
              className="px-4 py-3 rounded-2xl border border-slate-200 bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Warehouse ID"
              value={grnForm.warehouse_id}
              onChange={(e) => setGrnForm((p) => ({ ...p, warehouse_id: e.target.value }))}
            />
            <div className="space-y-1">
              <label className="text-xs text-slate-600">Product (from PO)</label>
              <select
                className="w-full px-4 py-3 rounded-2xl border border-slate-200 bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                value={grnForm.product_id}
                onChange={(e) => setGrnForm((p) => ({ ...p, product_id: e.target.value }))}
              >
                <option value="">Select product</option>
                {(poItems.length ? poItems : products).map((p) => (
                  <option
                    key={p.id || p.product_id}
                    value={p.product_id || p.id}
                  >
                    {p.product_id ? productName(p.product_id) : productName(p.id)}
                  </option>
                ))}
              </select>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1">
                <label className="text-xs text-slate-600">Qty received</label>
                <input
                  type="number"
                  className="w-full px-4 py-3 rounded-2xl border border-slate-200 bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Qty received"
                  value={grnForm.qty_received}
                  onChange={(e) => setGrnForm((p) => ({ ...p, qty_received: e.target.value }))}
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs text-slate-600">Serials (comma separated)</label>
                <input
                  className="w-full px-4 py-3 rounded-2xl border border-slate-200 bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Serials (comma separated)"
                  value={grnForm.serials}
                  onChange={(e) => setGrnForm((p) => ({ ...p, serials: e.target.value }))}
                />
              </div>
            </div>
          </div>
          <div className="flex justify-end">
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.97 }}
              disabled={savingGRN}
              onClick={handleSaveGRN}
              className="px-5 py-2.5 rounded-2xl text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-60"
            >
              {savingGRN ? 'Saving' : 'Post GRN'}
            </motion.button>
          </div>
          <div className="text-xs text-slate-400">
            Endpoint: POST /api/sa/procurement/grn
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="rounded-3xl bg-white border border-slate-100 shadow-[0_18px_40px_rgba(15,23,42,0.08)]">
          <div className="px-6 py-4 border-b border-slate-100">
            <h3 className="text-base font-semibold text-slate-900">Purchase Orders</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead className="bg-slate-50 text-xs text-slate-500 uppercase tracking-wider">
                <tr>
                  <th className="text-left px-6 py-3 font-semibold">PO #</th>
                  <th className="text-left px-6 py-3 font-semibold">Vendor</th>
                  <th className="text-left px-6 py-3 font-semibold">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {loading ? (
                  <tr>
                    <td colSpan={3} className="px-6 py-6 text-center text-xs text-slate-400">
                      Loading
                    </td>
                  </tr>
                ) : pos.length === 0 ? (
                  <tr>
                    <td colSpan={3} className="px-6 py-6 text-center text-xs text-slate-400">
                      No POs found.
                    </td>
                  </tr>
                ) : (
                  pos.map((po) => (
                    <tr key={po.id} className="hover:bg-slate-50">
                      <td className="px-6 py-4 text-slate-900">{po.po_number || po.id}</td>
                      <td className="px-6 py-4 text-slate-600">{vendorName(po.vendor_id)}</td>
                      <td className="px-6 py-4 text-slate-600">{po.status || 'draft'}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        <div className="rounded-3xl bg-white border border-slate-100 shadow-[0_18px_40px_rgba(15,23,42,0.08)]">
          <div className="px-6 py-4 border-b border-slate-100">
            <h3 className="text-base font-semibold text-slate-900">Recent GRN (stock ledger +)</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead className="bg-slate-50 text-xs text-slate-500 uppercase tracking-wider">
                <tr>
                  <th className="text-left px-6 py-3 font-semibold">Ref</th>
                  <th className="text-left px-6 py-3 font-semibold">Product</th>
                  <th className="text-left px-6 py-3 font-semibold">Warehouse</th>
                  <th className="text-left px-6 py-3 font-semibold">Qty</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {loading ? (
                  <tr>
                    <td colSpan={4} className="px-6 py-6 text-center text-xs text-slate-400">
                      Loading
                    </td>
                  </tr>
                ) : grns.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="px-6 py-6 text-center text-xs text-slate-400">
                      No GRN entries found.
                    </td>
                  </tr>
                ) : (
                  grns.slice(0, 10).map((row) => (
                    <tr key={row.id} className="hover:bg-slate-50">
                      <td className="px-6 py-4 text-slate-900">
                        {row.ref_type} #{row.ref_id}
                      </td>
                      <td className="px-6 py-4 text-slate-600">{productName(row.product_id)}</td>
                      <td className="px-6 py-4 text-slate-600">{row.warehouse_id || '-'}</td>
                      <td className="px-6 py-4 text-slate-600">{row.qty_delta ?? row.quantity ?? '-'}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </motion.div>
  );
}


