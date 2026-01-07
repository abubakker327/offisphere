'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';

const STATUS_OPTIONS = [
  { value: 'received', label: 'Received' },
  { value: 'pending', label: 'Pending' },
  { value: 'failed', label: 'Failed' },
  { value: 'refunded', label: 'Refunded' }
];

const FILTERS = [
  { value: 'all', label: 'All' },
  { value: 'received', label: 'Received' },
  { value: 'pending', label: 'Pending' },
  { value: 'failed', label: 'Failed' },
  { value: 'refunded', label: 'Refunded' }
];

export default function PaymentsPage() {
  const [payments, setPayments] = useState([]);
  const [leads, setLeads] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [isAdminManager, setIsAdminManager] = useState(false);

  const [form, setForm] = useState({
    lead_id: '',
    amount: '',
    currency: 'INR',
    status: 'received',
    method: '',
    reference: '',
    notes: '',
    paid_at: ''
  });

  const API_BASE = 'http://localhost:5000';

  const triggerToast = (type, message) => {
    window.dispatchEvent(
      new CustomEvent('offisphere-toast', {
        detail: { type, message }
      })
    );
  };

  const loadRoles = () => {
    try {
      const rolesStr = window.localStorage.getItem('offisphere_roles');
      if (!rolesStr) return;
      const roles = JSON.parse(rolesStr);
      if (!Array.isArray(roles)) return;
      const flag =
        roles.includes('admin') || roles.includes('manager');
      setIsAdminManager(flag);
    } catch {
      setIsAdminManager(false);
    }
  };

  const fetchLeads = async () => {
    try {
      const token = window.localStorage.getItem('offisphere_token');
      if (!token) return;

      const res = await fetch(`${API_BASE}/api/leads?status=all`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      const data = await res.json();
      if (Array.isArray(data)) {
        setLeads(data);
      }
    } catch (err) {
      console.error('Fetch leads for payments error:', err);
    }
  };

  const fetchPayments = async (status = 'all') => {
    try {
      const token = window.localStorage.getItem('offisphere_token');
      if (!token) {
        setError('Not authenticated');
        setLoading(false);
        return;
      }

      const qs = status ? `?status=${status}` : '';
      const res = await fetch(`${API_BASE}/api/payments${qs}`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.message || 'Error fetching payments');
      } else {
        setPayments(Array.isArray(data) ? data : []);
        setError('');
      }
    } catch (err) {
      console.error('Fetch payments error:', err);
      setError('Error connecting to server');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadRoles();
    fetchPayments(filterStatus);
    fetchLeads();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleChange = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError('');

    try {
      const token = window.localStorage.getItem('offisphere_token');
      if (!token) {
        setError('Not authenticated');
        setSaving(false);
        return;
      }

      const body = {
        ...form,
        amount:
          form.amount !== '' ? parseFloat(form.amount) : null,
        lead_id:
          form.lead_id !== '' ? form.lead_id : null
      };

      const res = await fetch(`${API_BASE}/api/payments`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(body)
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.message || 'Error recording payment');
        triggerToast('error', data.message || 'Error recording payment');
      } else {
        setPayments(Array.isArray(data) ? data : []);
        triggerToast('success', 'Payment recorded ✅');
        setForm({
          lead_id: '',
          amount: '',
          currency: 'INR',
          status: 'received',
          method: '',
          reference: '',
          notes: '',
          paid_at: ''
        });
      }
    } catch (err) {
      console.error('Create payment error:', err);
      setError('Error connecting to server');
      triggerToast('error', 'Error connecting to server');
    } finally {
      setSaving(false);
    }
  };

  const handleStatusFilter = (status) => {
    setFilterStatus(status);
    setLoading(true);
    fetchPayments(status);
  };

  const leadNameById = (id) => {
    const key = id != null ? String(id) : '';
    const match = leads.find((l) => String(l.id) === key);
    return match?.name || null;
  };

  const handleStatusChange = async (id, newStatus) => {
    try {
      const token = window.localStorage.getItem('offisphere_token');
      if (!token) {
        triggerToast('error', 'Not authenticated');
        return;
      }

      const res = await fetch(`${API_BASE}/api/payments/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ status: newStatus })
      });

      const data = await res.json();

      if (!res.ok) {
        triggerToast('error', data.message || 'Error updating payment');
      } else {
        setPayments(Array.isArray(data) ? data : []);
        triggerToast('success', 'Payment updated');
      }
    } catch (err) {
      console.error('Update payment status error:', err);
      triggerToast('error', 'Error connecting to server');
    }
  };

  const formatDate = (value) =>
    value ? new Date(value).toLocaleDateString() : '—';

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25 }}
      className="space-y-6 bg-gradient-to-br from-slate-50 via-indigo-50/70 to-cyan-50/60 p-1 rounded-3xl"
    >
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-gradient-to-r from-indigo-600 via-purple-600 to-sky-500 text-white text-[11px] font-semibold shadow-sm shadow-indigo-200">
            <span className="h-1.5 w-1.5 rounded-full bg-white/90" />
            <span>Payment log</span>
          </div>
          <div>
            <h1 className="text-xl font-semibold text-slate-900">
              Payments
            </h1>
            <p className="text-sm text-slate-600">
              Track incoming payments against leads.
            </p>
          </div>
        </div>
      </div>

      {/* Record payment */}
      <div className="relative overflow-hidden bg-white/90 rounded-2xl border border-indigo-100/60 shadow-[0_14px_36px_rgba(0,0,0,0.06)] p-4 backdrop-blur">
        <div
          className="absolute inset-y-0 left-0 w-1 bg-gradient-to-b from-indigo-500 via-purple-500 to-cyan-500"
          aria-hidden="true"
        />
        <h2 className="text-sm font-semibold text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 via-purple-600 to-sky-500 mb-3">
          Record payment
        </h2>

        {error && (
          <div className="mb-3 text-xs text-rose-600 bg-rose-50 border border-rose-100 rounded-xl px-3 py-2">
            {error}
          </div>
        )}

        <form
          onSubmit={handleCreate}
          className="grid grid-cols-1 md:grid-cols-6 gap-3 text-sm"
        >
          <div className="md:col-span-2 space-y-1">
            <label className="text-xs text-slate-600">Lead</label>
            <select
              value={form.lead_id}
              onChange={(e) => handleChange('lead_id', e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-xs"
            >
              <option value="">— No lead —</option>
              {leads.map((lead) => (
                <option key={lead.id} value={lead.id}>
                  {lead.name} {lead.company ? `• ${lead.company}` : ''}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-1">
            <label className="text-xs text-slate-600">Amount</label>
            <input
              type="number"
              step="0.01"
              value={form.amount}
              onChange={(e) => handleChange('amount', e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              placeholder="25000"
              required
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs text-slate-600">Currency</label>
            <input
              type="text"
              value={form.currency}
              onChange={(e) => handleChange('currency', e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-xs"
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs text-slate-600">Status</label>
            <select
              value={form.status}
              onChange={(e) => handleChange('status', e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-xs"
            >
              {STATUS_OPTIONS.map((s) => (
                <option key={s.value} value={s.value}>
                  {s.label}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-1">
            <label className="text-xs text-slate-600">Method</label>
            <input
              type="text"
              value={form.method}
              onChange={(e) => handleChange('method', e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              placeholder="UPI / Bank / Card"
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs text-slate-600">
              Paid date (optional)
            </label>
            <input
              type="date"
              value={form.paid_at}
              onChange={(e) => handleChange('paid_at', e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-xs"
            />
          </div>

          <div className="md:col-span-3 space-y-1">
            <label className="text-xs text-slate-600">Reference</label>
            <input
              type="text"
              value={form.reference}
              onChange={(e) => handleChange('reference', e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              placeholder="TXN ID / invoice no"
            />
          </div>

          <div className="md:col-span-3 space-y-1">
            <label className="text-xs text-slate-600">Notes</label>
            <input
              type="text"
              value={form.notes}
              onChange={(e) => handleChange('notes', e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              placeholder="Optional notes"
            />
          </div>

          <div className="md:col-span-6 flex justify-end pt-1">
            <motion.button
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              type="submit"
              disabled={saving}
              className="px-5 py-2 rounded-xl text-sm font-medium text-white bg-gradient-to-r from-indigo-500 to-purple-500 shadow hover:shadow-lg disabled:opacity-60"
            >
              {saving ? 'Saving…' : 'Record payment'}
            </motion.button>
          </div>
        </form>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-2 text-xs">
        {FILTERS.map((f) => {
          const active = f.value === filterStatus;
          return (
            <button
              key={f.value}
              onClick={() => handleStatusFilter(f.value)}
              className={`px-3 py-1.5 rounded-full border transition ${
                active
                  ? 'bg-slate-900 text-white border-slate-900'
                  : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
              }`}
            >
              {f.label}
            </button>
          );
        })}
      </div>

      {/* Payments list */}
      <div className="relative overflow-hidden bg-white rounded-2xl border border-slate-100 shadow-sm p-4">
        <div
          className="absolute inset-y-0 left-0 w-1 bg-gradient-to-b from-indigo-500 via-purple-500 to-cyan-500"
          aria-hidden="true"
        />
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-semibold text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 via-purple-600 to-sky-500">
            Payment history
          </h2>
          {isAdminManager && (
            <span className="text-[11px] text-slate-400">
              Admin / Manager can adjust status
            </span>
          )}
        </div>

        <div className="overflow-x-auto text-sm">
          <table className="min-w-full border-separate border-spacing-y-2">
            <thead className="text-xs text-white">
              <tr className="bg-gradient-to-r from-indigo-600 via-purple-600 to-sky-500">
                <th className="text-left px-3 py-2 font-semibold first:rounded-l-xl">Lead</th>
                <th className="text-left px-3 py-2 font-semibold">Amount</th>
                <th className="text-left px-3 py-2 font-semibold">Method</th>
                <th className="text-left px-3 py-2 font-semibold">Status</th>
                <th className="text-left px-3 py-2 font-semibold">Reference</th>
                <th className="text-left px-3 py-2 font-semibold">Recorded by</th>
                <th className="text-left px-3 py-2 font-semibold">Paid date</th>
                <th className="text-left px-3 py-2 font-semibold last:rounded-r-xl">Created</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td
                    colSpan={8}
                    className="px-3 py-6 text-center text-xs text-slate-400"
                  >
                    Loading payments…
                  </td>
                </tr>
              ) : payments.length === 0 ? (
                <tr>
                  <td
                    colSpan={8}
                    className="px-3 py-6 text-center text-xs text-slate-400"
                  >
                    No payments found.
                  </td>
                </tr>
              ) : (
                payments.map((p, idx) => (
                  <tr
                    key={p.id}
                    className={`rounded-xl shadow-sm ${idx % 2 === 0 ? 'bg-indigo-50/70' : 'bg-slate-50'} hover:bg-indigo-50`}
                  >
                    <td className="px-3 py-2 rounded-l-xl text-slate-900">
                      {p.lead_name || leadNameById(p.lead_id) || '—'}
                    </td>
                    <td className="px-3 py-2 text-xs text-slate-600">
                      {p.amount} {p.currency}
                    </td>
                    <td className="px-3 py-2 text-xs text-slate-600">
                      {p.method || '—'}
                    </td>
                    <td className="px-3 py-2 text-xs">
                      {isAdminManager ? (
                        <select
                          value={p.status}
                          onChange={(e) =>
                            handleStatusChange(p.id, e.target.value)
                          }
                          className="rounded-full border border-indigo-100 bg-white px-3 py-1 text-xs shadow-sm hover:border-indigo-200"
                        >
                          {STATUS_OPTIONS.map((s) => (
                            <option key={s.value} value={s.value}>
                              {s.label}
                            </option>
                          ))}
                        </select>
                      ) : (
                        <span
                          className={`px-3 py-1 rounded-full border text-xs font-medium ${
                            p.status === 'received'
                              ? 'bg-emerald-50 text-emerald-700 border-emerald-100'
                              : p.status === 'pending'
                              ? 'bg-amber-50 text-amber-700 border-amber-100'
                              : p.status === 'failed'
                              ? 'bg-rose-50 text-rose-700 border-rose-100'
                              : 'bg-slate-50 text-slate-700 border-slate-200'
                          }`}
                        >
                          {p.status}
                        </span>
                      )}
                    </td>
                    <td className="px-3 py-2 text-xs text-slate-600">
                      {p.reference || '—'}
                    </td>
                    <td className="px-3 py-2 text-xs text-slate-600">
                      {p.recorded_by_name || '—'}
                    </td>
                    <td className="px-3 py-2 text-xs text-slate-600">
                      {formatDate(p.paid_at)}
                    </td>
                    <td className="px-3 py-2 rounded-r-xl text-xs text-slate-600">
                      {formatDate(p.created_at)}
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
