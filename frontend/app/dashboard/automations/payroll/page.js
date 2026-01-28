"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import Link from "next/link";

export default function PayrollDashboardPage() {
  const [mounted, setMounted] = useState(false);
  const [payrolls, setPayrolls] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all"); // all, pending, approved, blocked
  const [selectedPayroll, setSelectedPayroll] = useState(null);

  const API_BASE = process.env.NEXT_PUBLIC_API_BASE || "https://offisphere.onrender.com";

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted) return;
    const fetchPayrolls = async () => {
      try {
        setLoading(true);
        const res = await fetch(`${API_BASE}/api/payroll/runs`, {
          credentials: "include",
        });
        const data = res.ok ? await res.json() : [];
        setPayrolls(data);
      } catch (err) {
        console.error("Error fetching payrolls:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchPayrolls();
    const interval = setInterval(fetchPayrolls, 60000); // Refresh every 60s
    return () => clearInterval(interval);
  }, [API_BASE, mounted]);

  const filteredPayrolls = payrolls.filter((p) => {
    if (filter === "all") return true;
    if (filter === "blocked") return p.is_blocked_for_anomalies;
    if (filter === "pending") return p.validation_status === "pending";
    if (filter === "approved") return p.hr_approved && p.finance_approved;
    return true;
  });

  const getStatusColor = (status, isBlocked) => {
    if (isBlocked) return "bg-red-100 text-red-800 border-red-200";
    switch (status) {
      case "pending":
        return "bg-yellow-100 text-yellow-800 border-yellow-200";
      case "approved":
        return "bg-green-100 text-green-800 border-green-200";
      case "failed":
        return "bg-orange-100 text-orange-800 border-orange-200";
      default:
        return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  const getStatusLabel = (status, isBlocked) => {
    if (isBlocked) return "🚫 Blocked";
    switch (status) {
      case "pending":
        return "⏳ Pending";
      case "approved":
        return "✓ Approved";
      case "failed":
        return "✗ Failed";
      default:
        return "Unknown";
    }
  };

  const getApprovalProgress = (payroll) => {
    let progress = 0;
    if (payroll.validation_status === "passed") progress += 25;
    if (payroll.hr_approved) progress += 25;
    if (payroll.finance_approved) progress += 25;
    if (payroll.is_processed) progress += 25;
    return progress;
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
            <div className="h-10 w-10 rounded-2xl bg-purple-100 text-purple-600 flex items-center justify-center">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="2" y="7" width="20" height="14" rx="2" ry="2" />
                <path d="M16 21V5a2 2 0 00-2-2h-4a2 2 0 00-2 2v16" />
              </svg>
            </div>
            <div>
              <h1 className="text-3xl font-bold text-slate-900">Payroll Coupling</h1>
              <p className="text-sm text-slate-600">Validation, dual approval, and blocking mechanism</p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="mx-auto max-w-7xl px-6 py-8">
        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-white rounded-2xl border border-slate-200 p-6">
            <h3 className="text-sm font-medium text-slate-600 mb-2">Total Runs</h3>
            <div className="text-3xl font-bold text-slate-900">{payrolls.length}</div>
            <p className="text-xs text-slate-500 mt-2">All-time</p>
          </div>

          <div className="bg-yellow-50 border-2 border-yellow-200 rounded-2xl p-6">
            <h3 className="text-sm font-medium text-yellow-800 mb-2">Pending</h3>
            <div className="text-3xl font-bold text-yellow-600">
              {payrolls.filter((p) => p.validation_status === "pending").length}
            </div>
            <p className="text-xs text-yellow-700 mt-2">Awaiting validation</p>
          </div>

          <div className="bg-red-50 border-2 border-red-200 rounded-2xl p-6">
            <h3 className="text-sm font-medium text-red-800 mb-2">Blocked</h3>
            <div className="text-3xl font-bold text-red-600">
              {payrolls.filter((p) => p.is_blocked_for_anomalies).length}
            </div>
            <p className="text-xs text-red-700 mt-2">Non-bypassable blocks</p>
          </div>

          <div className="bg-green-50 border-2 border-green-200 rounded-2xl p-6">
            <h3 className="text-sm font-medium text-green-800 mb-2">Approved</h3>
            <div className="text-3xl font-bold text-green-600">
              {payrolls.filter((p) => p.hr_approved && p.finance_approved).length}
            </div>
            <p className="text-xs text-green-700 mt-2">Dual approved</p>
          </div>
        </div>

        {/* Filter Buttons */}
        <div className="flex gap-2 mb-6 flex-wrap">
          {["all", "pending", "blocked", "approved"].map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                filter === f
                  ? "bg-blue-600 text-white"
                  : "bg-white border border-slate-200 text-slate-700 hover:border-slate-300"
              }`}
            >
              {f.charAt(0).toUpperCase() + f.slice(1)}
            </button>
          ))}
        </div>

        {/* Info Alert */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-red-50 border border-red-200 rounded-2xl p-4 mb-6 flex gap-3"
        >
          <div className="h-5 w-5 rounded-full bg-red-600 text-white flex items-center justify-center text-xs flex-shrink-0 mt-0.5">
            ⚠
          </div>
          <div className="text-sm text-red-900">
            <strong>Critical Control:</strong> Payroll runs are automatically blocked if critical attendance anomalies exist. Blocks are non-bypassable and require HR + Finance dual approval.
          </div>
        </motion.div>

        {/* Payroll Runs List */}
        <div className="space-y-3">
          {loading ? (
            <div className="text-center py-12">
              <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-slate-200 border-t-blue-600"></div>
              <p className="text-slate-600 mt-3">Loading payroll runs...</p>
            </div>
          ) : filteredPayrolls.length === 0 ? (
            <div className="text-center py-12 bg-white rounded-2xl border border-slate-200">
              <div className="text-4xl mb-2">✓</div>
              <p className="text-slate-600">No payroll runs in this category</p>
            </div>
          ) : (
            filteredPayrolls.map((payroll, idx) => (
              <motion.div
                key={payroll.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.05 }}
                onClick={() => setSelectedPayroll(payroll)}
                className={`rounded-2xl border-2 p-6 cursor-pointer transition-all hover:shadow-md ${getStatusColor(payroll.validation_status, payroll.is_blocked_for_anomalies)}`}
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <span className="text-2xl">💰</span>
                      <div>
                        <h3 className="font-semibold">
                          Payroll Run #{payroll.id}
                        </h3>
                        <p className="text-xs opacity-75" suppressHydrationWarning>
                          Period: {new Date(payroll.period_start).toISOString().split('T')[0]} - {new Date(payroll.period_end).toISOString().split('T')[0]}
                        </p>
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="inline-block px-3 py-1 rounded-full text-sm font-medium bg-white bg-opacity-50">
                      {getStatusLabel(payroll.validation_status, payroll.is_blocked_for_anomalies)}
                    </div>
                  </div>
                </div>

                {/* Approval Progress */}
                <div className="mb-4">
                  <div className="flex justify-between items-center mb-2">
                    <p className="text-xs font-medium opacity-75">Approval Progress</p>
                    <p className="text-xs font-bold">{getApprovalProgress(payroll)}%</p>
                  </div>
                  <div className="w-full bg-white bg-opacity-30 rounded-full h-2">
                    <div
                      className="bg-white h-2 rounded-full transition-all"
                      style={{ width: `${getApprovalProgress(payroll)}%` }}
                    ></div>
                  </div>
                </div>

                {/* Approval Badges */}
                <div className="flex gap-2 flex-wrap">
                  <span className={`text-xs px-2 py-1 rounded border ${payroll.validation_status === "passed" ? "bg-white bg-opacity-50" : "opacity-50"}`}>
                    {payroll.validation_status === "passed" ? "✓" : "○"} Validation
                  </span>
                  <span className={`text-xs px-2 py-1 rounded border ${payroll.hr_approved ? "bg-white bg-opacity-50" : "opacity-50"}`}>
                    {payroll.hr_approved ? "✓" : "○"} HR Approved
                  </span>
                  <span className={`text-xs px-2 py-1 rounded border ${payroll.finance_approved ? "bg-white bg-opacity-50" : "opacity-50"}`}>
                    {payroll.finance_approved ? "✓" : "○"} Finance Approved
                  </span>
                  <span className={`text-xs px-2 py-1 rounded border ${payroll.is_processed ? "bg-white bg-opacity-50" : "opacity-50"}`}>
                    {payroll.is_processed ? "✓" : "○"} Processed
                  </span>
                </div>
              </motion.div>
            ))
          )}
        </div>
      </div>

      {/* Detail Modal */}
      {selectedPayroll && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50 overflow-y-auto" onClick={() => setSelectedPayroll(null)}>
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            onClick={(e) => e.stopPropagation()}
            className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl my-4"
          >
            <h2 className="text-xl font-bold text-slate-900 mb-4">Payroll Run #{selectedPayroll.id}</h2>
            <div className="space-y-3 mb-6">
              <div>
                <p className="text-xs text-slate-500">PERIOD</p>
                <p className="text-sm font-medium text-slate-900" suppressHydrationWarning>
                  {new Date(selectedPayroll.period_start).toISOString().split('T')[0]} - {new Date(selectedPayroll.period_end).toISOString().split('T')[0]}
                </p>
              </div>
              <div>
                <p className="text-xs text-slate-500">VALIDATION STATUS</p>
                <p className="text-sm font-medium text-slate-900">
                  {selectedPayroll.validation_status?.toUpperCase()}
                </p>
              </div>
              <div>
                <p className="text-xs text-slate-500">BLOCKED FOR ANOMALIES</p>
                <p className="text-sm font-medium text-slate-900">
                  {selectedPayroll.is_blocked_for_anomalies ? "🚫 Yes (Non-bypassable)" : "✓ No"}
                </p>
              </div>
              <div>
                <p className="text-xs text-slate-500">APPROVALS</p>
                <div className="space-y-1 mt-1">
                  <p className="text-sm">
                    <span className={selectedPayroll.hr_approved ? "✓" : "○"}>
                      {" "}
                      HR: {selectedPayroll.hr_approved ? "Approved" : "Pending"}
                    </span>
                  </p>
                  <p className="text-sm">
                    <span className={selectedPayroll.finance_approved ? "✓" : "○"}>
                      {" "}
                      Finance: {selectedPayroll.finance_approved ? "Approved" : "Pending"}
                    </span>
                  </p>
                </div>
              </div>
              <div>
                <p className="text-xs text-slate-500">EMPLOYEE COUNT</p>
                <p className="text-sm font-medium text-slate-900">{selectedPayroll.employee_count || "N/A"}</p>
              </div>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => setSelectedPayroll(null)}
                className="flex-1 px-4 py-2 rounded-lg border border-slate-200 text-slate-700 hover:bg-slate-50 transition-all"
              >
                Close
              </button>
              <button
                onClick={() => {
                  // TODO: Approve or manage payroll
                  setSelectedPayroll(null);
                }}
                className="flex-1 px-4 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 transition-all"
              >
                Manage
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}
