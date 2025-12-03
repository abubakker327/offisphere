'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('admin@offisphere.local');
  const [password, setPassword] = useState('Admin@123');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const res = await fetch('http://localhost:5000/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.message || 'Login failed');
        setLoading(false);
        return;
      }

      const roles = Array.isArray(data.user?.roles) ? data.user.roles : [];

      // Store token, user and roles
      window.localStorage.setItem('offisphere_token', data.token);
      window.localStorage.setItem(
        'offisphere_user',
        JSON.stringify(data.user)
      );
      window.localStorage.setItem(
        'offisphere_roles',
        JSON.stringify(roles)
      );

      router.push('/dashboard');
    } catch (err) {
      console.error(err);
      setError('Error connecting to server');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex bg-gradient-to-r from-indigo-900 via-indigo-700 to-purple-700">
      {/* Left panel */}
      <div className="hidden md:flex w-1/2 items-center justify-center relative overflow-hidden">
        <div className="absolute inset-0 opacity-40 bg-[radial-gradient(circle_at_top,_#ffffff33,_transparent_60%),radial-gradient(circle_at_bottom,_#ffffff22,_transparent_60%)]" />
        <div className="relative z-10 max-w-md px-8">
          <p className="text-xs uppercase tracking-[0.2em] text-indigo-100 mb-3">
            Offisphere
          </p>
          <h1 className="text-4xl font-semibold text-white mb-4 leading-tight">
            Digital platform
            <br />
            for office operations.
          </h1>
          <p className="text-sm text-indigo-100/80">
            Manage users, attendance, leaves, timesheets and more in one
            unified workspace.
          </p>
        </div>
      </div>

      {/* Right panel (form) */}
      <div className="flex-1 flex items-center justify-center bg-slate-50">
        <div className="w-full max-w-md px-6 py-8">
          <div className="mb-6">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-9 h-9 rounded-2xl bg-indigo-600 flex items-center justify-center text-white font-semibold">
                O
              </div>
              <div>
                <p className="text-xs font-semibold text-slate-500">
                  Offisphere
                </p>
                <p className="text-[11px] text-slate-400">Office OS</p>
              </div>
            </div>
            <h2 className="text-xl font-semibold text-slate-900 flex items-center gap-2">
              Hey, hello <span>👋</span>
            </h2>
            <p className="text-xs text-slate-500 mt-1">
              Enter the information you used while registering.
            </p>
          </div>

          {error && (
            <div className="mb-3 text-xs text-red-600 bg-red-50 border border-red-100 rounded-xl px-3 py-2">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-3 text-sm">
            <div className="space-y-1">
              <label className="text-xs font-medium text-slate-700">
                Email
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                placeholder="you@company.com"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-medium text-slate-700">
                Password
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                placeholder="••••••••"
              />
            </div>

            <div className="flex items-center justify-between text-xs">
              <label className="inline-flex items-center gap-2 text-slate-600">
                <input
                  type="checkbox"
                  className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                  defaultChecked
                />
                Remember me
              </label>
              <button
                type="button"
                className="text-indigo-600 hover:underline"
              >
                Forgot password?
              </button>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2 rounded-xl text-sm font-medium text-white bg-gradient-to-r from-indigo-500 to-purple-500 shadow hover:opacity-90 disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {loading ? 'Logging in...' : 'Login'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
