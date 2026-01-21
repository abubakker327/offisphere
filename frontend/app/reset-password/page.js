"use client";

import { useMemo, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { motion } from "framer-motion";

const API_BASE =
  process.env.NEXT_PUBLIC_API_BASE || "https://offisphere.onrender.com";

export default function ResetPasswordPage() {
  const params = useSearchParams();
  const router = useRouter();
  const token = useMemo(() => params.get("token") || "", [params]);

  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");
    setMessage("");

    if (!token) {
      setError("Reset token is missing.");
      return;
    }
    if (password !== confirm) {
      setError("Passwords do not match.");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/api/auth/reset`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, password }),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.message || "Unable to reset password");
      } else {
        setMessage("Password updated. You can log in now.");
        setTimeout(() => router.push("/"), 1200);
      }
    } catch (err) {
      setError("Unable to reset password");
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
        <h1 className="text-2xl font-semibold text-slate-900">
          Reset password
        </h1>
        <p className="mt-2 text-sm text-slate-500">
          Choose a new password for your account.
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
            <label className="text-xs text-slate-500">New password</label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-3 rounded-2xl border border-slate-200 bg-white text-sm text-slate-900 outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Minimum 8 characters"
            />
          </div>
          <div className="space-y-1">
            <label className="text-xs text-slate-500">Confirm password</label>
            <input
              type="password"
              required
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              className="w-full px-4 py-3 rounded-2xl border border-slate-200 bg-white text-sm text-slate-900 outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Repeat password"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-full bg-blue-600 text-white py-3 text-sm font-semibold shadow-lg shadow-blue-500/25 hover:bg-blue-700 disabled:opacity-60"
          >
            {loading ? "Updating..." : "Reset password"}
          </button>
        </form>
      </motion.div>
    </div>
  );
}
