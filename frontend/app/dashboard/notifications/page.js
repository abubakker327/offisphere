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
      className="space-y-6"
    >
      <div>
        <h1 className="text-xl font-semibold">Notifications</h1>
        <p className="text-sm text-slate-500">
          All system alerts and updates
        </p>
      </div>

      <div className="bg-white rounded-2xl p-4 shadow border">
        {loading ? (
          <p className="text-sm text-slate-400">Loading...</p>
        ) : notifications.length === 0 ? (
          <p className="text-sm text-slate-400">No notifications yet.</p>
        ) : (
          notifications.map((n) => (
            <div
              key={n.id}
              className={`p-3 mb-3 rounded-xl border flex justify-between items-center ${
                n.is_read
                  ? 'bg-slate-50 border-slate-100'
                  : 'bg-indigo-50 border-indigo-200'
              }`}
            >
              <div>
                <p className="text-sm font-semibold">{n.title}</p>
                <p className="text-xs text-slate-600">{n.message}</p>
              </div>

              {!n.is_read && (
                <button
                  onClick={() => markRead(n.id)}
                  className="text-xs px-3 py-1 rounded-full bg-indigo-600 text-white"
                >
                  Mark read
                </button>
              )}
            </div>
          ))
        )}
      </div>
    </motion.div>
  );
}
