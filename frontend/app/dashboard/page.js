'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';

export default function DashboardHome() {
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const router = useRouter();
  const API_BASE = 'http://localhost:5000'; // local dev

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const token =
          typeof window !== 'undefined'
            ? window.localStorage.getItem('offisphere_token')
            : null;

        if (!token) {
          setError('Not authenticated');
          setLoading(false);
          return;
        }

        const res = await fetch(`${API_BASE}/api/dashboard/summary`, {
          headers: {
            Authorization: `Bearer ${token}`
          }
        });

        const data = await res.json();

        if (!res.ok) {
          setError(data.message || 'Server error fetching dashboard summary');
          setLoading(false);
          return;
        }

        setSummary(data);
        setError('');
      } catch (err) {
        console.error('Dashboard summary error:', err);
        setError('Error connecting to server');
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  const formatDate = (date) =>
    date ? new Date(date).toLocaleDateString() : '-';
  const formatTime = (value) =>
    value
      ? new Date(value).toLocaleTimeString([], {
          hour: '2-digit',
          minute: '2-digit'
        })
      : '--';

  const s = summary || {};

  const leaveSummary = s.leave_summary || {
    cl_days: 0,
    sl_days: 0,
    el_days: 0,
    lop_days: 0
  };

  const cardVariants = {
    hidden: { opacity: 0, y: 10 },
    visible: (i) => ({
      opacity: 1,
      y: 0,
      transition: { delay: 0.05 * i, duration: 0.25 }
    })
  };

  const GlowCard = ({ title, accent, index = 0, children }) => (
    <motion.div
      custom={index}
      variants={cardVariants}
      initial="hidden"
      animate="visible"
      whileHover={{ y: -8, scale: 1.01 }}
      className={`relative overflow-hidden rounded-3xl border shadow-[0_14px_36px_rgba(0,0,0,0.06)] p-4 ${accent.border} ${accent.bg}`}
    >
      <div className="absolute inset-0 pointer-events-none">
        <div
          className={`absolute -top-10 -left-6 h-28 w-28 blur-3xl ${accent.glowA}`}
        />
        <div
          className={`absolute -bottom-8 right-0 h-24 w-24 blur-2xl ${accent.glowB}`}
        />
      </div>
      <div className="relative flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <p className={`text-xs font-semibold tracking-wide ${accent.title}`}>
            {title}
          </p>
          <span className={`h-2 w-8 rounded-full ${accent.pill}`} />
        </div>
        {children}
      </div>
    </motion.div>
  );

  const skeletonCard = (
    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4 animate-pulse">
      <div className="h-3 w-20 bg-slate-200 rounded-full mb-4" />
      <div className="h-7 w-16 bg-slate-200 rounded-full mb-2" />
      <div className="h-3 w-24 bg-slate-100 rounded-full" />
    </div>
  );

  const goToNotifications = () => {
    router.push('/dashboard/notifications');
  };

  return (
    <motion.div
      className="space-y-6"
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25 }}
    >
      {/* Header */}
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-semibold text-slate-900">
            Dashboard
          </h1>
          <p className="text-sm text-slate-500">
            Overview of users, attendance, leaves, tasks, devices and
            documents. Welcome to Offisphere.
          </p>
        </div>

        {/* Notification icon */}
        <motion.button
          whileHover={{ scale: 1.05, y: -1 }}
          whileTap={{ scale: 0.95, y: 0 }}
          onClick={goToNotifications}
          className="relative flex items-center justify-center w-10 h-10 rounded-full bg-white shadow-sm border border-slate-200 text-slate-500 hover:text-indigo-600 hover:shadow-md transition"
          aria-label="Notifications"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-4 w-4"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M18 8a6 6 0 0 0-12 0c0 7-3 9-3 9h18s-3-2-3-9" />
            <path d="M13.73 21a2 2 0 0 1-3.46 0" />
          </svg>
          {/* red dot indicator */}
          <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 bg-rose-500 rounded-full" />
        </motion.button>
      </div>

      {/* Error banner */}
      {error && (
        <div className="text-xs text-red-600 bg-red-50 border border-red-100 rounded-xl px-3 py-2">
          {error}
        </div>
      )}

      {/* Top row: Leaves + Attendance + Users + Leave Summary */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {loading ? (
          <>
            {skeletonCard}
            {skeletonCard}
            {skeletonCard}
            {skeletonCard}
          </>
        ) : (
          <>
            {/* Leaves */}
            <GlowCard
              index={0}
              title="LEAVES"
              accent={{
                border: 'border-indigo-100/70',
                bg: 'bg-gradient-to-br from-indigo-400/15 via-indigo-200/10 to-white',
                glowA: 'bg-indigo-400/15',
                glowB: 'bg-purple-300/15',
                title: 'text-indigo-600',
                pill: 'bg-indigo-500/60'
              }}
            >
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-3xl font-semibold text-slate-900">
                    {s.leaves?.pending ?? 0}
                  </div>
                  <p className="text-xs text-slate-500">Pending requests</p>
                </div>
                <div className="text-right space-y-1 text-xs">
                  <p className="flex items-center justify-end gap-1">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                    <span className="text-slate-500">Approved</span>
                    <span className="font-semibold text-emerald-700">
                      {s.leaves?.approved ?? 0}
                    </span>
                  </p>
                  <p className="flex items-center justify-end gap-1">
                    <span className="h-1.5 w-1.5 rounded-full bg-rose-500 animate-pulse" />
                    <span className="text-slate-500">Rejected</span>
                    <span className="font-semibold text-rose-700">
                      {s.leaves?.rejected ?? 0}
                    </span>
                  </p>
                </div>
              </div>
            </GlowCard>

            {/* Attendance */}
            <GlowCard
              index={1}
              title="ATTENDANCE"
              accent={{
                border: 'border-sky-100/70',
                bg: 'bg-gradient-to-br from-sky-400/15 via-cyan-200/10 to-white',
                glowA: 'bg-cyan-400/18',
                glowB: 'bg-sky-300/14',
                title: 'text-sky-600',
                pill: 'bg-sky-400/60'
              }}
            >
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-3xl font-semibold text-slate-900">
                    {s.attendance?.checkins_today ?? 0}
                  </div>
                  <p className="text-xs text-slate-500">Check-ins today</p>
                </div>
                <div className="text-right text-xs">
                  <p className="flex items-center justify-end gap-1">
                    <span className="h-1.5 w-1.5 rounded-full bg-sky-500 animate-pulse" />
                    <span className="text-slate-500">Users</span>
                    <span className="font-semibold text-slate-900">
                      {s.attendance?.total_users ?? 0}
                    </span>
                  </p>
                </div>
              </div>
            </GlowCard>

            {/* Users */}
            <GlowCard
              index={2}
              title="USERS"
              accent={{
                border: 'border-emerald-100/70',
                bg: 'bg-gradient-to-br from-emerald-400/14 via-teal-200/10 to-white',
                glowA: 'bg-emerald-300/16',
                glowB: 'bg-teal-300/14',
                title: 'text-emerald-600',
                pill: 'bg-emerald-400/60'
              }}
            >
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-3xl font-semibold text-slate-900">
                    {s.users?.total ?? 0}
                  </div>
                  <p className="text-xs text-slate-500">Total users</p>
                </div>
                <div className="text-right space-y-1 text-xs">
                  <p className="flex items-center justify-end gap-1">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                    <span className="text-slate-500">Active</span>
                    <span className="font-semibold text-emerald-700">
                      {s.users?.active ?? 0}
                    </span>
                  </p>
                  <p className="flex items-center justify-end gap-1">
                    <span className="h-1.5 w-1.5 rounded-full bg-indigo-500 animate-pulse" />
                    <span className="text-slate-500">Admins</span>
                    <span className="font-semibold text-indigo-700">
                      {s.users?.admins ?? 0}
                    </span>
                  </p>
                </div>
              </div>
            </GlowCard>

            {/* Leave summary */}
            <GlowCard
              index={3}
              title="WORKFORCE PULSE"
              accent={{
                border: 'border-cyan-100/70',
                bg: 'bg-gradient-to-br from-cyan-300/14 via-teal-200/12 to-white',
                glowA: 'bg-cyan-300/16',
                glowB: 'bg-teal-200/14',
                title: 'text-cyan-600',
                pill: 'bg-cyan-400/70'
              }}
            >
              <div className="grid grid-cols-1 gap-2 text-xs text-slate-700">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="h-2 w-2 rounded-full bg-sky-500 animate-pulse" />
                    <span>Hours logged today</span>
                  </div>
                  <span className="font-semibold text-slate-900">
                    {s.timesheets?.hours_today ?? 0}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="h-2 w-2 rounded-full bg-amber-500 animate-pulse" />
                    <span>Open tasks</span>
                  </div>
                  <span className="font-semibold text-slate-900">
                    {s.tasks?.open ?? 0}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                    <span>Devices available</span>
                  </div>
                  <span className="font-semibold text-slate-900">
                    {s.devices?.available ?? 0}
                  </span>
                </div>
              </div>
            </GlowCard>
          </>
        )}
      </div>

      {/* Operations overview row */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {loading ? (
          <>
            {skeletonCard}
            {skeletonCard}
            {skeletonCard}
            {skeletonCard}
          </>
        ) : (
          <>
            {/* Timesheets */}
            <GlowCard
              index={4}
              title="TIMESHEETS"
              accent={{
                border: 'border-slate-100/70',
                bg: 'bg-gradient-to-br from-white via-slate-50 to-sky-50/50',
                glowA: 'bg-slate-300/20',
                glowB: 'bg-sky-200/16',
                title: 'text-slate-600',
                pill: 'bg-slate-300/70'
              }}
            >
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-2xl font-semibold text-slate-900">
                    {s.timesheets?.entries_today ?? 0}
                  </div>
                  <p className="text-xs text-slate-500">Entries today</p>
                </div>
                <div className="text-right text-xs text-slate-500">
                  <p>
                    Hours:{' '}
                    <span className="font-semibold text-slate-900">
                      {s.timesheets?.hours_today ?? 0}
                    </span>
                  </p>
                </div>
              </div>
            </GlowCard>

            {/* Tasks */}
            <GlowCard
              index={5}
              title="TASKS"
              accent={{
                border: 'border-amber-100/70',
                bg: 'bg-gradient-to-br from-amber-400/14 via-orange-200/12 to-white',
                glowA: 'bg-orange-300/16',
                glowB: 'bg-amber-200/12',
                title: 'text-amber-600',
                pill: 'bg-amber-400/70'
              }}
            >
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-2xl font-semibold text-slate-900">
                    {s.tasks?.open ?? 0}
                  </div>
                  <p className="text-xs text-slate-500">Open tasks</p>
                </div>
                <div className="text-right text-xs space-y-1">
                  <p className="text-slate-600">
                    In progress:{' '}
                    <span className="font-semibold text-sky-600">
                      {s.tasks?.in_progress ?? 0}
                    </span>
                  </p>
                  <p className="text-slate-600">
                    Completed:{' '}
                    <span className="font-semibold text-emerald-600">
                      {s.tasks?.completed ?? 0}
                    </span>
                  </p>
                  <p className="text-slate-600">
                    Overdue:{' '}
                    <span className="font-semibold text-rose-600">
                      {s.tasks?.overdue ?? 0}
                    </span>
                  </p>
                </div>
              </div>
            </GlowCard>

            {/* Devices */}
            <GlowCard
              index={6}
              title="DEVICES"
              accent={{
                border: 'border-rose-100/70',
                bg: 'bg-gradient-to-br from-rose-400/14 via-rose-200/12 to-white',
                glowA: 'bg-rose-300/18',
                glowB: 'bg-pink-200/14',
                title: 'text-rose-600',
                pill: 'bg-rose-400/70'
              }}
            >
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-2xl font-semibold text-slate-900">
                    {s.devices?.total ?? 0}
                  </div>
                  <p className="text-xs text-slate-500">Total devices</p>
                </div>
                <div className="text-right text-xs space-y-1">
                  <p className="text-slate-600">
                    Assigned:{' '}
                    <span className="font-semibold text-sky-600">
                      {s.devices?.assigned ?? 0}
                    </span>
                  </p>
                  <p className="text-slate-600">
                    Available:{' '}
                    <span className="font-semibold text-emerald-600">
                      {s.devices?.available ?? 0}
                    </span>
                  </p>
                </div>
              </div>
            </GlowCard>

            {/* Documents */}
            <GlowCard
              index={7}
              title="DOCUMENTS"
              accent={{
                border: 'border-indigo-100/70',
                bg: 'bg-gradient-to-br from-indigo-400/12 via-indigo-200/10 to-white',
                glowA: 'bg-indigo-300/16',
                glowB: 'bg-blue-200/12',
                title: 'text-indigo-600',
                pill: 'bg-indigo-400/70'
              }}
            >
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-2xl font-semibold text-slate-900">
                    {s.documents?.total ?? 0}
                  </div>
                  <p className="text-xs text-slate-500">
                    Documents in library
                  </p>
                </div>
              </div>
            </GlowCard>
          </>
        )}
      </div>

      {/* Quick actions */}
      <motion.div
        custom={8}
        variants={cardVariants}
        initial="hidden"
        animate="visible"
        className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4"
      >
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-semibold text-slate-900">
            Quick actions
          </h2>
          <span className="text-[11px] text-slate-400">
            Jump to common workflows
          </span>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-5 gap-3 text-xs">
          {[
            {
              href: '/dashboard/users',
              title: 'Add user',
              desc: 'Create a new employee',
              gradient: 'from-indigo-500/90 to-purple-500/90'
            },
            {
              href: '/dashboard/attendance',
              title: 'Record attendance',
              desc: 'Check-in / Check-out',
              gradient: 'from-sky-500/90 to-cyan-500/90'
            },
            {
              href: '/dashboard/leaves',
              title: 'Review leaves',
              desc: 'Approve / reject requests',
              gradient: 'from-emerald-500/90 to-teal-500/90'
            },
            {
              href: '/dashboard/tasks',
              title: 'Create task',
              desc: 'Assign work to team',
              gradient: 'from-amber-500/90 to-orange-500/90'
            },
            {
              href: '/dashboard/devices',
              title: 'Assign device',
              desc: 'Laptop / phone / assets',
              gradient: 'from-rose-500/90 to-pink-500/90'
            }
          ].map((item) => (
            <motion.div
              key={item.href}
              whileHover={{ y: -3, scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              transition={{ duration: 0.15 }}
            >
              <Link
                href={item.href}
                className={`flex flex-col gap-1 px-3 py-2 rounded-2xl bg-gradient-to-br ${item.gradient} text-white shadow hover:shadow-lg transition`}
              >
                <span className="font-semibold text-xs">{item.title}</span>
                <span className="text-[11px] text-indigo-50/90">
                  {item.desc}
                </span>
              </Link>
            </motion.div>
          ))}
        </div>
      </motion.div>

      {/* Recent attendance */}
      <motion.div
        custom={9}
        variants={cardVariants}
        initial="hidden"
        animate="visible"
        className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4"
      >
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-semibold text-slate-900">
            Recent attendance
          </h2>
          <Link
            href="/dashboard/attendance"
            className="text-xs text-indigo-600 hover:underline"
          >
            View all
          </Link>
        </div>
        <div className="overflow-x-auto text-sm">
          <table className="min-w-full border-separate border-spacing-y-2">
            <thead>
              <tr className="text-xs text-slate-400">
                <th className="text-left px-3 py-1">Employee</th>
                <th className="text-left px-3 py-1">Date</th>
                <th className="text-left px-3 py-1">Check in</th>
                <th className="text-left px-3 py-1">Check out</th>
                <th className="text-left px-3 py-1">Status</th>
              </tr>
            </thead>
            <tbody>
              {s.recent_attendance?.length ? (
                s.recent_attendance.map((row) => (
                  <tr
                    key={row.id}
                    className="bg-slate-50 rounded-xl hover:bg-slate-100 transition-colors"
                  >
                    <td className="px-3 py-2 rounded-l-xl text-slate-900">
                      {row.employee_name || row.user_name || '--'}
                    </td>
                    <td className="px-3 py-2 text-slate-600 text-xs">
                      {formatDate(row.date)}
                    </td>
                    <td className="px-3 py-2 text-xs text-slate-600">
                      {formatTime(row.check_in)}
                    </td>
                    <td className="px-3 py-2 text-xs text-slate-600">
                      {formatTime(row.check_out)}
                    </td>
                    <td className="px-3 py-2 rounded-r-xl text-xs">
                      <span className="px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-100">
                        {row.status || 'On_time'}
                      </span>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td
                    colSpan={5}
                    className="px-3 py-6 text-center text-xs text-slate-400"
                  >
                    No recent attendance records.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </motion.div>
    </motion.div>
  );
}

