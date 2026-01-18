'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';

const API_BASE =
  process.env.NEXT_PUBLIC_API_BASE || 'https://offisphere.onrender.com';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async (event) => {
    event.preventDefault();
    setLoading(true);
    setError('');
    setMessage('');

    try {
      const res = await fetch(`${API_BASE}/api/auth/forgot`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email })
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.message || 'Unable to send reset email');
      } else {
        setMessage(data.message || 'Check your email for reset instructions.');
      }
    } catch (err) {
      setError('Unable to send reset email');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#f6f5fb] px-4">
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md rounded-3xl border border-white/60 bg-white/90 p-8 shadow-[0_24px_60px_rgba(15,23,42,0.18)] backdrop-blur-xl"
      >
        <h1 className="text-2xl font-semibold text-slate-900">Forgot password</h1>
        <p className="mt-2 text-sm text-slate-500">
          Enter your email and we&apos;ll send a reset link.
        </p>

        {error && (
          <div className="mt-4 rounded-xl bg-rose-50 border border-rose-100 text-rose-600 text-xs px-3 py-2">
            {error}
          </div>
        )}
        {message && (
          <div className="mt-4 rounded-xl bg-emerald-50 border border-emerald-100 text-emerald-700 text-xs px-3 py-2">
            {message}
          </div>
        )}

        <form onSubmit={handleSubmit} className="mt-6 space-y-4 text-sm">
          <div className="space-y-1">
            <label className="text-xs text-slate-500">Email</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-3 rounded-2xl border border-slate-200 bg-white text-sm text-slate-900 outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="name@company.com"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-full bg-blue-600 text-white py-3 text-sm font-semibold shadow-lg shadow-blue-500/25 hover:bg-blue-700 disabled:opacity-60"
          >
            {loading ? 'Sending...' : 'Send reset link'}
          </button>
        </form>
      </motion.div>
    </div>
  );
}
