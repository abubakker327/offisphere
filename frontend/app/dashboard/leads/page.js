'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';

const API_BASE =
  process.env.NEXT_PUBLIC_API_BASE || 'http://localhost:5000';

const STAGE_OPTIONS = [
  { label: 'Hot', value: 'hot' },
  { label: 'Warm', value: 'warm' },
  { label: 'Cold', value: 'cold' }
];

const apiFetch = async (path, options = {}) => {
  const token =
    typeof window !== 'undefined'
      ? window.localStorage.getItem('offisphere_token')
      : null;

  const headers = {
    'Content-Type': 'application/json',
    ...(options.headers || {}),
    ...(token ? { Authorization: `Bearer ${token}` } : {})
  };

  const res = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers
  });

  const data = await res.json().catch(() => ({}));

  if (!res.ok) {
    const message = data?.message || 'Request failed';
    throw new Error(message);
  }

  return data;
};

const mapApiLeadToUi = (lead) => {
  const stage = (lead.stage || '').toLowerCase();
  return {
    ...lead,
    stage: stage || 'cold',
    expected_value: lead.expected_value ?? lead.value ?? null
  };
};

const getStageLabel = (stage) =>
  STAGE_OPTIONS.find((o) => o.value === stage)?.label || stage;

export default function LeadsPage() {
  const [leads, setLeads] = useState([]);
  const [stageFilter, setStageFilter] = useState('all');
  const [dateRange, setDateRange] = useState({ start: '', end: '' });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [form, setForm] = useState({
    name: '',
    email: '',
    phone: '',
    company: '',
    source: '',
    expected_value: '',
    stage: 'hot'
  });

  const fetchLeads = async (range) => {
    try {
      setLoading(true);
      const appliedRange = range || dateRange;
      const params = new URLSearchParams();

      if (appliedRange?.start) {
        params.set('start_date', appliedRange.start);
      }
      if (appliedRange?.end) {
        params.set('end_date', appliedRange.end);
      }

      const queryString = params.toString()
        ? `?${params.toString()}`
        : '';

      const data = await apiFetch(`/api/leads${queryString}`);
      const mapped = Array.isArray(data)
        ? data.map(mapApiLeadToUi)
        : [];
      setLeads(mapped);
      setError('');
    } catch (err) {
      console.error(err);
      setError('Error fetching leads');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLeads();
  }, []);

  const handleChange = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        name: form.name,
        email: form.email || null,
        phone: form.phone || null,
        company: form.company || null,
        source: form.source || null,
        stage: form.stage,
        expected_value:
          form.expected_value !== ''
            ? Number(form.expected_value)
            : null
      };

      await apiFetch('/api/leads', {
        method: 'POST',
        body: JSON.stringify(payload)
      });

      setForm({
        name: '',
        email: '',
        phone: '',
        company: '',
        source: '',
        expected_value: '',
        stage: 'hot'
      });

      fetchLeads();
    } catch (err) {
      console.error(err);
      setError('Error creating lead');
    }
  };

  const handleDateRangeChange = (field, value) => {
    setDateRange((prev) => ({ ...prev, [field]: value }));
  };

  const applyDateFilter = () => {
    fetchLeads({ ...dateRange });
  };

  const clearDateFilter = () => {
    const cleared = { start: '', end: '' };
    setDateRange(cleared);
    fetchLeads(cleared);
  };

  const filteredLeads =
    stageFilter === 'all'
      ? leads
      : leads.filter((l) => l.stage === stageFilter);

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

      {error && (
        <div className="text-xs text-rose-600 bg-rose-50 border border-rose-100 rounded-xl px-3 py-2">
          {error}
        </div>
      )}

      <form
        onSubmit={handleSubmit}
        className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4"
      >
        <h2 className="text-sm font-semibold text-slate-900 mb-3">
          Add new lead
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-5 gap-3 text-sm">
          <div className="space-y-1">
            <label className="text-xs text-slate-600">Lead name</label>
            <input
              placeholder="Lead name"
              value={form.name}
              onChange={(e) => handleChange('name', e.target.value)}
              required
              className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            />
          </div>
          <div className="space-y-1">
            <label className="text-xs text-slate-600">Email</label>
            <input
              placeholder="Email"
              value={form.email}
              onChange={(e) => handleChange('email', e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            />
          </div>
          <div className="space-y-1">
            <label className="text-xs text-slate-600">Phone</label>
            <input
              placeholder="Phone"
              value={form.phone}
              onChange={(e) => handleChange('phone', e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            />
          </div>
          <div className="space-y-1">
            <label className="text-xs text-slate-600">Company</label>
            <input
              placeholder="Company"
              value={form.company}
              onChange={(e) => handleChange('company', e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            />
          </div>
          <div className="space-y-1">
            <label className="text-xs text-slate-600">Source</label>
            <input
              placeholder="Source"
              value={form.source}
              onChange={(e) => handleChange('source', e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mt-3 text-sm">
          <div className="space-y-1">
            <label className="text-xs text-slate-600">Expected value</label>
            <input
              type="number"
              placeholder="e.g. 50000"
              value={form.expected_value}
              onChange={(e) => handleChange('expected_value', e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs text-slate-600">Stage</label>
            <select
              value={form.stage}
              onChange={(e) => handleChange('stage', e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-xs"
            >
              {STAGE_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-end justify-end">
            <motion.button
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              type="submit"
              className="px-5 py-2 rounded-xl text-sm font-medium text-white bg-gradient-to-r from-indigo-500 to-purple-500 shadow hover:shadow-lg disabled:opacity-60"
            >
              Add lead
            </motion.button>
          </div>
        </div>
      </form>

      <div className="flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-[11px] font-semibold text-slate-700">
            Stage:
          </span>
          {['all', ...STAGE_OPTIONS.map((s) => s.value)].map((s) => {
            const active = s === stageFilter;
            return (
              <button
                key={s}
                type="button"
                onClick={() => setStageFilter(s)}
                className={`px-3 py-1.5 rounded-full border transition ${
                  active
                    ? 'bg-slate-900 text-white border-slate-900'
                    : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                }`}
              >
                {s === 'all' ? 'All' : getStageLabel(s)}
              </button>
            );
          })}
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <span className="text-[11px] font-semibold text-slate-700">
            Created:
          </span>
          <input
            type="date"
            value={dateRange.start}
            onChange={(e) =>
              handleDateRangeChange('start', e.target.value)
            }
            className="px-3 py-1.5 rounded-lg border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-xs"
          />
          <span className="text-slate-400">to</span>
          <input
            type="date"
            value={dateRange.end}
            onChange={(e) =>
              handleDateRangeChange('end', e.target.value)
            }
            className="px-3 py-1.5 rounded-lg border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-xs"
          />
          <button
            type="button"
            onClick={applyDateFilter}
            disabled={loading}
            className="px-3 py-1.5 rounded-lg text-xs font-medium text-white bg-slate-900 disabled:opacity-60 shadow-sm"
          >
            Apply
          </button>
          {(dateRange.start || dateRange.end) && (
            <button
              type="button"
              onClick={clearDateFilter}
              className="px-3 py-1.5 rounded-lg text-xs font-medium text-slate-600 border border-slate-200 hover:bg-slate-50"
            >
              Clear
            </button>
          )}
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-semibold text-slate-900">
            Pipeline
          </h2>
        </div>

        <div className="overflow-x-auto text-sm">
          <table className="min-w-full border-separate border-spacing-y-2">
            <thead>
              <tr className="text-xs text-slate-400">
                <th className="text-left px-3 py-1">Lead</th>
                <th className="text-left px-3 py-1">Company</th>
                <th className="text-left px-3 py-1">Source</th>
                <th className="text-left px-3 py-1">Value</th>
                <th className="text-left px-3 py-1">Stage</th>
                <th className="text-left px-3 py-1">Created</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td
                    colSpan={6}
                    className="px-3 py-6 text-center text-xs text-slate-400"
                  >
                    Loading leads...
                  </td>
                </tr>
              ) : filteredLeads.length === 0 ? (
                <tr>
                  <td
                    colSpan={6}
                    className="px-3 py-6 text-center text-xs text-slate-400"
                  >
                    No leads found.
                  </td>
                </tr>
              ) : (
                filteredLeads.map((lead) => (
                  <tr
                    key={lead.id}
                    className="bg-slate-50 rounded-xl hover:bg-slate-100"
                  >
                    <td className="px-3 py-2 rounded-l-xl text-slate-900">
                      {lead.name || '-'}
                    </td>
                    <td className="px-3 py-2 text-xs text-slate-600">
                      {lead.company || '-'}
                    </td>
                    <td className="px-3 py-2 text-xs text-slate-600">
                      {lead.source || '-'}
                    </td>
                    <td className="px-3 py-2 text-xs text-slate-600">
                      {lead.expected_value != null
                        ? Number(lead.expected_value).toLocaleString()
                        : '-'}
                    </td>
                    <td className="px-3 py-2 text-xs">
                      <span
                        className={`px-3 py-1 rounded-full text-xs font-medium ${
                          lead.stage === 'hot'
                            ? 'bg-red-50 text-red-700 border border-red-100'
                            : lead.stage === 'warm'
                            ? 'bg-amber-50 text-amber-700 border border-amber-100'
                            : 'bg-sky-50 text-sky-700 border border-sky-100'
                        }`}
                      >
                        {getStageLabel(lead.stage)}
                      </span>
                    </td>
                    <td className="px-3 py-2 rounded-r-xl text-xs text-slate-500">
                      {lead.created_at
                        ? new Date(lead.created_at).toLocaleDateString()
                        : '-'}
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
