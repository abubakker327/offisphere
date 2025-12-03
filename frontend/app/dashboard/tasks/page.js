'use client';

import { useEffect, useState } from 'react';

export default function TasksPage() {
  const [tasks, setTasks] = useState([]);
  const [users, setUsers] = useState([]);
  const [roles, setRoles] = useState([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState('');
  const [form, setForm] = useState({
    title: '',
    description: '',
    assignee_id: '',
    priority: 'medium',
    due_date: ''
  });

  const [statusSavingId, setStatusSavingId] = useState(null);

  const isAdminOrManager =
    roles.includes('admin') || roles.includes('manager');

  useEffect(() => {
    // Load roles from localStorage
    if (typeof window !== 'undefined') {
      const rolesStr = window.localStorage.getItem('offisphere_roles');
      if (rolesStr) {
        try {
          const parsed = JSON.parse(rolesStr);
          if (Array.isArray(parsed)) {
            setRoles(parsed);
          }
        } catch {
          setRoles([]);
        }
      }
    }
  }, []);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const token = window.localStorage.getItem('offisphere_token');
        if (!token) {
          setError('Not authenticated');
          setLoading(false);
          return;
        }

        // Always fetch tasks
        const tasksRes = await fetch('http://localhost:5000/api/tasks', {
          headers: { Authorization: `Bearer ${token}` }
        });
        const tasksData = await tasksRes.json();

        if (!tasksRes.ok) {
          setError(tasksData.message || 'Error fetching tasks');
        } else {
          setTasks(tasksData);
          setError('');
        }

        // Only admin/manager need full user list for assignment
        if (isAdminOrManager) {
          const usersRes = await fetch('http://localhost:5000/api/users', {
            headers: { Authorization: `Bearer ${token}` }
          });
          const usersData = await usersRes.json();

          if (usersRes.ok && Array.isArray(usersData)) {
            setUsers(usersData);
          }
        }
      } catch (err) {
        console.error('Tasks fetch error:', err);
        setError('Error fetching tasks');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [isAdminOrManager]);

  const handleFormChange = (field, value) => {
    setForm((prev) => ({
      ...prev,
      [field]: value
    }));
  };

  const handleCreateTask = async (e) => {
    e.preventDefault();
    setCreateError('');
    setCreating(true);

    try {
      const token = window.localStorage.getItem('offisphere_token');
      if (!token) {
        setCreateError('Not authenticated');
        setCreating(false);
        return;
      }

      const res = await fetch('http://localhost:5000/api/tasks', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(form)
      });

      const data = await res.json();

      if (!res.ok) {
        setCreateError(data.message || 'Error creating task');
        setCreating(false);
        return;
      }

      setTasks(data);
      setForm({
        title: '',
        description: '',
        assignee_id: '',
        priority: 'medium',
        due_date: ''
      });
      setCreateError('');
    } catch (err) {
      console.error('Create task error:', err);
      setCreateError('Error creating task');
    } finally {
      setCreating(false);
    }
  };

  const handleStatusChange = async (taskId, newStatus) => {
    setStatusSavingId(taskId);
    try {
      const token = window.localStorage.getItem('offisphere_token');
      if (!token) {
        setError('Not authenticated');
        setStatusSavingId(null);
        return;
      }

      const res = await fetch(
        `http://localhost:5000/api/tasks/${taskId}/status`,
        {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`
          },
          body: JSON.stringify({ status: newStatus })
        }
      );

      const data = await res.json();

      if (!res.ok) {
        setError(data.message || 'Error updating status');
        setStatusSavingId(null);
        return;
      }

      setTasks(data);
      setError('');
    } catch (err) {
      console.error('Update status error:', err);
      setError('Error updating status');
    } finally {
      setStatusSavingId(null);
    }
  };

  const formatDate = (value) => {
    if (!value) return '—';
    return new Date(value).toLocaleDateString();
  };

  const formatCreated = (value) => {
    if (!value) return '—';
    const d = new Date(value);
    return d.toLocaleString();
  };

  const statusBadge = (status) => {
    const base =
      'inline-flex items-center px-2 py-0.5 rounded-full text-[11px] border';
    switch (status) {
      case 'todo':
        return `${base} bg-slate-50 text-slate-700 border-slate-200`;
      case 'in_progress':
        return `${base} bg-sky-50 text-sky-700 border-sky-200`;
      case 'done':
        return `${base} bg-emerald-50 text-emerald-700 border-emerald-200`;
      case 'blocked':
        return `${base} bg-rose-50 text-rose-700 border-rose-200`;
      default:
        return `${base} bg-slate-50 text-slate-600 border-slate-200`;
    }
  };

  const priorityBadge = (priority) => {
    const base =
      'inline-flex items-center px-2 py-0.5 rounded-full text-[11px] border';
    switch (priority) {
      case 'high':
        return `${base} bg-rose-50 text-rose-700 border-rose-200`;
      case 'medium':
        return `${base} bg-amber-50 text-amber-700 border-amber-200`;
      case 'low':
        return `${base} bg-emerald-50 text-emerald-700 border-emerald-200`;
      default:
        return `${base} bg-slate-50 text-slate-600 border-slate-200`;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold text-slate-900">
            Tasks
          </h1>
          <p className="text-sm text-slate-500">
            Track and manage work across your team.
          </p>
        </div>
      </div>

      {/* Create task form (only for admin/manager) */}
      {isAdminOrManager && (
        <div className="rounded-2xl bg-white border border-slate-100 shadow-sm p-4">
          <h2 className="text-sm font-semibold text-slate-900 mb-3">
            Create new task
          </h2>

          {createError && (
            <div className="mb-3 text-xs text-red-600 bg-red-50 border border-red-100 rounded-xl px-3 py-2">
              {createError}
            </div>
          )}

          <form
            onSubmit={handleCreateTask}
            className="grid grid-cols-1 md:grid-cols-4 gap-3 text-sm"
          >
            <div className="space-y-1 md:col-span-2">
              <label className="text-xs text-slate-600">Title</label>
              <input
                type="text"
                value={form.title}
                onChange={(e) =>
                  handleFormChange('title', e.target.value)
                }
                className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                placeholder="Design dashboard, fix bug #123..."
                required
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs text-slate-600">
                Assignee
              </label>
              <select
                value={form.assignee_id}
                onChange={(e) =>
                  handleFormChange('assignee_id', e.target.value)
                }
                className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              >
                <option value="">Unassigned</option>
                {users.map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.full_name || u.email}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1">
              <label className="text-xs text-slate-600">
                Priority &amp; Due
              </label>
              <div className="flex gap-2">
                <select
                  value={form.priority}
                  onChange={(e) =>
                    handleFormChange('priority', e.target.value)
                  }
                  className="flex-1 px-3 py-2 rounded-xl border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-xs"
                >
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                </select>
                <input
                  type="date"
                  value={form.due_date}
                  onChange={(e) =>
                    handleFormChange('due_date', e.target.value)
                  }
                  className="flex-1 px-3 py-2 rounded-xl border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-xs"
                />
              </div>
            </div>

            <div className="space-y-1 md:col-span-4">
              <label className="text-xs text-slate-600">
                Description
              </label>
              <textarea
                value={form.description}
                onChange={(e) =>
                  handleFormChange('description', e.target.value)
                }
                rows={2}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-xs resize-none"
                placeholder="Add more context, acceptance criteria, links..."
              />
            </div>

            <div className="md:col-span-4 flex justify-end">
              <button
                type="submit"
                disabled={creating}
                className="px-5 py-2 rounded-xl text-sm font-medium text-white bg-gradient-to-r from-indigo-500 to-purple-500 shadow hover:opacity-90 disabled:opacity-60"
              >
                {creating ? 'Creating...' : 'Create task'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Tasks table */}
      <div className="rounded-2xl bg-white border border-slate-100 shadow-sm p-4">
        <h2 className="text-sm font-semibold text-slate-900 mb-3">
          Tasks
        </h2>

        {error && (
          <div className="mb-3 text-xs text-red-600 bg-red-50 border border-red-100 rounded-xl px-3 py-2">
            {error}
          </div>
        )}

        <div className="overflow-x-auto text-sm">
          <table className="min-w-full border-separate border-spacing-y-2">
            <thead>
              <tr className="text-xs text-slate-400">
                <th className="text-left px-3 py-1">Title</th>
                <th className="text-left px-3 py-1">Assignee</th>
                <th className="text-left px-3 py-1">Status</th>
                <th className="text-left px-3 py-1">Priority</th>
                <th className="text-left px-3 py-1">Due</th>
                <th className="text-left px-3 py-1">Created</th>
                <th className="text-right px-3 py-1">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td
                    colSpan={7}
                    className="px-3 py-6 text-center text-xs text-slate-400"
                  >
                    Loading tasks...
                  </td>
                </tr>
              ) : tasks.length === 0 ? (
                <tr>
                  <td
                    colSpan={7}
                    className="px-3 py-6 text-center text-xs text-slate-400"
                  >
                    No tasks yet.
                  </td>
                </tr>
              ) : (
                tasks.map((task) => (
                  <tr
                    key={task.id}
                    className="bg-slate-50 hover:bg-slate-100 rounded-xl align-top"
                  >
                    <td className="px-3 py-3 rounded-l-xl text-slate-900">
                      <div className="text-sm font-medium">
                        {task.title}
                      </div>
                      {task.description && (
                        <div className="text-xs text-slate-500 mt-1 line-clamp-2">
                          {task.description}
                        </div>
                      )}
                    </td>
                    <td className="px-3 py-3 text-slate-600 text-xs">
                      {task.assignee_name || 'Unassigned'}
                      {task.created_by_name && (
                        <div className="text-[11px] text-slate-400">
                          Created by {task.created_by_name}
                        </div>
                      )}
                    </td>
                    <td className="px-3 py-3 text-xs">
                      <span className={statusBadge(task.status)}>
                        {task.status.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="px-3 py-3 text-xs">
                      <span className={priorityBadge(task.priority)}>
                        {task.priority}
                      </span>
                    </td>
                    <td className="px-3 py-3 text-xs text-slate-600">
                      {formatDate(task.due_date)}
                    </td>
                    <td className="px-3 py-3 text-xs text-slate-500">
                      {formatCreated(task.created_at)}
                    </td>
                    <td className="px-3 py-3 rounded-r-xl text-right text-xs">
                      <select
                        value={task.status}
                        onChange={(e) =>
                          handleStatusChange(
                            task.id,
                            e.target.value
                          )
                        }
                        disabled={statusSavingId === task.id}
                        className="px-3 py-1 rounded-full border border-slate-200 bg-white focus:outline-none focus:ring-1 focus:ring-indigo-500 text-xs"
                      >
                        <option value="todo">To do</option>
                        <option value="in_progress">
                          In progress
                        </option>
                        <option value="done">Done</option>
                        <option value="blocked">Blocked</option>
                      </select>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
