'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';

export default function DashboardHome() {
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

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
            <path d="M20 4c-9 0-14 6-14 12 0 4 3 7 7 7 6 0 12-5 12-14 0 0-2 0-5-5Z" />
            <path d="M9 14c2 0 4 1 5 3" />
            <path d="M9 10c1.5 0 3 0.5 4 2" />
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
      case 'device':
        return (
          <svg className={base} viewBox="0 0 24 24" {...props}>
            <rect x="3" y="4" width="14" height="12" rx="2" />
            <rect x="18" y="7" width="3" height="7" rx="1" />
            <path d="M10 16v4" />
            <path d="M7 20h6" />
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
        return <span className={base}>???</span>;
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
        return <span className={common}>???</span>;
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

  const GlowCard = ({ title, accent, index = 0, children }) => (
    <motion.div
      custom={index}
      variants={cardVariants}
      initial="hidden"
      animate="visible"
      whileHover={{ y: -5, boxShadow: "0 20px 40px rgba(0,0,0,0.08)" }}
      className="relative flex items-center justify-between rounded-2xl bg-white border border-slate-100 shadow-[0_8px_30px_rgb(0,0,0,0.04)] p-5 border-l-[6px] transition-all duration-300 h-full"
      style={{ borderLeftColor: accent.iconColor || accent.color }}
    >
      <div className="flex-1 min-w-0 pr-4">
        <p className="text-[11px] font-bold tracking-wider text-slate-400 uppercase mb-1 drop-shadow-sm">
          {title}
        </p>
        <div className="relative">
          {children}
        </div>
      </div>
      
      <div 
        className="flex-shrink-0 h-14 w-14 rounded-2xl bg-white shadow-[0_10px_25px_rgba(0,0,0,0.06)] border border-slate-50 flex items-center justify-center overflow-hidden"
        style={{ color: accent.iconColor }}
      >
        <div className="opacity-90">
          {renderKpiIcon(accent.icon || 'pulse', accent.iconColor || '#0f172a')}
        </div>
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
            Hello Admin 👋
          </h1>
          <p className="text-sm text-slate-500">
            Overview of users, attendance, leaves, tasks, devices and
            documents.
          </p>
        </div>
      </div>

      {/* Error banner */}
      {error && (
        <div className="text-xs text-rose-600 bg-rose-50 border border-rose-100 rounded-xl px-3 py-2">
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
              title="Leaves"
              accent={{
                icon: 'leaf',
                iconColor: '#6366f1'
              }}
            >
              <div>
                <div className="text-3xl font-bold text-slate-900 tracking-tight">
                  {s.leaves?.pending ?? 0}
                </div>
                <div className="flex items-center gap-3 mt-1 text-[10px] font-medium uppercase tracking-wider">
                  <span className="text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded-md border border-emerald-100/50">
                    Appr: {s.leaves?.approved ?? 0}
                  </span>
                  <span className="text-rose-600 bg-rose-50 px-1.5 py-0.5 rounded-md border border-rose-100/50">
                    Rej: {s.leaves?.rejected ?? 0}
                  </span>
                </div>
              </div>
            </GlowCard>

            {/* Attendance */}
            <GlowCard
              index={1}
              title="Attendance"
              accent={{
                icon: 'clock',
                iconColor: '#0ea5e9'
              }}
            >
              <div>
                <div className="text-3xl font-bold text-slate-900 tracking-tight">
                  {s.attendance?.checkins_today ?? 0}
                </div>
                <p className="text-xs text-slate-400 font-medium mt-0.5">Check-ins today</p>
              </div>
            </GlowCard>

            {/* Users */}
            <GlowCard
              index={2}
              title="Users"
              accent={{
                icon: 'users',
                iconColor: '#10b981'
              }}
            >
              <div>
                <div className="text-3xl font-bold text-slate-900 tracking-tight">
                  {s.users?.total ?? 0}
                </div>
                <div className="flex items-center gap-3 mt-1 text-[10px] font-medium uppercase tracking-wider text-slate-500">
                  <span>Active: <span className="text-emerald-600">{s.users?.active ?? 0}</span></span>
                  <span>Admins: <span className="text-indigo-600">{s.users?.admins ?? 0}</span></span>
                </div>
              </div>
            </GlowCard>

            {/* Pulse */}
            <GlowCard
              index={3}
              title="Workforce Pulse"
              accent={{
                icon: 'pulse',
                iconColor: '#06b6d4'
              }}
            >
              <div className="space-y-1.5 mt-1">
                <div className="flex items-center justify-between text-[11px] font-medium">
                  <span className="text-slate-500">Hours Today</span>
                  <span className="text-slate-900 font-bold">{s.timesheets?.hours_today ?? 0}h</span>
                </div>
                <div className="flex items-center justify-between text-[11px] font-medium">
                  <span className="text-slate-500">Open Tasks</span>
                  <span className="text-amber-600 font-bold">{s.tasks?.open ?? 0}</span>
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
              title="Timesheets"
              accent={{
                icon: 'calendar',
                iconColor: '#64748b'
              }}
            >
              <div>
                <div className="text-3xl font-bold text-slate-900 tracking-tight">
                  {s.timesheets?.entries_today ?? 0}
                </div>
                <p className="text-xs text-slate-400 font-medium mt-0.5">
                  {s.timesheets?.hours_today ?? 0}h logged today
                </p>
              </div>
            </GlowCard>

            {/* Tasks */}
            <GlowCard
              index={5}
              title="Tasks"
              accent={{
                icon: 'list',
                iconColor: '#f59e0b'
              }}
            >
              <div>
                <div className="text-3xl font-bold text-slate-900 tracking-tight">
                  {s.tasks?.open ?? 0}
                </div>
                <div className="flex items-center gap-2 mt-1 px-2 py-0.5 bg-rose-50 border border-rose-100/60 rounded-full w-fit">
                  <span className="text-[9px] font-bold text-rose-600 uppercase tracking-tighter">
                    {s.tasks?.overdue ?? 0} Overdue
                  </span>
                </div>
              </div>
            </GlowCard>

            {/* Devices */}
            <GlowCard
              index={6}
              title="Devices"
              accent={{
                icon: 'device',
                iconColor: '#ec4899'
              }}
            >
              <div>
                <div className="text-3xl font-bold text-slate-900 tracking-tight">
                  {s.devices?.total ?? 0}
                </div>
                <p className="text-xs text-slate-400 font-medium mt-0.5">
                  {s.devices?.available ?? 0} available
                </p>
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
        className="space-y-4"
      >
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-semibold text-slate-900">
            Quick actions
          </h2>
          <span className="text-[11px] text-slate-400">
            Jump to common workflows
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[
            {
              href: '/dashboard/users',
              title: 'Add user',
              desc: 'Create a new employee',
              color: '#a855f7',
              icon: 'user'
            },
            {
              href: '/dashboard/attendance',
              title: 'Record attendance',
              desc: 'Check-in / Check-out',
              color: '#06b6d4',
              icon: 'clock'
            },
            {
              href: '/dashboard/leaves',
              title: 'Review leaves',
              desc: 'Approve / reject requests',
              color: '#10b981',
              icon: 'check'
            },
            {
              href: '/dashboard/tasks',
              title: 'Create task',
              desc: 'Assign work to team',
              color: '#f97316',
              icon: 'tasks'
            },
            {
              href: '/dashboard/devices',
              title: 'Assign device',
              desc: 'Laptop / phone / assets',
              color: '#f43f5e',
              icon: 'device'
            },
            {
              href: '/dashboard/sales-accounts',
              title: 'Sales & Accounts',
              desc: 'Quotes, orders, invoices, payments',
              color: '#7c3aed',
              icon: 'money'
            }
          ].map((item) => (
            <motion.div
              key={item.href}
              whileHover="hover"
              whileTap={{ scale: 0.98 }}
              className="relative group cursor-pointer"
            >
              <Link
                href={item.href}
                className="relative block overflow-hidden rounded-2xl p-6 text-white h-44 shadow-[0_15px_30px_rgba(0,0,0,0.12)] transition-all duration-300"
                style={{ backgroundColor: item.color }}
                variants={{
                  hover: { 
                    y: -4, 
                    scale: 1.02,
                    boxShadow: "0 20px 40px rgba(0,0,0,0.18)"
                  }
                }}
              >
                {/* Corner highlight shape */}
                <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-bl-full translate-x-12 -translate-y-12 transition-transform duration-500 group-hover:translate-x-8 group-hover:-translate-y-8" />
                
                {/* Hover Arrow */}
                <motion.div
                  variants={{
                    hover: { opacity: 1, x: 0 }
                  }}
                  initial={{ opacity: 0, x: -10 }}
                  className="absolute top-6 right-6 z-20"
                >
                  <svg 
                    width="24" 
                    height="24" 
                    viewBox="0 0 24 24" 
                    fill="none" 
                    stroke="currentColor" 
                    strokeWidth="2.5" 
                    strokeLinecap="round" 
                    strokeLinejoin="round" 
                    className="text-white/90 drop-shadow-sm"
                  >
                    <line x1="5" y1="12" x2="19" y2="12"></line>
                    <polyline points="12 5 19 12 12 19"></polyline>
                  </svg>
                </motion.div>

                <div className="relative z-10 h-full flex flex-col justify-between">
                  <div className="w-12 h-12 flex items-center justify-center rounded-xl bg-white/20 backdrop-blur-md border border-white/20 shadow-inner">
                    <div className="scale-110 drop-shadow-sm">
                      {renderQAIcon(item.icon)}
                    </div>
                  </div>
                  
                  <div className="space-y-0.5">
                    <h3 className="font-bold text-lg leading-tight tracking-tight drop-shadow-md">
                      {item.title}
                    </h3>
                    <p className="text-xs text-white/80 font-medium">
                      {item.desc}
                    </p>
                  </div>
                </div>
              </Link>
            </motion.div>
          ))}
        </div>
      </motion.div>

    </motion.div>
  );
}






