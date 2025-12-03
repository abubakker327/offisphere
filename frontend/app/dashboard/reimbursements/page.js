'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';

export default function ReimbursementsPage() {
  const [reimbursements, setReimbursements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [isAdminOrManager, setIsAdminOrManager] = useState(false);

  const [form, setForm] = useState({
    title: '',
    category: '',
    amount: '',
    currency: 'INR',
    expense_date: '',
    notes: '',
    receipt_url: ''
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
      setIsAdminOrManager(flag);
    } catch {
      setIsAdminOrManager(false);
    }
  };

  const fetchReimbursements = async () => {
    try {
      const token = window.localStorage.getItem('offisphere_token');
      if (!token) {
        setError('Not authenticated');
        setLoading(false);
        return;
      }

      const res = await fetch(`${API_BASE}/api/reimbursements`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.message || 'Error fetching reimbursements');
      } else {
        setReimbursements(Array.isArray(data) ? data : []);
        setError('');
      }
    } catch (err) {
      console.error('Fetch reimbursements error:', err);
      setError('Error connecting to server');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadRoles();
    fetchReimbursements();
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

      const res = await fetch(`${API_BASE}/api/reimbursements`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(form)
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.message || 'Error creating reimbursement');
        triggerToast('error', data.message || 'Error creating reimbursement');
      } else {
        setReimbursements(Array.isArray(data) ? data : []);
        triggerToast('success', 'Reimbursement submitted ✅');
        setForm({
          title: '',
          category: '',
          amount: '',
          currency: 'INR',
          expense_date: '',
          notes: '',
          receipt_url: ''
        });
      }
    } catch (err) {
      console.error('Create reimbursement error:', err);
      setError('Error connecting to server');
      triggerToast('error', 'Error connecting to server');
    } finally {
      setSaving(false);
    }
  };

  const handleStatusChange = async (id, newStatus) => {
    try {
      const token = window.localStorage.getItem('offisphere_token');
      if (!token) {
        triggerToast('error', 'Not authenticated');
        return;
      }

      const res = await fetch(`${API_BASE}/api/reimbursements/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ status: newStatus })
      });

      const data = await res.json();

      if (!res.ok) {
        triggerToast('error', data.message || 'Error updating status');
      } else {
        setReimbursements(Array.isArray(data) ? data : []);
        triggerToast('success', 'Reimbursement updated');
      }
    } catch (err) {
      console.error('Update reimbursement error:', err);
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
      className="space-y-6"
    >
      <div>
        <h1 className="text-xl font-semibold text-slate-900">
          Reimbursements
        </h1>
        <p className="text-sm text-slate-500">
          Submit and review expense reimbursements.
        </p>
      </div>

      {/* Create reimbursement */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4">
        <h2 className="text-sm font-semibold text-slate-900 mb-3">
          Submit reimbursement
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
            <label className="text-xs text-slate-600">Title</label>
            <input
              type="text"
              value={form.title}
              onChange={(e) => handleChange('title', e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              placeholder="Taxi to client meeting"
              required
            />
          </div>

          <div className="md:col-span-2 space-y-1">
            <label className="text-xs text-slate-600">Category</label>
            <input
              type="text"
              value={form.category}
              onChange={(e) => handleChange('category', e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              placeholder="Travel / Food / Software"
              required
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs text-slate-600">Amount</label>
            <input
              type="number"
              step="0.01"
              value={form.amount}
              onChange={(e) => handleChange('amount', e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              placeholder="1500"
              required
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs text-slate-600">Date</label>
            <input
              type="date"
              value={form.expense_date}
              onChange={(e) =>
                handleChange('expense_date', e.target.value)
              }
              className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-xs"
              required
            />
          </div>

          <div className="md:col-span-3 space-y-1">
            <label className="text-xs text-slate-600">Notes</label>
            <input
              type="text"
              value={form.notes}
              onChange={(e) => handleChange('notes', e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              placeholder="Optional description"
            />
          </div>

          <div className="md:col-span-3 space-y-1">
            <label className="text-xs text-slate-600">
              Receipt URL (optional)
            </label>
            <input
              type="text"
              value={form.receipt_url}
              onChange={(e) =>
                handleChange('receipt_url', e.target.value)
              }
              className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              placeholder="Link to uploaded receipt"
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
              {saving ? 'Submitting…' : 'Submit reimbursement'}
            </motion.button>
          </div>
        </form>
      </div>

      {/* List */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-semibold text-slate-900">
            Reimbursement list
          </h2>
          {isAdminOrManager && (
            <span className="text-[11px] text-slate-400">
              Admin / Manager can change status
            </span>
          )}
        </div>

        <div className="overflow-x-auto text-sm">
          <table className="min-w-full border-separate border-spacing-y-2">
            <thead>
              <tr className="text-xs text-slate-400">
                <th className="text-left px-3 py-1">Employee</th>
                <th className="text-left px-3 py-1">Title</th>
                <th className="text-left px-3 py-1">Category</th>
                <th className="text-left px-3 py-1">Amount</th>
                <th className="text-left px-3 py-1">Date</th>
                <th className="text-left px-3 py-1">Status</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td
                    colSpan={6}
                    className="px-3 py-6 text-center text-xs text-slate-400"
                  >
                    Loading reimbursements…
                  </td>
                </tr>
              ) : reimbursements.length === 0 ? (
                <tr>
                  <td
                    colSpan={6}
                    className="px-3 py-6 text-center text-xs text-slate-400"
                  >
                    No reimbursements found.
                  </td>
                </tr>
              ) : (
                reimbursements.map((r) => (
                  <tr
                    key={r.id}
                    className="bg-slate-50 rounded-xl hover:bg-slate-100"
                  >
                    <td className="px-3 py-2 rounded-l-xl text-slate-900">
                      {r.employee_name || '—'}
                    </td>
                    <td className="px-3 py-2 text-xs text-slate-700">
                      {r.title}
                    </td>
                    <td className="px-3 py-2 text-xs text-slate-600">
                      {r.category}
                    </td>
                    <td className="px-3 py-2 text-xs text-slate-600">
                      {r.amount} {r.currency}
                    </td>
                    <td className="px-3 py-2 text-xs text-slate-600">
                      {formatDate(r.expense_date)}
                    </td>
                    <td className="px-3 py-2 rounded-r-xl text-xs">
                      {isAdminOrManager ? (
                        <select
                          value={r.status}
                          onChange={(e) =>
                            handleStatusChange(r.id, e.target.value)
                          }
                          className="rounded-full border border-slate-200 bg-white px-3 py-1 text-xs"
                        >
                          <option value="pending">Pending</option>
                          <option value="approved">Approved</option>
                          <option value="rejected">Rejected</option>
                          <option value="paid">Paid</option>
                        </select>
                      ) : (
                        <span className="px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-100">
                          {r.status}
                        </span>
                      )}
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
