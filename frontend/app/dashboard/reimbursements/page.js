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
        triggerToast('success', 'Reimbursement submitted.');
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
    value ? new Date(value).toLocaleDateString() : '--';

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25 }}
      className="space-y-6 rounded-3xl bg-slate-50/70 p-4 md:p-6"
    >
      <div className="space-y-3">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-violet-600 text-white text-xs font-semibold shadow-[0_8px_20px_rgba(124,58,237,0.25)]">
          <span>Expense desk</span>
        </div>
        <div>
          <h1 className="text-3xl font-semibold text-slate-900">
            Reimbursements
          </h1>
          <p className="text-sm text-slate-500">
            Submit and review expense reimbursements.
          </p>
        </div>
      </div>

      {/* Create reimbursement */}
      <div className="rounded-3xl bg-white border border-slate-100 shadow-[0_20px_40px_rgba(15,23,42,0.08)] p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="h-10 w-10 rounded-2xl bg-violet-600 text-white flex items-center justify-center">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-5 w-5"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <rect x="2" y="5" width="20" height="14" rx="2" />
              <circle cx="12" cy="12" r="3" />
              <path d="M7 10h.01M17 14h.01" />
            </svg>
          </div>
          <div>
            <h2 className="text-lg font-semibold text-slate-900">
              Submit reimbursement
            </h2>
            <p className="text-xs text-slate-500">
              Log expense details and upload a receipt link.
            </p>
          </div>
        </div>

        {error && (
          <div className="mb-3 text-xs text-rose-600 bg-rose-50 border border-rose-100 rounded-xl px-3 py-2">
            {error}
          </div>
        )}

        <form
          onSubmit={handleCreate}
          className="grid grid-cols-1 md:grid-cols-6 gap-4 text-sm"
        >
          <div className="md:col-span-2 space-y-1">
            <label className="text-xs text-slate-600">Title</label>
            <input
              type="text"
              value={form.title}
              onChange={(e) => handleChange('title', e.target.value)}
              className="w-full px-4 py-3 rounded-2xl border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent"
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
              className="w-full px-4 py-3 rounded-2xl border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent"
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
              className="w-full px-4 py-3 rounded-2xl border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent"
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
              className="w-full px-4 py-3 rounded-2xl border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent text-xs"
              required
            />
          </div>

          <div className="md:col-span-3 space-y-1">
            <label className="text-xs text-slate-600">Notes</label>
            <input
              type="text"
              value={form.notes}
              onChange={(e) => handleChange('notes', e.target.value)}
              className="w-full px-4 py-3 rounded-2xl border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent"
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
              className="w-full px-4 py-3 rounded-2xl border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent"
              placeholder="Link to uploaded receipt"
            />
          </div>

          <div className="md:col-span-6 flex justify-end pt-1">
            <motion.button
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              type="submit"
              disabled={saving}
              className="px-5 py-2.5 rounded-2xl text-sm font-semibold text-white bg-violet-600 shadow-lg shadow-violet-300/40 hover:bg-violet-700 disabled:opacity-60"
            >
              {saving ? 'Submitting...' : 'Submit reimbursement'}
            </motion.button>
          </div>
        </form>
      </div>

      {/* List */}
      <div className="rounded-3xl bg-white border border-slate-100 shadow-[0_18px_40px_rgba(15,23,42,0.08)]">
        <div className="flex flex-wrap items-center justify-between gap-4 px-6 py-4 border-b border-slate-100">
          <div>
            <h2 className="text-lg font-semibold text-slate-900">
              Reimbursement list
            </h2>
            <p className="text-xs text-slate-500">
              {reimbursements.length} requests
            </p>
          </div>
          {isAdminOrManager && (
            <span className="text-[11px] text-slate-500">
              Admins or managers can update status.
            </span>
          )}
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead className="bg-slate-50 text-xs text-slate-500 uppercase tracking-wider">
              <tr>
                <th className="text-left px-6 py-3 font-semibold">Employee</th>
                <th className="text-left px-6 py-3 font-semibold">Title</th>
                <th className="text-left px-6 py-3 font-semibold">Category</th>
                <th className="text-left px-6 py-3 font-semibold">Amount</th>
                <th className="text-left px-6 py-3 font-semibold">Date</th>
                <th className="text-left px-6 py-3 font-semibold">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td
                    colSpan={6}
                    className="px-6 py-8 text-center text-xs text-slate-400"
                  >
                    Loading reimbursements...
                  </td>
                </tr>
              ) : reimbursements.length === 0 ? (
                <tr>
                  <td
                    colSpan={6}
                    className="px-6 py-8 text-center text-xs text-slate-400"
                  >
                    No reimbursements found.
                  </td>
                </tr>
              ) : (
                reimbursements.map((r) => (
                  <tr
                    key={r.id}
                    className="hover:bg-slate-50"
                  >
                    <td className="px-6 py-4 text-slate-900">
                      {r.employee_name || '--'}
                    </td>
                    <td className="px-6 py-4 text-xs text-slate-700">
                      {r.title}
                    </td>
                    <td className="px-6 py-4 text-xs text-slate-600">
                      {r.category}
                    </td>
                    <td className="px-6 py-4 text-xs text-slate-600">
                      {r.amount} {r.currency}
                    </td>
                    <td className="px-6 py-4 text-xs text-slate-600">
                      {formatDate(r.expense_date)}
                    </td>
                    <td className="px-6 py-4 text-xs">
                      {isAdminOrManager ? (
                        <select
                          value={r.status}
                          onChange={(e) =>
                            handleStatusChange(r.id, e.target.value)
                          }
                          className="rounded-full border border-slate-200 bg-white px-3 py-1 text-xs shadow-sm hover:border-violet-200"
                        >
                          <option value="pending">Pending</option>
                          <option value="approved">Approved</option>
                          <option value="rejected">Rejected</option>
                          <option value="paid">Paid</option>
                        </select>
                      ) : (
                        <span className="px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-100 font-medium">
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
