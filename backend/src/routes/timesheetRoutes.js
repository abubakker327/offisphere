// backend/src/routes/timesheetRoutes.js
const express = require("express");
const supabase = require("../supabaseClient");
const { authenticate, authorize } = require("../middleware/authMiddleware");

const router = express.Router();

/**
 * Helper: attach full_name
 */
async function attachUserNames(records) {
  if (!records || records.length === 0) return [];

  const userIds = [...new Set(records.map((r) => r.user_id))];

  const { data: users, error } = await supabase
    .from("users")
    .select("id, full_name")
    .in("id", userIds);

  if (error) {
    console.error("Timesheets users error:", error);
    return records;
  }

  const map = {};
  (users || []).forEach((u) => {
    map[u.id] = u.full_name;
  });

  return records.map((r) => ({
    ...r,
    full_name: map[r.user_id] || "",
  }));
}

/**
 * POST /api/timesheets
 */
router.post("/", authenticate, authorize([]), async (req, res) => {
  const userId = req.user.id;
  const { work_date, project_name, task_description, hours, notes } = req.body;

  if (!work_date || hours === undefined || hours === null) {
    return res
      .status(400)
      .json({ message: "work_date and hours are required" });
  }

  const parsedHours = Number(hours);
  if (Number.isNaN(parsedHours) || parsedHours < 0 || parsedHours > 24) {
    return res.status(400).json({ message: "hours must be between 0 and 24" });
  }

  try {
    const { error } = await supabase.from("timesheets").insert({
      user_id: userId,
      work_date,
      project_name: project_name || null,
      task_description: task_description || null,
      hours: parsedHours,
      notes: notes || null,
      status: "submitted",
    });

    if (error) {
      console.error("Create timesheet error:", error);
      return res
        .status(500)
        .json({ message: "Error creating timesheet entry" });
    }

    res.status(201).json({ message: "Timesheet entry created" });
  } catch (err) {
    console.error("Create timesheet catch error:", err);
    res.status(500).json({ message: "Error creating timesheet entry" });
  }
});

/**
 * GET /api/timesheets
 * - admin/manager: all
 * - employee: own
 */
router.get("/", authenticate, authorize([]), async (req, res) => {
  const userId = req.user.id;
  const roles = req.user.roles || [];
  const isAdminOrManager = roles.includes("admin") || roles.includes("manager");

  try {
    let query = supabase
      .from("timesheets")
      .select(
        "id, user_id, work_date, project_name, task_description, hours, status, created_at",
      )
      .order("work_date", { ascending: false })
      .order("created_at", { ascending: false });

    if (!isAdminOrManager) {
      query = query.eq("user_id", userId);
    }

    const { data, error } = await query;

    if (error) {
      console.error("List timesheets error:", error);
      return res.status(500).json({ message: "Error fetching timesheets" });
    }

    const enriched = await attachUserNames(data || []);
    res.json(enriched);
  } catch (err) {
    console.error("List timesheets catch error:", err);
    res.status(500).json({ message: "Error fetching timesheets" });
  }
});

/**
 * PATCH /api/timesheets/:id/status
 * Admin/manager can approve/reject
 */
router.patch(
  "/:id/status",
  authenticate,
  authorize(["admin", "manager"]),
  async (req, res) => {
    const timesheetId = req.params.id;
    const { status } = req.body;

    if (!["approved", "rejected"].includes(status)) {
      return res
        .status(400)
        .json({ message: "status must be 'approved' or 'rejected'" });
    }

    try {
      const { error } = await supabase
        .from("timesheets")
        .update({ status })
        .eq("id", timesheetId);

      if (error) {
        console.error("Update timesheet status error:", error);
        return res
          .status(500)
          .json({ message: "Error updating timesheet status" });
      }

      res.json({ message: `Timesheet ${status}` });
    } catch (err) {
      console.error("Update timesheet status catch error:", err);
      res.status(500).json({ message: "Error updating timesheet status" });
    }
  },
);

/**
 * DELETE /api/timesheets/:id
 * - Admin/manager: any
 * - Employee: own only
 */
router.delete("/:id", authenticate, authorize([]), async (req, res) => {
  const timesheetId = req.params.id;
  const userId = req.user.id;
  const roles = req.user.roles || [];
  const isAdminOrManager = roles.includes("admin") || roles.includes("manager");

  try {
    // Get entry to check ownership
    const { data: existing, error: existingError } = await supabase
      .from("timesheets")
      .select("id, user_id")
      .eq("id", timesheetId)
      .single();

    if (existingError) {
      console.error("Get timesheet before delete error:", existingError);
      return res.status(404).json({ message: "Timesheet entry not found" });
    }

    if (!isAdminOrManager && existing.user_id !== userId) {
      return res.status(403).json({
        message: "You are not allowed to delete this entry",
      });
    }

    const { error } = await supabase
      .from("timesheets")
      .delete()
      .eq("id", timesheetId);

    if (error) {
      console.error("Delete timesheet error:", error);
      return res
        .status(500)
        .json({ message: "Error deleting timesheet entry" });
    }

    res.json({ message: "Timesheet entry deleted" });
  } catch (err) {
    console.error("Delete timesheet catch error:", err);
    res.status(500).json({ message: "Error deleting timesheet entry" });
  }
});

module.exports = router;
