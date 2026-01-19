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
        <div className="of-pill">
          <span>Cash desk</span>
        </div>
        <div>
          <h1 className="page-title">Payments</h1>
          <p className="page-subtitle">
            Cash in (customers) and cash out (vendors) with balanced ledger enforcement.
          </p>
        </div>
      </div>

      {error && (
        <div className="of-banner-error">{error}</div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="of-card p-6 space-y-4">
          <h3 className="section-title">Customer Receipts</h3>
          <div className="grid grid-cols-1 gap-2 text-xs">
            <input
              className="of-input"
              placeholder="Invoice ID (optional)"
              value={inForm.invoice_id}
              onChange={(e) => setInForm((p) => ({ ...p, invoice_id: e.target.value }))}
            />
            <input
              className="of-input"
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
                className="of-input"
                placeholder="Amount"
                value={inForm.amount}
                onChange={(e) => setInForm((p) => ({ ...p, amount: e.target.value }))}
              />
              <input
                className="of-input"
                placeholder="Date"
                type="date"
                value={inForm.date}
                onChange={(e) => setInForm((p) => ({ ...p, date: e.target.value }))}
              />
            </div>
            <input
              className="of-input"
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
              className="of-button-primary"
            >
              {savingIn ? 'Saving' : 'Record Payment In'}
            </motion.button>
          </div>
        </div>

        <div className="of-card p-6 space-y-4">
          <h3 className="section-title">Vendor Payments</h3>
          <div className="grid grid-cols-1 gap-2 text-xs">
            <input
              className="of-input"
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
              className="of-input"
              placeholder="PO ID (optional)"
              value={outForm.po_id}
              onChange={(e) => setOutForm((p) => ({ ...p, po_id: e.target.value }))}
            />
            <div className="grid grid-cols-2 gap-2">
              <input
                className="of-input"
                placeholder="Amount"
                value={outForm.amount}
                onChange={(e) => setOutForm((p) => ({ ...p, amount: e.target.value }))}
              />
              <input
                className="of-input"
                placeholder="Date"
                type="date"
                value={outForm.date}
                onChange={(e) => setOutForm((p) => ({ ...p, date: e.target.value }))}
              />
            </div>
            <input
              className="of-input"
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
              className="of-button-primary"
            >
              {savingOut ? 'Saving' : 'Record Payment Out'}
            </motion.button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="of-card">
          <div className="px-6 py-4 border-b border-slate-100">
            <h3 className="section-title">Recent Customer Payments</h3>
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
                    <td colSpan={5} className="px-6 py-6 of-empty">
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

        <div className="of-card">
          <div className="px-6 py-4 border-b border-slate-100">
            <h3 className="section-title">Recent Vendor Payments</h3>
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
                    <td colSpan={5} className="px-6 py-6 of-empty">
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






