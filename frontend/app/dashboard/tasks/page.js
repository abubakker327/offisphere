'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';

export default function TasksPage() {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [form, setForm] = useState({
    title: '',
    description: '',
    status: 'pending',
    priority: 'medium',
    due_date: ''
  });

  const API_BASE = 'http://localhost:5000';

  const triggerToast = (type, message) => {
    window.dispatchEvent(
      new CustomEvent('offisphere-toast', {
        detail: { type, message }
      })
    );
  };

  const fetchTasks = async () => {
    try {
      const token = window.localStorage.getItem('offisphere_token');
      if (!token) {
        setError('Not authenticated');
        setLoading(false);
        return;
      }

      const res = await fetch(`${API_BASE}/api/tasks`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.message || 'Error fetching tasks');
      } else {
        setTasks(Array.isArray(data) ? data : []);
        setError('');
      }
    } catch (err) {
      console.error('Fetch tasks error:', err);
      setError('Error connecting to server');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTasks();
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

      const res = await fetch(`${API_BASE}/api/tasks`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(form)
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.message || 'Error creating task');
        triggerToast('error', data.message || 'Error creating task');
      } else {
        setTasks(Array.isArray(data) ? data : []);
        triggerToast('success', 'Task created successfully ✅');
        setForm({
          title: '',
          description: '',
          status: 'pending',
          priority: 'medium',
          due_date: ''
        });
      }
    } catch (err) {
      console.error('Create task error:', err);
      setError('Error connecting to server');
      triggerToast('error', 'Error connecting to server');
    } finally {
      setSaving(false);
    }
  };

  const handleStatusChange = async (taskId, newStatus) => {
    try {
      const token = window.localStorage.getItem('offisphere_token');
      if (!token) {
        triggerToast('error', 'Not authenticated');
        return;
      }

      const res = await fetch(`${API_BASE}/api/tasks/${taskId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ status: newStatus })
      });

      const data = await res.json();

      if (!res.ok) {
        triggerToast('error', data.message || 'Error updating task');
      } else {
        setTasks(Array.isArray(data) ? data : []);
        triggerToast('success', 'Task updated');
      }
    } catch (err) {
      console.error('Update task error:', err);
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
        <h1 className="text-xl font-semibold text-slate-900">Tasks</h1>
        <p className="text-sm text-slate-500">
          Create and track tasks assigned to your team.
        </p>
      </div>

      {/* Create task */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4">
        <h2 className="text-sm font-semibold text-slate-900 mb-3">
          Create task
        </h2>

        {error && (
          <div className="mb-3 text-xs text-rose-600 bg-rose-50 border border-rose-100 rounded-xl px-3 py-2">
            {error}
          </div>
        )}

        <form
          onSubmit={handleCreate}
          className="grid grid-cols-1 md:grid-cols-5 gap-3 text-sm"
        >
          <div className="md:col-span-2 space-y-1">
            <label className="text-xs text-slate-600">Title</label>
            <input
              type="text"
              value={form.title}
              onChange={(e) => handleChange('title', e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              placeholder="Prepare monthly report"
              required
            />
          </div>

          <div className="md:col-span-2 space-y-1">
            <label className="text-xs text-slate-600">
              Description
            </label>
            <input
              type="text"
              value={form.description}
              onChange={(e) =>
                handleChange('description', e.target.value)
              }
              className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              placeholder="What needs to be done?"
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs text-slate-600">Due date</label>
            <input
              type="date"
              value={form.due_date}
              onChange={(e) =>
                handleChange('due_date', e.target.value)
              }
              className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-xs"
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs text-slate-600">Status</label>
            <select
              value={form.status}
              onChange={(e) =>
                handleChange('status', e.target.value)
              }
              className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-xs"
            >
              <option value="pending">Pending</option>
              <option value="in_progress">In progress</option>
              <option value="completed">Completed</option>
            </select>
          </div>

          <div className="space-y-1">
            <label className="text-xs text-slate-600">Priority</label>
            <select
              value={form.priority}
              onChange={(e) =>
                handleChange('priority', e.target.value)
              }
              className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-xs"
            >
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
            </select>
          </div>

          <div className="md:col-span-5 flex justify-end pt-1">
            <motion.button
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              type="submit"
              disabled={saving}
              className="px-5 py-2 rounded-xl text-sm font-medium text-white bg-gradient-to-r from-indigo-500 to-purple-500 shadow hover:shadow-lg disabled:opacity-60"
            >
              {saving ? 'Saving…' : 'Create task'}
            </motion.button>
          </div>
        </form>
      </div>

      {/* Task list */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-semibold text-slate-900">
            Tasks list
          </h2>
        </div>

        <div className="overflow-x-auto text-sm">
          <table className="min-w-full border-separate border-spacing-y-2">
            <thead>
              <tr className="text-xs text-slate-400">
                <th className="text-left px-3 py-1">Title</th>
                <th className="text-left px-3 py-1">Description</th>
                <th className="text-left px-3 py-1">Status</th>
                <th className="text-left px-3 py-1">Priority</th>
                <th className="text-left px-3 py-1">Due date</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td
                    colSpan={5}
                    className="px-3 py-6 text-center text-xs text-slate-400"
                  >
                    Loading tasks…
                  </td>
                </tr>
              ) : tasks.length === 0 ? (
                <tr>
                  <td
                    colSpan={5}
                    className="px-3 py-6 text-center text-xs text-slate-400"
                  >
                    No tasks found.
                  </td>
                </tr>
              ) : (
                tasks.map((task) => (
                  <tr
                    key={task.id}
                    className="bg-slate-50 rounded-xl hover:bg-slate-100"
                  >
                    <td className="px-3 py-2 rounded-l-xl text-slate-900">
                      {task.title}
                    </td>
                    <td className="px-3 py-2 text-xs text-slate-600">
                      {task.description || '—'}
                    </td>
                    <td className="px-3 py-2 text-xs">
                      <select
                        value={task.status}
                        onChange={(e) =>
                          handleStatusChange(task.id, e.target.value)
                        }
                        className="rounded-full border border-slate-200 bg-white px-3 py-1 text-xs"
                      >
                        <option value="pending">Pending</option>
                        <option value="in_progress">In progress</option>
                        <option value="completed">Completed</option>
                      </select>
                    </td>
                    <td className="px-3 py-2 text-xs text-slate-600">
                      {task.priority || '—'}
                    </td>
                    <td className="px-3 py-2 rounded-r-xl text-xs text-slate-600">
                      {formatDate(task.due_date)}
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
