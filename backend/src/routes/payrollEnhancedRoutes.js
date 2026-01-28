/**
 * Enhanced Payroll Routes
 * Integrates attendance anomaly validation and dual approval workflow
 */

const express = require("express");
const supabase = require("../supabaseClient");
const { authenticate, authorize } = require("../middleware/authMiddleware");
const payrollEngine = require("../services/payrollCouplingEngine");

const router = express.Router();

// Helper
function isAdminOrManager(user) {
  const roles = user?.roles || [];
  return roles.includes("admin") || roles.includes("manager");
}

// ============================================
// 1. CREATE PAYROLL RUN (Enhanced)
// ============================================
/**
 * POST /api/payroll/runs
 * body: { period_start, period_end }
 */
router.post("/runs", authenticate, authorize(["admin", "manager"]), async (req, res) => {
  const { period_start, period_end } = req.body;
  const userId = req.user.id;

  if (!period_start || !period_end) {
    return res.status(400).json({
      message: "period_start and period_end are required",
    });
  }

  try {
    // Create payroll run
    const { data: run, error: runError } = await supabase
      .from("payroll_runs")
      .insert({
        period_start,
        period_end,
        status: "draft",
        validation_status: "pending",
        created_by: userId,
      })
      .select("*")
      .single();

    if (runError) throw runError;

    res.status(201).json({
      message: "Payroll run created",
      payroll_run: run,
    });
  } catch (err) {
    console.error("Create payroll run error:", err);
    res.status(500).json({ message: "Error creating payroll run" });
  }
});

// ============================================
// 2. VALIDATE PAYROLL RUN
// ============================================
/**
 * POST /api/payroll/runs/:id/validate
 * Validate payroll against attendance/leave data
 * Blocks payroll if critical anomalies exist
 */
router.post("/runs/:id/validate", authenticate, authorize(["admin", "manager"]), async (req, res) => {
  const { id } = req.params;

  try {
    // Check payroll exists and is in draft
    const { data: run, error: runError } = await supabase
      .from("payroll_runs")
      .select("*")
      .eq("id", id)
      .single();

    if (runError || !run) {
      return res.status(404).json({ message: "Payroll run not found" });
    }

    if (run.status !== "draft") {
      return res.status(400).json({
        message: `Cannot validate payroll in ${run.status} status`,
      });
    }

    // Run validation
    const validationResult = await payrollEngine.validatePayrollRun(id);

    res.json({
      message: "Payroll validation complete",
      validation_result: validationResult,
    });
  } catch (err) {
    console.error("Validate payroll error:", err);
    res.status(500).json({ message: "Error validating payroll" });
  }
});

// ============================================
// 3. GET PAYROLL VALIDATION RESULTS
// ============================================
/**
 * GET /api/payroll/runs/:id/validation-results
 */
router.get("/runs/:id/validation-results", authenticate, authorize(["admin", "manager"]), async (req, res) => {
  const { id } = req.params;

  try {
    const { data: results, error } = await supabase
      .from("payroll_validation_results")
      .select(
        `
        id, payroll_run_id, user_id, check_name, check_result, 
        check_message, is_blocking, is_warning,
        users!payroll_validation_results_user_id_fkey(full_name, email)
      `
      )
      .eq("payroll_run_id", id)
      .order("user_id");

    if (error) throw error;

    const mapped = (results || []).map((r) => ({
      ...r,
      employee_name: r.users?.full_name || r.users?.email,
    }));

    res.json(mapped);
  } catch (err) {
    console.error("Get validation results error:", err);
    res.status(500).json({ message: "Error fetching validation results" });
  }
});

// ============================================
// 4. AGGREGATE PAYROLL SOURCE DATA
// ============================================
/**
 * POST /api/payroll/runs/:id/aggregate
 * Aggregate attendance, leave, timesheet data
 */
router.post("/runs/:id/aggregate", authenticate, authorize(["admin", "manager"]), async (req, res) => {
  const { id } = req.params;

  try {
    const { data: run, error: runError } = await supabase
      .from("payroll_runs")
      .select("*")
      .eq("id", id)
      .single();

    if (runError || !run) {
      return res.status(404).json({ message: "Payroll run not found" });
    }

    // Fetch all payroll items (employees in this run)
    const { data: items, error: itemsError } = await supabase
      .from("payroll_items")
      .select("user_id")
      .eq("run_id", id);

    if (itemsError) throw itemsError;

    const aggregationResults = [];

    // Aggregate for each employee
    for (const item of items || []) {
      const agg = await payrollEngine.aggregatePayrollSourceData(
        id,
        item.user_id,
        run.period_start,
        run.period_end
      );

      aggregationResults.push(agg);
    }

    res.json({
      message: "Payroll data aggregated",
      aggregations: aggregationResults,
      total_employees: aggregationResults.length,
    });
  } catch (err) {
    console.error("Aggregate payroll error:", err);
    res.status(500).json({ message: "Error aggregating payroll data" });
  }
});

// ============================================
// 5. LIST PAYROLL WITH STATUS
// ============================================
/**
 * GET /api/payroll/runs
 * List payroll runs with full status
 */
router.get("/runs", authenticate, authorize([]), async (req, res) => {
  try {
    const { data, error } = await supabase
      .from("payroll_runs")
      .select(
        `
        id, period_start, period_end, status, validation_status,
        has_attendance_anomalies, is_blocked_for_anomalies, blocked_reason,
        created_by, created_at, updated_at,
        sign_offs:payroll_sign_offs(sign_off_status, hr_sign_off_at, finance_sign_off_at)
      `
      )
      .order("period_start", { ascending: false });

    if (error) throw error;

    res.json(data || []);
  } catch (err) {
    console.error("List payroll runs error:", err);
    res.status(500).json({ message: "Error fetching payroll runs" });
  }
});

// ============================================
// 6. GET PAYROLL DETAIL WITH ITEMS
// ============================================
/**
 * GET /api/payroll/runs/:id
 */
router.get("/runs/:id", authenticate, authorize([]), async (req, res) => {
  const { id } = req.params;

  try {
    const { data: run, error: runError } = await supabase
      .from("payroll_runs")
      .select("*")
      .eq("id", id)
      .single();

    if (runError || !run) {
      return res.status(404).json({ message: "Payroll run not found" });
    }

    const { data: items, error: itemsError } = await supabase
      .from("payroll_items")
      .select(
        `
        id, user_id, base_salary, bonus, deductions, net_pay, status,
        users!payroll_items_user_id_fkey(full_name, email)
      `
      )
      .eq("run_id", id);

    if (itemsError) throw itemsError;

    const { data: signOffs } = await supabase
      .from("payroll_sign_offs")
      .select("*")
      .eq("payroll_run_id", id)
      .single();

    const { data: haltLogs } = await supabase
      .from("payroll_halt_log")
      .select("*")
      .eq("payroll_run_id", id)
      .eq("status", "active");

    const mappedItems = (items || []).map((it) => ({
      ...it,
      employee_name: it.users?.full_name || it.users?.email,
    }));

    res.json({
      payroll_run: run,
      items: mappedItems,
      sign_offs: signOffs || null,
      active_holds: haltLogs || [],
    });
  } catch (err) {
    console.error("Get payroll run error:", err);
    res.status(500).json({ message: "Error fetching payroll run" });
  }
});

// ============================================
// 7. HR APPROVAL (Step 1)
// ============================================
/**
 * PATCH /api/payroll/runs/:id/approve/hr
 * body: { hr_notes }
 */
router.patch("/runs/:id/approve/hr", authenticate, authorize(["admin", "manager"]), async (req, res) => {
  const { id } = req.params;
  const userId = req.user.id;
  const { hr_notes } = req.body;

  try {
    const result = await payrollEngine.approvePayrollHR(id, userId, hr_notes);

    res.json({
      message: "HR approval recorded",
      approval_result: result,
    });
  } catch (err) {
    console.error("HR approval error:", err);
    res.status(500).json({ message: "Error recording HR approval" });
  }
});

// ============================================
// 8. FINANCE APPROVAL (Step 2)
// ============================================
/**
 * PATCH /api/payroll/runs/:id/approve/finance
 * body: { finance_notes }
 * Both HR and Finance must approve for payroll to be finalized
 */
router.patch("/runs/:id/approve/finance", authenticate, authorize(["admin"]), async (req, res) => {
  const { id } = req.params;
  const userId = req.user.id;
  const { finance_notes } = req.body;

  try {
    const result = await payrollEngine.approvePayrollFinance(id, userId, finance_notes);

    res.json({
      message: "Finance approval recorded",
      approval_result: result,
    });
  } catch (err) {
    console.error("Finance approval error:", err);
    res.status(500).json({ message: "Error recording finance approval" });
  }
});

// ============================================
// 9. GET SIGN-OFF STATUS
// ============================================
/**
 * GET /api/payroll/runs/:id/sign-offs
 */
router.get("/runs/:id/sign-offs", authenticate, authorize([]), async (req, res) => {
  const { id } = req.params;

  try {
    const { data: signOffs, error } = await supabase
      .from("payroll_sign_offs")
      .select(
        `
        id, payroll_run_id, sign_off_status,
        hr_sign_off_by, hr_sign_off_at, hr_sign_off_notes,
        finance_sign_off_by, finance_sign_off_at, finance_sign_off_notes,
        finalized_at, finalized_by,
        hr_user:users!payroll_sign_offs_hr_sign_off_by_fkey(full_name, email),
        finance_user:users!payroll_sign_offs_finance_sign_off_by_fkey(full_name, email)
      `
      )
      .eq("payroll_run_id", id)
      .single();

    if (error && error.code !== "PGRST116") {
      throw error;
    }

    res.json(signOffs || {});
  } catch (err) {
    console.error("Get sign-offs error:", err);
    res.status(500).json({ message: "Error fetching sign-offs" });
  }
});

// ============================================
// 10. PAYROLL HOLDS - VIEW
// ============================================
/**
 * GET /api/payroll/runs/:id/holds
 * View all active payroll holds
 */
router.get("/runs/:id/holds", authenticate, authorize(["admin", "manager"]), async (req, res) => {
  const { id } = req.params;

  try {
    const { data: holds, error } = await supabase
      .from("payroll_halt_log")
      .select(
        `
        id, payroll_run_id, user_id, halt_reason, halt_description,
        status, halted_at, resolved_at,
        users!payroll_halt_log_halted_by_fkey(full_name, email)
      `
      )
      .eq("payroll_run_id", id)
      .eq("status", "active");

    if (error) throw error;

    res.json(holds || []);
  } catch (err) {
    console.error("Get holds error:", err);
    res.status(500).json({ message: "Error fetching payroll holds" });
  }
});

// ============================================
// 11. RESOLVE PAYROLL HOLD
// ============================================
/**
 * PATCH /api/payroll/runs/:id/holds/:hold_id/resolve
 * body: { resolution_notes }
 */
router.patch("/runs/:id/holds/:hold_id/resolve", authenticate, authorize(["admin"]), async (req, res) => {
  const { id, hold_id } = req.params;
  const userId = req.user.id;
  const { resolution_notes } = req.body;

  try {
    const { error } = await supabase
      .from("payroll_halt_log")
      .update({
        status: "resolved",
        resolved_by: userId,
        resolved_at: new Date().toISOString(),
        resolution_notes,
      })
      .eq("id", hold_id)
      .eq("payroll_run_id", id);

    if (error) throw error;

    res.json({ message: "Payroll hold resolved" });
  } catch (err) {
    console.error("Resolve hold error:", err);
    res.status(500).json({ message: "Error resolving hold" });
  }
});

module.exports = router;
