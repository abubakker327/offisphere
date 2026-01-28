// backend/src/routes/taskOverdueAutomationRoutes.js
// Task overdue, dependencies, auto-reopen endpoints

const express = require("express");
const supabase = require("../supabaseClient");
const { authenticate, authorize } = require("../middleware/authMiddleware");
const taskEngine = require("../services/taskOverdueAutomationEngine");

const router = express.Router();

// ============================================
// HELPERS
// ============================================

async function attachUserDetails(records) {
  if (!records || records.length === 0) return [];

  const userIds = [...new Set(records.map((r) => r.assigned_to || r.user_id))];

  const { data: users, error } = await supabase
    .from("users")
    .select("id, full_name, email")
    .in("id", userIds);

  if (error) {
    console.error("Fetch users error:", error);
    return records;
  }

  const map = {};
  (users || []).forEach((u) => {
    map[u.id] = { full_name: u.full_name, email: u.email };
  });

  return records.map((r) => ({
    ...r,
    assignee: map[r.assigned_to] || { full_name: "", email: "" },
  }));
}

// ============================================
// ENDPOINTS
// ============================================

/**
 * GET /api/tasks/overdue
 * Get overdue tasks for current user
 */
router.get("/overdue", authenticate, authorize([]), async (req, res) => {
  try {
    const userId = req.user.id;
    const overdue = await taskEngine.getOverdueTasks(userId);
    const enriched = await attachUserDetails(overdue);
    res.json(enriched);
  } catch (err) {
    console.error("GET /overdue error:", err);
    res.status(500).json({ message: "Error fetching overdue tasks" });
  }
});

/**
 * GET /api/tasks/:taskId/dependencies
 * Get task dependencies (blocking and blocked)
 */
router.get("/:taskId/dependencies", authenticate, authorize([]), async (req, res) => {
  try {
    const { taskId } = req.params;

    // Verify access
    const { data: task, error: taskError } = await supabase
      .from("tasks")
      .select("id, assigned_to, project_id")
      .eq("id", taskId)
      .single();

    if (taskError || !task) {
      return res.status(404).json({ message: "Task not found" });
    }

    const userId = req.user.id;
    const roles = req.user.roles || [];
    const isAdmin = roles.includes("admin");
    const isManager = roles.includes("manager");

    if (!isAdmin && !isManager && task.assigned_to !== userId) {
      return res.status(403).json({ message: "Unauthorized" });
    }

    const dependencies = await taskEngine.getTaskDependencies(taskId);
    res.json(dependencies);
  } catch (err) {
    console.error("GET /:taskId/dependencies error:", err);
    res.status(500).json({ message: "Error fetching dependencies" });
  }
});

/**
 * POST /api/tasks/:blockingTaskId/blocks/:blockedTaskId
 * Create dependency relationship
 */
router.post(
  "/:blockingTaskId/blocks/:blockedTaskId",
  authenticate,
  authorize(["manager", "admin"]),
  async (req, res) => {
    try {
      const { blockingTaskId, blockedTaskId } = req.params;
      const { dependencyType, reason } = req.body;
      const userId = req.user.id;

      if (!dependencyType) {
        return res.status(400).json({ message: "dependencyType is required" });
      }

      // Verify both tasks exist
      const { data: blockingTask, error: blockingError } = await supabase
        .from("tasks")
        .select("id")
        .eq("id", blockingTaskId)
        .single();

      const { data: blockedTask, error: blockedError } = await supabase
        .from("tasks")
        .select("id")
        .eq("id", blockedTaskId)
        .single();

      if (blockingError || !blockingTask) {
        return res.status(404).json({ message: "Blocking task not found" });
      }
      if (blockedError || !blockedTask) {
        return res.status(404).json({ message: "Blocked task not found" });
      }

      const result = await taskEngine.createDependency(
        blockingTaskId,
        blockedTaskId,
        dependencyType,
        userId,
        reason
      );

      if (!result.success) {
        return res.status(500).json({ message: result.error });
      }

      res.status(201).json({
        message: "Dependency created",
        dependency: result.dependency,
      });
    } catch (err) {
      console.error("POST /:blockingTaskId/blocks/:blockedTaskId error:", err);
      res.status(500).json({ message: "Error creating dependency" });
    }
  }
);

/**
 * DELETE /api/tasks/dependencies/:dependencyId
 * Resolve/remove dependency
 */
router.delete(
  "/dependencies/:dependencyId",
  authenticate,
  authorize(["manager", "admin"]),
  async (req, res) => {
    try {
      const { dependencyId } = req.params;
      const { resolutionNotes } = req.body;
      const userId = req.user.id;

      const result = await taskEngine.resolveDependency(
        dependencyId,
        userId,
        resolutionNotes || ""
      );

      if (!result.success) {
        return res.status(500).json({ message: result.error });
      }

      res.json({ message: "Dependency resolved" });
    } catch (err) {
      console.error("DELETE /dependencies/:dependencyId error:", err);
      res.status(500).json({ message: "Error resolving dependency" });
    }
  }
);

/**
 * POST /api/tasks/check-overdue
 * Manually trigger overdue check (Admin)
 */
router.post(
  "/check-overdue",
  authenticate,
  authorize(["admin"]),
  async (req, res) => {
    try {
      const result = await taskEngine.checkOverdueTasks();
      res.json({
        message: "Overdue check completed",
        ...result,
      });
    } catch (err) {
      console.error("POST /check-overdue error:", err);
      res.status(500).json({ message: "Error checking overdue tasks" });
    }
  }
);

/**
 * GET /api/tasks/overdue/tracking
 * Get all overdue tracking records (Manager/Admin)
 */
router.get(
  "/overdue/tracking",
  authenticate,
  authorize(["manager", "admin"]),
  async (req, res) => {
    try {
      const { status, escalation_level } = req.query;

      let query = supabase
        .from("task_overdue_tracking")
        .select(
          `id, task_id, assigned_to, due_date, days_overdue, escalation_level, status,
          level_1_triggered_at, level_2_triggered_at, level_3_triggered_at,
          created_at`
        )
        .order("days_overdue", { ascending: false });

      if (status) {
        query = query.eq("status", status);
      }
      if (escalation_level) {
        query = query.gte("escalation_level", parseInt(escalation_level));
      }

      const { data, error } = await query.limit(100);

      if (error) {
        console.error("GET /tracking error:", error);
        return res.status(500).json({ message: "Error fetching tracking" });
      }

      const enriched = await attachUserDetails(data || []);
      res.json(enriched);
    } catch (err) {
      console.error("GET /tracking exception:", err);
      res.status(500).json({ message: "Error fetching tracking" });
    }
  }
);

/**
 * PATCH /api/tasks/:taskId/extend-due-date
 * Extend task due date
 */
router.patch("/:taskId/extend-due-date", authenticate, authorize([]), async (req, res) => {
  try {
    const { taskId } = req.params;
    const { newDueDate, extensionReason } = req.body;
    const userId = req.user.id;

    if (!newDueDate) {
      return res.status(400).json({ message: "newDueDate is required" });
    }

    // Verify ownership or manager/admin
    const { data: task, error: taskError } = await supabase
      .from("tasks")
      .select("id, assigned_to")
      .eq("id", taskId)
      .single();

    if (taskError || !task) {
      return res.status(404).json({ message: "Task not found" });
    }

    const roles = req.user.roles || [];
    const isAdmin = roles.includes("admin");
    const isManager = roles.includes("manager");

    if (!isAdmin && !isManager && task.assigned_to !== userId) {
      return res.status(403).json({ message: "Unauthorized" });
    }

    const result = await taskEngine.extendTaskDueDate(
      taskId,
      newDueDate,
      userId,
      extensionReason || "Extended by user"
    );

    if (!result.success) {
      return res.status(500).json({ message: result.error });
    }

    res.json({
      message: "Due date extended",
      taskId,
      newDueDate,
    });
  } catch (err) {
    console.error("PATCH /:taskId/extend-due-date error:", err);
    res.status(500).json({ message: "Error extending due date" });
  }
});

/**
 * GET /api/tasks/escalation/audit
 * Get task escalation audit logs (Manager/Admin)
 */
router.get(
  "/escalation/audit",
  authenticate,
  authorize(["manager", "admin"]),
  async (req, res) => {
    try {
      const { taskId, action } = req.query;

      let query = supabase
        .from("task_escalation_audit")
        .select("*")
        .order("triggered_at", { ascending: false });

      if (taskId) {
        query = query.eq("task_id", taskId);
      }
      if (action) {
        query = query.eq("action", action);
      }

      const { data, error } = await query.limit(200);

      if (error) {
        console.error("GET /audit error:", error);
        return res.status(500).json({ message: "Error fetching audit logs" });
      }

      res.json(data || []);
    } catch (err) {
      console.error("GET /audit exception:", err);
      res.status(500).json({ message: "Error fetching audit logs" });
    }
  }
);

/**
 * GET /api/tasks/config
 * Get task overdue configuration
 */
router.get("/config", authenticate, authorize([]), async (req, res) => {
  try {
    const config = await taskEngine.loadTaskConfig();
    res.json(config);
  } catch (err) {
    console.error("GET /config error:", err);
    res.status(500).json({ message: "Error fetching config" });
  }
});

/**
 * PATCH /api/tasks/config
 * Update task overdue configuration (Admin only)
 */
router.patch(
  "/config",
  authenticate,
  authorize(["admin"]),
  async (req, res) => {
    try {
      const {
        level_1_days_after_due,
        level_2_days_after_due,
        level_3_days_after_due,
        auto_reopen_if_blocked,
        require_manager_approval_if_extended,
        send_email_level_1,
        send_email_level_2,
        send_email_level_3,
        send_sms_level_2,
        send_sms_level_3,
      } = req.body;

      const updates = {};
      if (level_1_days_after_due !== undefined) updates.level_1_days_after_due = level_1_days_after_due;
      if (level_2_days_after_due !== undefined) updates.level_2_days_after_due = level_2_days_after_due;
      if (level_3_days_after_due !== undefined) updates.level_3_days_after_due = level_3_days_after_due;
      if (auto_reopen_if_blocked !== undefined) updates.auto_reopen_if_blocked = auto_reopen_if_blocked;
      if (require_manager_approval_if_extended !== undefined)
        updates.require_manager_approval_if_extended = require_manager_approval_if_extended;
      if (send_email_level_1 !== undefined) updates.send_email_level_1 = send_email_level_1;
      if (send_email_level_2 !== undefined) updates.send_email_level_2 = send_email_level_2;
      if (send_email_level_3 !== undefined) updates.send_email_level_3 = send_email_level_3;
      if (send_sms_level_2 !== undefined) updates.send_sms_level_2 = send_sms_level_2;
      if (send_sms_level_3 !== undefined) updates.send_sms_level_3 = send_sms_level_3;

      updates.updated_at = new Date().toISOString();

      const { error } = await supabase
        .from("task_overdue_config")
        .update(updates)
        .eq("is_active", true);

      if (error) {
        console.error("Update config error:", error);
        return res.status(500).json({ message: "Failed to update config" });
      }

      const config = await taskEngine.loadTaskConfig();
      res.json({ message: "Config updated", config });
    } catch (err) {
      console.error("PATCH /config error:", err);
      res.status(500).json({ message: "Error updating config" });
    }
  }
);

/**
 * GET /api/tasks/stats/overdue
 * Get overdue statistics (Manager/Admin)
 */
router.get(
  "/stats/overdue",
  authenticate,
  authorize(["manager", "admin"]),
  async (req, res) => {
    try {
      const { data: allOverdue, error } = await supabase
        .from("task_overdue_tracking")
        .select("escalation_level, status, days_overdue");

      if (error) {
        console.error("GET stats error:", error);
        return res.status(500).json({ message: "Error fetching stats" });
      }

      const stats = {
        total_overdue: allOverdue.length,
        level_1: allOverdue.filter((t) => t.escalation_level >= 1).length,
        level_2: allOverdue.filter((t) => t.escalation_level >= 2).length,
        level_3: allOverdue.filter((t) => t.escalation_level >= 3).length,
        pending: allOverdue.filter((t) => t.status === "overdue").length,
        escalated: allOverdue.filter((t) => t.status === "escalated").length,
        resolved: allOverdue.filter((t) => t.status === "resolved").length,
        reopened: allOverdue.filter((t) => t.status === "reopened").length,
        avg_days_overdue: allOverdue.length > 0
          ? Math.round(
              allOverdue.reduce((sum, t) => sum + (t.days_overdue || 0), 0) / allOverdue.length
            )
          : 0,
      };

      res.json(stats);
    } catch (err) {
      console.error("GET /stats exception:", err);
      res.status(500).json({ message: "Error fetching stats" });
    }
  }
);

module.exports = router;
