// backend/src/routes/exportRoutes.js

const express = require("express");
const supabase = require("../supabaseClient");
const { authenticate, authorize } = require("../middleware/authMiddleware");

const router = express.Router();

/**
 * Small helper to turn JSON rows into CSV text
 */
function toCsv(rows) {
  if (!rows || rows.length === 0) {
    return "";
  }

  const headers = Object.keys(rows[0]);

  const escape = (value) => {
    if (value === null || value === undefined) return "";
    const str = String(value).replace(/"/g, '""');
    return `"${str}"`;
  };

  const lines = [];
  lines.push(headers.join(","));
  for (const row of rows) {
    lines.push(headers.map((h) => escape(row[h])).join(","));
  }

  return lines.join("\n");
}

/**
 * Helper: attach CSV headers and send
 */
function sendCsv(res, filename, rows) {
  const csv = toCsv(rows);
  res.setHeader("Content-Type", "text/csv; charset=utf-8");
  res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);
  res.status(200).send(csv);
}

/**
 * GET /api/exports/attendance?from=YYYY-MM-DD&to=YYYY-MM-DD
 */
router.get("/attendance", authenticate, authorize([]), async (req, res) => {
  try {
    const { from, to } = req.query;

    let query = supabase.from("attendance").select("*");

    // Filter by created_at so we don't rely on a specific "date" column name
    if (from) {
      query = query.gte("created_at", from);
    }
    if (to) {
      // Add 1 day to make "to" inclusive – simplest is keep as-is;
      // if you want strict inclusive, you can adjust here later
      query = query.lte("created_at", to);
    }

    const { data, error } = await query;

    if (error) {
      console.error("Attendance export error:", error);
      return res.status(500).json({ message: "Error exporting attendance" });
    }

    const rows = data || [];
    const filename = `attendance_export_${from || "all"}_${to || "all"}.csv`;

    return sendCsv(res, filename, rows);
  } catch (err) {
    console.error("Attendance export catch error:", err);
    res.status(500).json({ message: "Error exporting attendance" });
  }
});

/**
 * GET /api/exports/timesheets?from=YYYY-MM-DD&to=YYYY-MM-DD
 */
router.get("/timesheets", authenticate, authorize([]), async (req, res) => {
  try {
    const { from, to } = req.query;

    let query = supabase.from("timesheets").select("*");

    if (from) {
      query = query.gte("created_at", from);
    }
    if (to) {
      query = query.lte("created_at", to);
    }

    const { data, error } = await query;

    if (error) {
      console.error("Timesheets export error:", error);
      return res.status(500).json({ message: "Error exporting timesheets" });
    }

    const rows = data || [];
    const filename = `timesheets_export_${from || "all"}_${to || "all"}.csv`;

    return sendCsv(res, filename, rows);
  } catch (err) {
    console.error("Timesheets export catch error:", err);
    res.status(500).json({ message: "Error exporting timesheets" });
  }
});

/**
 * GET /api/exports/payroll?from=YYYY-MM-DD&to=YYYY-MM-DD
 * Exports payroll_runs; you can later extend to join payroll_items.
 */
router.get("/payroll", authenticate, authorize([]), async (req, res) => {
  try {
    const { from, to } = req.query;

    let query = supabase.from("payroll_runs").select("*");

    if (from) {
      query = query.gte("period_start", from);
    }
    if (to) {
      query = query.lte("period_end", to);
    }

    const { data, error } = await query;

    if (error) {
      console.error("Payroll export error:", error);
      return res.status(500).json({ message: "Error exporting payroll runs" });
    }

    const rows = data || [];
    const filename = `payroll_runs_export_${from || "all"}_${to || "all"}.csv`;

    return sendCsv(res, filename, rows);
  } catch (err) {
    console.error("Payroll export catch error:", err);
    res.status(500).json({ message: "Error exporting payroll runs" });
  }
});

/**
 * (Optional) GET /api/exports/leaves?from=YYYY-MM-DD&to=YYYY-MM-DD
 * Nice to have: export leaves too.
 */
router.get("/leaves", authenticate, authorize([]), async (req, res) => {
  try {
    const { from, to } = req.query;

    let query = supabase.from("leaves").select("*");

    if (from) {
      query = query.gte("created_at", from);
    }
    if (to) {
      query = query.lte("created_at", to);
    }

    const { data, error } = await query;

    if (error) {
      console.error("Leaves export error:", error);
      return res.status(500).json({ message: "Error exporting leaves" });
    }

    const rows = data || [];
    const filename = `leaves_export_${from || "all"}_${to || "all"}.csv`;

    return sendCsv(res, filename, rows);
  } catch (err) {
    console.error("Leaves export catch error:", err);
    res.status(500).json({ message: "Error exporting leaves" });
  }
});

module.exports = router;
