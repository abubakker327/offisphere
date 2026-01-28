/**
 * RFID & Attendance Anomaly Routes
 * Handles RFID ingestion, anomaly workflow, missing checkout requests
 */

const express = require("express");
const supabase = require("../supabaseClient");
const { authenticate, authorize } = require("../middleware/authMiddleware");
const attendanceEngine = require("../services/attendanceAutomationEngine");

const router = express.Router();

// ============================================
// 1. RFID INGESTION ENDPOINT
// ============================================
/**
 * POST /api/attendance/rfid/ingest
 * Hardware device submits RFID scan
 * body: { employee_id, scan_timestamp, device_id, device_location, raw_data }
 */
router.post("/rfid/ingest", async (req, res) => {
  const { employee_id, scan_timestamp, device_id, device_location, raw_data } = req.body;

  if (!employee_id || !scan_timestamp) {
    return res.status(400).json({
      message: "Missing required fields: employee_id, scan_timestamp",
    });
  }

  try {
    const result = await attendanceEngine.ingestRfidScan({
      employee_id,
      scan_timestamp,
      device_id,
      device_location,
      raw_data,
    });

    res.status(201).json({
      message: "RFID scan processed",
      result,
    });
  } catch (err) {
    console.error("RFID ingest error:", err);
    res.status(500).json({ message: "Error processing RFID scan" });
  }
});

// ============================================
// 2. ATTENDANCE ANOMALIES LIST
// ============================================
/**
 * GET /api/attendance/anomalies
 * Fetch anomalies (filtered by role)
 */
router.get("/anomalies", authenticate, authorize([]), async (req, res) => {
  const userId = req.user.id;
  const roles = req.user.roles || [];
  const isAdminOrManager = roles.includes("admin") || roles.includes("manager");

  try {
    let query = supabase
      .from("attendance_anomalies")
      .select(
        "id, user_id, attendance_date, anomaly_type, anomaly_severity, status, description, detected_at"
      )
      .order("detected_at", { ascending: false });

    // Employees see only their own anomalies
    if (!isAdminOrManager) {
      query = query.eq("user_id", userId);
    }

    const { data, error } = await query;

    if (error) {
      console.error("List anomalies error:", error);
      return res.status(500).json({ message: "Error fetching anomalies" });
    }

    res.json(data || []);
  } catch (err) {
    console.error("List anomalies catch error:", err);
    res.status(500).json({ message: "Error fetching anomalies" });
  }
});

// ============================================
// 3. GET SINGLE ANOMALY DETAIL
// ============================================
/**
 * GET /api/attendance/anomalies/:id
 */
router.get("/anomalies/:id", authenticate, async (req, res) => {
  const { id } = req.params;
  const userId = req.user.id;
  const roles = req.user.roles || [];
  const isAdminOrManager = roles.includes("admin") || roles.includes("manager");

  try {
    const { data: anomaly, error } = await supabase
      .from("attendance_anomalies")
      .select("*")
      .eq("id", id)
      .single();

    if (error || !anomaly) {
      return res.status(404).json({ message: "Anomaly not found" });
    }

    // Authorization check
    if (!isAdminOrManager && anomaly.user_id !== userId) {
      return res.status(403).json({ message: "Not authorized to view this anomaly" });
    }

    res.json(anomaly);
  } catch (err) {
    console.error("Get anomaly error:", err);
    res.status(500).json({ message: "Error fetching anomaly" });
  }
});

// ============================================
// 4. EMPLOYEE SUBMITS MISSING CHECKOUT REQUEST
// ============================================
/**
 * POST /api/attendance/missing-checkout/request
 * body: { attendance_id, requested_checkout_time }
 */
router.post("/missing-checkout/request", authenticate, authorize([]), async (req, res) => {
  const userId = req.user.id;
  const { attendance_id, requested_checkout_time } = req.body;

  if (!attendance_id) {
    return res.status(400).json({ message: "attendance_id is required" });
  }

  try {
    // Verify attendance record belongs to user
    const { data: att, error: attError } = await supabase
      .from("attendance")
      .select("id, attendance_date, user_id")
      .eq("id", attendance_id)
      .eq("user_id", userId)
      .single();

    if (attError || !att) {
      return res.status(404).json({ message: "Attendance record not found or unauthorized" });
    }

    const request = await attendanceEngine.submitMissingCheckoutRequest(
      userId,
      attendance_id,
      att.attendance_date,
      requested_checkout_time
    );

    res.status(201).json({
      message: "Missing checkout request submitted",
      request,
    });
  } catch (err) {
    console.error("Missing checkout request error:", err);
    res.status(400).json({ message: err.message || "Error submitting request" });
  }
});

// ============================================
// 5. MISSING CHECKOUT REQUESTS - LIST
// ============================================
/**
 * GET /api/attendance/missing-checkout/requests
 */
router.get("/missing-checkout/requests", authenticate, authorize([]), async (req, res) => {
  const userId = req.user.id;
  const roles = req.user.roles || [];
  const isAdminOrManager = roles.includes("admin") || roles.includes("manager");

  try {
    let query = supabase
      .from("missing_checkout_requests")
      .select(
        `
        id, user_id, attendance_date, requested_checkout_time, 
        status, requested_at, approved_at,
        users!missing_checkout_requests_user_id_fkey(full_name, email)
      `
      )
      .order("requested_at", { ascending: false });

    if (!isAdminOrManager) {
      query = query.eq("user_id", userId);
    }

    const { data, error } = await query;

    if (error) {
      console.error("List missing checkouts error:", error);
      return res.status(500).json({ message: "Error fetching requests" });
    }

    const mapped = (data || []).map((r) => ({
      ...r,
      employee_name: r.users?.full_name || r.users?.email,
    }));

    res.json(mapped);
  } catch (err) {
    console.error("List missing checkouts catch error:", err);
    res.status(500).json({ message: "Error fetching requests" });
  }
});

// ============================================
// 6. MANAGER APPROVES MISSING CHECKOUT REQUEST
// ============================================
/**
 * PATCH /api/attendance/missing-checkout/requests/:id/approve
 * body: { checkout_time, approval_notes }
 */
router.patch("/missing-checkout/requests/:id/approve", authenticate, authorize(["admin", "manager"]), async (req, res) => {
  const { id } = req.params;
  const approverId = req.user.id;
  const { checkout_time, approval_notes } = req.body;

  try {
    // Get the request
    const { data: request, error: reqError } = await supabase
      .from("missing_checkout_requests")
      .select("*")
      .eq("id", id)
      .single();

    if (reqError || !request) {
      return res.status(404).json({ message: "Request not found" });
    }

    // Update request
    const { error: updateError } = await supabase
      .from("missing_checkout_requests")
      .update({
        status: "approved",
        approved_by: approverId,
        approved_at: new Date().toISOString(),
        approval_notes,
      })
      .eq("id", id);

    if (updateError) throw updateError;

    // Update attendance with checkout time
    if (checkout_time) {
      await supabase
        .from("attendance")
        .update({
          check_out: checkout_time,
        })
        .eq("id", request.attendance_id);
    }

    // Mark anomaly as resolved
    await supabase
      .from("attendance_anomalies")
      .update({
        status: "resolved_manual",
        approved_by: approverId,
        approved_at: new Date().toISOString(),
        manager_notes: approval_notes,
      })
      .eq("id", request.anomaly_id);

    res.json({ message: "Missing checkout approved" });
  } catch (err) {
    console.error("Approve missing checkout error:", err);
    res.status(500).json({ message: "Error approving request" });
  }
});

// ============================================
// 7. MANAGER REJECTS MISSING CHECKOUT REQUEST
// ============================================
/**
 * PATCH /api/attendance/missing-checkout/requests/:id/reject
 * body: { rejection_reason }
 */
router.patch("/missing-checkout/requests/:id/reject", authenticate, authorize(["admin", "manager"]), async (req, res) => {
  const { id } = req.params;
  const approverId = req.user.id;
  const { rejection_reason } = req.body;

  try {
    const { data: request, error: reqError } = await supabase
      .from("missing_checkout_requests")
      .select("*")
      .eq("id", id)
      .single();

    if (reqError || !request) {
      return res.status(404).json({ message: "Request not found" });
    }

    // Update request
    await supabase
      .from("missing_checkout_requests")
      .update({
        status: "rejected",
        approved_by: approverId,
        approved_at: new Date().toISOString(),
        approval_notes: rejection_reason || "Request rejected",
      })
      .eq("id", id);

    // Mark anomaly as still open
    await supabase
      .from("attendance_anomalies")
      .update({
        status: "open",
        manager_notes: `Rejected: ${rejection_reason || "No reason provided"}`,
      })
      .eq("id", request.anomaly_id);

    res.json({ message: "Missing checkout request rejected" });
  } catch (err) {
    console.error("Reject missing checkout error:", err);
    res.status(500).json({ message: "Error rejecting request" });
  }
});

// ============================================
// 8. EVALUATE ATTENDANCE RULES (Manual Trigger)
// ============================================
/**
 * POST /api/attendance/evaluate-rules
 * Manually trigger rule evaluation for a date
 * Admin/Manager only
 * body: { user_id, attendance_date }
 */
router.post("/evaluate-rules", authenticate, authorize(["admin", "manager"]), async (req, res) => {
  const { user_id, attendance_date } = req.body;

  if (!user_id || !attendance_date) {
    return res.status(400).json({ message: "user_id and attendance_date are required" });
  }

  try {
    const result = await attendanceEngine.evaluateAttendanceRules(user_id, attendance_date);

    res.json({
      message: "Attendance rules evaluated",
      result,
    });
  } catch (err) {
    console.error("Evaluate rules error:", err);
    res.status(500).json({ message: "Error evaluating rules" });
  }
});

// ============================================
// 9. APPLY AUTO-LOP (Manual Trigger)
// ============================================
/**
 * POST /api/attendance/apply-auto-lop
 * Manually trigger auto-LOP application
 * Admin only
 */
router.post("/apply-auto-lop", authenticate, authorize(["admin"]), async (req, res) => {
  try {
    const result = await attendanceEngine.applyAutoLopForUnresolvedAnomalies();

    res.json({
      message: "Auto-LOP application complete",
      result,
    });
  } catch (err) {
    console.error("Auto-LOP error:", err);
    res.status(500).json({ message: "Error applying auto-LOP" });
  }
});

// ============================================
// 10. RFID LOGS - VIEW (Admin Only)
// ============================================
/**
 * GET /api/attendance/rfid-logs
 * View RFID scan logs for debugging
 */
router.get("/rfid-logs", authenticate, authorize(["admin"]), async (req, res) => {
  const { limit = 50, offset = 0, is_processed } = req.query;

  try {
    let query = supabase
      .from("rfid_logs")
      .select("*")
      .order("scan_timestamp", { ascending: false })
      .range(offset, offset + limit - 1);

    if (is_processed !== undefined) {
      query = query.eq("is_processed", is_processed === "true");
    }

    const { data, error } = await query;

    if (error) throw error;

    res.json(data || []);
  } catch (err) {
    console.error("RFID logs error:", err);
    res.status(500).json({ message: "Error fetching RFID logs" });
  }
});

module.exports = router;
