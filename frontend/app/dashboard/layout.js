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
    items: [
      { href: '/dashboard/devices', label: 'Devices' },
      { href: '/dashboard/documents', label: 'Documents' },
      { href: '/dashboard/reimbursements', label: 'Reimbursements' }
    ]
  },
  {
    id: 'sales',
    label: 'Sales & CRM',
    items: [
      { href: '/dashboard/leads', label: 'Leads' },
      { href: '/dashboard/payments', label: 'Payments' },
      { href: '/dashboard/sales-reports', label: 'Sales Reports' }
    ]
  },
  {
    id: 'sales-accounts',
    label: 'Sales & Accounts',
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

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Fixed sidebar on the left */}
      <aside className="hidden md:flex md:flex-col fixed inset-y-0 left-0 w-64 bg-gradient-to-b from-indigo-700 via-indigo-800 to-purple-900 text-indigo-50">
        {/* Brand */}
        <div className="h-16 px-4 flex items-center border-b border-white/10">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-2xl bg-white/10 ring-1 ring-white/20 flex items-center justify-center text-white text-sm font-semibold shadow-lg shadow-black/20">
              O
            </div>
            <div>
              <div className="text-sm font-semibold text-white">
                Offisphere
              </div>
              <div className="text-[11px] text-indigo-100/80">
                Workplace OS
              </div>
            </div>
          </div>
        </div>

        {/* Dashboard (single item, no dropdown) */}
        <div className="px-3 pt-4 pb-1">
          <Link
            href="/dashboard"
            className={`block px-3 py-2 rounded-xl text-[11px] font-semibold transition ${
              isActive('/dashboard')
                ? 'bg-white text-indigo-900 shadow-sm shadow-black/10'
                : 'bg-white/10 text-indigo-50 hover:bg-white/15'
            }`}
          >
            Dashboard
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
                  className="w-full flex items-center justify-between px-3 py-2 rounded-xl text-[11px] font-semibold text-indigo-100/90 hover:bg-white/10 hover:text-white transition"
                >
                  <span>{group.label}</span>
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
                </button>

                {/* Items */}
                <AnimatePresence initial={false}>
                  {open && (
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
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-full bg-black/25 flex items-center justify-center text-xs font-medium text-white">
                {userName ? userName.charAt(0).toUpperCase() : 'U'}
              </div>
              <div>
                <div className="text-xs font-medium text-white line-clamp-1">
                  {userName || 'Super Admin'}
                </div>
                <div className="inline-flex items-center px-2 py-0.5 rounded-full bg-black/25 text-[10px] text-indigo-100/90 border border-white/10 mt-0.5">
                  {primaryRoleLabel}
                </div>
              </div>
            </div>

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
          </div>
        </div>
      </aside>

      {/* Main content area, shifted right by sidebar width on desktop */}
      <div className="md:ml-64">
        <main className="min-h-screen p-4 md:p-6">{children}</main>
      </div>
    </div>
  );
}
