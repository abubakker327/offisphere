// Frontend utilities for automation dashboard API calls
// Place at: frontend/lib/automationApi.js

const API_BASE = process.env.NEXT_PUBLIC_API_BASE || "https://offisphere.onrender.com";

export const automationApi = {
  // Attendance Anomalies
  async getAnomalies(filters = {}) {
    const query = new URLSearchParams(filters);
    const res = await fetch(`${API_BASE}/api/attendance/anomalies?${query}`, {
      credentials: "include",
      headers: { "Content-Type": "application/json" },
    });
    if (!res.ok) throw new Error("Failed to fetch anomalies");
    return res.json();
  },

  async getAnomalyDetail(anomalyId) {
    const res = await fetch(`${API_BASE}/api/attendance/anomalies/${anomalyId}`, {
      credentials: "include",
    });
    if (!res.ok) throw new Error("Failed to fetch anomaly detail");
    return res.json();
  },

  async resolveAnomaly(anomalyId, managerResponse) {
    const res = await fetch(`${API_BASE}/api/attendance/anomalies/${anomalyId}/resolve`, {
      method: "PATCH",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ manager_response: managerResponse }),
    });
    if (!res.ok) throw new Error("Failed to resolve anomaly");
    return res.json();
  },

  async escalateAnomaly(anomalyId) {
    const res = await fetch(`${API_BASE}/api/attendance/anomalies/${anomalyId}/escalate`, {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
    });
    if (!res.ok) throw new Error("Failed to escalate anomaly");
    return res.json();
  },

  // Timesheet Escalations
  async getTimesheetEscalations(filters = {}) {
    const query = new URLSearchParams(filters);
    const res = await fetch(`${API_BASE}/api/timesheets/escalations?${query}`, {
      credentials: "include",
    });
    if (!res.ok) throw new Error("Failed to fetch escalations");
    return res.json();
  },

  async getTimesheetStats() {
    const res = await fetch(`${API_BASE}/api/timesheets/escalations/stats`, {
      credentials: "include",
    });
    if (!res.ok) throw new Error("Failed to fetch stats");
    return res.json();
  },

  async getIncompleteTimesheets() {
    const res = await fetch(`${API_BASE}/api/timesheets/pending`, {
      credentials: "include",
    });
    if (!res.ok) throw new Error("Failed to fetch incomplete timesheets");
    return res.json();
  },

  async completeTimesheet(timesheetId) {
    const res = await fetch(`${API_BASE}/api/timesheets/${timesheetId}/complete`, {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
    });
    if (!res.ok) throw new Error("Failed to complete timesheet");
    return res.json();
  },

  async getTimesheetEscalationHistory(timesheetId) {
    const res = await fetch(`${API_BASE}/api/timesheets/${timesheetId}/escalation-history`, {
      credentials: "include",
    });
    if (!res.ok) throw new Error("Failed to fetch history");
    return res.json();
  },

  // Task Overdue
  async getOverdueTasks(filters = {}) {
    const query = new URLSearchParams(filters);
    const res = await fetch(`${API_BASE}/api/tasks/overdue?${query}`, {
      credentials: "include",
    });
    if (!res.ok) throw new Error("Failed to fetch overdue tasks");
    return res.json();
  },

  async getTaskStats() {
    const res = await fetch(`${API_BASE}/api/tasks/stats/overdue`, {
      credentials: "include",
    });
    if (!res.ok) throw new Error("Failed to fetch task stats");
    return res.json();
  },

  async getTaskDependencies(taskId) {
    const res = await fetch(`${API_BASE}/api/tasks/${taskId}/dependencies`, {
      credentials: "include",
    });
    if (!res.ok) throw new Error("Failed to fetch dependencies");
    return res.json();
  },

  async createDependency(blockingTaskId, blockedTaskId) {
    const res = await fetch(`${API_BASE}/api/tasks/${blockingTaskId}/blocks/${blockedTaskId}`, {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
    });
    if (!res.ok) throw new Error("Failed to create dependency");
    return res.json();
  },

  async resolveDependency(dependencyId) {
    const res = await fetch(`${API_BASE}/api/tasks/dependencies/${dependencyId}/resolve`, {
      method: "PATCH",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
    });
    if (!res.ok) throw new Error("Failed to resolve dependency");
    return res.json();
  },

  async extendTaskDueDate(taskId, newDueDate) {
    const res = await fetch(`${API_BASE}/api/tasks/${taskId}/extend-due-date`, {
      method: "PATCH",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ new_due_date: newDueDate }),
    });
    if (!res.ok) throw new Error("Failed to extend due date");
    return res.json();
  },

  async getTaskAuditLogs(taskId) {
    const res = await fetch(`${API_BASE}/api/tasks/${taskId}/audit-logs`, {
      credentials: "include",
    });
    if (!res.ok) throw new Error("Failed to fetch audit logs");
    return res.json();
  },

  // Payroll
  async getPayrollRuns(filters = {}) {
    const query = new URLSearchParams(filters);
    const res = await fetch(`${API_BASE}/api/payroll/runs?${query}`, {
      credentials: "include",
    });
    if (!res.ok) throw new Error("Failed to fetch payroll runs");
    return res.json();
  },

  async getPayrollDetail(runId) {
    const res = await fetch(`${API_BASE}/api/payroll/runs/${runId}`, {
      credentials: "include",
    });
    if (!res.ok) throw new Error("Failed to fetch payroll detail");
    return res.json();
  },

  async validatePayroll(runId) {
    const res = await fetch(`${API_BASE}/api/payroll/runs/${runId}/validate`, {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
    });
    if (!res.ok) throw new Error("Failed to validate payroll");
    return res.json();
  },

  async getValidationResults(runId) {
    const res = await fetch(`${API_BASE}/api/payroll/runs/${runId}/validation-results`, {
      credentials: "include",
    });
    if (!res.ok) throw new Error("Failed to fetch validation results");
    return res.json();
  },

  async approvePayrollHR(runId) {
    const res = await fetch(`${API_BASE}/api/payroll/runs/${runId}/approve/hr`, {
      method: "PATCH",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
    });
    if (!res.ok) throw new Error("Failed to approve payroll (HR)");
    return res.json();
  },

  async approvePayrollFinance(runId) {
    const res = await fetch(`${API_BASE}/api/payroll/runs/${runId}/approve/finance`, {
      method: "PATCH",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
    });
    if (!res.ok) throw new Error("Failed to approve payroll (Finance)");
    return res.json();
  },

  async releasePayrollHold(runId) {
    const res = await fetch(`${API_BASE}/api/payroll/runs/${runId}/release-hold`, {
      method: "PATCH",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
    });
    if (!res.ok) throw new Error("Failed to release hold");
    return res.json();
  },
};

// Custom hook for automation data with real-time updates
export function useAutomationData(type, options = {}) {
  const [data, setData] = React.useState([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState(null);

  React.useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        let result;
        switch (type) {
          case "anomalies":
            result = await automationApi.getAnomalies(options.filters || {});
            break;
          case "timesheets":
            result = await automationApi.getTimesheetEscalations(options.filters || {});
            break;
          case "tasks":
            result = await automationApi.getOverdueTasks(options.filters || {});
            break;
          case "payroll":
            result = await automationApi.getPayrollRuns(options.filters || {});
            break;
          default:
            result = [];
        }
        setData(result);
        setError(null);
      } catch (err) {
        setError(err.message);
        console.error(`Error fetching ${type}:`, err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();

    // Auto-refresh based on type
    const refreshIntervals = {
      anomalies: 30000,
      timesheets: 15000,
      tasks: 30000,
      payroll: 60000,
    };

    const interval = setInterval(
      fetchData,
      options.refreshInterval || refreshIntervals[type] || 30000
    );

    return () => clearInterval(interval);
  }, [type, options]);

  return { data, loading, error };
}
