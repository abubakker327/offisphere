// backend/src/routes/timesheetEscalationRoutes.js
// Timesheet escalation workflow endpoints

const express = require("express");
const supabase = require("../supabaseClient");
const { authenticate, authorize } = require("../middleware/authMiddleware");
const timesheetEngine = require("../services/timesheetEscalationEngine");

const router = express.Router();

// ============================================
// HELPERS
// ============================================

async function attachUserDetails(records) {
  if (!records || records.length === 0) return [];

  const userIds = [...new Set(records.map((r) => r.user_id))];

  const { data: users, error } = await supabase
    .from("users")
    .select("id, full_name, email")
    .in("id", userIds);

  if (error) {
    console.error("Fetch user details error:", error);
    return records;
  }

  const map = {};
  (users || []).forEach((u) => {
    map[u.id] = { full_name: u.full_name, email: u.email };
  });

  return records.map((r) => ({
    ...r,
    user: map[r.user_id] || { full_name: "", email: "" },
  }));
}

// ============================================
// ENDPOINTS
// ============================================

/**
 * GET /api/timesheets/escalations
 * List escalated timesheets (role-based)
 * - Employees: their own incomplete timesheets
 * - Managers: team incomplete timesheets
 * - Admins: all incomplete timesheets
 */
router.get("/escalations", authenticate, authorize([]), async (req, res) => {
  try {
    const userId = req.user.id;
    const roles = req.user.roles || [];
    const isAdmin = roles.includes("admin");
    const isManager = roles.includes("manager");

    let query = supabase
      .from("timesheet_escalation_tracking")
      .select(
        `id, timesheet_id, user_id, timesheet_date, escalation_level, status,
        level_1_triggered_at, level_2_triggered_at, level_3_triggered_at,
        completed_at, created_at`
      )
      .in("status", ["pending", "escalated"])
      .order("timesheet_date", { ascending: false });

    if (!isAdmin && !isManager) {
      // Employees see only their own
      query = query.eq("user_id", userId);
    } else if (isManager && !isAdmin) {
      // Managers see their team's (would need team mapping - simplified here)
      // For now, managers see all
      query = query;
    }

    const { data, error } = await query.limit(100);

    if (error) {
      console.error("GET /escalations error:", error);
      return res.status(500).json({ message: "Error fetching escalations" });
    }

    const enriched = await attachUserDetails(data || []);
    res.json(enriched);
  } catch (err) {
    console.error("GET /escalations exception:", err);
    res.status(500).json({ message: "Error fetching escalations" });
  }
});

/**
 * GET /api/timesheets/pending
 * Get incomplete timesheets for current user
 */
router.get("/pending", authenticate, authorize([]), async (req, res) => {
  try {
    const userId = req.user.id;
    const incomplete = await timesheetEngine.getIncompleteTimesheets(userId);
    res.json(incomplete);
  } catch (err) {
    console.error("GET /pending error:", err);
    res.status(500).json({ message: "Error fetching pending timesheets" });
  }
});

/**
 * POST /api/timesheets/:id/complete
 * Mark timesheet as complete
 */
router.post("/:id/complete", authenticate, authorize([]), async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    // Verify ownership
    const { data: ts, error: tsError } = await supabase
      .from("timesheets")
      .select("id, user_id")
      .eq("id", id)
      .single();

    if (tsError || !ts) {
      return res.status(404).json({ message: "Timesheet not found" });
    }

    if (ts.user_id !== userId) {
      return res.status(403).json({ message: "Unauthorized" });
    }

    // Update timesheet
    const { error: updateError } = await supabase
      .from("timesheets")
      .update({
        status: "submitted",
        updated_at: new Date().toISOString(),
      })
      .eq("id", id);

    if (updateError) {
      console.error("Update timesheet error:", updateError);
      return res.status(500).json({ message: "Failed to update timesheet" });
    }

    // Mark escalation as complete
    const markResult = await timesheetEngine.markTimesheetComplete(id, userId);

    if (!markResult.success) {
      console.warn("markTimesheetComplete warning:", markResult.error);
      // Still return success - timesheet was updated
    }

    // Record audit
    const ipAddress = req.ip || req.connection.remoteAddress;
    const userAgent = req.get("user-agent");
    await timesheetEngine.recordSubmissionAudit(id, userId, null, ipAddress, userAgent);

    res.json({
      message: "Timesheet completed",
      timesheetId: id,
      trackingId: markResult.trackingId,
    });
  } catch (err) {
    console.error("POST /:id/complete error:", err);
    res.status(500).json({ message: "Error completing timesheet" });
  }
});

/**
 * POST /api/timesheets/check-pending
 * Manually trigger escalation check (Admin only)
 */
router.post(
  "/check-pending",
  authenticate,
  authorize(["admin"]),
  async (req, res) => {
    try {
      const result = await timesheetEngine.checkIncompleteTimesheets();
      res.json({
        message: "Escalation check completed",
        ...result,
      });
    } catch (err) {
      console.error("POST /check-pending error:", err);
      res.status(500).json({ message: "Error checking pending timesheets" });
    }
  }
);

/**
 * GET /api/timesheets/escalations/history/:timesheetId
 * Get escalation history for a timesheet
 */
router.get("/escalations/history/:timesheetId", authenticate, authorize([]), async (req, res) => {
  try {
    const { timesheetId } = req.params;
    const userId = req.user.id;

    // Verify access
    const { data: ts, error: tsError } = await supabase
      .from("timesheets")
      .select("id, user_id")
      .eq("id", timesheetId)
      .single();

    if (tsError || !ts) {
      return res.status(404).json({ message: "Timesheet not found" });
    }

    const roles = req.user.roles || [];
    const isAdmin = roles.includes("admin");
    const isManager = roles.includes("manager");

    if (!isAdmin && !isManager && ts.user_id !== userId) {
      return res.status(403).json({ message: "Unauthorized" });
    }

    // Get history
    const { data: history, error } = await supabase
      .from("timesheet_escalation_history")
      .select("*")
      .eq("timesheet_id", timesheetId)
      .order("triggered_at", { ascending: false });

    if (error) {
      console.error("GET history error:", error);
      return res.status(500).json({ message: "Error fetching history" });
    }

    const enriched = await attachUserDetails(history || []);
    res.json(enriched);
  } catch (err) {
    console.error("GET /history error:", err);
    res.status(500).json({ message: "Error fetching escalation history" });
  }
});

/**
 * GET /api/timesheets/config
 * Get current timesheet cutoff configuration (Info only)
 */
router.get("/config", authenticate, authorize([]), async (req, res) => {
  try {
    const config = await timesheetEngine.loadTimesheetConfig();
    res.json(config);
  } catch (err) {
    console.error("GET /config error:", err);
    res.status(500).json({ message: "Error fetching config" });
  }
});

/**
 * PATCH /api/timesheets/config
 * Update timesheet cutoff configuration (Admin only)
 */
router.patch(
  "/config",
  authenticate,
  authorize(["admin"]),
  async (req, res) => {
    try {
      const {
        level_1_time,
        level_2_time,
        level_3_time,
        hard_deadline_time,
        require_manager_approval_if_late,
        send_email_level_1,
        send_email_level_2,
        send_email_level_3,
        send_sms_level_2,
        send_sms_level_3,
      } = req.body;

      const updates = {};
      if (level_1_time) updates.level_1_time = level_1_time;
      if (level_2_time) updates.level_2_time = level_2_time;
      if (level_3_time) updates.level_3_time = level_3_time;
      if (hard_deadline_time) updates.hard_deadline_time = hard_deadline_time;
      if (require_manager_approval_if_late !== undefined)
        updates.require_manager_approval_if_late = require_manager_approval_if_late;
      if (send_email_level_1 !== undefined) updates.send_email_level_1 = send_email_level_1;
      if (send_email_level_2 !== undefined) updates.send_email_level_2 = send_email_level_2;
      if (send_email_level_3 !== undefined) updates.send_email_level_3 = send_email_level_3;
      if (send_sms_level_2 !== undefined) updates.send_sms_level_2 = send_sms_level_2;
      if (send_sms_level_3 !== undefined) updates.send_sms_level_3 = send_sms_level_3;

      updates.updated_at = new Date().toISOString();

      const { error } = await supabase
        .from("timesheet_cutoff_config")
        .update(updates)
        .eq("is_active", true);

      if (error) {
        console.error("Update config error:", error);
        return res.status(500).json({ message: "Failed to update config" });
      }

      // Clear cache
      require("../services/timesheetEscalationEngine").loadTimesheetConfig =
        timesheetEngine.loadTimesheetConfig;

      const config = await timesheetEngine.loadTimesheetConfig();
      res.json({ message: "Config updated", config });
    } catch (err) {
      console.error("PATCH /config error:", err);
      res.status(500).json({ message: "Error updating config" });
    }
  }
);

/**
 * GET /api/timesheets/escalations/stats
 * Get escalation statistics (Manager/Admin)
 */
router.get(
  "/escalations/stats",
  authenticate,
  authorize(["manager", "admin"]),
  async (req, res) => {
    try {
      // Count escalations by level
      const { data: allEscalations, error } = await supabase
        .from("timesheet_escalation_tracking")
        .select("escalation_level, status");

      if (error) {
        console.error("GET stats error:", error);
        return res.status(500).json({ message: "Error fetching stats" });
      }

      const stats = {
        total_escalations: allEscalations.length,
        level_1: allEscalations.filter((e) => e.escalation_level >= 1).length,
        level_2: allEscalations.filter((e) => e.escalation_level >= 2).length,
        level_3: allEscalations.filter((e) => e.escalation_level >= 3).length,
        pending: allEscalations.filter((e) => e.status === "pending").length,
        escalated: allEscalations.filter((e) => e.status === "escalated").length,
        completed: allEscalations.filter((e) => e.status === "completed").length,
      };

      res.json(stats);
    } catch (err) {
      console.error("GET /stats error:", err);
      res.status(500).json({ message: "Error fetching stats" });
    }
  }
);

module.exports = router;
