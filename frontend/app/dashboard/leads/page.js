'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';

const STATUSES = [
  { value: 'all', label: 'All' },
  { value: 'new', label: 'New' },
  { value: 'contacted', label: 'Contacted' },
  { value: 'qualified', label: 'Qualified' },
  { value: 'proposal', label: 'Proposal' },
  { value: 'won', label: 'Won' },
  { value: 'lost', label: 'Lost' }
];

export default function LeadsPage() {
  const [leads, setLeads] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [activeStatus, setActiveStatus] = useState('all');
  const [isAdminManager, setIsAdminManager] = useState(false);

  const [form, setForm] = useState({
    name: '',
    email: '',
    phone: '',
    company: '',
    source: '',
    status: 'new',
    expected_value: '',
    currency: 'INR'
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

  const fetchLeads = async (status = 'all') => {
    try {
      const token = window.localStorage.getItem('offisphere_token');
      if (!token) {
        setError('Not authenticated');
        setLoading(false);
        return;
      }

      const qs = status ? `?status=${status}` : '';
      const res = await fetch(`${API_BASE}/api/leads${qs}`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.message || 'Error fetching leads');
      } else {
        setLeads(Array.isArray(data) ? data : []);
        setError('');
      }
    } catch (err) {
      console.error('Fetch leads error:', err);
      setError('Error connecting to server');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadRoles();
    fetchLeads(activeStatus);
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
        expected_value:
          form.expected_value !== ''
            ? parseFloat(form.expected_value)
            : null
      };

      const res = await fetch(`${API_BASE}/api/leads`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(body)
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.message || 'Error creating lead');
        triggerToast('error', data.message || 'Error creating lead');
      } else {
        setLeads(Array.isArray(data) ? data : []);
        triggerToast('success', 'Lead added to pipeline ✅');
        setForm({
          name: '',
          email: '',
          phone: '',
          company: '',
          source: '',
          status: 'new',
          expected_value: '',
          currency: 'INR'
        });
      }
    } catch (err) {
      console.error('Create lead error:', err);
      setError('Error connecting to server');
      triggerToast('error', 'Error connecting to server');
    } finally {
      setSaving(false);
    }
  };

  const handleStatusFilter = (status) => {
    setActiveStatus(status);
    setLoading(true);
    fetchLeads(status);
  };

  const handleStatusChange = async (id, newStatus) => {
    try {
      const token = window.localStorage.getItem('offisphere_token');
      if (!token) {
        triggerToast('error', 'Not authenticated');
        return;
      }

      const res = await fetch(`${API_BASE}/api/leads/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ status: newStatus })
      });

      const data = await res.json();

      if (!res.ok) {
        triggerToast('error', data.message || 'Error updating lead');
      } else {
        setLeads(Array.isArray(data) ? data : []);
        triggerToast(
          'success',
          newStatus === 'won'
            ? 'Lead marked as WON 🎉'
            : newStatus === 'lost'
            ? 'Lead marked as LOST'
            : 'Lead updated'
        );
      }
    } catch (err) {
      console.error('Update lead status error:', err);
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
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-slate-900">Leads</h1>
          <p className="text-sm text-slate-500">
            Capture and track your sales pipeline.
          </p>
        </div>
      </div>

      {/* Create lead */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4">
        <h2 className="text-sm font-semibold text-slate-900 mb-3">
          Add new lead
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
            <label className="text-xs text-slate-600">Lead name</label>
            <input
              type="text"
              value={form.name}
              onChange={(e) => handleChange('name', e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              placeholder="John Doe"
              required
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs text-slate-600">Email</label>
            <input
              type="email"
              value={form.email}
              onChange={(e) => handleChange('email', e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              placeholder="john@example.com"
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs text-slate-600">Phone</label>
            <input
              type="tel"
              value={form.phone}
              onChange={(e) => handleChange('phone', e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              placeholder="+91 98765 43210"
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs text-slate-600">Company</label>
            <input
              type="text"
              value={form.company}
              onChange={(e) => handleChange('company', e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              placeholder="Acme Pvt Ltd"
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs text-slate-600">Source</label>
            <input
              type="text"
              value={form.source}
              onChange={(e) => handleChange('source', e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              placeholder="Website / Referral / Cold call"
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs text-slate-600">
              Expected value (₹)
            </label>
            <input
              type="number"
              step="0.01"
              value={form.expected_value}
              onChange={(e) =>
                handleChange('expected_value', e.target.value)
              }
              className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              placeholder="50000"
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs text-slate-600">Stage</label>
            <select
              value={form.status}
              onChange={(e) => handleChange('status', e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-xs"
            >
              <option value="new">New</option>
              <option value="contacted">Contacted</option>
              <option value="qualified">Qualified</option>
              <option value="proposal">Proposal</option>
              <option value="won">Won</option>
              <option value="lost">Lost</option>
            </select>
          </div>

          <div className="md:col-span-5" />

          <div className="md:col-span-6 flex justify-end pt-1">
            <motion.button
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              type="submit"
              disabled={saving}
              className="px-5 py-2 rounded-xl text-sm font-medium text-white bg-gradient-to-r from-indigo-500 to-purple-500 shadow hover:shadow-lg disabled:opacity-60"
            >
              {saving ? 'Saving…' : 'Add lead'}
            </motion.button>
          </div>
        </form>
      </div>

      {/* Status filters */}
      <div className="flex flex-wrap gap-2 text-xs">
        {STATUSES.map((s) => {
          const active = s.value === activeStatus;
          return (
            <button
              key={s.value}
              onClick={() => handleStatusFilter(s.value)}
              className={`px-3 py-1.5 rounded-full border transition ${
                active
                  ? 'bg-slate-900 text-white border-slate-900'
                  : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
              }`}
            >
              {s.label}
            </button>
          );
        })}
      </div>

      {/* Leads table */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-semibold text-slate-900">
            Pipeline
          </h2>
          {isAdminManager && (
            <span className="text-[11px] text-slate-400">
              Admin / Manager can move leads between stages
            </span>
          )}
        </div>

        <div className="overflow-x-auto text-sm">
          <table className="min-w-full border-separate border-spacing-y-2">
            <thead>
              <tr className="text-xs text-slate-400">
                <th className="text-left px-3 py-1">Lead</th>
                <th className="text-left px-3 py-1">Contact</th>
                <th className="text-left px-3 py-1">Company</th>
                <th className="text-left px-3 py-1">Source</th>
                <th className="text-left px-3 py-1">Owner</th>
                <th className="text-left px-3 py-1">Value</th>
                <th className="text-left px-3 py-1">Stage</th>
                <th className="text-left px-3 py-1">Created</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td
                    colSpan={8}
                    className="px-3 py-6 text-center text-xs text-slate-400"
                  >
                    Loading leads…
                  </td>
                </tr>
              ) : leads.length === 0 ? (
                <tr>
                  <td
                    colSpan={8}
                    className="px-3 py-6 text-center text-xs text-slate-400"
                  >
                    No leads in this view.
                  </td>
                </tr>
              ) : (
                leads.map((lead) => (
                  <tr
                    key={lead.id}
                    className="bg-slate-50 rounded-xl hover:bg-slate-100"
                  >
                    <td className="px-3 py-2 rounded-l-xl text-slate-900">
                      {lead.name}
                    </td>
                    <td className="px-3 py-2 text-xs text-slate-600">
                      {lead.email || '-'}
                      {lead.phone && (
                        <span className="block text-[11px] text-slate-400">
                          {lead.phone}
                        </span>
                      )}
                    </td>
                    <td className="px-3 py-2 text-xs text-slate-600">
                      {lead.company || '—'}
                    </td>
                    <td className="px-3 py-2 text-xs text-slate-600">
                      {lead.source || '—'}
                    </td>
                    <td className="px-3 py-2 text-xs text-slate-600">
                      {lead.owner_name || '—'}
                    </td>
                    <td className="px-3 py-2 text-xs text-slate-600">
                      {lead.expected_value
                        ? `${lead.expected_value} ${lead.currency || 'INR'}`
                        : '—'}
                    </td>
                    <td className="px-3 py-2 text-xs">
                      {isAdminManager ? (
                        <select
                          value={lead.status}
                          onChange={(e) =>
                            handleStatusChange(lead.id, e.target.value)
                          }
                          className="rounded-full border border-slate-200 bg-white px-3 py-1 text-xs"
                        >
                          <option value="new">New</option>
                          <option value="contacted">Contacted</option>
                          <option value="qualified">Qualified</option>
                          <option value="proposal">Proposal</option>
                          <option value="won">Won</option>
                          <option value="lost">Lost</option>
                        </select>
                      ) : (
                        <span className="px-3 py-1 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-100">
                          {lead.status}
                        </span>
                      )}
                    </td>
                    <td className="px-3 py-2 rounded-r-xl text-xs text-slate-600">
                      {formatDate(lead.created_at)}
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
