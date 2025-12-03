'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

export default function DashboardLayout({ children }) {
  const pathname = usePathname();
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [userName, setUserName] = useState('');
  const [roles, setRoles] = useState([]);

  useEffect(() => {
    const token = window.localStorage.getItem('offisphere_token');
    const userStr = window.localStorage.getItem('offisphere_user');
    const rolesStr = window.localStorage.getItem('offisphere_roles');

    if (!token) {
      router.replace('/');
      return;
    }

    if (userStr) {
      try {
        const user = JSON.parse(userStr);
        setUserName(user.full_name || '');
      } catch {
        setUserName('');
      }
    }

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

    setLoading(false);
  }, [router]);

  const handleLogout = () => {
    window.localStorage.removeItem('offisphere_token');
    window.localStorage.removeItem('offisphere_user');
    window.localStorage.removeItem('offisphere_roles');
    router.replace('/');
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-100 text-slate-600">
        Loading dashboard...
      </div>
    );
  }

  const navItems = [
    { href: '/dashboard', label: 'Dashboard' },
    { href: '/dashboard/users', label: 'Users' },
    { href: '/dashboard/attendance', label: 'Attendance' },
    { href: '/dashboard/timesheets', label: 'Timesheets' },
    { href: '/dashboard/leaves', label: 'Leaves' },
    { href: '/dashboard/tasks', label: 'Tasks' } // 👈 new
  ];

  return (
    <div className="min-h-screen flex bg-slate-100">
      {/* Sidebar */}
      <aside className="w-64 bg-gradient-to-b from-indigo-900 via-indigo-800 to-purple-800 text-white flex flex-col">
        <div className="px-6 py-6 flex items-center gap-3 border-b border-white/10">
          <div className="w-10 h-10 rounded-2xl bg-white/10 flex items-center justify-center">
            <span className="text-xl font-semibold">O</span>
          </div>
          <div>
            <p className="text-sm font-semibold">Offisphere</p>
            <p className="text-xs text-indigo-200">Office OS</p>
          </div>
        </div>

        <nav className="flex-1 px-3 py-4 space-y-1">
          {navItems.map((item) => {
            const active = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-2 px-3 py-2 rounded-xl text-sm transition ${
                  active
                    ? 'bg-white text-indigo-900 font-semibold shadow'
                    : 'text-indigo-100 hover:bg-white/10'
                }`}
              >
                <span className="w-2 h-2 rounded-full bg-white/40" />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>

        <div className="px-4 py-4 border-t border-white/10 text-xs text-indigo-100 space-y-2">
          <div>
            <p className="mb-1">Logged in as:</p>
            <p className="font-semibold mb-1 truncate">
              {userName || 'User'}
            </p>
          </div>

          {roles.length > 0 && (
            <div className="flex flex-wrap gap-1 mb-1">
              {roles.map((role) => (
                <span
                  key={role}
                  className="px-2 py-0.5 rounded-full bg-white/10 text-[10px] uppercase tracking-wide border border-white/20"
                >
                  {role}
                </span>
              ))}
            </div>
          )}

          <button
            onClick={handleLogout}
            className="w-full text-center text-xs py-2 rounded-xl bg-white/10 hover:bg-white/20 transition"
          >
            Logout
          </button>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 bg-slate-50 p-6 md:p-8 overflow-y-auto">
        {children}
      </main>
    </div>
  );
}
