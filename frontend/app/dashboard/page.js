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

  const renderKpiIcon = (name, color = '#0f172a') => {
    const base = 'w-4 h-4';
    const props = { fill: 'none', stroke: color, strokeWidth: '2', strokeLinecap: 'round', strokeLinejoin: 'round' };
    switch (name) {
      case 'leaf':
        return (
          <svg className={base} viewBox="0 0 24 24" {...props}>
            <path d="M5 21c8 0 14-6 14-14 0 0-12 0-14 12" />
            <path d="M9 15c-2.5 0-4-1.5-4-4" />
          </svg>
        );
      case 'clock':
        return (
          <svg className={base} viewBox="0 0 24 24" {...props}>
            <circle cx="12" cy="12" r="10" />
            <path d="M12 6v6l3 3" />
          </svg>
        );
      case 'users':
        return (
          <svg className={base} viewBox="0 0 24 24" {...props}>
            <path d="M17 21v-2a4 4 0 0 0-4-4H7a4 4 0 0 0-4 4v2" />
            <circle cx="9" cy="7" r="4" />
            <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
            <path d="M16 3.13a4 4 0 0 1 0 7.75" />
          </svg>
        );
      case 'pulse':
        return (
          <svg className={base} viewBox="0 0 24 24" {...props}>
            <path d="M2 12h4l2 7 4-14 2 7h6" />
          </svg>
        );
      case 'calendar':
        return (
          <svg className={base} viewBox="0 0 24 24" {...props}>
            <rect x="3" y="4" width="18" height="18" rx="2" />
            <path d="M16 2v4" />
            <path d="M8 2v4" />
            <path d="M3 10h18" />
          </svg>
        );
      case 'list':
        return (
          <svg className={base} viewBox="0 0 24 24" {...props}>
            <path d="M9 6h12" />
            <path d="M9 12h12" />
            <path d="M9 18h12" />
            <path d="M5 6h.01" />
            <path d="M5 12h.01" />
            <path d="M5 18h.01" />
          </svg>
        );
      case 'monitor':
        return (
          <svg className={base} viewBox="0 0 24 24" {...props}>
            <rect x="2" y="3" width="20" height="14" rx="2" />
            <path d="M12 17v4" />
            <path d="M8 21h8" />
          </svg>
        );
      case 'file':
        return (
          <svg className={base} viewBox="0 0 24 24" {...props}>
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8Z" />
            <path d="M14 2v6h6" />
          </svg>
        );
      case 'quote':
        return (
          <svg className={base} viewBox="0 0 24 24" {...props}>
            <path d="M7 7h10" />
            <path d="M7 12h10" />
            <path d="M7 17h6" />
            <path d="M17 17h0" />
          </svg>
        );
      case 'truck':
        return (
          <svg className={base} viewBox="0 0 24 24" {...props}>
            <path d="M10 17h4" />
            <path d="M3 17h2" />
            <path d="M17 17h2" />
            <path d="M3 13V6a1 1 0 0 1 1-1h11v12H4a1 1 0 0 1-1-1Z" />
            <path d="M14 8h4l3 3v6a1 1 0 0 1-1 1h-2" />
            <circle cx="5.5" cy="17.5" r="1.5" />
            <circle cx="17.5" cy="17.5" r="1.5" />
          </svg>
        );
      case 'cash':
        return (
          <svg className={base} viewBox="0 0 24 24" {...props}>
            <rect x="2" y="5" width="20" height="14" rx="2" />
            <circle cx="12" cy="12" r="3" />
            <path d="M7 10h.01M17 14h.01" />
          </svg>
        );
      default:
        return <span className={base}>•</span>;
    }
  };
  const renderQAIcon = (name) => {
    const common = 'w-4 h-4 text-white';
    switch (name) {
      case 'user':
        return (
          <svg className={common} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M17 21v-2a4 4 0 0 0-4-4H7a4 4 0 0 0-4 4v2" />
            <circle cx="9" cy="7" r="4" />
          </svg>
        );
      case 'clock':
        return (
          <svg className={common} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10" />
            <path d="M12 6v6l3 3" />
          </svg>
        );
      case 'check':
        return (
          <svg className={common} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M20 6 9 17l-5-5" />
          </svg>
        );
      case 'tasks':
        return (
          <svg className={common} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M9 6h11" />
            <path d="M9 12h11" />
            <path d="M9 18h11" />
            <path d="m3 6 1.5 1.5L6 6" />
            <path d="m3 12 1.5 1.5L6 12" />
            <path d="m3 18 1.5 1.5L6 18" />
          </svg>
        );
      case 'device':
        return (
          <svg className={common} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="3" y="4" width="18" height="14" rx="2" />
            <path d="M8 20h8" />
          </svg>
        );
      case 'money':
        return (
          <svg className={common} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="9" />
            <path d="M12 7v10" />
            <path d="M8.5 9.5A3.5 3.5 0 0 1 12 7h1a3 3 0 1 1 0 6h-2a3 3 0 1 0 0 6h1.5a3.5 3.5 0 0 0 3.5-3.5" />
          </svg>
        );
      default:
        return <span className={common}>•</span>;
    }
  };

  const cardVariants = {
    hidden: { opacity: 0, y: 10 },
    visible: (i) => ({
      opacity: 1,
      y: 0,
      transition: { delay: 0.05 * i, duration: 0.25 }
    })
  };

  const GlowCard = ({ title, accent, index = 0, children, cardKey }) => (
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
          <div className="h-8 w-8 rounded-full bg-white/30 border border-white/40 flex items-center justify-center">
            {renderKpiIcon(accent.icon || 'pulse', accent.iconColor || '#0f172a')}
          </div>
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

      <div className="space-y-4">
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
              cardKey="leaves"
              title="LEAVES"
              accent={{
                border: 'border-indigo-100/70',
                bg: 'bg-gradient-to-br from-indigo-400/15 via-indigo-200/10 to-white',
                glowA: 'bg-indigo-400/15',
                glowB: 'bg-purple-300/15',
                title: 'text-indigo-600',
                pill: 'bg-indigo-500/60',
                icon: 'leaf',
                iconColor: '#4f46e5'
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
              cardKey="attendance"
              title="ATTENDANCE"
              accent={{
                border: 'border-sky-100/70',
                bg: 'bg-gradient-to-br from-sky-400/15 via-cyan-200/10 to-white',
                glowA: 'bg-cyan-400/18',
                glowB: 'bg-sky-300/14',
                title: 'text-sky-600',
                pill: 'bg-sky-400/60',
                icon: 'clock',
                iconColor: '#0ea5e9'
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
              cardKey="users"
              title="USERS"
              accent={{
                border: 'border-emerald-100/70',
                bg: 'bg-gradient-to-br from-emerald-400/14 via-teal-200/10 to-white',
                glowA: 'bg-emerald-300/16',
                glowB: 'bg-teal-300/14',
                title: 'text-emerald-600',
                pill: 'bg-emerald-400/60',
                icon: 'users',
                iconColor: '#10b981'
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
              cardKey="workforce"
              title="WORKFORCE PULSE"
              accent={{
                border: 'border-cyan-100/70',
                bg: 'bg-gradient-to-br from-cyan-300/14 via-teal-200/12 to-white',
                glowA: 'bg-cyan-300/16',
                glowB: 'bg-teal-200/14',
                title: 'text-cyan-600',
                pill: 'bg-cyan-400/70',
                icon: 'pulse',
                iconColor: '#06b6d4'
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
              cardKey="timesheets"
              title="TIMESHEETS"
              accent={{
                border: 'border-slate-100/70',
                bg: 'bg-gradient-to-br from-white via-slate-50 to-sky-50/50',
                glowA: 'bg-slate-300/20',
                glowB: 'bg-sky-200/16',
                title: 'text-slate-600',
                pill: 'bg-slate-300/70',
                icon: 'calendar',
                iconColor: '#64748b'
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
              cardKey="tasks"
              title="TASKS"
              accent={{
                border: 'border-amber-100/70',
                bg: 'bg-gradient-to-br from-amber-400/14 via-orange-200/12 to-white',
                glowA: 'bg-orange-300/16',
                glowB: 'bg-amber-200/12',
                title: 'text-amber-600',
                pill: 'bg-amber-400/70',
                icon: 'list',
                iconColor: '#f59e0b'
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
              cardKey="devices"
              title="DEVICES"
              accent={{
                border: 'border-rose-100/70',
                bg: 'bg-gradient-to-br from-rose-400/14 via-rose-200/12 to-white',
                glowA: 'bg-rose-300/18',
                glowB: 'bg-pink-200/14',
                title: 'text-rose-600',
                pill: 'bg-rose-400/70',
                icon: 'monitor',
                iconColor: '#e11d48'
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
              cardKey="documents"
              title="DOCUMENTS"
              accent={{
                border: 'border-indigo-100/70',
                bg: 'bg-gradient-to-br from-indigo-400/12 via-indigo-200/10 to-white',
                glowA: 'bg-indigo-300/16',
                glowB: 'bg-blue-200/12',
                title: 'text-indigo-600',
                pill: 'bg-indigo-400/70',
                icon: 'file',
                iconColor: '#4f46e5'
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

      {/* Sales & Accounts snapshots */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {loading ? (
          <>
            {skeletonCard}
            {skeletonCard}
            {skeletonCard}
          </>
        ) : (
          <>
            <GlowCard
              index={8}
              cardKey="sales_quotes"
              title="SALES QUOTES"
              accent={{
                border: 'border-fuchsia-100/70',
                bg: 'bg-gradient-to-br from-fuchsia-400/14 via-pink-200/12 to-white',
                glowA: 'bg-fuchsia-300/16',
                glowB: 'bg-pink-200/14',
                title: 'text-fuchsia-600',
                pill: 'bg-fuchsia-400/70',
                icon: 'quote',
                iconColor: '#c026d3'
              }}
            >
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-2xl font-semibold text-slate-900">
                    {s.sales?.quotations ?? 0}
                  </div>
                  <p className="text-xs text-slate-500">Quotations created</p>
                </div>
                <div className="text-right text-xs text-slate-600">
                  <p>
                    Open:{' '}
                    <span className="font-semibold text-fuchsia-600">
                      {s.sales?.quotations_open ?? 0}
                    </span>
                  </p>
                </div>
              </div>
            </GlowCard>

            <GlowCard
              index={9}
              cardKey="orders_delivery"
              title="ORDERS & DELIVERY"
              accent={{
                border: 'border-sky-100/70',
                bg: 'bg-gradient-to-br from-sky-400/14 via-blue-200/12 to-white',
                glowA: 'bg-blue-300/16',
                glowB: 'bg-sky-200/14',
                title: 'text-sky-600',
                pill: 'bg-sky-400/70',
                icon: 'truck',
                iconColor: '#0ea5e9'
              }}
            >
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-2xl font-semibold text-slate-900">
                    {s.sales?.orders ?? 0}
                  </div>
                  <p className="text-xs text-slate-500">Sales orders</p>
                </div>
                <div className="text-right text-xs text-slate-600 space-y-1">
                  <p>
                    Deliveries:{' '}
                    <span className="font-semibold text-sky-600">
                      {s.sales?.deliveries ?? 0}
                    </span>
                  </p>
                  <p>
                    Pending:{' '}
                    <span className="font-semibold text-amber-600">
                      {s.sales?.orders_pending ?? 0}
                    </span>
                  </p>
                </div>
              </div>
            </GlowCard>

            <GlowCard
              index={10}
              cardKey="invoices_cash"
              title="INVOICES & CASH"
              accent={{
                border: 'border-emerald-100/70',
                bg: 'bg-gradient-to-br from-emerald-400/14 via-teal-200/12 to-white',
                glowA: 'bg-emerald-300/16',
                glowB: 'bg-teal-200/14',
                title: 'text-emerald-600',
                pill: 'bg-emerald-400/70',
                icon: 'cash',
                iconColor: '#059669'
              }}
            >
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-2xl font-semibold text-slate-900">
                    {s.sales?.invoices ?? 0}
                  </div>
                  <p className="text-xs text-slate-500">Invoices posted</p>
                </div>
                <div className="text-right text-xs text-slate-600 space-y-1">
                  <p>
                    Cash in:{' '}
                    <span className="font-semibold text-emerald-600">
                      {s.sales?.payments_in ?? 0}
                    </span>
                  </p>
                  <p>
                    Cash out:{' '}
                    <span className="font-semibold text-rose-600">
                      {s.sales?.payments_out ?? 0}
                    </span>
                  </p>
                </div>
              </div>
            </GlowCard>
          </>
        )}
      </div>

      </div> {/* end drag container */}

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

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 text-xs">
          {[
            {
              href: '/dashboard/users',
              title: 'Add user',
              desc: 'Create a new employee',
              gradient: 'from-indigo-500 to-purple-500',
              icon: 'user'
            },
            {
              href: '/dashboard/attendance',
              title: 'Record attendance',
              desc: 'Check-in / Check-out',
              gradient: 'from-sky-500 to-cyan-500',
              icon: 'clock'
            },
            {
              href: '/dashboard/leaves',
              title: 'Review leaves',
              desc: 'Approve / reject requests',
              gradient: 'from-emerald-500 to-teal-500',
              icon: 'check'
            },
            {
              href: '/dashboard/tasks',
              title: 'Create task',
              desc: 'Assign work to team',
              gradient: 'from-amber-500 to-orange-500',
              icon: 'tasks'
            },
            {
              href: '/dashboard/devices',
              title: 'Assign device',
              desc: 'Laptop / phone / assets',
              gradient: 'from-rose-500 to-pink-500',
              icon: 'device'
            },
            {
              href: '/dashboard/sales-accounts',
              title: 'Sales & Accounts',
              desc: 'Quotes, orders, invoices, payments',
              gradient: 'from-fuchsia-500 to-violet-500',
              icon: 'money'
            }
          ].map((item) => (
            <motion.div
              key={item.href}
              whileHover={{ y: -4, scale: 1.01 }}
              whileTap={{ scale: 0.99 }}
              transition={{ duration: 0.15 }}
            >
              <Link
                href={item.href}
                className={`flex items-center gap-3 px-4 py-3 rounded-2xl text-white shadow hover:shadow-lg transition bg-gradient-to-r ${item.gradient}`}
              >
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/15 border border-white/10">
                  {renderQAIcon(item.icon)}
                </div>
                <div className="flex flex-col">
                  <span className="font-semibold text-sm">
                    {item.title}
                  </span>
                  <span className="text-[11px] text-white/90">
                    {item.desc}
                  </span>
                </div>
              </Link>
            </motion.div>
          ))}
        </div>
      </motion.div>

    </motion.div>
  );
}

