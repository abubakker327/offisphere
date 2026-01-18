'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { motion } from 'framer-motion';

const API_BASE =
  process.env.NEXT_PUBLIC_API_BASE || 'https://offisphere.onrender.com';

export default function LoginPage() {
  const router = useRouter();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [remember, setRemember] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Ripple state
  const [rippleStyle, setRippleStyle] = useState({});
  const [rippleVisible, setRippleVisible] = useState(false);

  const triggerToast = (type, message) => {
    if (typeof window === 'undefined') return;
    window.dispatchEvent(
      new CustomEvent('offisphere-toast', {
        detail: { type, message }
      })
    );
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await fetch(`${API_BASE}/api/auth/login`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, remember })
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.message || 'Login failed');
        triggerToast('error', data.message || 'Login failed');
      } else {
        const { user, roles } = data;

        if (remember) {
          localStorage.setItem('offisphere_user', JSON.stringify(user || {}));
          localStorage.setItem('offisphere_roles', JSON.stringify(roles || []));
        }

        triggerToast('success', 'Welcome back to Offisphere!');
        router.replace('/dashboard');
      }
    } catch (err) {
      console.error('Login error:', err);
      setError('Error connecting to server');
      triggerToast('error', 'Error connecting to server');
    } finally {
      setLoading(false);
    }
  };

  const handleButtonClick = (e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const size = Math.max(rect.width, rect.height);
    const x = e.clientX - rect.left - size / 2;
    const y = e.clientY - rect.top - size / 2;

    setRippleStyle({
      top: y,
      left: x,
      width: size,
      height: size
    });

    setRippleVisible(false);
    requestAnimationFrame(() => setRippleVisible(true));
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="min-h-screen w-full flex bg-[#f6f5fb]"
    >
      {/* LEFT SIDE - gradient blob art */}
      <div className="hidden lg:flex w-1/2 relative overflow-hidden">
        {/* Background gradient */}
        <div
          className="absolute inset-0"
          style={{ background: 'var(--brand-gradient)' }}
        />

        {/* Organic blobs */}
        <motion.div
          className="absolute -top-32 -left-24 w-72 h-72 rounded-[40%] bg-sky-400/70 blur-3xl"
          animate={{ y: [0, 30, 0] }}
          transition={{ duration: 10, repeat: Infinity, ease: 'easeInOut' }}
        />
        <motion.div
          className="absolute bottom-[-120px] left-[-40px] w-80 h-80 rounded-[45%] bg-sky-500/80 blur-3xl"
          animate={{ y: [0, -40, 0] }}
          transition={{ duration: 14, repeat: Infinity, ease: 'easeInOut' }}
        />
        <motion.div
          className="absolute -right-32 top-40 w-80 h-80 rounded-[45%] bg-sky-300/80 blur-3xl"
          animate={{ x: [0, -30, 0] }}
          transition={{ duration: 12, repeat: Infinity, ease: 'easeInOut' }}
        />

        {/* Semi-transparent overlay to soften */}
        <div className="absolute inset-0 bg-white/10" />

        {/* Content */}
        <div className="relative z-10 flex flex-col justify-between px-12 py-10 w-full">
          {/* Logo */}
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="flex items-center justify-center"
          >
            <div className="relative h-32 w-32">
              <div className="absolute inset-0 rounded-full shadow-[0_22px_50px_rgba(37,99,235,0.45)]" style={{ background: 'var(--brand-gradient)' }} />
              <div className="absolute inset-x-0 bottom-0 h-1/2 rounded-b-full bg-white/40 blur-lg" />
              <div className="absolute inset-3 rounded-full bg-white/20 backdrop-blur-md ring-1 ring-white/60" />
              <div className="relative h-full w-full flex items-center justify-center">
                <Image
                  src="/offisphere-logo.png"
                  alt="Offisphere logo"
                  width={64}
                  height={64}
                  priority
                />
              </div>
            </div>
          </motion.div>

          {/* Welcome text */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.35 }}
            className="space-y-3"
          >
            <p className="text-4xl xl:text-5xl font-bold text-white leading-tight">
              Welcome
              <br />
              to Offisphere
            </p>
            <p className="text-sm text-indigo-50/90 max-w-xs">
              Sign in to manage people, assets, payroll, and reporting in one place.
            </p>
          </motion.div>

          {/* Small footer text */}
          <motion.p
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 0.9, y: 0 }}
            transition={{ delay: 0.45 }}
            className="text-[11px] text-indigo-100"
          >
            Powered by TechMatrix AI
          </motion.p>
        </div>
      </div>

      {/* RIGHT SIDE - login form */}
      <div className="relative w-full lg:w-1/2 flex items-center justify-center px-6 py-12">
          <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -top-24 right-10 h-56 w-56 rounded-full bg-sky-200/70 blur-3xl" />
          <div className="absolute bottom-0 left-6 h-64 w-64 rounded-full bg-blue-200/70 blur-3xl" />
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(255,255,255,0.9),_rgba(255,255,255,0.3),_transparent_70%)]" />
        </div>
        <motion.div
          initial={{ x: 20, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          transition={{ duration: 0.35 }}
          className="relative w-full max-w-md rounded-3xl border border-white/70 bg-white/80 p-8 shadow-[0_24px_60px_rgba(15,23,42,0.18)] backdrop-blur-xl ring-1 ring-black/5"
        >
          <div className="mb-8">
            <motion.h1
              initial={{ y: 10, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.2 }}
              className="text-2xl sm:text-3xl font-bold text-slate-900"
            >
              Welcome Back!
            </motion.h1>
            <motion.p
              initial={{ y: 10, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.28 }}
              className="text-xs sm:text-sm text-slate-500 mt-2"
            >
              Sign in to continue to your workspace.
            </motion.p>
          </div>

          {error && (
            <motion.div
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-4 rounded-xl bg-rose-50 border border-rose-100 text-rose-600 text-xs px-3 py-2"
            >
              {error}
            </motion.div>
          )}

          <form onSubmit={handleLogin} className="space-y-4 text-sm">
            {/* Email */}
            <motion.div
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.32 }}
              className="space-y-1"
            >
              <label className="text-xs text-slate-500">Email</label>
              <div className="relative group">
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-3 rounded-2xl border border-slate-200 bg-white text-sm text-slate-900 outline-none
                             transition shadow-sm group-hover:shadow-md
                             focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="name@company.com"
                  required
                />
              </div>
            </motion.div>

            {/* Password */}
            <motion.div
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.37 }}
              className="space-y-1"
            >
              <label className="text-xs text-slate-500">Password</label>
              <div className="relative group">
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-3 rounded-2xl border border-slate-200 bg-white text-sm text-slate-900 outline-none
                             transition shadow-sm group-hover:shadow-md
                             focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="********"
                  required
                />
              </div>
            </motion.div>

            {/* Remember + forgot */}
            <motion.div
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.42 }}
              className="flex items-center justify-between text-[11px] text-slate-500 mt-1"
            >
              <label className="inline-flex items-center gap-2 cursor-pointer select-none">
                <span className="relative inline-flex items-center justify-center">
                  <input
                    type="checkbox"
                    checked={remember}
                    onChange={(e) => setRemember(e.target.checked)}
                    className="peer h-3.5 w-3.5 rounded border border-slate-300 text-blue-600 focus:ring-0 focus:outline-none"
                  />
                  {/* custom checkbox micro interaction */}
                  <span className="pointer-events-none absolute inset-0 rounded bg-blue-100 scale-0 opacity-0 peer-checked:scale-100 peer-checked:opacity-100 transition-transform duration-150" />
                  <span className="pointer-events-none absolute inset-0 flex items-center justify-center text-[8px] text-blue-600 opacity-0 peer-checked:opacity-100 transition-opacity">v</span>
                </span>
                <span>Remember Me</span>
              </label>

              <button
                type="button"
                className="text-blue-600 hover:text-blue-700"
              >
                Forgot Password?
              </button>
            </motion.div>

            {/* Login button (ripple + hover) */}
            <motion.div
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.47 }}
              className="pt-2"
            >
              <motion.button
                type="submit"
                whileHover={{ scale: 1.01, y: -1 }}
                whileTap={{ scale: 0.98, y: 0 }}
                onClick={handleButtonClick}
                disabled={loading}
                className="relative w-full overflow-hidden rounded-full text-white text-sm font-medium py-3 shadow-lg shadow-blue-500/25 disabled:opacity-60 disabled:cursor-not-allowed focus:outline-none"
                style={{ background: 'var(--brand-gradient)' }}
              >
                {rippleVisible && (
                  <span
                    style={rippleStyle}
                    className="absolute rounded-full bg-white/40 animate-[ping_0.7s_ease-out] pointer-events-none"
                  />
                )}
                {loading ? 'Signing in...' : 'Login'}
              </motion.button>
            </motion.div>

            {/* New user / signup text */}
            <motion.div
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.52 }}
              className="flex justify-center pt-4 text-[11px] sm:text-xs text-slate-500"
            >
              <span>New User?&nbsp;</span>
              <button
                type="button"
                className="text-blue-600 hover:text-blue-700 font-medium"
              >
                Signup
              </button>
            </motion.div>
          </form>
        </motion.div>
      </div>
    </motion.div>
  );
}

