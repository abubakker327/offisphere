'use client';

import { useEffect, useState } from 'react';

const STATUS_COLORS = {
  submitted: 'bg-amber-50 text-amber-700 border-amber-100',
  approved: 'bg-emerald-50 text-emerald-700 border-emerald-100',
  rejected: 'bg-red-50 text-red-600 border-red-100'
};

export default function TimesheetsPage() {
  const [timesheets, setTimesheets] = useState([]);
  const [loadingList, setLoadingList] = useState(true);
  const [listError, setListError] = useState('');

  // create form
  const [workDate, setWorkDate] = useState('');
  const [projectName, setProjectName] = useState('');
  const [taskDescription, setTaskDescription] = useState('');
  const [hours, setHours] = useState('');
  const [notes, setNotes] = useState('');
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState('');
  const [createSuccess, setCreateSuccess] = useState('');

  // filters
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterDateFrom, setFilterDateFrom] = useState('');
  const [filterDateTo, setFilterDateTo] = useState('');

  // roles
  const [roles, setRoles] = useState([]);
  const [statusLoadingId, setStatusLoadingId] = useState(null);
  const [deleteLoadingId, setDeleteLoadingId] = useState(null);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const today = new Date().toISOString().slice(0, 10);
      setWorkDate(today);

      const storedRoles = window.localStorage.getItem('offisphere_roles');
      if (storedRoles) {
        try {
          const parsed = JSON.parse(storedRoles);
          if (Array.isArray(parsed)) setRoles(parsed);
        } catch {
          setRoles([]);
        }
      }
    }
  }, []);

  const token =
    typeof window !== 'undefined'
      ? window.localStorage.getItem('offisphere_token')
      : null;

  const authHeaders = token
    ? {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    : { 'Content-Type': 'application/json' };

  const isAdmin = roles.includes('admin');
  const isManager = roles.includes('manager');
  const isAdminOrManager = isAdmin || isManager;

  const fetchTimesheets = async () => {
    setLoadingList(true);
    setListError('');

    try {
      const res = await fetch('http://localhost:5000/api/timesheets', {
        headers: authHeaders
      });

      const data = await res.json();

      if (!res.ok) {
        setListError(data.message || 'Failed to load timesheets');
      } else {
        setTimesheets(data);
      }
    } catch (err) {
      console.error(err);
      setListError('Error connecting to server');
    } finally {
      setLoadingList(false);
    }
  };

  useEffect(() => {
    fetchTimesheets();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleCreateTimesheet = async (e) => {
    e.preventDefault();
    setCreating(true);
    setCreateError('');
    setCreateSuccess('');

    try {
      const res = await fetch('http://localhost:5000/api/timesheets', {
        method: 'POST',
        headers: authHeaders,
        body: JSON.stringify({
          work_date: workDate,
          project_name: projectName,
          task_description: taskDescription,
          hours,
          notes
        })
      });

      const data = await res.json();

      if (!res.ok) {
        setCreateError(data.message || 'Failed to create timesheet entry');
      } else {
        setCreateSuccess('Timesheet entry added');
        setProjectName('');
        setTaskDescription('');
        setHours('');
        setNotes('');
        fetchTimesheets();
      }
    } catch (err) {
      console.error(err);
      setCreateError('Error connecting to server');
    } finally {
      setCreating(false);
    }
  };

  const handleUpdateStatus = async (id, newStatus) => {
    setStatusLoadingId(id);
    setListError('');

    try {
      const res = await fetch(
        `http://localhost:5000/api/timesheets/${id}/status`,
        {
          method: 'PATCH',
          headers: authHeaders,
          body: JSON.stringify({ status: newStatus })
        }
      );

      const data = await res.json();

      if (!res.ok) {
        setListError(data.message || 'Failed to update status');
      } else {
        fetchTimesheets();
      }
    } catch (err) {
      console.error(err);
      setListError('Error connecting to server');
    } finally {
      setStatusLoadingId(null);
    }
  };

  const handleDelete = async (id) => {
    const confirmed = window.confirm(
      'Are you sure you want to delete this timesheet entry?'
    );
    if (!confirmed) return;

    setDeleteLoadingId(id);
    setListError('');

    try {
      const res = await fetch(
        `http://localhost:5000/api/timesheets/${id}`,
        {
          method: 'DELETE',
          headers: authHeaders
        }
      );

      const data = await res.json();

      if (!res.ok) {
        setListError(data.message || 'Failed to delete entry');
      } else {
        fetchTimesheets();
      }
    } catch (err) {
      console.error(err);
      setListError('Error connecting to server');
    } finally {
      setDeleteLoadingId(null);
    }
  };

  const formatDate = (value) => {
    if (!value) return '-';
    return new Date(value).toLocaleDateString();
  };

  // client-side filters
  const filteredTimesheets = timesheets.filter((item) => {
    const matchesStatus =
      filterStatus === 'all' ? true : item.status === filterStatus;

    const dateObj = item.work_date ? new Date(item.work_date) : null;
    let matchesFrom = true;
    let matchesTo = true;

    if (filterDateFrom && dateObj) {
      matchesFrom = dateObj >= new Date(filterDateFrom);
    }
    if (filterDateTo && dateObj) {
      matchesTo = dateObj <= new Date(filterDateTo);
    }

    return matchesStatus && matchesFrom && matchesTo;
  });

  return (
    <div className="space-y-6 bg-gradient-to-br from-slate-50 via-indigo-50/70 to-cyan-50/60 p-1 rounded-3xl">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
        <div className="space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-gradient-to-r from-indigo-600 via-purple-600 to-sky-500 text-white text-[11px] font-semibold shadow-sm shadow-indigo-200">
            <span className="h-1.5 w-1.5 rounded-full bg-white/90" />
            <span>Time tracking</span>
          </div>
          <div>
            <h1 className="text-xl font-semibold text-slate-900">Timesheets</h1>
            <p className="text-sm text-slate-600">
              Log daily work hours and review timesheet entries. Managers can
              approve or reject submissions.
            </p>
          </div>
        </div>
      </div>

      {/* Log work form */}
      <div className="relative overflow-hidden rounded-2xl bg-white/90 p-5 shadow-[0_14px_36px_rgba(0,0,0,0.06)] border border-indigo-100/60 backdrop-blur">
        <div
          className="absolute inset-y-0 left-0 w-1 bg-gradient-to-b from-indigo-500 via-purple-500 to-cyan-500"
          aria-hidden="true"
        />
        <h2 className="text-sm font-semibold text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 via-purple-600 to-sky-500 mb-3">Log work</h2>

        <form
          onSubmit={handleCreateTimesheet}
          className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm"
        >
          <div className="space-y-1">
            <label className="font-medium text-slate-700">Date</label>
            <input
              type="date"
              value={workDate}
              onChange={(e) => setWorkDate(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              required
            />
          </div>

          <div className="space-y-1">
            <label className="font-medium text-slate-700">Project</label>
            <input
              type="text"
              value={projectName}
              onChange={(e) => setProjectName(e.target.value)}
              placeholder="Project name"
              className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            />
          </div>

          <div className="space-y-1">
            <label className="font-medium text-slate-700">Task</label>
            <input
              type="text"
              value={taskDescription}
              onChange={(e) => setTaskDescription(e.target.value)}
              placeholder="What did you work on?"
              className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            />
          </div>

          <div className="space-y-1">
            <label className="font-medium text-slate-700">Hours</label>
            <input
              type="number"
              step="0.25"
              min="0"
              max="24"
              value={hours}
              onChange={(e) => setHours(e.target.value)}
              placeholder="e.g. 4"
              className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              required
            />
          </div>

          <div className="space-y-1 md:col-span-2">
            <label className="font-medium text-slate-700">
              Notes (optional)
            </label>
            <textarea
              rows={3}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Any extra details..."
              className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent resize-none"
            />
          </div>

          <div className="md:col-span-2 flex flex-col gap-2 mt-2">
            {createError && (
              <p className="text-xs text-red-600 bg-red-50 border border-red-100 rounded-xl px-3 py-2">
                {createError}
              </p>
            )}
            {createSuccess && (
              <p className="text-xs text-emerald-600 bg-emerald-50 border border-emerald-100 rounded-xl px-3 py-2">
                {createSuccess}
              </p>
            )}
            <button
              type="submit"
              disabled={creating}
              className="self-start px-4 py-2 rounded-xl text-xs font-medium text-white bg-gradient-to-r from-indigo-500 to-purple-500 shadow hover:opacity-90 disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {creating ? 'Saving...' : 'Add entry'}
            </button>
          </div>
        </form>
      </div>

      {/* Filters */}
      <div className="relative overflow-hidden rounded-2xl bg-white p-4 shadow-sm border border-slate-100">
        <div
          className="absolute inset-y-0 left-0 w-1 bg-gradient-to-b from-indigo-500 via-purple-500 to-cyan-500"
          aria-hidden="true"
        />
        <h2 className="text-sm font-semibold text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 via-purple-600 to-sky-500 mb-3">Filters</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
          <div className="space-y-1">
            <label className="font-medium text-slate-700">Status</label>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            >
              <option value="all">All statuses</option>
              <option value="submitted">Submitted</option>
              <option value="approved">Approved</option>
              <option value="rejected">Rejected</option>
            </select>
          </div>
          <div className="space-y-1">
            <label className="font-medium text-slate-700">From date</label>
            <input
              type="date"
              value={filterDateFrom}
              onChange={(e) => setFilterDateFrom(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            />
          </div>
          <div className="space-y-1">
            <label className="font-medium text-slate-700">To date</label>
            <input
              type="date"
              value={filterDateTo}
              onChange={(e) => setFilterDateTo(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            />
          </div>
        </div>
      </div>

      {/* Timesheets table */}
      <div className="relative overflow-hidden rounded-2xl bg-white p-5 shadow-sm border border-slate-100">
        <div
          className="absolute inset-y-0 left-0 w-1 bg-gradient-to-b from-indigo-500 via-purple-500 to-cyan-500"
          aria-hidden="true"
        />
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-semibold text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 via-purple-600 to-sky-500">
            Timesheet entries
          </h2>
        </div>

        {listError && (
          <p className="text-xs text-red-600 bg-red-50 border border-red-100 rounded-xl px-3 py-2 mb-3">
            {listError}
          </p>
        )}

        <div className="overflow-x-auto text-sm">
          <table className="min-w-full border-separate border-spacing-y-2">
            <thead className="text-xs text-white">
              <tr className="bg-gradient-to-r from-indigo-600 via-purple-600 to-sky-500">
                <th className="text-left px-2 py-2 font-semibold first:rounded-l-xl">Employee</th>
                <th className="text-left px-2 py-2 font-semibold">Date</th>
                <th className="text-left px-2 py-2 font-semibold">Project</th>
                <th className="text-left px-2 py-2 font-semibold">Task</th>
                <th className="text-left px-2 py-2 font-semibold">Hours</th>
                <th className="text-left px-2 py-2 font-semibold">Status</th>
                <th className="text-left px-2 py-2 font-semibold last:rounded-r-xl">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loadingList ? (
                <tr>
                  <td
                    colSpan={7}
                    className="px-2 py-4 text-center text-xs text-slate-400"
                  >
                    Loading timesheets...
                  </td>
                </tr>
              ) : filteredTimesheets.length === 0 ? (
                <tr>
                  <td
                    colSpan={7}
                    className="px-2 py-4 text-center text-xs text-slate-400"
                  >
                    No timesheet entries match your filters.
                  </td>
                </tr>
              ) : (
                filteredTimesheets.map((item, idx) => (
                  <tr
                    key={item.id}
                    className={`transition rounded-xl shadow-sm ${idx % 2 === 0 ? 'bg-indigo-50/70' : 'bg-slate-50'} hover:bg-indigo-50`}
                  >
                    <td className="px-2 py-2 rounded-l-xl text-slate-800">
                      {item.full_name}
                    </td>
                    <td className="px-2 py-2 text-slate-600">
                      {formatDate(item.work_date)}
                    </td>
                    <td className="px-2 py-2 text-slate-600">
                      {item.project_name || '—'}
                    </td>
                    <td className="px-2 py-2 text-slate-600">
                      {item.task_description || '—'}
                    </td>
                    <td className="px-2 py-2 text-slate-800">{item.hours}</td>
                    <td className="px-2 py-2 text-xs">
                      <span
                        className={`px-2 py-0.5 rounded-full border ${
                          STATUS_COLORS[item.status] ||
                          'bg-slate-50 text-slate-700 border-slate-200'
                        }`}
                      >
                        {item.status}
                      </span>
                    </td>
                    <td className="px-2 py-2 rounded-r-xl text-xs">
                      <div className="flex flex-wrap gap-2">
                        {isAdminOrManager && item.status === 'submitted' && (
                          <>
                            <button
                              onClick={() =>
                                handleUpdateStatus(item.id, 'approved')
                              }
                              disabled={statusLoadingId === item.id}
                              className="px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-100 hover:bg-emerald-100 disabled:opacity-60"
                            >
                              Approve
                            </button>
                            <button
                              onClick={() =>
                                handleUpdateStatus(item.id, 'rejected')
                              }
                              disabled={statusLoadingId === item.id}
                              className="px-3 py-1 rounded-full bg-red-50 text-red-600 border border-red-100 hover:bg-red-100 disabled:opacity-60"
                            >
                              Reject
                            </button>
                          </>
                        )}

                        <button
                          onClick={() => handleDelete(item.id)}
                          disabled={deleteLoadingId === item.id}
                          className="px-3 py-1 rounded-full bg-slate-900 text-white hover:bg-slate-700 disabled:opacity-60"
                        >
                          {deleteLoadingId === item.id ? 'Deleting...' : 'Delete'}
                        </button>
                      </div>
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
