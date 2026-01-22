"use client";

import { useEffect, useState } from "react";
import { KpiCard } from "../components/KpiCard";

const API_BASE =
  process.env.NEXT_PUBLIC_API_BASE || "https://offisphere.onrender.com";

const LEAVE_TYPES = [
  { value: "CL", label: "Casual Leave (CL)" },
  { value: "SL", label: "Sick Leave (SL)" },
  { value: "EL", label: "Earned Leave (EL)" },
  { value: "LOP", label: "Loss of Pay (LOP)" },
];

const STATUS_FILTERS = [
  { value: "all", label: "All statuses" },
  { value: "pending", label: "Pending" },
  { value: "approved", label: "Approved" },
  { value: "rejected", label: "Rejected" },
];

export default function LeavesPage() {
  const [leaves, setLeaves] = useState([]);
  const [loadingList, setLoadingList] = useState(true);
  const [listError, setListError] = useState("");

  const [leaveType, setLeaveType] = useState("CL");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [reason, setReason] = useState("");

  const [applyLoading, setApplyLoading] = useState(false);
  const [applyError, setApplyError] = useState("");
  const [applySuccess, setApplySuccess] = useState("");

  const [statusActionLoadingId, setStatusActionLoadingId] = useState(null);
  const [reviewModalOpen, setReviewModalOpen] = useState(false);
  const [reviewLeave, setReviewLeave] = useState(null);
  const [reviewStatus, setReviewStatus] = useState("approved");
  const [reviewReason, setReviewReason] = useState("");
  const [reviewError, setReviewError] = useState("");
  const [reviewLoading, setReviewLoading] = useState(false);
  const [roles, setRoles] = useState([]);

  // Filters
  const [filterStatus, setFilterStatus] = useState("all");
  const [filterType, setFilterType] = useState("all");

  const normalizeRole = (role) => {
    if (!role) return "";
    if (typeof role === "string") return role;
    if (typeof role === "object") {
      return role.name || role.role || role.type || role.code || "";
    }
    return "";
  };

  useEffect(() => {
    let mounted = true;

    const normalizeRoles = (values) =>
      (Array.isArray(values) ? values : [])
        .map((role) => normalizeRole(role))
        .map((role) => String(role || "").toLowerCase().replace(/\s+/g, "_"))
        .filter(Boolean);

    const loadRoles = async () => {
      if (typeof window === "undefined") return;

      const storedRoles =
        window.localStorage.getItem("offisphere_roles") ||
        window.sessionStorage.getItem("offisphere_roles");

      if (storedRoles) {
        try {
          const parsed = JSON.parse(storedRoles);
          const normalized = normalizeRoles(parsed);
          if (normalized.length && mounted) {
            setRoles(normalized);
            return;
          }
        } catch {
          // fall through to fetch
        }
      }

      try {
        const res = await fetch(`${API_BASE}/api/auth/me`, {
          credentials: "include",
          cache: "no-store",
        });
        if (!res.ok) return;
        const data = await res.json();
        const normalized = normalizeRoles(data?.user?.roles);
        if (mounted) {
          setRoles(normalized);
          if (normalized.length) {
            window.localStorage.setItem(
              "offisphere_roles",
              JSON.stringify(normalized),
            );
          }
        }
      } catch {
        if (mounted) {
          setRoles([]);
        }
      }
    };

    loadRoles();
    return () => {
      mounted = false;
    };
  }, []);
  const authHeaders = { "Content-Type": "application/json" };

  const isAdmin =
    roles.includes("admin") ||
    roles.includes("super_admin") ||
    roles.includes("superadmin");
  const isManager = roles.includes("manager");
  const canReview = isAdmin || isManager;

  const fetchLeaves = async () => {
    setLoadingList(true);
    setListError("");

    try {
      const res = await fetch(`${API_BASE}/api/leaves`, {
        credentials: "include",
        headers: authHeaders,
      });

      const data = await res.json();

      if (!res.ok) {
        setListError(data.message || "Failed to load leaves");
      } else {
        setLeaves(data);
      }
    } catch (err) {
      console.error(err);
      setListError("Error connecting to server");
    } finally {
      setLoadingList(false);
    }
  };

  useEffect(() => {
    fetchLeaves();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleApplyLeave = async (e) => {
    e.preventDefault();
    setApplyLoading(true);
    setApplyError("");
    setApplySuccess("");

    try {
      const res = await fetch(`${API_BASE}/api/leaves/apply`, {
        credentials: "include",
        method: "POST",
        headers: authHeaders,
        body: JSON.stringify({
          leave_type: leaveType,
          start_date: startDate,
          end_date: endDate,
          reason,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setApplyError(data.message || "Failed to submit leave");
      } else {
        setApplySuccess("Leave request submitted");
        setReason("");
        setStartDate("");
        setEndDate("");
        fetchLeaves();
      }
    } catch (err) {
      console.error(err);
      setApplyError("Error connecting to server");
    } finally {
      setApplyLoading(false);
    }
  };

  const handleUpdateStatus = async (id, newStatus, rejectionReason) => {
    setStatusActionLoadingId(id);
    setListError("");

    try {
      const res = await fetch(`${API_BASE}/api/leaves/${id}/status`, {
        credentials: "include",
        method: "PATCH",
        headers: authHeaders,
        body: JSON.stringify({
          status: newStatus,
          rejection_reason: rejectionReason || null,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setListError(data.message || "Failed to update status");
        return false;
      } else {
        fetchLeaves();
        return true;
      }
    } catch (err) {
      console.error(err);
      setListError("Error connecting to server");
      return false;
    } finally {
      setStatusActionLoadingId(null);
    }
  };

  const statusChipStyles = (status) => {
    switch (status) {
      case "approved":
        return "bg-emerald-50 text-emerald-700 border-emerald-100";
      case "rejected":
        return "bg-red-50 text-red-600 border-red-100";
      default:
        return "bg-amber-50 text-amber-700 border-amber-100";
    }
  };

  const formatDate = (value) => {
    if (!value) return "-";
    return new Date(value).toLocaleDateString();
  };

  const openReviewModal = (leave) => {
    setReviewLeave(leave);
    setReviewStatus("approved");
    setReviewReason("");
    setReviewError("");
    setReviewModalOpen(true);
  };

  const closeReviewModal = () => {
    setReviewModalOpen(false);
    setReviewLeave(null);
    setReviewStatus("approved");
    setReviewReason("");
    setReviewError("");
  };

  const handleReviewSubmit = async (event) => {
    event.preventDefault();
    if (!reviewLeave) return;

    setReviewLoading(true);
    setReviewError("");
    const ok = await handleUpdateStatus(
      reviewLeave.id,
      reviewStatus,
      reviewReason.trim(),
    );
    setReviewLoading(false);
    if (ok) {
      closeReviewModal();
    }
  };

  // Apply filters client-side
  const filteredLeaves = leaves.filter((leave) => {
    const matchesStatus =
      filterStatus === "all" ? true : leave.status === filterStatus;
    const matchesType =
      filterType === "all" ? true : leave.leave_type === filterType;
    return matchesStatus && matchesType;
  });

  const now = new Date();
  const currentMonthKey = `${now.getFullYear()}-${now.getMonth()}`;
  const isInCurrentMonth = (value) => {
    if (!value) return false;
    const date = new Date(value);
    return `${date.getFullYear()}-${date.getMonth()}` === currentMonthKey;
  };

  const pendingCount = leaves.filter((l) => l.status === "pending").length;
  const approvedThisMonth = leaves.filter(
    (l) => l.status === "approved" && isInCurrentMonth(l.created_at),
  ).length;
  const rejectedThisMonth = leaves.filter(
    (l) => l.status === "rejected" && isInCurrentMonth(l.created_at),
  ).length;
  const approvalDurations = leaves
    .filter(
      (l) =>
        (l.status === "approved" || l.status === "rejected") &&
        l.created_at &&
        l.updated_at,
    )
    .map(
      (l) =>
        (new Date(l.updated_at).getTime() -
          new Date(l.created_at).getTime()) /
        (1000 * 60 * 60),
    )
    .filter((v) => Number.isFinite(v));
  const avgApprovalHours = approvalDurations.length
    ? Math.round(
        approvalDurations.reduce((acc, val) => acc + val, 0) /
          approvalDurations.length,
      )
    : null;

  return (
    <div className="space-y-6 rounded-3xl bg-slate-50/70 p-4 md:p-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
        <div className="space-y-3">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-blue-600 text-white text-xs font-semibold shadow-[0_8px_20px_rgba(124,58,237,0.25)]">
            <span>Leave desk</span>
          </div>
          <div>
            <h1 className="text-3xl font-semibold text-slate-900">
              Leave Management
            </h1>
            <p className="text-sm text-slate-500">
              Apply for leave and track approvals. Admins can review and approve
              requests.
            </p>
          </div>
        </div>
      </div>

      {/* KPI cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <KpiCard
          label="Pending requests"
          value={pendingCount}
          loading={loadingList}
          icon="clock"
          accent="#f59e0b"
        />
        <KpiCard
          label="Approved this month"
          value={approvedThisMonth}
          loading={loadingList}
          icon="check"
          accent="#10b981"
        />
        <KpiCard
          label="Rejected this month"
          value={rejectedThisMonth}
          loading={loadingList}
          icon="alert"
          accent="#ef4444"
        />
        <KpiCard
          label="Avg approval time"
          value={avgApprovalHours != null ? `${avgApprovalHours}h` : "--"}
          loading={loadingList}
          icon="clock"
          accent="#6366f1"
        />
      </div>

      {/* Apply leave card */}
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
              <path d="M8 2v4" />
              <path d="M16 2v4" />
              <rect x="3" y="4" width="18" height="18" rx="2" />
              <path d="M3 10h18" />
            </svg>
          </div>
          <div>
            <h2 className="text-lg font-semibold text-slate-900">
              Apply for leave
            </h2>
            <p className="text-xs text-slate-500">
              Submit a request with dates and reason.
            </p>
          </div>
        </div>

        <form
          onSubmit={handleApplyLeave}
          className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm"
        >
          <div className="space-y-1">
            <label className="font-medium text-slate-700">Leave type</label>
            <select
              value={leaveType}
              onChange={(e) => setLeaveType(e.target.value)}
              className="w-full px-4 py-3 rounded-2xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              {LEAVE_TYPES.map((lt) => (
                <option key={lt.value} value={lt.value}>
                  {lt.label}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-1">
            <label className="font-medium text-slate-700">Start date</label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="w-full px-4 py-3 rounded-2xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              required
            />
          </div>

          <div className="space-y-1">
            <label className="font-medium text-slate-700">End date</label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="w-full px-4 py-3 rounded-2xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              required
            />
          </div>

          <div className="space-y-1 md:col-span-1">
            <label className="font-medium text-slate-700">
              Reason (optional)
            </label>
            <textarea
              rows={3}
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Eg. Medical appointment, family function, etc."
              className="w-full px-4 py-3 rounded-2xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
            />
          </div>

          <div className="md:col-span-2 flex flex-col gap-2 mt-2">
            {applyError && (
              <p className="text-xs text-rose-600 bg-rose-50 border border-rose-100 rounded-xl px-3 py-2">
                {applyError}
              </p>
            )}
            {applySuccess && (
              <p className="text-xs text-emerald-600 bg-emerald-50 border border-emerald-100 rounded-xl px-3 py-2">
                {applySuccess}
              </p>
            )}
            <button
              type="submit"
              disabled={applyLoading}
              className="self-start px-5 py-2.5 rounded-2xl text-xs font-semibold text-white bg-blue-600 shadow-lg shadow-blue-300/40 hover:bg-blue-700 disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {applyLoading ? "Submitting..." : "Submit leave request"}
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
              Filter by status or leave type.
            </p>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
          <div className="space-y-1">
            <label className="font-medium text-slate-700">Status</label>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="w-full px-4 py-3 rounded-2xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              {STATUS_FILTERS.map((st) => (
                <option key={st.value} value={st.value}>
                  {st.label}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-1">
            <label className="font-medium text-slate-700">Leave type</label>
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className="w-full px-4 py-3 rounded-2xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">All types</option>
              {LEAVE_TYPES.map((lt) => (
                <option key={lt.value} value={lt.value}>
                  {lt.label}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Leave list */}
      <div className="rounded-3xl bg-white p-6 shadow-[0_18px_40px_rgba(15,23,42,0.08)] border border-slate-100">
        <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-slate-100">
          <div>
            <h2 className="text-lg font-semibold text-slate-900">
              Leave requests
            </h2>
            <p className="text-xs text-slate-500">
              {filteredLeaves.length} requests
            </p>
          </div>
          {canReview && (
            <span className="text-[11px] text-slate-500">
              Approve or reject pending requests.
            </span>
          )}
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
                <th className="text-left px-6 py-3 font-semibold">Type</th>
                <th className="text-left px-6 py-3 font-semibold">From</th>
                <th className="text-left px-6 py-3 font-semibold">To</th>
                <th className="text-left px-6 py-3 font-semibold">Days</th>
                <th className="text-left px-6 py-3 font-semibold">Status</th>
                {canReview && (
                  <th className="text-right px-6 py-3 font-semibold">
                    Actions
                  </th>
                )}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loadingList ? (
                <tr>
                  <td
                    colSpan={canReview ? 7 : 6}
                    className="px-6 py-8 text-center text-xs text-slate-400"
                  >
                    Loading leaves...
                  </td>
                </tr>
              ) : filteredLeaves.length === 0 ? (
                <tr>
                  <td
                    colSpan={canReview ? 7 : 6}
                    className="px-6 py-8 text-center text-xs text-slate-400"
                  >
                    No leave requests match your filters.
                  </td>
                </tr>
              ) : (
                filteredLeaves.map((leave) => {
                  const rowIsEditable = canReview;
                  return (
                    <tr
                      key={leave.id}
                      onClick={() => {
                        if (rowIsEditable) openReviewModal(leave);
                      }}
                      className={`transition ${
                        rowIsEditable
                          ? "hover:bg-slate-50 cursor-pointer"
                          : "hover:bg-slate-50"
                      }`}
                    >
                    <td className="px-6 py-4 text-slate-800">
                      {leave.full_name}
                    </td>
                    <td className="px-6 py-4 text-slate-600">
                      {leave.leave_type}
                    </td>
                    <td className="px-6 py-4 text-slate-600">
                      {formatDate(leave.start_date)}
                    </td>
                    <td className="px-6 py-4 text-slate-600">
                      {formatDate(leave.end_date)}
                    </td>
                    <td className="px-6 py-4 text-slate-600">
                      {leave.total_days}
                    </td>
                    <td className="px-6 py-4 text-xs">
                      <span
                        className={`px-2.5 py-1 rounded-full border font-medium ${statusChipStyles(
                          leave.status,
                        )}`}
                      >
                        {leave.status}
                      </span>
                    </td>
                    {canReview && (
                      <td className="px-6 py-4 text-xs text-right">
                        <button
                          type="button"
                          onClick={(event) => {
                            event.stopPropagation();
                            openReviewModal(leave);
                          }}
                          disabled={statusActionLoadingId === leave.id}
                          className="text-xs font-semibold text-blue-600 hover:text-blue-800 disabled:opacity-60"
                        >
                          Edit
                        </button>
                      </td>
                    )}
                  </tr>
                )})
              )}
            </tbody>
          </table>
        </div>
      </div>

      {reviewModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 px-4">
          <div className="w-full max-w-lg rounded-3xl bg-white p-6 shadow-[0_20px_60px_rgba(15,23,42,0.25)] border border-slate-100">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h3 className="text-lg font-semibold text-slate-900">
                  Review leave request
                </h3>
                <p className="text-xs text-slate-500">
                  Approve or reject and provide a reason when rejecting.
                </p>
              </div>
              <button
                type="button"
                onClick={closeReviewModal}
                className="text-slate-400 hover:text-slate-600"
                aria-label="Close"
              >
                ✕
              </button>
            </div>

            <div className="mt-4 rounded-2xl bg-slate-50 px-4 py-3 text-xs text-slate-600">
              <div className="flex flex-wrap gap-2">
                <span className="font-semibold text-slate-700">Employee:</span>
                <span>{reviewLeave?.full_name || "-"}</span>
              </div>
              <div className="flex flex-wrap gap-2">
                <span className="font-semibold text-slate-700">Dates:</span>
                <span>
                  {formatDate(reviewLeave?.start_date)} -{" "}
                  {formatDate(reviewLeave?.end_date)}
                </span>
              </div>
              <div className="flex flex-wrap gap-2">
                <span className="font-semibold text-slate-700">Type:</span>
                <span>{reviewLeave?.leave_type || "-"}</span>
              </div>
            </div>

            <form onSubmit={handleReviewSubmit} className="mt-4 space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-700">
                  Decision
                </label>
                <select
                  value={reviewStatus}
                  onChange={(e) => setReviewStatus(e.target.value)}
                  className="w-full px-4 py-3 rounded-2xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="approved">Approve</option>
                  <option value="rejected">Reject</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-700">
                  Rejection reason
                </label>
                <textarea
                  rows={3}
                  value={reviewReason}
                  onChange={(e) => setReviewReason(e.target.value)}
                  placeholder="Provide a short explanation"
                  className="w-full px-4 py-3 rounded-2xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                />
                <p className="text-[11px] text-slate-500">
                  Optional. Add context for the employee.
                </p>
              </div>

              {reviewError && (
                <p className="text-xs text-rose-600 bg-rose-50 border border-rose-100 rounded-xl px-3 py-2">
                  {reviewError}
                </p>
              )}

              <div className="flex flex-wrap justify-end gap-2">
                <button
                  type="button"
                  onClick={closeReviewModal}
                  className="px-4 py-2 rounded-2xl text-xs font-semibold text-slate-600 border border-slate-200 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={reviewLoading}
                  className="px-5 py-2 rounded-2xl text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-60"
                >
                  {reviewLoading ? "Saving..." : "Save decision"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
