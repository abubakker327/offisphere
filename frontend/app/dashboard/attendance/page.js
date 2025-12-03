'use client';

import { useEffect, useState } from 'react';

export default function AttendancePage() {
  const [attendance, setAttendance] = useState([]);
  const [loadingList, setLoadingList] = useState(true);
  const [listError, setListError] = useState('');

  const [actionMessage, setActionMessage] = useState('');
  const [actionError, setActionError] = useState('');
  const [checkingIn, setCheckingIn] = useState(false);
  const [checkingOut, setCheckingOut] = useState(false);

  // Filters
  const [filterName, setFilterName] = useState('');
  const [filterDateFrom, setFilterDateFrom] = useState('');
  const [filterDateTo, setFilterDateTo] = useState('');

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

  const fetchAttendance = async () => {
    setLoadingList(true);
    setListError('');

    try {
      const res = await fetch('http://localhost:5000/api/attendance', {
        headers: authHeaders
      });

      const data = await res.json();

      if (!res.ok) {
        setListError(data.message || 'Failed to load attendance');
      } else {
        setAttendance(data);
      }
    } catch (err) {
      console.error(err);
      setListError('Error connecting to server');
    } finally {
      setLoadingList(false);
    }
  };

  useEffect(() => {
    fetchAttendance();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleCheckIn = async () => {
    setCheckingIn(true);
    setActionError('');
    setActionMessage('');

    try {
      const res = await fetch('http://localhost:5000/api/attendance/check-in', {
        method: 'POST',
        headers: authHeaders
      });
      const data = await res.json();

      if (!res.ok) {
        setActionError(data.message || 'Check-in failed');
      } else {
        setActionMessage('Check-in recorded');
        fetchAttendance();
      }
    } catch (err) {
      console.error(err);
      setActionError('Error connecting to server');
    } finally {
      setCheckingIn(false);
    }
  };

  const handleCheckOut = async () => {
    setCheckingOut(true);
    setActionError('');
    setActionMessage('');

    try {
      const res = await fetch('http://localhost:5000/api/attendance/check-out', {
        method: 'POST',
        headers: authHeaders
      });
      const data = await res.json();

      if (!res.ok) {
        setActionError(data.message || 'Check-out failed');
      } else {
        setActionMessage('Check-out recorded');
        fetchAttendance();
      }
    } catch (err) {
      console.error(err);
      setActionError('Error connecting to server');
    } finally {
      setCheckingOut(false);
    }
  };

  const formatTime = (value) => {
    if (!value) return '-';
    const d = new Date(value);
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const formatDate = (value) => {
    if (!value) return '-';
    return new Date(value).toLocaleDateString();
  };

  // Apply filters client-side
  const filteredAttendance = attendance.filter((item) => {
    const name = (item.full_name || '').toLowerCase();
    const matchesName = !filterName
      ? true
      : name.includes(filterName.toLowerCase());

    const dateObj = item.attendance_date
      ? new Date(item.attendance_date)
      : null;

    let matchesFrom = true;
    let matchesTo = true;

    if (filterDateFrom && dateObj) {
      const from = new Date(filterDateFrom);
      // ignore time by comparing yyyy-mm-dd part only
      matchesFrom = dateObj >= from;
    }

    if (filterDateTo && dateObj) {
      const to = new Date(filterDateTo);
      matchesTo = dateObj <= to;
    }

    return matchesName && matchesFrom && matchesTo;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold text-slate-900">Attendance</h1>
          <p className="text-sm text-slate-500">
            Check in, check out, and review attendance history with filters.
          </p>
        </div>
      </div>

      {/* Today actions */}
      <div className="rounded-2xl bg-white p-5 shadow-sm border border-slate-100">
        <h2 className="text-sm font-semibold text-slate-900 mb-3">
          Today&apos;s attendance
        </h2>

        <div className="flex flex-wrap gap-3 items-center text-xs">
          <button
            onClick={handleCheckIn}
            disabled={checkingIn}
            className="px-4 py-2 rounded-xl bg-gradient-to-r from-indigo-500 to-purple-500 text-white font-medium shadow-sm hover:opacity-90 disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {checkingIn ? 'Checking in...' : 'Check in'}
          </button>

          <button
            onClick={handleCheckOut}
            disabled={checkingOut}
            className="px-4 py-2 rounded-xl border border-slate-300 bg-slate-50 text-slate-700 font-medium hover:bg-slate-100 disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {checkingOut ? 'Checking out...' : 'Check out'}
          </button>

          {actionMessage && (
            <span className="px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-100">
              {actionMessage}
            </span>
          )}
          {actionError && (
            <span className="px-3 py-1 rounded-full bg-red-50 text-red-600 border border-red-100">
              {actionError}
            </span>
          )}
        </div>
      </div>

      {/* Filters */}
      <div className="rounded-2xl bg-white p-4 shadow-sm border border-slate-100">
        <h2 className="text-sm font-semibold text-slate-900 mb-3">
          Filters
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
          <div className="space-y-1">
            <label className="font-medium text-slate-700">
              Employee name
            </label>
            <input
              type="text"
              value={filterName}
              onChange={(e) => setFilterName(e.target.value)}
              placeholder="Search by name"
              className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            />
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

      {/* Attendance table */}
      <div className="rounded-2xl bg-white p-5 shadow-sm border border-slate-100">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-semibold text-slate-900">
            Attendance records
          </h2>
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
                <th className="text-left px-2 py-1">Date</th>
                <th className="text-left px-2 py-1">Check in</th>
                <th className="text-left px-2 py-1">Check out</th>
                <th className="text-left px-2 py-1">Status</th>
              </tr>
            </thead>
            <tbody>
              {loadingList ? (
                <tr>
                  <td
                    colSpan={5}
                    className="px-2 py-4 text-center text-xs text-slate-400"
                  >
                    Loading attendance...
                  </td>
                </tr>
              ) : filteredAttendance.length === 0 ? (
                <tr>
                  <td
                    colSpan={5}
                    className="px-2 py-4 text-center text-xs text-slate-400"
                  >
                    No attendance records match your filters.
                  </td>
                </tr>
              ) : (
                filteredAttendance.map((item) => (
                  <tr
                    key={item.id}
                    className="bg-slate-50 hover:bg-slate-100 transition rounded-xl"
                  >
                    <td className="px-2 py-2 rounded-l-xl text-slate-800">
                      {item.full_name}
                    </td>
                    <td className="px-2 py-2 text-slate-600">
                      {formatDate(item.attendance_date)}
                    </td>
                    <td className="px-2 py-2 text-slate-600">
                      {formatTime(item.check_in)}
                    </td>
                    <td className="px-2 py-2 text-slate-600">
                      {formatTime(item.check_out)}
                    </td>
                    <td className="px-2 py-2 rounded-r-xl text-xs">
                      <span className="px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-100 capitalize">
                        {item.status || 'n/a'}
                      </span>
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
