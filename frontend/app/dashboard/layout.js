'use client';

import { usePathname, useRouter } from 'next/navigation';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

// Only grouped sections now (Dashboard is separate, not a dropdown)
const navGroups = [
  {
    id: 'hr',
    label: 'HR Management',
    icon: 'users',
    items: [
      { href: '/dashboard/users', label: 'Users' },
      { href: '/dashboard/attendance', label: 'Attendance' },
      { href: '/dashboard/timesheets', label: 'Timesheets' },
      { href: '/dashboard/leaves', label: 'Leaves' },
      { href: '/dashboard/tasks', label: 'Tasks' }
    ]
  },
  {
    id: 'ops',
    label: 'Assets & Operations',
    icon: 'box',
    items: [
      { href: '/dashboard/devices', label: 'Devices' },
      { href: '/dashboard/documents', label: 'Documents' },
      { href: '/dashboard/reimbursements', label: 'Reimbursements' }
    ]
  },
  {
    id: 'sales',
    label: 'Sales & CRM',
    icon: 'chart',
    items: [
      { href: '/dashboard/leads', label: 'Leads' },
      { href: '/dashboard/payments', label: 'Payments' },
      { href: '/dashboard/sales-reports', label: 'Sales Reports' }
    ]
  },
  {
    id: 'sales-accounts',
    label: 'Sales & Accounts',
    icon: 'briefcase',
    items: [
      { href: '/dashboard/sales-accounts', label: 'Overview' },
      { href: '/dashboard/sales-accounts/procurement', label: 'Procurement' },
      { href: '/dashboard/sales-accounts/sales', label: 'Sales' },
      { href: '/dashboard/sales-accounts/inventory', label: 'Inventory' },
      { href: '/dashboard/sales-accounts/payments', label: 'Payments' },
      { href: '/dashboard/sales-accounts/accounting', label: 'Accounting' },
      { href: '/dashboard/sales-accounts/prints', label: 'Print Docs' }
    ]
  },
  {
    id: 'finance',
    label: 'Finance & Admin',
    icon: 'card',
    items: [
      { href: '/dashboard/payroll', label: 'Payroll' },
      { href: '/dashboard/recognition', label: 'Recognition' },
      { href: '/dashboard/email', label: 'Email' },
      { href: '/dashboard/exports', label: 'Exports' },
      { href: '/dashboard/reports', label: 'Reports' }
    ]
  }
];

export default function DashboardLayout({ children }) {
  const router = useRouter();
  const pathname = usePathname();

  const [userName, setUserName] = useState('');
  const [roles, setRoles] = useState([]);
  const [openGroups, setOpenGroups] = useState({});
  const [cursorPos, setCursorPos] = useState({ x: 0, y: 0 });
  const [cursorActive, setCursorActive] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  // Auth + user info
  useEffect(() => {
    try {
      const token =
        typeof window !== 'undefined'
          ? window.localStorage.getItem('offisphere_token')
          : null;

      if (!token) {
        router.replace('/');
        return;
      }

      const userStr =
        typeof window !== 'undefined'
          ? window.localStorage.getItem('offisphere_user')
          : null;

      if (userStr) {
        const user = JSON.parse(userStr);
        setUserName(user.full_name || user.name || user.email || 'User');
      }

      const rolesStr =
        typeof window !== 'undefined'
          ? window.localStorage.getItem('offisphere_roles')
          : null;

      if (rolesStr) {
        try {
          const parsed = JSON.parse(rolesStr);
          setRoles(Array.isArray(parsed) ? parsed : []);
        } catch {
          setRoles([]);
        }
      }
    } catch {
      router.replace('/');
    }
  }, [router]);

  // Open correct groups based on current route
  useEffect(() => {
    const initial = {};
    navGroups.forEach((group) => {
      const containsActive = group.items.some((item) =>
        pathname.startsWith(item.href)
      );
      initial[group.id] = containsActive;
    });
    setOpenGroups(initial);
  }, [pathname]);

  const handleLogout = () => {
    if (typeof window !== 'undefined') {
      Object.keys(window.localStorage)
        .filter((k) => k.startsWith('offisphere_'))
        .forEach((k) => window.localStorage.removeItem(k));
    }
    router.replace('/');
  };

  const toggleGroup = (id) => {
    setOpenGroups((prev) => ({
      ...prev,
      [id]: !prev[id]
    }));
  };

  const isActive = (href) =>
    pathname === href || pathname.startsWith(href + '/');

  const primaryRoleLabel = roles[0] ? roles[0].toUpperCase() : 'SUPER ADMIN';

  const renderIcon = (name, className = 'text-white') => {
    const common = `w-4 h-4 ${className}`;
    switch (name) {
      case 'home':
        return (
          <svg className={common} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M3 9.5 12 3l9 6.5V21H3V9.5Z" />
            <path d="M9 21V12h6v9" />
          </svg>
        );
      case 'users':
        return (
          <svg className={common} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M17 21v-2a4 4 0 0 0-4-4H7a4 4 0 0 0-4 4v2" />
            <circle cx="9" cy="7" r="4" />
            <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
            <path d="M16 3.13a4 4 0 0 1 0 7.75" />
          </svg>
        );
      case 'box':
        return (
          <svg className={common} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="m21 16-9 5-9-5" />
            <path d="m3 8 9 5 9-5-9-5-9 5z" />
            <path d="M3 8v8" />
            <path d="M21 8v8" />
          </svg>
        );
      case 'chart':
        return (
          <svg className={common} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M3 3v18h18" />
            <path d="m19 9-5 5-4-4-3 3" />
            <path d="m15 9h4v4" />
          </svg>
        );
      case 'briefcase':
        return (
          <svg className={common} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 13V7a2 2 0 0 0-2-2h-3V3H8v2H5a2 2 0 0 0-2 2v6" />
            <path d="M3 13v6a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-6" />
            <path d="M12 17v-6" />
          </svg>
        );
      case 'card':
        return (
          <svg className={common} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="2" y="5" width="20" height="14" rx="2" ry="2" />
            <path d="M2 10h20" />
            <path d="M7 15h1" />
            <path d="M14 15h4" />
          </svg>
        );
      default:
        return <span className={common}>•</span>;
    }
  };

  // Custom cursor (circle) with hover response on interactive elements
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const handleMove = (e) => {
      const x = e.clientX;
      const y = e.clientY;
      setCursorPos({ x, y });

      const interactive = e.target?.closest?.(
        'a, button, input, select, textarea, [role="button"], [data-interactive]'
      );
      setCursorActive(!!interactive);
    };

    window.addEventListener('pointermove', handleMove);
    return () => {
      window.removeEventListener('pointermove', handleMove);
    };
  }, []);

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Fixed sidebar on the left */}
      <aside
        className={`hidden md:flex md:flex-col fixed inset-y-0 left-0 overflow-visible ${
          sidebarCollapsed ? 'w-16' : 'w-64'
        } bg-gradient-to-b from-indigo-700 via-indigo-800 to-purple-900 text-indigo-50 transition-[width,transform] duration-300 ease-in-out ${
          sidebarCollapsed ? '-translate-x-0' : 'translate-x-0'
        }`}
      >
        {/* Brand */}
        <div className="h-16 px-4 flex items-center justify-between gap-2 border-b border-white/10 w-full">
          <div className="flex items-center gap-3 flex-shrink-0">
            <div className="h-9 w-9 rounded-2xl bg-white/10 ring-1 ring-white/20 flex items-center justify-center text-white text-sm font-semibold shadow-lg shadow-black/20">
              O
            </div>
            {!sidebarCollapsed && (
              <div>
                <div className="text-sm font-semibold text-white">
                  Offisphere
                </div>
                <div className="text-[11px] text-indigo-100/80">
                  Workplace OS
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Collapse/expand arrow */}
        <button
          type="button"
          data-interactive
          onClick={() => setSidebarCollapsed((v) => !v)}
          className="absolute top-3 -right-3 h-7 w-7 rounded-full bg-white text-slate-700 shadow-lg shadow-black/20 border border-slate-200 ring-4 ring-black ring-offset-[3px] ring-offset-indigo-800 flex items-center justify-center hover:bg-slate-50 transition md:flex"
          aria-label={sidebarCollapsed ? 'Open menu' : 'Hide menu'}
        >
          <span className="text-sm leading-none">{sidebarCollapsed ? '›' : '‹'}</span>
        </button>

        {/* Dashboard (single item, no dropdown) */}
        <div className="px-3 pt-4 pb-1">
          <Link
            href="/dashboard"
            className={`flex items-center gap-3 px-3 py-2 rounded-xl text-[11px] font-semibold transition ${
              isActive('/dashboard')
                ? 'bg-white text-indigo-900 shadow-sm shadow-black/10'
                : 'bg-white/10 text-indigo-50 hover:bg-white/15'
            }`}
          >
            <span className="text-base drop-shadow-sm">
              {renderIcon('home', isActive('/dashboard') ? 'text-indigo-900' : 'text-white')}
            </span>
            {!sidebarCollapsed && <span>Dashboard</span>}
          </Link>
        </div>

        {/* Grouped nav (no internal scroll) */}
        <nav className="flex-1 px-3 pb-3 space-y-3 text-sm">
          {navGroups.map((group) => {
            const open = openGroups[group.id];

            return (
              <div key={group.id} className="space-y-1">
                {/* Group header */}
                <button
                  type="button"
                  onClick={() => toggleGroup(group.id)}
                  className={`w-full flex items-center ${
                    sidebarCollapsed ? 'justify-center' : 'justify-between'
                  } px-3 py-2 rounded-xl text-[11px] font-semibold text-indigo-100/90 hover:bg-white/10 hover:text-white transition`}
                >
                  <span className="flex items-center gap-2">
                    <span className="text-base drop-shadow-sm">
                      {renderIcon(group.icon, sidebarCollapsed ? 'text-white' : 'text-indigo-100/90')}
                    </span>
                    {!sidebarCollapsed && <span>{group.label}</span>}
                  </span>
                  {!sidebarCollapsed && (
                    <motion.span
                      animate={{ rotate: open ? 90 : 0 }}
                      transition={{ duration: 0.15 }}
                      className="text-indigo-100/70"
                    >
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-3 w-3"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <polyline points="9 18 15 12 9 6" />
                      </svg>
                    </motion.span>
                  )}
                </button>

                {/* Items */}
                <AnimatePresence initial={false}>
                  {open && !sidebarCollapsed && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      transition={{ duration: 0.18 }}
                      className="pl-2 space-y-0.5"
                    >
                      {group.items.map((item) => {
                        const active = isActive(item.href);
                        return (
                          <Link
                            key={item.href}
                            href={item.href}
                            className={`block px-3 py-1.5 rounded-lg text-[11px] transition ${
                              active
                                ? 'bg-white text-indigo-900 font-semibold shadow-sm shadow-black/10'
                                : 'text-indigo-100/80 hover:bg-white/10 hover:text-white'
                            }`}
                          >
                            {item.label}
                          </Link>
                        );
                      })}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            );
          })}
        </nav>

        {/* User / logout */}
        <div className="border-t border-white/10 px-3 py-3">
          <div className={`flex items-center ${sidebarCollapsed ? 'justify-center' : 'justify-between'} gap-2`}>
            <div className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-full bg-black/25 flex items-center justify-center text-xs font-medium text-white">
                {userName ? userName.charAt(0).toUpperCase() : 'U'}
              </div>
              {!sidebarCollapsed && (
                <div>
                  <div className="text-xs font-medium text-white line-clamp-1">
                    {userName || 'Super Admin'}
                  </div>
                  <div className="inline-flex items-center px-2 py-0.5 rounded-full bg-black/25 text-[10px] text-indigo-100/90 border border-white/10 mt-0.5">
                    {primaryRoleLabel}
                  </div>
                </div>
              )}
            </div>

            {!sidebarCollapsed && (
              <button
                type="button"
                onClick={handleLogout}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/10 text-[11px] text-rose-100 border border-white/20 hover:bg-rose-500/35 hover:border-rose-100 hover:text-white transition shadow-sm shadow-black/20"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-3.5 w-3.5"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                  <polyline points="16 17 21 12 16 7" />
                  <line x1="21" y1="12" x2="9" y2="12" />
                </svg>
                <span>Logout</span>
              </button>
            )}
          </div>
        </div>
      </aside>

      {/* Main content area, shifted right by sidebar width on desktop */}
      <div
        className={`md:transition-[margin-left] duration-300 ease-in-out ${
          sidebarCollapsed ? 'md:ml-16' : 'md:ml-64'
        }`}
      >
        <main className="min-h-screen p-4 md:p-6">{children}</main>
      </div>

      {/* Custom cursor overlay */}
      <div
        className="pointer-events-none fixed inset-0 z-[9999]"
        aria-hidden="true"
      >
        <div
          className="absolute rounded-full mix-blend-difference"
          style={{
            width: cursorActive ? 26 : 18,
            height: cursorActive ? 26 : 18,
            transform: `translate(${cursorPos.x - (cursorActive ? 13 : 9)}px, ${
              cursorPos.y - (cursorActive ? 13 : 9)
            }px)`,
            transition: 'transform 120ms ease, width 120ms ease, height 120ms ease',
            background: 'rgba(12,12,12,0.85)',
            boxShadow: cursorActive
              ? '0 0 0 8px rgba(0,0,0,0.12)'
              : '0 0 0 4px rgba(0,0,0,0.08)'
          }}
        />
      </div>
    </div>
  );
}
