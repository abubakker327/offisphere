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

export default function SalesFlowPage() {
  const [quotations, setQuotations] = useState([]);
  const [orders, setOrders] = useState([]);
  const [deliveries, setDeliveries] = useState([]);
  const [products, setProducts] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [invoices, setInvoices] = useState([]);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [successOrder, setSuccessOrder] = useState('');
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    customer_id: '',
    product_id: '',
    qty: 1,
    unit_price: 0,
    gst_rate: 18
  });
  const [deliveryForm, setDeliveryForm] = useState({
    sales_order_id: '',
    warehouse_id: '',
    product_id: '',
    qty: 1,
    serials: ''
  });
  const [invoiceForm, setInvoiceForm] = useState({
    delivery_id: '',
    customer_id: '',
    product_id: '',
    qty: 1,
    unit_price: 0,
    gst_rate: 18
  });

  const loadData = async () => {
      try {
        setError('');
        const [q, o, d, productList, customerList, invoiceList] = await Promise.all([
          fetchWithAuth('/api/sa/sales/quotation?limit=20').catch(() => []),
          fetchWithAuth('/api/sa/sales/order?limit=20').catch(() => []),
          fetchWithAuth('/api/sa/inventory/stock-ledger').catch(() => []),
          fetchWithAuth('/api/sa/masters/products').catch(() => []),
          fetchWithAuth('/api/sa/masters/customers').catch(() => []),
          fetchWithAuth('/api/sa/sales/invoice?limit=20').catch(() => [])
        ]);
        setQuotations(Array.isArray(q) ? q : []);
        setOrders(Array.isArray(o) ? o : []);
        setDeliveries(
          Array.isArray(d) ? d.filter((r) => r.ref_type === 'DELIVERY').slice(0, 10) : []
        );
        setProducts(Array.isArray(productList) ? productList : []);
        setCustomers(Array.isArray(customerList) ? customerList : []);
        setInvoices(Array.isArray(invoiceList) ? invoiceList : []);
      } catch (err) {
        setError(err.message || 'Error loading sales data');
        setSuccess('');
        setSuccessOrder('');
      }
  };

  useEffect(() => {
    loadData();
  }, []);

  const customerName = (id) => {
    const c = customers.find((x) => x.id === id);
    return c ? c.name || c.full_name || id : id;
  };

  const productName = (id) => {
    const p = products.find((x) => x.id === id);
    return p ? `${p.name} (${p.sku || 'sku'})` : id;
  };

  const createQuotation = async () => {
    try {
      setSaving(true);
      await fetchWithAuth('/api/sa/sales/quotation', {
        method: 'POST',
        body: JSON.stringify({
          customer_id: form.customer_id,
          items: [
            {
              product_id: form.product_id,
              qty: Number(form.qty),
              unit_price: Number(form.unit_price),
              gst_rate: Number(form.gst_rate)
            }
          ]
        })
      });
      setForm({ customer_id: '', product_id: '', qty: 1, unit_price: 0, gst_rate: 18 });
      setSuccess('Quotation created successfully');
      loadData();
    } catch (err) {
      setError(err.message || 'Error creating quotation');
      setSuccess('');
    } finally {
      setSaving(false);
    }
  };

  const createOrder = async () => {
    try {
      setSaving(true);
      await fetchWithAuth('/api/sa/sales/order', {
        method: 'POST',
        body: JSON.stringify({
          customer_id: form.customer_id,
          items: [
            {
              product_id: form.product_id,
              qty: Number(form.qty),
              unit_price: Number(form.unit_price),
              gst_rate: Number(form.gst_rate)
            }
          ]
        })
      });
      setSuccessOrder('Sales order created successfully');
      setSuccess('');
      loadData();
    } catch (err) {
      setError(err.message || 'Error creating order');
      setSuccessOrder('');
    } finally {
      setSaving(false);
    }
  };

  const createDelivery = async () => {
    try {
      setSaving(true);
      const serialArr = deliveryForm.serials
        ? deliveryForm.serials.split(',').map((s) => s.trim()).filter(Boolean)
        : [];
      await fetchWithAuth('/api/sa/sales/delivery', {
        method: 'POST',
        body: JSON.stringify({
          sales_order_id: deliveryForm.sales_order_id,
          warehouse_id: deliveryForm.warehouse_id,
          items: [
            {
              product_id: deliveryForm.product_id,
              qty: Number(deliveryForm.qty),
              serials: serialArr
            }
          ]
        })
      });
      setDeliveryForm({
        sales_order_id: '',
        warehouse_id: '',
        product_id: '',
        qty: 1,
        serials: ''
      });
      loadData();
    } catch (err) {
      setError(err.message || 'Error creating delivery');
    } finally {
      setSaving(false);
    }
  };

  const createInvoice = async () => {
    try {
      setSaving(true);
      await fetchWithAuth('/api/sa/sales/invoice', {
        method: 'POST',
        body: JSON.stringify({
          delivery_id: invoiceForm.delivery_id,
          customer_id: invoiceForm.customer_id,
          items: [
            {
              product_id: invoiceForm.product_id,
              qty: Number(invoiceForm.qty),
              unit_price: Number(invoiceForm.unit_price),
              gst_rate: Number(invoiceForm.gst_rate)
            }
          ]
        })
      });
      setInvoiceForm({
        delivery_id: '',
        customer_id: '',
        product_id: '',
        qty: 1,
        unit_price: 0,
        gst_rate: 18
      });
      loadData();
    } catch (err) {
      setError(err.message || 'Error creating invoice');
    } finally {
      setSaving(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
      className="space-y-6 bg-gradient-to-br from-slate-50 via-indigo-50/70 to-cyan-50/60 p-1 rounded-3xl"
    >      <div className="space-y-2">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-gradient-to-r from-indigo-600 via-purple-600 to-sky-500 text-white text-[11px] font-semibold shadow-sm shadow-indigo-200">
          <span className="h-1.5 w-1.5 rounded-full bg-white/90" />
          <span>Sales pipeline</span>
        </div>
        <div>
          <h1 className="text-xl font-semibold text-slate-900">Sales Flow</h1>
          <p className="text-sm text-slate-600">
            Quotations - Orders - Delivery - Invoice with GST, serials for panels/projectors.
          </p>
        </div>
      </div>

      {error && (
        <div className="text-xs text-rose-600 bg-rose-50 border border-rose-100 rounded-xl px-3 py-2">
          {error}
        </div>
      )}
      {success && (
        <div className="text-xs text-emerald-700 bg-emerald-50 border border-emerald-100 rounded-xl px-3 py-2">
          {success}
        </div>
      )}
      {successOrder && (
        <div className="text-xs text-emerald-700 bg-emerald-50 border border-emerald-100 rounded-xl px-3 py-2">
          {successOrder}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="relative overflow-hidden rounded-2xl border border-indigo-100/60 bg-white/90 shadow-[0_14px_36px_rgba(0,0,0,0.06)] p-4 space-y-2 backdrop-blur">
          <div
            className="absolute inset-y-0 left-0 w-1 bg-gradient-to-b from-indigo-500 via-purple-500 to-cyan-500"
            aria-hidden="true"
          />
          <h3 className="text-sm font-semibold text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 via-purple-600 to-sky-500">Quotation / Sales Order</h3>
          <div className="grid grid-cols-1 gap-2 text-xs">
            <div className="space-y-1">
              <label className="text-[11px] text-slate-500">Customer</label>
              <select
                className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white"
                value={form.customer_id}
                onChange={(e) => setForm((p) => ({ ...p, customer_id: e.target.value }))}
              >
                <option value="">Select customer</option>
                {customers.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name || c.full_name || c.id}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-1">
              <label className="text-[11px] text-slate-500">Product</label>
              <select
                className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white"
                value={form.product_id}
                onChange={(e) => setForm((p) => ({ ...p, product_id: e.target.value }))}
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
              <input
                type="number"
                className="px-3 py-2 rounded-xl border border-slate-200"
                placeholder="Qty"
                value={form.qty}
                onChange={(e) => setForm((p) => ({ ...p, qty: e.target.value }))}
              />
              <input
                type="number"
                className="px-3 py-2 rounded-xl border border-slate-200"
                placeholder="Unit price"
                value={form.unit_price}
                onChange={(e) => setForm((p) => ({ ...p, unit_price: e.target.value }))}
              />
              <input
                type="number"
                className="px-3 py-2 rounded-xl border border-slate-200"
                placeholder="GST %"
                value={form.gst_rate}
                onChange={(e) => setForm((p) => ({ ...p, gst_rate: e.target.value }))}
              />
            </div>
          </div>
          <div className="flex gap-2 justify-end">
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.97 }}
              disabled={saving}
              onClick={createQuotation}
              className="px-4 py-2 rounded-full text-xs font-semibold text-white bg-gradient-to-r from-indigo-500 to-purple-500 shadow hover:shadow-lg disabled:opacity-60"
            >
              Create Quotation
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.97 }}
              disabled={saving}
              onClick={createOrder}
              className="px-4 py-2 rounded-full text-xs font-semibold text-white bg-gradient-to-r from-emerald-500 to-teal-500 shadow hover:shadow-lg disabled:opacity-60"
            >
              Create Order
            </motion.button>
          </div>
        </div>

        <div className="relative overflow-hidden rounded-2xl border border-indigo-100/60 bg-white/90 shadow-[0_14px_36px_rgba(0,0,0,0.06)] p-4 space-y-2 backdrop-blur">
          <div
            className="absolute inset-y-0 left-0 w-1 bg-gradient-to-b from-indigo-500 via-purple-500 to-cyan-500"
            aria-hidden="true"
          />
          <h3 className="text-sm font-semibold text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 via-purple-600 to-sky-500">Delivery & Invoice</h3>
          <div className="grid grid-cols-1 gap-2 text-xs">
            <div className="space-y-1">
              <label className="text-[11px] text-slate-500">Sales Order ID</label>
              <input
                className="w-full px-3 py-2 rounded-xl border border-slate-200"
                placeholder="Sales Order ID"
                value={deliveryForm.sales_order_id}
                onChange={(e) => setDeliveryForm((p) => ({ ...p, sales_order_id: e.target.value }))}
              />
            </div>
            <div className="space-y-1">
              <label className="text-[11px] text-slate-500">Warehouse ID</label>
              <input
                className="w-full px-3 py-2 rounded-xl border border-slate-200"
                placeholder="Warehouse ID"
                value={deliveryForm.warehouse_id}
                onChange={(e) => setDeliveryForm((p) => ({ ...p, warehouse_id: e.target.value }))}
              />
            </div>
            <div className="space-y-1">
              <label className="text-[11px] text-slate-500">Product</label>
              <select
                className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white"
                value={deliveryForm.product_id}
                onChange={(e) => setDeliveryForm((p) => ({ ...p, product_id: e.target.value }))}
              >
                <option value="">Select product</option>
                {products.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name} ({p.sku || 'sku'})
                  </option>
                ))}
              </select>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <input
                type="number"
                className="px-3 py-2 rounded-xl border border-slate-200"
                placeholder="Qty"
                value={deliveryForm.qty}
                onChange={(e) => setDeliveryForm((p) => ({ ...p, qty: e.target.value }))}
              />
              <input
                className="px-3 py-2 rounded-xl border border-slate-200"
                placeholder="Serials (comma separated)"
                value={deliveryForm.serials}
                onChange={(e) => setDeliveryForm((p) => ({ ...p, serials: e.target.value }))}
              />
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.97 }}
              disabled={saving}
              onClick={createDelivery}
              className="px-4 py-2 rounded-full text-xs font-semibold text-white bg-gradient-to-r from-amber-500 to-orange-500 shadow hover:shadow-lg disabled:opacity-60"
            >
              Post Delivery
            </motion.button>
          </div>

          <div className="pt-3 border-t border-slate-100 mt-3">
            <h4 className="text-xs font-semibold text-slate-700 mb-2">Invoice</h4>
            <div className="grid grid-cols-1 gap-2 text-xs">
              <div className="space-y-1">
                <label className="text-[11px] text-slate-500">Delivery ID</label>
                <input
                  className="w-full px-3 py-2 rounded-xl border border-slate-200"
                  placeholder="Delivery ID"
                  value={invoiceForm.delivery_id}
                  onChange={(e) => setInvoiceForm((p) => ({ ...p, delivery_id: e.target.value }))}
                />
              </div>
              <div className="space-y-1">
                <label className="text-[11px] text-slate-500">Customer</label>
                <select
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white"
                  value={invoiceForm.customer_id}
                  onChange={(e) => setInvoiceForm((p) => ({ ...p, customer_id: e.target.value }))}
                >
                  <option value="">Select customer</option>
                  {customers.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name || c.full_name || c.id}
                    </option>
                  ))}
                </select>
              </div>
              <div className="space-y-1">
                <label className="text-[11px] text-slate-500">Product</label>
                <select
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white"
                  value={invoiceForm.product_id}
                  onChange={(e) => setInvoiceForm((p) => ({ ...p, product_id: e.target.value }))}
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
                <input
                  type="number"
                  className="px-3 py-2 rounded-xl border border-slate-200"
                  placeholder="Qty"
                  value={invoiceForm.qty}
                  onChange={(e) => setInvoiceForm((p) => ({ ...p, qty: e.target.value }))}
                />
                <input
                  type="number"
                  className="px-3 py-2 rounded-xl border border-slate-200"
                  placeholder="Unit price"
                  value={invoiceForm.unit_price}
                  onChange={(e) => setInvoiceForm((p) => ({ ...p, unit_price: e.target.value }))}
                />
                <input
                  type="number"
                  className="px-3 py-2 rounded-xl border border-slate-200"
                  placeholder="GST %"
                  value={invoiceForm.gst_rate}
                  onChange={(e) => setInvoiceForm((p) => ({ ...p, gst_rate: e.target.value }))}
                />
              </div>
            </div>
            <div className="flex justify-end mt-2">
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.97 }}
                disabled={saving}
                onClick={createInvoice}
                className="px-4 py-2 rounded-full text-xs font-semibold text-white bg-gradient-to-r from-indigo-500 to-purple-500 shadow hover:shadow-lg disabled:opacity-60"
              >
                Post Invoice
              </motion.button>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="relative overflow-hidden bg-white rounded-2xl border border-slate-100 shadow-sm p-4">
          <div
            className="absolute inset-y-0 left-0 w-1 bg-gradient-to-b from-indigo-500 via-purple-500 to-cyan-500"
            aria-hidden="true"
          />
          <h3 className="text-sm font-semibold text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 via-purple-600 to-sky-500 mb-2">Recent Quotations</h3>
          <div className="overflow-x-auto text-xs">
            <table className="min-w-full border-separate border-spacing-y-1">
              <thead className="text-[11px] text-white">
                <tr className="bg-gradient-to-r from-indigo-600 via-purple-600 to-sky-500">
                  <th className="text-left px-2 py-2 font-semibold first:rounded-l-xl">Quote #</th>
                  <th className="text-left px-2 py-2 font-semibold">Customer</th>
                  <th className="text-left px-2 py-2 font-semibold last:rounded-r-xl">Status</th>
                </tr>
              </thead>
              <tbody>
                {quotations.length === 0 ? (
                  <tr>
                    <td colSpan={3} className="px-2 py-3 text-center text-slate-400">
                      No quotations yet.
                    </td>
                  </tr>
                ) : (
                  quotations.slice(0, 8).map((q, idx) => (
                    <tr key={q.id} className={`rounded shadow-sm ${idx % 2 === 0 ? 'bg-indigo-50/70' : 'bg-slate-50'} hover:bg-indigo-50`}>
                      <td className="px-2 py-2 text-slate-900">{q.quote_number || q.id}</td>
                      <td className="px-2 py-2 text-slate-600">{customerName(q.customer_id)}</td>
                      <td className="px-2 py-2 text-slate-600">{q.status || '-'}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        <div className="relative overflow-hidden bg-white rounded-2xl border border-slate-100 shadow-sm p-4">
          <div
            className="absolute inset-y-0 left-0 w-1 bg-gradient-to-b from-indigo-500 via-purple-500 to-cyan-500"
            aria-hidden="true"
          />
          <h3 className="text-sm font-semibold text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 via-purple-600 to-sky-500 mb-2">Recent Orders</h3>
          <div className="overflow-x-auto text-xs">
            <table className="min-w-full border-separate border-spacing-y-1">
              <thead className="text-[11px] text-white">
                <tr className="bg-gradient-to-r from-indigo-600 via-purple-600 to-sky-500">
                  <th className="text-left px-2 py-2 font-semibold first:rounded-l-xl">SO #</th>
                  <th className="text-left px-2 py-2 font-semibold">Customer</th>
                  <th className="text-left px-2 py-2 font-semibold last:rounded-r-xl">Status</th>
                </tr>
              </thead>
              <tbody>
                {orders.length === 0 ? (
                  <tr>
                    <td colSpan={3} className="px-2 py-3 text-center text-slate-400">
                      No orders yet.
                    </td>
                  </tr>
                ) : (
                  orders.slice(0, 8).map((o, idx) => (
                    <tr key={o.id} className={`rounded shadow-sm ${idx % 2 === 0 ? 'bg-indigo-50/70' : 'bg-slate-50'} hover:bg-indigo-50`}>
                      <td className="px-2 py-2 text-slate-900">{o.so_number || o.id}</td>
                      <td className="px-2 py-2 text-slate-600">{customerName(o.customer_id)}</td>
                      <td className="px-2 py-2 text-slate-600">{o.status || '-'}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        <div className="relative overflow-hidden bg-white rounded-2xl border border-slate-100 shadow-sm p-4">
          <div
            className="absolute inset-y-0 left-0 w-1 bg-gradient-to-b from-indigo-500 via-purple-500 to-cyan-500"
            aria-hidden="true"
          />
          <h3 className="text-sm font-semibold text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 via-purple-600 to-sky-500 mb-2">Recent Invoices</h3>
          <div className="overflow-x-auto text-xs">
            <table className="min-w-full border-separate border-spacing-y-1">
              <thead className="text-[11px] text-white">
                <tr className="bg-gradient-to-r from-indigo-600 via-purple-600 to-sky-500">
                  <th className="text-left px-2 py-2 font-semibold first:rounded-l-xl">Invoice #</th>
                  <th className="text-left px-2 py-2 font-semibold">Customer</th>
                  <th className="text-left px-2 py-2 font-semibold last:rounded-r-xl">Status</th>
                </tr>
              </thead>
              <tbody>
                {invoices.length === 0 ? (
                  <tr>
                    <td colSpan={3} className="px-2 py-3 text-center text-slate-400">
                      No invoices yet.
                    </td>
                  </tr>
                ) : (
                  invoices.slice(0, 8).map((inv, idx) => (
                    <tr key={inv.id} className={`rounded shadow-sm ${idx % 2 === 0 ? 'bg-indigo-50/70' : 'bg-slate-50'} hover:bg-indigo-50`}>
                      <td className="px-2 py-2 text-slate-900">{inv.invoice_number || inv.id}</td>
                      <td className="px-2 py-2 text-slate-600">{customerName(inv.customer_id)}</td>
                      <td className="px-2 py-2 text-slate-600">{inv.status || '-'}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        <div className="relative overflow-hidden bg-white rounded-2xl border border-slate-100 shadow-sm p-4">
          <div
            className="absolute inset-y-0 left-0 w-1 bg-gradient-to-b from-indigo-500 via-purple-500 to-cyan-500"
            aria-hidden="true"
          />
          <h3 className="text-sm font-semibold text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 via-purple-600 to-sky-500 mb-2">Recent deliveries (from stock ledger)</h3>
          <div className="overflow-x-auto text-xs">
            <table className="min-w-full border-separate border-spacing-y-1">
              <thead className="text-[11px] text-white">
                <tr className="bg-gradient-to-r from-indigo-600 via-purple-600 to-sky-500">
                  <th className="text-left px-2 py-2 font-semibold first:rounded-l-xl">Ref</th>
                  <th className="text-left px-2 py-2 font-semibold">Product</th>
                  <th className="text-left px-2 py-2 font-semibold">Warehouse</th>
                  <th className="text-left px-2 py-2 font-semibold last:rounded-r-xl">Qty</th>
                </tr>
              </thead>
              <tbody>
                {deliveries.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="px-2 py-3 text-center text-slate-400">
                      No deliveries yet.
                    </td>
                  </tr>
                ) : (
                  deliveries.map((row, idx) => (
                    <tr key={row.id} className={`rounded shadow-sm ${idx % 2 === 0 ? 'bg-indigo-50/70' : 'bg-slate-50'} hover:bg-indigo-50`}>
                      <td className="px-2 py-2 text-slate-900">
                        {row.ref_type} #{row.ref_id}
                      </td>
                      <td className="px-2 py-2 text-slate-600">{productName(row.product_id)}</td>
                      <td className="px-2 py-2 text-slate-600">{row.warehouse_id || '-'}</td>
                      <td className="px-2 py-2 text-slate-600">{row.qty_delta}</td>
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







