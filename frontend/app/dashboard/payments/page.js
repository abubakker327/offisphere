"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";

const STATUS_OPTIONS = [
  { value: "received", label: "Received" },
  { value: "pending", label: "Pending" },
  { value: "failed", label: "Failed" },
  { value: "refunded", label: "Refunded" },
];

const FILTERS = [
  { value: "all", label: "All" },
  { value: "received", label: "Received" },
  { value: "pending", label: "Pending" },
  { value: "failed", label: "Failed" },
  { value: "refunded", label: "Refunded" },
];

export default function PaymentsPage() {
  const [payments, setPayments] = useState([]);
  const [leads, setLeads] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [isAdminManager, setIsAdminManager] = useState(false);

  const [form, setForm] = useState({
    lead_id: "",
    amount: "",
    currency: "INR",
    status: "received",
    method: "",
    reference: "",
    notes: "",
    paid_at: "",
  });

  const API_BASE =
    process.env.NEXT_PUBLIC_API_BASE || "https://offisphere.onrender.com";

  const triggerToast = (type, message) => {
    window.dispatchEvent(
      new CustomEvent("offisphere-toast", {
        detail: { type, message },
      }),
    );
  };

  const loadRoles = () => {
    try {
      const rolesStr = window.localStorage.getItem("offisphere_roles");
      if (!rolesStr) return;
      const roles = JSON.parse(rolesStr);
      if (!Array.isArray(roles)) return;
      const flag = roles.includes("admin") || roles.includes("manager");
      setIsAdminManager(flag);
    } catch {
      setIsAdminManager(false);
    }
  };

  const fetchLeads = async () => {
    try {
      const res = await fetch(`${API_BASE}/api/leads?status=all`, {
        credentials: "include",
      });

      const data = await res.json();
      if (Array.isArray(data)) {
        setLeads(data);
      }
    } catch (err) {
      console.error("Fetch leads for payments error:", err);
    }
  };

  const fetchPayments = async (status = "all") => {
    try {
      const qs = status ? `?status=${status}` : "";
      const res = await fetch(`${API_BASE}/api/payments${qs}`, {
        credentials: "include",
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.message || "Error fetching payments");
      } else {
        setPayments(Array.isArray(data) ? data : []);
        setError("");
      }
    } catch (err) {
      console.error("Fetch payments error:", err);
      setError("Error connecting to server");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadRoles();
    fetchPayments(filterStatus);
    fetchLeads();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleChange = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError("");

    try {
      const body = {
        ...form,
        amount: form.amount !== "" ? parseFloat(form.amount) : null,
        lead_id: form.lead_id !== "" ? form.lead_id : null,
      };

      const res = await fetch(`${API_BASE}/api/payments`, {
        credentials: "include",
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(body),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.message || "Error recording payment");
        triggerToast("error", data.message || "Error recording payment");
      } else {
        setPayments(Array.isArray(data) ? data : []);
        triggerToast("success", "Payment recorded.");
        setForm({
          lead_id: "",
          amount: "",
          currency: "INR",
          status: "received",
          method: "",
          reference: "",
          notes: "",
          paid_at: "",
        });
      }
    } catch (err) {
      console.error("Create payment error:", err);
      setError("Error connecting to server");
      triggerToast("error", "Error connecting to server");
    } finally {
      setSaving(false);
    }
  };

  const handleStatusFilter = (status) => {
    setFilterStatus(status);
    setLoading(true);
    fetchPayments(status);
  };

  const leadNameById = (id) => {
    const key = id != null ? String(id) : "";
    const match = leads.find((l) => String(l.id) === key);
    return match?.name || null;
  };

  const handleStatusChange = async (id, newStatus) => {
    try {
      const res = await fetch(`${API_BASE}/api/payments/${id}`, {
        credentials: "include",
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ status: newStatus }),
      });

      const data = await res.json();

      if (!res.ok) {
        triggerToast("error", data.message || "Error updating payment");
      } else {
        setPayments(Array.isArray(data) ? data : []);
        triggerToast("success", "Payment updated");
      }
    } catch (err) {
      console.error("Update payment status error:", err);
      triggerToast("error", "Error connecting to server");
    }
  };

  const formatDate = (value) =>
    value ? new Date(value).toLocaleDateString() : "--";

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25 }}
      className="space-y-6 rounded-3xl bg-slate-50/70 p-4 md:p-6"
    >
      <div className="flex items-center justify-between">
        <div className="space-y-3">
          <div className="of-pill">
            <span>Payment log</span>
          </div>
          <div>
            <h1 className="page-title">Payments</h1>
            <p className="page-subtitle">
              Track incoming payments against leads.
            </p>
          </div>
        </div>
      </div>

      {/* Record payment */}
      <div className="of-card p-6">
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
              <rect x="2" y="5" width="20" height="14" rx="2" />
              <circle cx="12" cy="12" r="3" />
              <path d="M7 10h.01M17 14h.01" />
            </svg>
          </div>
          <div>
            <h2 className="section-title">Record payment</h2>
            <p className="section-subtitle">
              Log payments tied to leads and invoices.
            </p>
          </div>
        </div>

        {error && <div className="mb-3 of-banner-error">{error}</div>}

        <form
          onSubmit={handleCreate}
          className="grid grid-cols-1 md:grid-cols-6 gap-3 text-sm"
        >
          <div className="md:col-span-2 space-y-1">
            <label className="of-label">Lead</label>
            <select
              value={form.lead_id}
              onChange={(e) => handleChange("lead_id", e.target.value)}
              className="of-input text-xs"
            >
              <option value="">No lead</option>
              {leads.map((lead) => (
                <option key={lead.id} value={lead.id}>
                  {lead.name}
                  {lead.company ? ` - ${lead.company}` : ""}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-1">
            <label className="of-label">Amount</label>
            <input
              type="number"
              step="0.01"
              value={form.amount}
              onChange={(e) => handleChange("amount", e.target.value)}
              className="of-input"
              placeholder="25000"
              required
            />
          </div>

          <div className="space-y-1">
            <label className="of-label">Currency</label>
            <input
              type="text"
              value={form.currency}
              onChange={(e) => handleChange("currency", e.target.value)}
              className="of-input text-xs"
            />
          </div>

          <div className="space-y-1">
            <label className="of-label">Status</label>
            <select
              value={form.status}
              onChange={(e) => handleChange("status", e.target.value)}
              className="of-input text-xs"
            >
              {STATUS_OPTIONS.map((s) => (
                <option key={s.value} value={s.value}>
                  {s.label}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-1">
            <label className="of-label">Method</label>
            <input
              type="text"
              value={form.method}
              onChange={(e) => handleChange("method", e.target.value)}
              className="of-input"
              placeholder="UPI / Bank / Card"
            />
          </div>

          <div className="space-y-1">
            <label className="of-label">Paid date (optional)</label>
            <input
              type="date"
              value={form.paid_at}
              onChange={(e) => handleChange("paid_at", e.target.value)}
              className="of-input text-xs"
            />
          </div>

          <div className="md:col-span-3 space-y-1">
            <label className="of-label">Reference</label>
            <input
              type="text"
              value={form.reference}
              onChange={(e) => handleChange("reference", e.target.value)}
              className="of-input"
              placeholder="TXN ID / invoice no"
            />
          </div>

          <div className="md:col-span-3 space-y-1">
            <label className="of-label">Notes</label>
            <input
              type="text"
              value={form.notes}
              onChange={(e) => handleChange("notes", e.target.value)}
              className="of-input"
              placeholder="Optional notes"
            />
          </div>

          <div className="md:col-span-6 flex justify-end pt-1">
            <motion.button
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              type="submit"
              disabled={saving}
              className="of-button-primary"
            >
              {saving ? "Saving..." : "Record payment"}
            </motion.button>
          </div>
        </form>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-2 text-xs">
        {FILTERS.map((f) => {
          const active = f.value === filterStatus;
          return (
            <button
              key={f.value}
              onClick={() => handleStatusFilter(f.value)}
              className={`of-chip transition ${
                active
                  ? "bg-blue-600 text-white border-transparent shadow"
                  : "hover:border-blue-200"
              }`}
            >
              {f.label}
            </button>
          );
        })}
      </div>

      {/* Payments list */}
      <div className="of-card">
        <div className="flex flex-wrap items-center justify-between gap-4 px-6 py-4 border-b border-slate-100">
          <div className="flex items-center gap-3">
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
                <rect x="2" y="5" width="20" height="14" rx="2" />
                <circle cx="12" cy="12" r="3" />
                <path d="M7 10h.01M17 14h.01" />
              </svg>
            </div>
            <div>
              <h2 className="section-title">Payment history</h2>
              <p className="section-subtitle">{payments.length} payments</p>
            </div>
          </div>
          {isAdminManager && (
            <span className="text-[11px] text-slate-500">
              Admins or managers can adjust status.
            </span>
          )}
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead className="bg-slate-50 text-xs text-slate-600 uppercase tracking-wider">
              <tr>
                <th className="text-left px-6 py-3 font-semibold">Lead</th>
                <th className="text-left px-6 py-3 font-semibold">Amount</th>
                <th className="text-left px-6 py-3 font-semibold">Method</th>
                <th className="text-left px-6 py-3 font-semibold">Status</th>
                <th className="text-left px-6 py-3 font-semibold">Reference</th>
                <th className="text-left px-6 py-3 font-semibold">
                  Recorded by
                </th>
                <th className="text-left px-6 py-3 font-semibold">Paid date</th>
                <th className="text-left px-6 py-3 font-semibold">Created</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={8} className="px-6 py-8 of-loading">
                    Loading payments...
                  </td>
                </tr>
              ) : payments.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-6 py-8 of-empty">
                    No payments found.
                  </td>
                </tr>
              ) : (
                payments.map((p) => (
                  <tr key={p.id} className="hover:bg-slate-50">
                    <td className="px-6 py-4 text-slate-900">
                      {p.lead_name || leadNameById(p.lead_id) || "--"}
                    </td>
                    <td className="px-6 py-4 text-xs text-slate-600">
                      {p.amount} {p.currency}
                    </td>
                    <td className="px-6 py-4 text-xs text-slate-600">
                      {p.method || "--"}
                    </td>
                    <td className="px-6 py-4 text-xs">
                      {isAdminManager ? (
                        <select
                          value={p.status}
                          onChange={(e) =>
                            handleStatusChange(p.id, e.target.value)
                          }
                          className="rounded-full border border-slate-200 bg-white px-3 py-1 text-xs shadow-sm hover:border-blue-200"
                        >
                          {STATUS_OPTIONS.map((s) => (
                            <option key={s.value} value={s.value}>
                              {s.label}
                            </option>
                          ))}
                        </select>
                      ) : (
                        <span
                          className={`px-3 py-1 rounded-full border text-xs font-medium ${
                            p.status === "received"
                              ? "bg-emerald-50 text-emerald-700 border-emerald-100"
                              : p.status === "pending"
                                ? "bg-amber-50 text-amber-700 border-amber-100"
                                : p.status === "failed"
                                  ? "bg-rose-50 text-rose-700 border-rose-100"
                                  : "bg-slate-50 text-slate-700 border-slate-200"
                          }`}
                        >
                          {p.status}
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-xs text-slate-600">
                      {p.reference || "--"}
                    </td>
                    <td className="px-6 py-4 text-xs text-slate-600">
                      {p.recorded_by_name || "--"}
                    </td>
                    <td className="px-6 py-4 text-xs text-slate-600">
                      {formatDate(p.paid_at)}
                    </td>
                    <td className="px-6 py-4 text-xs text-slate-600">
                      {formatDate(p.created_at)}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </motion.div>
  );
}
