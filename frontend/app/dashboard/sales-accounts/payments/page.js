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

export default function PaymentsSAPage() {
  const [error, setError] = useState('');
  const [savingIn, setSavingIn] = useState(false);
  const [savingOut, setSavingOut] = useState(false);
  const [customers, setCustomers] = useState([]);
  const [vendors, setVendors] = useState([]);
  const [payments, setPayments] = useState([]);
  const [inForm, setInForm] = useState({
    invoice_id: '',
    customer_id: '',
    amount: '',
    mode: 'cash',
    date: ''
  });
  const [outForm, setOutForm] = useState({
    vendor_id: '',
    po_id: '',
    amount: '',
    mode: 'cash',
    date: ''
  });

  const customerName = (id) => {
    const c = customers.find((x) => x.id === id);
    return c ? c.name || c.full_name || id : id || '-';
  };

  const vendorName = (id) => {
    const v = vendors.find((x) => x.id === id);
    return v ? v.name || v.full_name || id : id || '-';
  };

  const displayStatus = (p) => {
    if (p?.type === 'out') return 'paid';
    return p?.status || 'received';
  };

  const formatRef = (p) => {
    if (!p) return '-';
    const label = p.reference_type || p.ref_type || 'ref';
    const ref = p.reference_id ? String(p.reference_id) : '-';
    return `${label} #${ref}`;
  };

  const loadData = async () => {
    try {
      const [cust, vend, pay] = await Promise.all([
        fetchWithAuth('/api/sa/masters/customers').catch(() => []),
        fetchWithAuth('/api/sa/masters/vendors').catch(() => []),
        fetchWithAuth('/api/sa/payments?limit=50').catch(() => [])
      ]);
      setCustomers(Array.isArray(cust) ? cust : []);
      setVendors(Array.isArray(vend) ? vend : []);
      setPayments(Array.isArray(pay) ? pay : []);
    } catch {
      // ignore
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleIn = async () => {
    try {
      setSavingIn(true);
      await fetchWithAuth('/api/sa/payments/in', {
        method: 'POST',
        body: JSON.stringify({
          ...inForm,
          amount: Number(inForm.amount)
        })
      });
      setInForm({ invoice_id: '', customer_id: '', amount: '', mode: 'cash', date: '' });
      setError('');
      await loadData();
    } catch (err) {
      setError(err.message || 'Payment in failed');
    } finally {
      setSavingIn(false);
    }
  };

  const handleOut = async () => {
    try {
      setSavingOut(true);
      await fetchWithAuth('/api/sa/payments/out', {
        method: 'POST',
        body: JSON.stringify({
          ...outForm,
          amount: Number(outForm.amount)
        })
      });
      setOutForm({ vendor_id: '', po_id: '', amount: '', mode: 'cash', date: '' });
      setError('');
      await loadData();
    } catch (err) {
      setError(err.message || 'Payment out failed');
    } finally {
      setSavingOut(false);
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
          <span>Cash desk</span>
        </div>
        <div>
          <h1 className="text-3xl font-semibold text-slate-900">Payments</h1>
          <p className="text-sm text-slate-500">
            Cash in (customers) and cash out (vendors) with balanced ledger enforcement.
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
          <h3 className="text-base font-semibold text-slate-900">Customer Receipts</h3>
          <div className="grid grid-cols-1 gap-2 text-xs">
            <input
              className="px-4 py-3 rounded-2xl border border-slate-200 bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Invoice ID (optional)"
              value={inForm.invoice_id}
              onChange={(e) => setInForm((p) => ({ ...p, invoice_id: e.target.value }))}
            />
            <input
              className="px-4 py-3 rounded-2xl border border-slate-200 bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Customer"
              list="customerOptions"
              value={inForm.customer_id}
              onChange={(e) => setInForm((p) => ({ ...p, customer_id: e.target.value }))}
            />
            <datalist id="customerOptions">
              {customers.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name || c.full_name}
                </option>
              ))}
            </datalist>
            <div className="grid grid-cols-2 gap-2">
              <input
                className="px-4 py-3 rounded-2xl border border-slate-200 bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Amount"
                value={inForm.amount}
                onChange={(e) => setInForm((p) => ({ ...p, amount: e.target.value }))}
              />
              <input
                className="px-4 py-3 rounded-2xl border border-slate-200 bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Date"
                type="date"
                value={inForm.date}
                onChange={(e) => setInForm((p) => ({ ...p, date: e.target.value }))}
              />
            </div>
            <input
              className="px-4 py-3 rounded-2xl border border-slate-200 bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Mode (cash/bank/upi/cheque)"
              value={inForm.mode}
              onChange={(e) => setInForm((p) => ({ ...p, mode: e.target.value }))}
            />
          </div>
          <div className="flex justify-end">
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.97 }}
              disabled={savingIn}
              onClick={handleIn}
              className="px-5 py-2.5 rounded-2xl text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-60"
            >
              {savingIn ? 'Saving' : 'Record Payment In'}
            </motion.button>
          </div>
        </div>

        <div className="rounded-3xl bg-white border border-slate-100 shadow-[0_20px_40px_rgba(15,23,42,0.08)] p-6 space-y-4">
          <h3 className="text-base font-semibold text-slate-900">Vendor Payments</h3>
          <div className="grid grid-cols-1 gap-2 text-xs">
            <input
              className="px-4 py-3 rounded-2xl border border-slate-200 bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Vendor"
              list="vendorOptions"
              value={outForm.vendor_id}
              onChange={(e) => setOutForm((p) => ({ ...p, vendor_id: e.target.value }))}
            />
            <datalist id="vendorOptions">
              {vendors.map((v) => (
                <option key={v.id} value={v.id}>
                  {v.name || v.full_name}
                </option>
              ))}
            </datalist>
            <input
              className="px-4 py-3 rounded-2xl border border-slate-200 bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="PO ID (optional)"
              value={outForm.po_id}
              onChange={(e) => setOutForm((p) => ({ ...p, po_id: e.target.value }))}
            />
            <div className="grid grid-cols-2 gap-2">
              <input
                className="px-4 py-3 rounded-2xl border border-slate-200 bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Amount"
                value={outForm.amount}
                onChange={(e) => setOutForm((p) => ({ ...p, amount: e.target.value }))}
              />
              <input
                className="px-4 py-3 rounded-2xl border border-slate-200 bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Date"
                type="date"
                value={outForm.date}
                onChange={(e) => setOutForm((p) => ({ ...p, date: e.target.value }))}
              />
            </div>
            <input
              className="px-4 py-3 rounded-2xl border border-slate-200 bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Mode (cash/bank/upi/cheque)"
              value={outForm.mode}
              onChange={(e) => setOutForm((p) => ({ ...p, mode: e.target.value }))}
            />
          </div>
          <div className="flex justify-end">
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.97 }}
              disabled={savingOut}
              onClick={handleOut}
              className="px-5 py-2.5 rounded-2xl text-sm font-medium text-white bg-slate-900 hover:bg-slate-950 disabled:opacity-60"
            >
              {savingOut ? 'Saving' : 'Record Payment Out'}
            </motion.button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="rounded-3xl bg-white border border-slate-100 shadow-[0_18px_40px_rgba(15,23,42,0.08)]">
          <div className="px-6 py-4 border-b border-slate-100">
            <h3 className="text-base font-semibold text-slate-900">Recent Customer Payments</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead className="bg-slate-50 text-xs text-slate-500 uppercase tracking-wider">
                <tr>
                  <th className="text-left px-6 py-3 font-semibold">Ref</th>
                  <th className="text-left px-6 py-3 font-semibold">Customer</th>
                  <th className="text-left px-6 py-3 font-semibold">Amount</th>
                  <th className="text-left px-6 py-3 font-semibold">Method</th>
                  <th className="text-left px-6 py-3 font-semibold">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {payments.filter((p) => p.type === 'in').length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-6 text-center text-xs text-slate-400">
                      No customer payments yet.
                    </td>
                  </tr>
                ) : (
                  payments
                    .filter((p) => p.type === 'in')
                    .slice(0, 8)
                    .map((p) => (
                      <tr key={p.id} className="hover:bg-slate-50">
                        <td className="px-6 py-4 text-slate-900">{formatRef(p)}</td>
                        <td className="px-6 py-4 text-slate-600">{customerName(p.customer_id)}</td>
                        <td className="px-6 py-4 text-slate-900 font-semibold">{p.amount ?? '-'}</td>
                        <td className="px-6 py-4 text-slate-600">{p.method || '-'}</td>
                        <td className="px-6 py-4 text-slate-600">{displayStatus(p)}</td>
                      </tr>
                    ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        <div className="rounded-3xl bg-white border border-slate-100 shadow-[0_18px_40px_rgba(15,23,42,0.08)]">
          <div className="px-6 py-4 border-b border-slate-100">
            <h3 className="text-base font-semibold text-slate-900">Recent Vendor Payments</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead className="bg-slate-50 text-xs text-slate-500 uppercase tracking-wider">
                <tr>
                  <th className="text-left px-6 py-3 font-semibold">Ref</th>
                  <th className="text-left px-6 py-3 font-semibold">Vendor</th>
                  <th className="text-left px-6 py-3 font-semibold">Amount</th>
                  <th className="text-left px-6 py-3 font-semibold">Method</th>
                  <th className="text-left px-6 py-3 font-semibold">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {payments.filter((p) => p.type === 'out').length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-6 text-center text-xs text-slate-400">
                      No vendor payments yet.
                    </td>
                  </tr>
                ) : (
                  payments
                    .filter((p) => p.type === 'out')
                    .slice(0, 8)
                    .map((p) => (
                      <tr key={p.id} className="hover:bg-slate-50">
                        <td className="px-6 py-4 text-slate-900">{formatRef(p)}</td>
                        <td className="px-6 py-4 text-slate-600">{vendorName(p.vendor_id)}</td>
                        <td className="px-6 py-4 text-slate-900 font-semibold">{p.amount ?? '-'}</td>
                        <td className="px-6 py-4 text-slate-600">{p.method || '-'}</td>
                        <td className="px-6 py-4 text-slate-600">{displayStatus(p)}</td>
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

