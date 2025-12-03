'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';

export default function DashboardHome() {
  const [summary, setSummary] = useState({
    users: 0,
    leaves: { pending: 0, approved: 0 },
    attendanceToday: 0
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [roles, setRoles] = useState([]);
  const [recentAttendance, setRecentAttendance] = useState([]);
  const [leaveBreakdown, setLeaveBreakdown] = useState({
    CL: 0,
    SL: 0,
    EL: 0,
    LOP: 0
  });

  useEffect(() => {
    if (typeof window !== 'undefined') {
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

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const token = window.localStorage.getItem('offisphere_token');
        if (!token) {
          setError('You are not logged in. Please sign in again.');
          setLoading(false);
          return;
        }

        const [summaryRes, attendanceRes, leavesRes] = await Promise.all([
          fetch('http://localhost:5000/api/dashboard/summary', {
            headers: { Authorization: `Bearer ${token}` }
          }),
          fetch('http://localhost:5000/api/attendance', {
            headers: { Authorization: `Bearer ${token}` }
          }),
          fetch('http://localhost:5000/api/leaves', {
            headers: { Authorization: `Bearer ${token}` }
          })
        ]);

        const summaryData = await summaryRes.json();
        const attendanceData = await attendanceRes.json();
        const leavesData = await leavesRes.json();

        if (!summaryRes.ok) {
          setError(
            summaryData.message || 'Failed to load dashboard data'
          );
        } else {
          setSummary(summaryData);
          setError('');
        }

        if (attendanceRes.ok && Array.isArray(attendanceData)) {
          const sortedAttendance = [...attendanceData].sort((a, b) => {
            const dA = new Date(
              a.attendance_date || a.created_at || 0
            );
            const dB = new Date(
              b.attendance_date || b.created_at || 0
            );
            return dB.getTime() - dA.getTime();
          });
          setRecentAttendance(sortedAttendance.slice(0, 5));
        }

        if (leavesRes.ok && Array.isArray(leavesData)) {
          const breakdown = { CL: 0, SL: 0, EL: 0, LOP: 0 };
          for (const leave of leavesData) {
            if (
              leave.leave_type &&
              breakdown[leave.leave_type] !== undefined
            ) {
              breakdown[leave.leave_type] += Number(
                leave.total_days || 0
              );
            }
          }
          setLeaveBreakdown(breakdown);
        }
      } catch (err) {
        console.error('Dashboard fetch error:', err);
        setError('Error connecting to server');
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  const isAdmin = roles.includes('admin');
  const isManager = roles.includes('manager');
  const isEmployee = roles.includes('employee');

  const roleText = (() => {
    if (isAdmin) return 'You have full admin access to Offisphere.';
    if (isManager) return 'You can manage team attendance and review leaves.';
    if (isEmployee) return 'You can check in, check out and apply for leaves.';
    return 'Welcome to Offisphere.';
  })();

  const formatDate = (value) => {
    if (!value) return '-';
    return new Date(value).toLocaleDateString();
  };

  const formatTime = (value) => {
    if (!value) return '-';
    const d = new Date(value);
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">Dashboard</h1>
          <p className="text-sm text-slate-500">
            Overview of users, attendance and leave activity. {roleText}
          </p>
        </div>
        <div className="flex gap-2 text-xs text-slate-500">
          <span className="px-3 py-1 rounded-full bg-white border border-slate-200 shadow-sm">
            Today
          </span>
          <span className="px-3 py-1 rounded-full bg-slate-100 border border-slate-200">
            This week
          </span>
        </div>
      </div>

      {error && (
        <div className="text-xs text-red-600 bg-red-50 border border-red-100 rounded-xl px-4 py-3">
          {error}
        </div>
      )}

      {/* Top cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Users card – always visible */}
        <div className="rounded-2xl bg-gradient-to-br from-indigo-500 to-indigo-600 text-white p-4 shadow-lg">
          <p className="text-xs uppercase tracking-wide text-indigo-100">
            Total Users
          </p>
          <p className="mt-2 text-3xl font-semibold">
            {loading ? '...' : summary.users}
          </p>
          <p className="mt-1 text-[11px] text-indigo-100/80">
            Admins, managers & employees.
          </p>
        </div>

        <div className="rounded-2xl bg-white p-4 shadow-sm border border-slate-100">
          <p className="text-xs uppercase tracking-wide text-slate-400">Leaves</p>
          <div className="mt-2 flex items-end gap-4">
            <div>
              <p className="text-xl font-semibold text-slate-900">
                {loading ? '...' : summary.leaves.pending}
              </p>
              <p className="text-[11px] text-slate-500">Pending requests</p>
            </div>
            <div>
              <p className="text-lg font-semibold text-emerald-600">
                {loading ? '...' : summary.leaves.approved}
              </p>
              <p className="text-[11px] text-slate-500">Approved</p>
            </div>
          </div>
        </div>

        <div className="rounded-2xl bg-white p-4 shadow-sm border border-slate-100">
          <p className="text-xs uppercase tracking-wide text-slate-400">
            Attendance
          </p>
          <p className="mt-2 text-2xl font-semibold text-slate-900">
            {loading ? '...' : summary.attendanceToday}
          </p>
          <p className="mt-1 text-[11px] text-slate-500">Check-ins today</p>
        </div>
      </div>

      {/* Quick actions + lower section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Left 2/3 */}
        <div className="lg:col-span-2 space-y-4">
          {/* Quick actions */}
          <div className="rounded-2xl bg-white p-4 shadow-sm border border-slate-100">
            <p className="text-sm font-semibold text-slate-900 mb-3">
              Quick actions
            </p>
            <div className="flex flex-wrap gap-3 text-xs">
              <Link
                href="/dashboard/users"
                className="px-4 py-2 rounded-xl bg-slate-900 text-white hover:bg-slate-700"
              >
                Manage users
              </Link>

              <Link
                href="/dashboard/attendance"
                className="px-4 py-2 rounded-xl bg-indigo-50 text-indigo-700 border border-indigo-100 hover:bg-indigo-100"
              >
                Open attendance
              </Link>

              <Link
                href="/dashboard/timesheets"
                className="px-4 py-2 rounded-xl bg-sky-50 text-sky-700 border border-sky-100 hover:bg-sky-100"
              >
                Log timesheets
              </Link>

              <Link
                href="/dashboard/leaves"
                className="px-4 py-2 rounded-xl bg-purple-50 text-purple-700 border border-purple-100 hover:bg-purple-100"
              >
                Apply / review leaves
              </Link>
            </div>
          </div>

          {/* Recent attendance */}
          <div className="rounded-2xl bg-white p-4 shadow-sm border border-slate-100">
            <div className="flex items-center justify-between mb-3">
              <p className="text-sm font-semibold text-slate-900">
                Recent attendance
              </p>
              <Link
                href="/dashboard/attendance"
                className="text-[11px] text-indigo-600 hover:underline"
              >
                View all
              </Link>
            </div>

            <div className="overflow-x-auto text-xs">
              <table className="min-w-full border-separate border-spacing-y-2">
                <thead>
                  <tr className="text-[11px] text-slate-400">
                    <th className="text-left px-2 py-1">Employee</th>
                    <th className="text-left px-2 py-1">Date</th>
                    <th className="text-left px-2 py-1">Check in</th>
                    <th className="text-left px-2 py-1">Check out</th>
                    <th className="text-left px-2 py-1">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <tr>
                      <td
                        colSpan={5}
                        className="px-2 py-4 text-center text-[11px] text-slate-400"
                      >
                        Loading attendance...
                      </td>
                    </tr>
                  ) : recentAttendance.length === 0 ? (
                    <tr>
                      <td
                        colSpan={5}
                        className="px-2 py-4 text-center text-[11px] text-slate-400"
                      >
                        No attendance records yet.
                      </td>
                    </tr>
                  ) : (
                    recentAttendance.map((item) => (
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
                        <td className="px-2 py-2 rounded-r-xl text-[11px]">
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

        {/* Right 1/3: Leave summary */}
        <div className="rounded-2xl bg-white p-4 shadow-sm border border-slate-100">
          <p className="text-sm font-semibold text-slate-900 mb-3">
            Leave summary
          </p>

          {loading ? (
            <p className="text-xs text-slate-500">Loading leave summary...</p>
          ) : (
            <div className="space-y-2 text-xs text-slate-700">
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-indigo-500" />
                  <span>Casual Leave (CL)</span>
                </span>
                <span className="font-semibold text-slate-900">
                  {leaveBreakdown.CL} days
                </span>
              </div>

              <div className="flex items-center justify-between">
                <span className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-emerald-500" />
                  <span>Sick Leave (SL)</span>
                </span>
                <span className="font-semibold text-slate-900">
                  {leaveBreakdown.SL} days
                </span>
              </div>

              <div className="flex items-center justify-between">
                <span className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-purple-500" />
                  <span>Earned Leave (EL)</span>
                </span>
                <span className="font-semibold text-slate-900">
                  {leaveBreakdown.EL} days
                </span>
              </div>

              <div className="flex items-center justify-between">
                <span className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-rose-500" />
                  <span>Loss of Pay (LOP)</span>
                </span>
                <span className="font-semibold text-slate-900">
                  {leaveBreakdown.LOP} days
                </span>
              </div>

              <p className="mt-3 text-[11px] text-slate-500">
                Based on all leave requests in the system (approved, rejected and
                pending).
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
