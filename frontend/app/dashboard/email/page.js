'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';

const API_BASE =
  process.env.NEXT_PUBLIC_API_BASE || 'http://localhost:5000';

export default function EmailPage() {
  const [templates, setTemplates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [saving, setSaving] = useState(false);
  const [editingId, setEditingId] = useState(null);

  const [form, setForm] = useState({
    template_key: '',
    name: '',
    subject: '',
    body: '',
    is_active: true
  });

  const fetchTemplates = async () => {
    try {
      setLoading(true);
      const token = window.localStorage.getItem('offisphere_token');
      if (!token) {
        setError('Not authenticated');
        setLoading(false);
        return;
      }

      const res = await fetch(`${API_BASE}/api/email/templates`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.message || 'Error fetching email templates');
      } else {
        setTemplates(data || []);
        setError('');
      }
    } catch (err) {
      console.error('Fetch email templates error:', err);
      setError('Error connecting to server');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTemplates();
  }, []);

  const resetForm = () => {
    setEditingId(null);
    setForm({
      template_key: '',
      name: '',
      subject: '',
      body: '',
      is_active: true
    });
  };

  const handleEditClick = (tpl) => {
    setEditingId(tpl.id);
    setForm({
      template_key: tpl.template_key,
      name: tpl.name,
      subject: tpl.subject,
      body: tpl.body,
      is_active: tpl.is_active
    });
  };

  const handleChange = (field, value) => {
    setForm((f) => ({ ...f, [field]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!form.template_key || !form.name || !form.subject || !form.body) {
      setError('All fields except Active toggle are required');
      return;
    }

    try {
      setSaving(true);
      const token = window.localStorage.getItem('offisphere_token');
      const isEditing = !!editingId;

      const url = isEditing
        ? `${API_BASE}/api/email/templates/${editingId}`
        : `${API_BASE}/api/email/templates`;
      const method = isEditing ? 'PUT' : 'POST';

      const body = {
        template_key: form.template_key,
        name: form.name,
        subject: form.subject,
        body: form.body,
        is_active: form.is_active
      };

      // backend ignores template_key on update, that's fine
      const res = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(body)
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.message || 'Error saving email template');
      } else {
        resetForm();
        await fetchTemplates();
      }
    } catch (err) {
      console.error('Save email template error:', err);
      setError('Error connecting to server');
    } finally {
      setSaving(false);
    }
  };

  const formatDate = (value) =>
    value ? new Date(value).toLocaleString() : '-';

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25 }}
      className="space-y-6 rounded-3xl bg-slate-50/70 p-4 md:p-6"
    >
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-violet-600 text-white text-xs font-semibold shadow-[0_8px_20px_rgba(124,58,237,0.25)]">
            <span>Template studio</span>
          </div>
          <div>
            <h1 className="text-3xl font-semibold text-slate-900">
              Email templates
            </h1>
            <p className="text-sm text-slate-500">
              Manage subjects and bodies for automated emails like leaves,
              tasks and payroll.
            </p>
          </div>
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="bg-rose-50 border border-rose-100 text-rose-700 text-xs rounded-2xl px-4 py-3">
          {error}
        </div>
      )}

      {/* Layout: left = list, right = form */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Templates list */}
        <motion.div
          whileHover={{ y: -2 }}
          className="rounded-3xl bg-white border border-slate-100 shadow-[0_18px_40px_rgba(15,23,42,0.08)] lg:col-span-2"
        >
          <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
            <h2 className="text-base font-semibold text-slate-900">
              Templates
            </h2>
          </div>

          {loading ? (
            <div className="py-6 text-center text-xs text-slate-400">
              Loading templates
            </div>
          ) : templates.length === 0 ? (
            <div className="py-6 text-center text-xs text-slate-400">
              No templates yet. Create your first one on the right.
            </div>
          ) : (
            <div className="space-y-2 text-sm px-6 py-4">
              {templates.map((tpl) => (
                <button
                  key={tpl.id}
                  type="button"
                  onClick={() => handleEditClick(tpl)}
                  className={`w-full text-left px-4 py-3 rounded-2xl border ${
                    editingId === tpl.id
                      ? 'border-violet-200 bg-violet-50'
                      : 'border-slate-100 bg-white hover:bg-slate-50'
                  } transition`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <div>
                      <p className="text-sm font-medium text-slate-900">
                        {tpl.name}
                      </p>
                      <p className="text-[11px] text-slate-400">
                        Key: {tpl.template_key}
                      </p>
                      <p className="text-[11px] text-slate-500 mt-1 line-clamp-1">
                        {tpl.subject}
                      </p>
                    </div>
                    <div className="text-right text-[11px] text-slate-400">
                      <div
                        className={`px-2 py-0.5 rounded-full border ${
                          tpl.is_active
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-100'
                            : 'bg-slate-100 text-slate-600 border-slate-200'
                        }`}
                      >
                        {tpl.is_active ? 'Active' : 'Inactive'}
                      </div>
                      <div className="mt-1">
                        {formatDate(tpl.updated_at)}
                      </div>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}
        </motion.div>

        {/* Form */}
        <motion.div
          whileHover={{ y: -2 }}
          className="rounded-3xl bg-white border border-slate-100 shadow-[0_20px_40px_rgba(15,23,42,0.08)] p-6"
        >
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-base font-semibold text-slate-900">
              {editingId ? 'Edit template' : 'New template'}
            </h2>
            {editingId && (
              <button
                type="button"
                onClick={resetForm}
                className="text-xs text-slate-400 hover:text-slate-600"
              >
                + New template
              </button>
            )}
          </div>

          <form
            onSubmit={handleSubmit}
            className="space-y-3 text-sm"
          >
            <div className="space-y-1">
              <label className="text-xs text-slate-600">
                Template key
              </label>
              <input
                type="text"
                value={form.template_key}
                onChange={(e) =>
                  handleChange('template_key', e.target.value)
                }
                placeholder="leave_approved, task_assigned, payroll_payslip"
                className="w-full px-4 py-3 rounded-2xl border border-slate-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent"
                disabled={!!editingId} // cannot change key on edit
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs text-slate-600">Name</label>
              <input
                type="text"
                value={form.name}
                onChange={(e) => handleChange('name', e.target.value)}
                placeholder="Leave approved (employee)"
                className="w-full px-4 py-3 rounded-2xl border border-slate-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs text-slate-600">Subject</label>
              <input
                type="text"
                value={form.subject}
                onChange={(e) =>
                  handleChange('subject', e.target.value)
                }
                placeholder="Your leave request has been approved"
                className="w-full px-4 py-3 rounded-2xl border border-slate-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs text-slate-600">
                Body (supports plain text, use variables like
                {' {{name}} '}later)
              </label>
              <textarea
                rows={5}
                value={form.body}
                onChange={(e) => handleChange('body', e.target.value)}
                placeholder={`Hi {{name}},\n\nYour leave from {{from_date}} to {{to_date}} has been approved.\n\nThanks,\nOffisphere`}
                className="w-full px-4 py-3 rounded-2xl border border-slate-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent resize-none"
              />
            </div>

            <div className="flex items-center justify-between pt-1">
              <label className="flex items-center gap-2 text-xs text-slate-600 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={form.is_active}
                  onChange={(e) =>
                    handleChange('is_active', e.target.checked)
                  }
                  className="h-3.5 w-3.5 rounded border border-slate-300 text-violet-600 focus:ring-0 focus:outline-none"
                />
                <span>Active</span>
              </label>

              <motion.button
                type="submit"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.97 }}
                disabled={saving}
                className="px-5 py-2 rounded-2xl bg-violet-600 text-white text-xs font-medium shadow-lg shadow-violet-300/50 hover:bg-violet-700 disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {saving
                  ? editingId
                    ? 'Updating'
                    : 'Creating'
                  : editingId
                  ? 'Update template'
                  : 'Create template'}
              </motion.button>
            </div>
          </form>
        </motion.div>
      </div>
    </motion.div>
  );
}

