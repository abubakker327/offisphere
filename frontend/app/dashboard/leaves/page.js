'use client';

import { useEffect, useState } from 'react';

const LEAVE_TYPES = [
  { value: 'CL', label: 'Casual Leave (CL)' },
  { value: 'SL', label: 'Sick Leave (SL)' },
  { value: 'EL', label: 'Earned Leave (EL)' },
  { value: 'LOP', label: 'Loss of Pay (LOP)' }
];

const STATUS_FILTERS = [
  { value: 'all', label: 'All statuses' },
  { value: 'pending', label: 'Pending' },
  { value: 'approved', label: 'Approved' },
  { value: 'rejected', label: 'Rejected' }
];

export default function LeavesPage() {
  const [leaves, setLeaves] = useState([]);
  const [loadingList, setLoadingList] = useState(true);
  const [listError, setListError] = useState('');

  const [leaveType, setLeaveType] = useState('CL');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [reason, setReason] = useState('');

  const [applyLoading, setApplyLoading] = useState(false);
  const [applyError, setApplyError] = useState('');
  const [applySuccess, setApplySuccess] = useState('');

  const [statusActionLoadingId, setStatusActionLoadingId] = useState(null);
  const [roles, setRoles] = useState([]);

  // Filters
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterType, setFilterType] = useState('all');

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const storedRoles =
        window.localStorage.getItem('offisphere_roles');
      if (storedRoles) {
        try {
          setRoles(JSON.parse(storedRoles));
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

  const fetchLeaves = async () => {
    setLoadingList(true);
    setListError('');

    try {
      const res = await fetch('http://localhost:5000/api/leaves', {
        headers: authHeaders
      });

      const data = await res.json();

      if (!res.ok) {
        setListError(data.message || 'Failed to load leaves');
      } else {
        setLeaves(data);
      }
    } catch (err) {
      console.error(err);
      setListError('Error connecting to server');
    } finally {
      setLoadingList(false);
    }
  };

  useEffect(() => {
    fetchLeaves();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleApplyLeave = async (e) => {
    e.preventDefault();
    setApplyLoading(true);
    setApplyError('');
    setApplySuccess('');

    try {
      const res = await fetch('http://localhost:5000/api/leaves/apply', {
        method: 'POST',
        headers: authHeaders,
        body: JSON.stringify({
          leave_type: leaveType,
          start_date: startDate,
          end_date: endDate,
          reason
        })
      });

      const data = await res.json();

      if (!res.ok) {
        setApplyError(data.message || 'Failed to submit leave');
      } else {
        setApplySuccess('Leave request submitted');
        setReason('');
        setStartDate('');
        setEndDate('');
        fetchLeaves();
      }
    } catch (err) {
      console.error(err);
      setApplyError('Error connecting to server');
    } finally {
      setApplyLoading(false);
    }
  };

  const handleUpdateStatus = async (id, newStatus) => {
    setStatusActionLoadingId(id);
    setListError('');

    try {
      const res = await fetch(
        `http://localhost:5000/api/leaves/${id}/status`,
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
        fetchLeaves();
      }
    } catch (err) {
      console.error(err);
      setListError('Error connecting to server');
    } finally {
      setStatusActionLoadingId(null);
    }
  };

  const statusChipStyles = (status) => {
    switch (status) {
      case 'approved':
        return 'bg-emerald-50 text-emerald-700 border-emerald-100';
      case 'rejected':
        return 'bg-red-50 text-red-600 border-red-100';
      default:
        return 'bg-amber-50 text-amber-700 border-amber-100';
    }
  };

  const formatDate = (value) => {
    if (!value) return '-';
    return new Date(value).toLocaleDateString();
  };

  // Apply filters client-side
  const filteredLeaves = leaves.filter((leave) => {
    const matchesStatus =
      filterStatus === 'all' ? true : leave.status === filterStatus;
    const matchesType =
      filterType === 'all' ? true : leave.leave_type === filterType;
    return matchesStatus && matchesType;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold text-slate-900">Leave Management</h1>
          <p className="text-sm text-slate-500">
            Apply for leave and track approvals. Admins can review and approve requests.
          </p>
        </div>
      </div>

      {/* Apply leave card */}
      <div className="rounded-2xl bg-white p-5 shadow-sm border border-slate-100">
        <h2 className="text-sm font-semibold text-slate-900 mb-3">
          Apply for leave
        </h2>

        <form
          onSubmit={handleApplyLeave}
          className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm"
        >
          <div className="space-y-1">
            <label className="font-medium text-slate-700">Leave type</label>
            <select
              value={leaveType}
              onChange={(e) => setLeaveType(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            >
              {LEAVE_TYPES.map((lt) => (
                <option key={lt.value} value={lt.value}>
                  {lt.label}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-1">
            <label className="font-medium text-slate-700">Start date</label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              required
            />
          </div>

          <div className="space-y-1">
            <label className="font-medium text-slate-700">End date</label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              required
            />
          </div>

          <div className="space-y-1 md:col-span-1">
            <label className="font-medium text-slate-700">Reason (optional)</label>
            <textarea
              rows={3}
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Eg. Medical appointment, family function, etc."
              className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent resize-none"
            />
          </div>

          <div className="md:col-span-2 flex flex-col gap-2 mt-2">
            {applyError && (
              <p className="text-xs text-red-600 bg-red-50 border border-red-100 rounded-xl px-3 py-2">
                {applyError}
              </p>
            )}
            {applySuccess && (
              <p className="text-xs text-emerald-600 bg-emerald-50 border border-emerald-100 rounded-xl px-3 py-2">
                {applySuccess}
              </p>
            )}
            <button
              type="submit"
              disabled={applyLoading}
              className="self-start px-4 py-2 rounded-xl text-xs font-medium text-white bg-gradient-to-r from-indigo-500 to-purple-500 shadow hover:opacity-90 disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {applyLoading ? 'Submitting...' : 'Submit leave request'}
            </button>
          </div>
        </form>
      </div>

      {/* Filters */}
      <div className="rounded-2xl bg-white p-4 shadow-sm border border-slate-100">
        <h2 className="text-sm font-semibold text-slate-900 mb-3">Filters</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
          <div className="space-y-1">
            <label className="font-medium text-slate-700">Status</label>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            >
              {STATUS_FILTERS.map((st) => (
                <option key={st.value} value={st.value}>
                  {st.label}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-1">
            <label className="font-medium text-slate-700">Leave type</label>
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            >
              <option value="all">All types</option>
              {LEAVE_TYPES.map((lt) => (
                <option key={lt.value} value={lt.value}>
                  {lt.label}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Leave list */}
      <div className="rounded-2xl bg-white p-5 shadow-sm border border-slate-100">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-semibold text-slate-900">Leave requests</h2>
          {isAdmin && (
            <span className="text-[11px] text-slate-500">
              As admin you can approve or reject pending requests.
            </span>
          )}
        </div>

        {listError && (
          <p className="text-xs text-red-600 bg-red-50 border border-red-100 rounded-xl px-3 py-2 mb-3">
            {listError}
          </p>
        )}

        <div className="overflow-x-auto text-sm">
          <table className="min-w-full border-separate border-spacing-y-2">
            <thead>
              <tr className="text-xs text-slate-400">
                <th className="text-left px-2 py-1">Employee</th>
                <th className="text-left px-2 py-1">Type</th>
                <th className="text-left px-2 py-1">From</th>
                <th className="text-left px-2 py-1">To</th>
                <th className="text-left px-2 py-1">Days</th>
                <th className="text-left px-2 py-1">Status</th>
                {isAdmin && <th className="text-left px-2 py-1">Actions</th>}
              </tr>
            </thead>
            <tbody>
              {loadingList ? (
                <tr>
                  <td
                    colSpan={isAdmin ? 7 : 6}
                    className="px-2 py-4 text-center text-xs text-slate-400"
                  >
                    Loading leaves...
                  </td>
                </tr>
              ) : filteredLeaves.length === 0 ? (
                <tr>
                  <td
                    colSpan={isAdmin ? 7 : 6}
                    className="px-2 py-4 text-center text-xs text-slate-400"
                  >
                    No leave requests match your filters.
                  </td>
                </tr>
              ) : (
                filteredLeaves.map((leave) => (
                  <tr
                    key={leave.id}
                    className="bg-slate-50 hover:bg-slate-100 transition rounded-xl"
                  >
                    <td className="px-2 py-2 rounded-l-xl text-slate-800">
                      {leave.full_name}
                    </td>
                    <td className="px-2 py-2 text-slate-600">
                      {leave.leave_type}
                    </td>
                    <td className="px-2 py-2 text-slate-600">
                      {formatDate(leave.start_date)}
                    </td>
                    <td className="px-2 py-2 text-slate-600">
                      {formatDate(leave.end_date)}
                    </td>
                    <td className="px-2 py-2 text-slate-600">
                      {leave.total_days}
                    </td>
                    <td className="px-2 py-2 text-xs">
                      <span
                        className={`px-2 py-0.5 rounded-full border ${statusChipStyles(
                          leave.status
                        )}`}
                      >
                        {leave.status}
                      </span>
                    </td>
                    {isAdmin && (
                      <td className="px-2 py-2 rounded-r-xl text-xs">
                        {leave.status === 'pending' ? (
                          <div className="flex gap-2">
                            <button
                              onClick={() =>
                                handleUpdateStatus(leave.id, 'approved')
                              }
                              disabled={
                                statusActionLoadingId === leave.id
                              }
                              className="px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-100 hover:bg-emerald-100 disabled:opacity-60"
                            >
                              Approve
                            </button>
                            <button
                              onClick={() =>
                                handleUpdateStatus(leave.id, 'rejected')
                              }
                              disabled={
                                statusActionLoadingId === leave.id
                              }
                              className="px-3 py-1 rounded-full bg-red-50 text-red-600 border border-red-100 hover:bg-red-100 disabled:opacity-60"
                            >
                              Reject
                            </button>
                          </div>
                        ) : (
                          <span className="text-slate-400">—</span>
                        )}
                      </td>
                    )}
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
