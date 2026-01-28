"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import Link from "next/link";

export default function TaskOverduePage() {
  const [mounted, setMounted] = useState(false);
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all"); // all, days_0, days_3, days_5
  const [selectedTask, setSelectedTask] = useState(null);
  const [dependencies, setDependencies] = useState({});

  const API_BASE = process.env.NEXT_PUBLIC_API_BASE || "https://offisphere.onrender.com";

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted) return;
    const fetchTasks = async () => {
      try {
        setLoading(true);
        const res = await fetch(`${API_BASE}/api/tasks/overdue`, {
          credentials: "include",
        });
        const data = res.ok ? await res.json() : [];
        setTasks(data);
      } catch (err) {
        console.error("Error fetching tasks:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchTasks();
    const interval = setInterval(fetchTasks, 30000);
    return () => clearInterval(interval);
  }, [API_BASE, mounted]);

  const filteredTasks = tasks.filter((t) => {
    if (filter === "all") return true;
    const daysOverdue = Math.floor((Date.now() - new Date(t.due_date)) / (1000 * 60 * 60 * 24));
    if (filter === "days_0") return daysOverdue < 3;
    if (filter === "days_3") return daysOverdue >= 3 && daysOverdue < 5;
    if (filter === "days_5") return daysOverdue >= 5;
    return true;
  });

  const getEscalationLevel = (dueDate) => {
    if (!mounted) return 1;
    const daysOverdue = Math.floor((Date.now() - new Date(dueDate)) / (1000 * 60 * 60 * 24));
    if (daysOverdue < 3) return 1;
    if (daysOverdue < 5) return 2;
    return 3;
  };

  const getLevelColor = (level) => {
    switch (level) {
      case 1:
        return "bg-yellow-100 text-yellow-800 border-yellow-200";
      case 2:
        return "bg-orange-100 text-orange-800 border-orange-200";
      case 3:
        return "bg-red-100 text-red-800 border-red-200";
      default:
        return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  const getLevelLabel = (level) => {
    switch (level) {
      case 1:
        return "Level 1 - Warning (0-3 days)";
      case 2:
        return "Level 2 - Urgent (3-5 days)";
      case 3:
        return "Level 3 - Critical (5+ days)";
      default:
        return "Unknown";
    }
  };

  const getDaysOverdue = (dueDate) => {
    if (!mounted) return 0;
    const days = Math.floor((Date.now() - new Date(dueDate)) / (1000 * 60 * 60 * 24));
    return Math.max(days, 0);
  };

  const fetchTaskDependencies = async (taskId) => {
    if (dependencies[taskId]) return;
    try {
      const res = await fetch(`${API_BASE}/api/tasks/${taskId}/dependencies`, {
        credentials: "include",
      });
      const data = res.ok ? await res.json() : { blocking: [], blocked_by: [] };
      setDependencies((prev) => ({ ...prev, [taskId]: data }));
    } catch (err) {
      console.error("Error fetching dependencies:", err);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <div className="border-b border-slate-200 bg-white">
        <div className="mx-auto max-w-7xl px-6 py-6">
          <Link href="/dashboard/automations" className="text-sm text-blue-600 hover:text-blue-700 mb-4 inline-block">
            ← Back to Dashboard
          </Link>
          <div className="flex items-center gap-3 mt-2">
            <div className="h-10 w-10 rounded-2xl bg-orange-100 text-orange-600 flex items-center justify-center">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
              </svg>
            </div>
            <div>
              <h1 className="text-3xl font-bold text-slate-900">Task Overdue Automation</h1>
              <p className="text-sm text-slate-600">Dependencies tracking and auto-reopen system</p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="mx-auto max-w-7xl px-6 py-8">
        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-white rounded-2xl border border-slate-200 p-6">
            <h3 className="text-sm font-medium text-slate-600 mb-2">Total Overdue</h3>
            <div className="text-3xl font-bold text-slate-900">{tasks.length}</div>
            <p className="text-xs text-slate-500 mt-2">Active tasks</p>
          </div>

          <div className="bg-yellow-50 border-2 border-yellow-200 rounded-2xl p-6">
            <h3 className="text-sm font-medium text-yellow-800 mb-2">Level 1</h3>
            <div className="text-3xl font-bold text-yellow-600" suppressHydrationWarning>
              {tasks.filter((t) => getEscalationLevel(t.due_date) === 1).length}
            </div>
            <p className="text-xs text-yellow-700 mt-2">0-3 days</p>
          </div>

          <div className="bg-orange-50 border-2 border-orange-200 rounded-2xl p-6">
            <h3 className="text-sm font-medium text-orange-800 mb-2">Level 2</h3>
            <div className="text-3xl font-bold text-orange-600" suppressHydrationWarning>
              {tasks.filter((t) => getEscalationLevel(t.due_date) === 2).length}
            </div>
            <p className="text-xs text-orange-700 mt-2">3-5 days</p>
          </div>

          <div className="bg-red-50 border-2 border-red-200 rounded-2xl p-6">
            <h3 className="text-sm font-medium text-red-800 mb-2">Level 3</h3>
            <div className="text-3xl font-bold text-red-600" suppressHydrationWarning>
              {tasks.filter((t) => getEscalationLevel(t.due_date) === 3).length}
            </div>
            <p className="text-xs text-red-700 mt-2">5+ days</p>
          </div>
        </div>

        {/* Filter Buttons */}
        <div className="flex gap-2 mb-6 flex-wrap">
          {["all", "days_0", "days_3", "days_5"].map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                filter === f
                  ? "bg-blue-600 text-white"
                  : "bg-white border border-slate-200 text-slate-700 hover:border-slate-300"
              }`}
            >
              {f === "all" ? "All" : `${f.split("_")[1]}+ Days`}
            </button>
          ))}
        </div>

        {/* Info Alert */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-blue-50 border border-blue-200 rounded-2xl p-4 mb-6 flex gap-3"
        >
          <div className="h-5 w-5 rounded-full bg-blue-600 text-white flex items-center justify-center text-xs flex-shrink-0 mt-0.5">
            ℹ
          </div>
          <div className="text-sm text-blue-900">
            <strong>Auto-Reopen System:</strong> Tasks automatically reopen if their blocking dependencies are not completed. Check dependencies section for details.
          </div>
        </motion.div>

        {/* Tasks List */}
        <div className="space-y-3">
          {loading ? (
            <div className="text-center py-12">
              <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-slate-200 border-t-blue-600"></div>
              <p className="text-slate-600 mt-3">Loading tasks...</p>
            </div>
          ) : filteredTasks.length === 0 ? (
            <div className="text-center py-12 bg-white rounded-2xl border border-slate-200">
              <div className="text-4xl mb-2">✓</div>
              <p className="text-slate-600">No overdue tasks at this level</p>
            </div>
          ) : (
            filteredTasks.map((task, idx) => {
              const level = getEscalationLevel(task.due_date);
              const daysOverdue = getDaysOverdue(task.due_date);
              return (
                <motion.div
                  key={task.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.05 }}
                  onClick={() => {
                    setSelectedTask(task);
                    fetchTaskDependencies(task.id);
                  }}
                  className={`rounded-2xl border-2 p-6 cursor-pointer transition-all hover:shadow-md ${getLevelColor(level)}`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <span className="text-2xl">✓</span>
                        <div>
                          <h3 className="font-semibold">{task.title}</h3>
                          <p className="text-xs opacity-75">
                            Assigned to: {task.assigned_to || "Unassigned"}
                          </p>
                        </div>
                      </div>
                      <p className="text-sm mt-2">
                        <strong>Status:</strong> {task.status || "Pending"}
                      </p>
                      {task.description && (
                        <p className="text-sm mt-1 opacity-75 line-clamp-2">{task.description}</p>
                      )}
                    </div>
                    <div className="text-right">
                    <div className="inline-block px-3 py-1 rounded-full text-sm font-medium bg-white bg-opacity-50 mb-2" suppressHydrationWarning>
                        {daysOverdue} days
                      </div>
                      <p className="text-xs opacity-75 mt-2">{getLevelLabel(level)}</p>
                    </div>
                  </div>
                </motion.div>
              );
            })
          )}
        </div>
      </div>

      {/* Detail Modal */}
      {selectedTask && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50 overflow-y-auto" onClick={() => setSelectedTask(null)}>
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            onClick={(e) => e.stopPropagation()}
            className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl my-4"
          >
            <h2 className="text-xl font-bold text-slate-900 mb-4">{selectedTask.title}</h2>
            <div className="space-y-3 mb-6">
              <div>
                <p className="text-xs text-slate-500">ASSIGNED TO</p>
                <p className="text-sm font-medium text-slate-900">{selectedTask.assigned_to || "Unassigned"}</p>
              </div>
              <div>
                <p className="text-xs text-slate-500">DUE DATE</p>
                <p className="text-sm font-medium text-slate-900" suppressHydrationWarning>
                  {new Date(selectedTask.due_date).toISOString().split('T')[0]}
                </p>
              </div>
              <div>
                <p className="text-xs text-slate-500">DAYS OVERDUE</p>
                <p className="text-sm font-medium text-slate-900" suppressHydrationWarning>
                  {getDaysOverdue(selectedTask.due_date)} days
                </p>
              </div>
              <div>
                <p className="text-xs text-slate-500">STATUS</p>
                <p className="text-sm font-medium text-slate-900">{selectedTask.status || "Pending"}</p>
              </div>

              {/* Dependencies */}
              {dependencies[selectedTask.id] && (
                <div className="pt-4 border-t border-slate-200">
                  <p className="text-xs font-semibold text-slate-600 mb-2">DEPENDENCIES</p>
                  {dependencies[selectedTask.id].blocked_by?.length > 0 && (
                    <div className="mb-3">
                      <p className="text-xs text-slate-500 mb-1">Blocked By:</p>
                      {dependencies[selectedTask.id].blocked_by.map((dep) => (
                        <div key={dep.id} className="text-xs bg-orange-50 border border-orange-200 rounded px-2 py-1 mb-1">
                          {dep.blocking_task_title}
                        </div>
                      ))}
                    </div>
                  )}
                  {dependencies[selectedTask.id].blocking?.length > 0 && (
                    <div>
                      <p className="text-xs text-slate-500 mb-1">Blocking:</p>
                      {dependencies[selectedTask.id].blocking.map((dep) => (
                        <div key={dep.id} className="text-xs bg-blue-50 border border-blue-200 rounded px-2 py-1 mb-1">
                          {dep.blocked_task_title}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => setSelectedTask(null)}
                className="flex-1 px-4 py-2 rounded-lg border border-slate-200 text-slate-700 hover:bg-slate-50 transition-all"
              >
                Close
              </button>
              <button
                onClick={() => {
                  // TODO: Extend due date or complete task
                  setSelectedTask(null);
                }}
                className="flex-1 px-4 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 transition-all"
              >
                Extend Date
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}
