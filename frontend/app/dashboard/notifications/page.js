'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);

  const API = 'http://localhost:5000';

  async function fetchNotifications() {
    try {
      const token = localStorage.getItem('offisphere_token');

      const res = await fetch(`${API}/api/notifications`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      const data = await res.json();
      setNotifications(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Fetch notifications error:', err);
    } finally {
      setLoading(false);
    }
  }

  async function markRead(id) {
    try {
      const token = localStorage.getItem('offisphere_token');

      await fetch(`${API}/api/notifications/${id}/read`, {
        method: 'PATCH',
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      fetchNotifications();
    } catch (err) {
      console.error('Mark read error:', err);
    }
  }

  useEffect(() => {
    fetchNotifications();
  }, []);

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
      className="space-y-6 rounded-3xl bg-slate-50/70 p-4 md:p-6"
    >
      <div className="space-y-2">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-blue-600 text-white text-xs font-semibold shadow-[0_8px_20px_rgba(124,58,237,0.25)]">
          <span>Activity feed</span>
        </div>
        <div>
          <h1 className="text-3xl text-slate-900 font-semibold">Notifications</h1>
          <p className="text-sm text-slate-500">
            All system alerts and updates.
          </p>
        </div>
      </div>

      <div className="bg-white rounded-3xl border border-slate-100 shadow-[0_18px_40px_rgba(15,23,42,0.08)]">
        {loading ? (
          <p className="px-6 py-6 text-sm text-slate-400">Loading...</p>
        ) : notifications.length === 0 ? (
          <p className="px-6 py-6 text-sm text-slate-900">No notifications yet.</p>
        ) : (
          <div className="divide-y divide-slate-100">
            {notifications.map((n) => (
              <div
                key={n.id}
                className="flex flex-col gap-3 px-6 py-4 md:flex-row md:items-center md:justify-between hover:bg-slate-50"
              >
                <div className="flex items-start gap-3">
                  <span
                    className={`mt-1 h-2 w-2 rounded-full ${
                      n.is_read ? 'bg-slate-200' : 'bg-blue-500'
                    }`}
                  />
                  <div>
                    <p className="text-sm text-slate-900 font-semibold">{n.title}</p>
                    <p className="text-xs text-slate-600">{n.message}</p>
                  </div>
                </div>

                {!n.is_read && (
                  <button
                    onClick={() => markRead(n.id)}
                    className="text-xs px-4 py-2 rounded-2xl bg-blue-600 text-white font-semibold hover:bg-blue-700"
                  >
                    Mark read
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </motion.div>
  );
}

