// backend/src/routes/reportRoutes.js

const express = require("express");
const supabase = require("../supabaseClient");
const { authenticate, authorize } = require("../middleware/authMiddleware");

const router = express.Router();

function applyDateFilter(query, from, to, column) {
  let q = query;
  if (from) {
    q = q.gte(column, from);
  }
  if (to) {
    q = q.lte(column, to);
  }
  return q;
}

/**
 * GET /api/reports/summary?from=YYYY-MM-DD&to=YYYY-MM-DD
 * Returns aggregate metrics across key modules.
 */
router.get("/summary", authenticate, authorize([]), async (req, res) => {
  const { from, to } = req.query;

  const result = {
    range: { from: from || null, to: to || null },
    attendance: {
      total: 0,
      present: 0,
      absent: 0,
      on_leave: 0,
    },
    leaves: {
      total: 0,
      approved: 0,
      pending: 0,
      rejected: 0,
    },
    timesheets: {
      entries: 0,
    },
    payroll: {
      runs: 0,
      total_gross: 0,
      total_net: 0,
    },
    tasks: {
      total: 0,
      open: 0,
      in_progress: 0,
      completed: 0,
      overdue: 0,
    },
  };

  try {
    // Attendance
    let attQuery = supabase
      .from("attendance")
      .select("id,status,created_at", { head: false });

    attQuery = applyDateFilter(attQuery, from, to, "created_at");
    const { data: attRows, error: attError } = await attQuery;

    if (attError) {
      console.error("Reports attendance error:", attError);
    } else if (attRows) {
      result.attendance.total = attRows.length;
      for (const row of attRows) {
        const status = (row.status || "").toLowerCase();
        if (status === "present") result.attendance.present += 1;
        else if (status === "absent") result.attendance.absent += 1;
        else if (status === "on_leave" || status === "leave")
          result.attendance.on_leave += 1;
      }
    }

    // Leaves
    let leaveQuery = supabase
      .from("leaves")
      .select("id,status,created_at", { head: false });
    leaveQuery = applyDateFilter(leaveQuery, from, to, "created_at");

    const { data: leaveRows, error: leaveError } = await leaveQuery;

    if (leaveError) {
      console.error("Reports leaves error:", leaveError);
    } else if (leaveRows) {
      result.leaves.total = leaveRows.length;
      for (const row of leaveRows) {
        const status = (row.status || "").toLowerCase();
        if (status === "approved") result.leaves.approved += 1;
        else if (status === "pending") result.leaves.pending += 1;
        else if (status === "rejected") result.leaves.rejected += 1;
      }
    }

    // Timesheets
    let tsQuery = supabase
      .from("timesheets")
      .select("id,created_at", { head: false });
    tsQuery = applyDateFilter(tsQuery, from, to, "created_at");

    const { data: tsRows, error: tsError } = await tsQuery;

    if (tsError) {
      console.error("Reports timesheets error:", tsError);
    } else if (tsRows) {
      result.timesheets.entries = tsRows.length;
    }

    // Payroll runs
    let prQuery = supabase
      .from("payroll_runs")
      .select("id,total_gross,total_net,period_start,period_end");

    // use period_start/period_end for filtering
    if (from) {
      prQuery = prQuery.gte("period_start", from);
    }
    if (to) {
      prQuery = prQuery.lte("period_end", to);
    }

    const { data: prRows, error: prError } = await prQuery;

    if (prError) {
      console.error("Reports payroll error:", prError);
    } else if (prRows) {
      result.payroll.runs = prRows.length;
      for (const row of prRows) {
        result.payroll.total_gross += Number(row.total_gross || 0);
        result.payroll.total_net += Number(row.total_net || 0);
      }
    }

    // Tasks
    let taskQuery = supabase
      .from("tasks")
      .select("id,status,created_at", { head: false });
    taskQuery = applyDateFilter(taskQuery, from, to, "created_at");

    const { data: taskRows, error: taskError } = await taskQuery;

    if (taskError) {
      console.error("Reports tasks error:", taskError);
    } else if (taskRows) {
      result.tasks.total = taskRows.length;
      for (const row of taskRows) {
        const status = (row.status || "").toLowerCase();
        if (status === "open") result.tasks.open += 1;
        else if (status === "in_progress" || status === "in-progress")
          result.tasks.in_progress += 1;
        else if (status === "completed") result.tasks.completed += 1;
        else if (status === "overdue") result.tasks.overdue += 1;
      }
    }

    return res.json(result);
  } catch (err) {
    console.error("Reports summary catch error:", err);
    res.status(500).json({ message: "Error generating reports summary" });
  }
});

module.exports = router;
