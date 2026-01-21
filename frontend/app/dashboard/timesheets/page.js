"use client";

import { useEffect, useState } from "react";

const API_BASE =
  process.env.NEXT_PUBLIC_API_BASE || "https://offisphere.onrender.com";

const STATUS_COLORS = {
  submitted: "bg-amber-50 text-amber-700 border-amber-100",
  approved: "bg-emerald-50 text-emerald-700 border-emerald-100",
  rejected: "bg-red-50 text-red-600 border-red-100",
};

export default function TimesheetsPage() {
  const [timesheets, setTimesheets] = useState([]);
  const [loadingList, setLoadingList] = useState(true);
  const [listError, setListError] = useState("");

  // create form
  const [workDate, setWorkDate] = useState("");
  const [projectName, setProjectName] = useState("");
  const [taskDescription, setTaskDescription] = useState("");
  const [hours, setHours] = useState("");
  const [notes, setNotes] = useState("");
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState("");
  const [createSuccess, setCreateSuccess] = useState("");

  // filters
  const [filterStatus, setFilterStatus] = useState("all");
  const [filterDateFrom, setFilterDateFrom] = useState("");
  const [filterDateTo, setFilterDateTo] = useState("");

  // roles
  const [roles, setRoles] = useState([]);
  const [statusLoadingId, setStatusLoadingId] = useState(null);
  const [deleteLoadingId, setDeleteLoadingId] = useState(null);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const today = new Date().toISOString().slice(0, 10);
      setWorkDate(today);

      const storedRoles = window.localStorage.getItem("offisphere_roles");
      if (storedRoles) {
        try {
          const parsed = JSON.parse(storedRoles);
          if (Array.isArray(parsed)) setRoles(parsed);
        } catch {
          setRoles([]);
        }
      }
    }
  }, []);

  const authHeaders = { "Content-Type": "application/json" };

  const isAdmin = roles.includes("admin");
  const isManager = roles.includes("manager");
  const isAdminOrManager = isAdmin || isManager;

  const fetchTimesheets = async () => {
    setLoadingList(true);
    setListError("");

    try {
      const res = await fetch(`${API_BASE}/api/timesheets`, {
        credentials: "include",
        headers: authHeaders,
      });

      const data = await res.json();

      if (!res.ok) {
        setListError(data.message || "Failed to load timesheets");
      } else {
        setTimesheets(data);
      }
    } catch (err) {
      console.error(err);
      setListError("Error connecting to server");
    } finally {
      setLoadingList(false);
    }
  };

  useEffect(() => {
    fetchTimesheets();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleCreateTimesheet = async (e) => {
    e.preventDefault();
    setCreating(true);
    setCreateError("");
    setCreateSuccess("");

    try {
      const res = await fetch(`${API_BASE}/api/timesheets`, {
        credentials: "include",
        method: "POST",
        headers: authHeaders,
        body: JSON.stringify({
          work_date: workDate,
          project_name: projectName,
          task_description: taskDescription,
          hours,
          notes,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setCreateError(data.message || "Failed to create timesheet entry");
      } else {
        setCreateSuccess("Timesheet entry added");
        setProjectName("");
        setTaskDescription("");
        setHours("");
        setNotes("");
        fetchTimesheets();
      }
    } catch (err) {
      console.error(err);
      setCreateError("Error connecting to server");
    } finally {
      setCreating(false);
    }
  };

  const handleUpdateStatus = async (id, newStatus) => {
    setStatusLoadingId(id);
    setListError("");

    try {
      const res = await fetch(`${API_BASE}/api/timesheets/${id}/status`, {
        credentials: "include",
        method: "PATCH",
        headers: authHeaders,
        body: JSON.stringify({ status: newStatus }),
      });

      const data = await res.json();

      if (!res.ok) {
        setListError(data.message || "Failed to update status");
      } else {
        fetchTimesheets();
      }
    } catch (err) {
      console.error(err);
      setListError("Error connecting to server");
    } finally {
      setStatusLoadingId(null);
    }
  };

  const handleDelete = async (id) => {
    const confirmed = window.confirm(
      "Are you sure you want to delete this timesheet entry?",
    );
    if (!confirmed) return;

    setDeleteLoadingId(id);
    setListError("");

    try {
      const res = await fetch(`${API_BASE}/api/timesheets/${id}`, {
        credentials: "include",
        method: "DELETE",
        headers: authHeaders,
      });

      const data = await res.json();

      if (!res.ok) {
        setListError(data.message || "Failed to delete entry");
      } else {
        fetchTimesheets();
      }
    } catch (err) {
      console.error(err);
      setListError("Error connecting to server");
    } finally {
      setDeleteLoadingId(null);
    }
  };

  const formatDate = (value) => {
    if (!value) return "-";
    return new Date(value).toLocaleDateString();
  };

  // client-side filters
  const filteredTimesheets = timesheets.filter((item) => {
    const matchesStatus =
      filterStatus === "all" ? true : item.status === filterStatus;

    const dateObj = item.work_date ? new Date(item.work_date) : null;
    let matchesFrom = true;
    let matchesTo = true;

    if (filterDateFrom && dateObj) {
      matchesFrom = dateObj >= new Date(filterDateFrom);
    }
    if (filterDateTo && dateObj) {
      matchesTo = dateObj <= new Date(filterDateTo);
    }

    return matchesStatus && matchesFrom && matchesTo;
  });

  return (
    <div className="space-y-6 rounded-3xl bg-slate-50/70 p-4 md:p-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
        <div className="space-y-3">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-blue-600 text-white text-xs font-semibold shadow-[0_8px_20px_rgba(124,58,237,0.25)]">
            <span>Time tracking</span>
          </div>
          <div>
            <h1 className="text-3xl font-semibold text-slate-900">
              Timesheets
            </h1>
            <p className="text-sm text-slate-500">
              Log daily work hours and review timesheet entries. Managers can
              approve or reject submissions.
            </p>
          </div>
        </div>
      </div>

      {/* Log work form */}
      <div className="rounded-3xl bg-white p-6 shadow-[0_20px_40px_rgba(15,23,42,0.08)] border border-slate-100">
        <div className="flex items-center gap-3 mb-4">
          <div className="h-10 w-10 rounded-2xl bg-blue-600 text-white flex items-center justify-center">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-5 w-5"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <rect x="3" y="4" width="18" height="18" rx="2" />
              <path d="M16 2v4" />
              <path d="M8 2v4" />
              <path d="M3 10h18" />
            </svg>
          </div>
          <div>
            <h2 className="text-lg font-semibold text-slate-900">Log work</h2>
            <p className="text-xs text-slate-500">
              Capture today&apos;s hours and tasks.
            </p>
          </div>
        </div>

        <form
          onSubmit={handleCreateTimesheet}
          className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm"
        >
          <div className="space-y-1">
            <label className="font-medium text-slate-700">Date</label>
            <input
              type="date"
              value={workDate}
              onChange={(e) => setWorkDate(e.target.value)}
              className="w-full px-4 py-3 rounded-2xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              required
            />
          </div>

          <div className="space-y-1">
            <label className="font-medium text-slate-700">Project</label>
            <input
              type="text"
              value={projectName}
              onChange={(e) => setProjectName(e.target.value)}
              placeholder="Project name"
              className="w-full px-4 py-3 rounded-2xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          <div className="space-y-1">
            <label className="font-medium text-slate-700">Task</label>
            <input
              type="text"
              value={taskDescription}
              onChange={(e) => setTaskDescription(e.target.value)}
              placeholder="What did you work on?"
              className="w-full px-4 py-3 rounded-2xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          <div className="space-y-1">
            <label className="font-medium text-slate-700">Hours</label>
            <input
              type="number"
              step="0.25"
              min="0"
              max="24"
              value={hours}
              onChange={(e) => setHours(e.target.value)}
              placeholder="e.g. 4"
              className="w-full px-4 py-3 rounded-2xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              required
            />
          </div>

          <div className="space-y-1 md:col-span-2">
            <label className="font-medium text-slate-700">
              Notes (optional)
            </label>
            <textarea
              rows={3}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Any extra details..."
              className="w-full px-4 py-3 rounded-2xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
            />
          </div>

          <div className="md:col-span-2 flex flex-col gap-2 mt-2">
            {createError && (
              <p className="text-xs text-rose-600 bg-rose-50 border border-rose-100 rounded-xl px-3 py-2">
                {createError}
              </p>
            )}
            {createSuccess && (
              <p className="text-xs text-emerald-600 bg-emerald-50 border border-emerald-100 rounded-xl px-3 py-2">
                {createSuccess}
              </p>
            )}
            <button
              type="submit"
              disabled={creating}
              className="self-start px-5 py-2.5 rounded-2xl text-xs font-semibold text-white bg-blue-600 shadow-lg shadow-blue-300/40 hover:bg-blue-700 disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {creating ? "Saving..." : "Add entry"}
            </button>
          </div>
        </form>
      </div>

      {/* Filters */}
      <div className="rounded-3xl bg-white p-6 shadow-[0_18px_36px_rgba(15,23,42,0.08)] border border-slate-100">
        <div className="flex items-center gap-3 mb-4">
          <div className="h-10 w-10 rounded-2xl bg-blue-100 text-blue-700 flex items-center justify-center">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-5 w-5"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M3 4h18" />
              <path d="M7 12h10" />
              <path d="M10 20h4" />
            </svg>
          </div>
          <div>
            <h2 className="text-lg font-semibold text-slate-900">Filters</h2>
            <p className="text-xs text-slate-500">
              Refine entries by status or date.
            </p>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
          <div className="space-y-1">
            <label className="font-medium text-slate-700">Status</label>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="w-full px-4 py-3 rounded-2xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">All statuses</option>
              <option value="submitted">Submitted</option>
              <option value="approved">Approved</option>
              <option value="rejected">Rejected</option>
            </select>
          </div>
          <div className="space-y-1">
            <label className="font-medium text-slate-700">From date</label>
            <input
              type="date"
              value={filterDateFrom}
              onChange={(e) => setFilterDateFrom(e.target.value)}
              className="w-full px-4 py-3 rounded-2xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <div className="space-y-1">
            <label className="font-medium text-slate-700">To date</label>
            <input
              type="date"
              value={filterDateTo}
              onChange={(e) => setFilterDateTo(e.target.value)}
              className="w-full px-4 py-3 rounded-2xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        </div>
      </div>

      {/* Timesheets table */}
      <div className="rounded-3xl bg-white p-6 shadow-[0_18px_40px_rgba(15,23,42,0.08)] border border-slate-100">
        <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-slate-100">
          <div>
            <h2 className="text-lg font-semibold text-slate-900">
              Timesheet entries
            </h2>
            <p className="text-xs text-slate-500">
              {filteredTimesheets.length} entries
            </p>
          </div>
        </div>

        {listError && (
          <p className="text-xs text-rose-600 bg-rose-50 border border-rose-100 rounded-xl px-3 py-2 mb-3">
            {listError}
          </p>
        )}

        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead className="bg-slate-50 text-xs text-slate-500 uppercase tracking-wider">
              <tr>
                <th className="text-left px-6 py-3 font-semibold">Employee</th>
                <th className="text-left px-6 py-3 font-semibold">Date</th>
                <th className="text-left px-6 py-3 font-semibold">Project</th>
                <th className="text-left px-6 py-3 font-semibold">Task</th>
                <th className="text-left px-6 py-3 font-semibold">Hours</th>
                <th className="text-left px-6 py-3 font-semibold">Status</th>
                <th className="text-left px-6 py-3 font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loadingList ? (
                <tr>
                  <td
                    colSpan={7}
                    className="px-6 py-8 text-center text-xs text-slate-400"
                  >
                    Loading timesheets...
                  </td>
                </tr>
              ) : filteredTimesheets.length === 0 ? (
                <tr>
                  <td
                    colSpan={7}
                    className="px-6 py-8 text-center text-xs text-slate-400"
                  >
                    No timesheet entries match your filters.
                  </td>
                </tr>
              ) : (
                filteredTimesheets.map((item) => (
                  <tr key={item.id} className="transition hover:bg-slate-50">
                    <td className="px-6 py-4 text-slate-800">
                      {item.full_name}
                    </td>
                    <td className="px-6 py-4 text-slate-600">
                      {formatDate(item.work_date)}
                    </td>
                    <td className="px-6 py-4 text-slate-600">
                      {item.project_name || "--"}
                    </td>
                    <td className="px-6 py-4 text-slate-600">
                      {item.task_description || "--"}
                    </td>
                    <td className="px-6 py-4 text-slate-800">{item.hours}</td>
                    <td className="px-6 py-4 text-xs">
                      <span
                        className={`px-2.5 py-1 rounded-full border font-medium ${
                          STATUS_COLORS[item.status] ||
                          "bg-slate-50 text-slate-700 border-slate-200"
                        }`}
                      >
                        {item.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-xs">
                      <div className="flex flex-wrap gap-2">
                        {isAdminOrManager && item.status === "submitted" && (
                          <>
                            <button
                              onClick={() =>
                                handleUpdateStatus(item.id, "approved")
                              }
                              disabled={statusLoadingId === item.id}
                              className="px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-100 hover:bg-emerald-100 disabled:opacity-60"
                            >
                              Approve
                            </button>
                            <button
                              onClick={() =>
                                handleUpdateStatus(item.id, "rejected")
                              }
                              disabled={statusLoadingId === item.id}
                              className="px-3 py-1 rounded-full bg-red-50 text-red-600 border border-red-100 hover:bg-red-100 disabled:opacity-60"
                            >
                              Reject
                            </button>
                          </>
                        )}

                        <button
                          onClick={() => handleDelete(item.id)}
                          disabled={deleteLoadingId === item.id}
                          className="px-3 py-1 rounded-full bg-slate-900 text-white hover:bg-slate-700 disabled:opacity-60"
                        >
                          {deleteLoadingId === item.id
                            ? "Deleting..."
                            : "Delete"}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
