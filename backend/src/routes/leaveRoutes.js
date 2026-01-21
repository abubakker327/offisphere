// backend/src/routes/leaveRoutes.js
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
    console.error("Leaves users error:", error);
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
 * GET /api/leaves
 * - admin/manager: all leaves
 * - employee: own leaves
 */
router.get("/", authenticate, authorize([]), async (req, res) => {
  const userId = req.user.id;
  const roles = req.user.roles || [];
  const isAdminOrManager = roles.includes("admin") || roles.includes("manager");

  try {
    let query = supabase
      .from("leaves")
      .select(
        "id, user_id, leave_type, start_date, end_date, total_days, reason, status, created_at",
      )
      .order("created_at", { ascending: false });

    if (!isAdminOrManager) {
      query = query.eq("user_id", userId);
    }

    const { data, error } = await query;

    if (error) {
      console.error("List leaves error:", error);
      return res.status(500).json({ message: "Error fetching leaves" });
    }

    const enriched = await attachUserNames(data || []);
    res.json(enriched);
  } catch (err) {
    console.error("List leaves catch error:", err);
    res.status(500).json({ message: "Error fetching leaves" });
  }
});

/**
 * POST /api/leaves/apply
 */
router.post("/apply", authenticate, authorize([]), async (req, res) => {
  const userId = req.user.id;
  const { leave_type, start_date, end_date, reason } = req.body;

  if (!leave_type || !start_date || !end_date) {
    return res.status(400).json({
      message: "leave_type, start_date and end_date are required",
    });
  }

  const start = new Date(start_date);
  const end = new Date(end_date);
  const msPerDay = 24 * 60 * 60 * 1000;
  const total_days = Math.round((end - start) / msPerDay) + 1;

  try {
    const { error } = await supabase.from("leaves").insert({
      user_id: userId,
      leave_type,
      start_date,
      end_date,
      total_days,
      reason: reason || null,
      status: "pending",
    });

    if (error) {
      console.error("Apply leave error:", error);
      return res
        .status(500)
        .json({ message: "Failed to submit leave request" });
    }

    res.status(201).json({ message: "Leave request submitted" });
  } catch (err) {
    console.error("Apply leave catch error:", err);
    res.status(500).json({ message: "Failed to submit leave request" });
  }
});

/**
 * PATCH /api/leaves/:id/status
 * Admin only
 */
router.patch(
  "/:id/status",
  authenticate,
  authorize(["admin"]),
  async (req, res) => {
    const leaveId = req.params.id;
    const { status } = req.body;

    if (!["approved", "rejected"].includes(status)) {
      return res
        .status(400)
        .json({ message: "status must be 'approved' or 'rejected'" });
    }

    try {
      const { error } = await supabase
        .from("leaves")
        .update({ status })
        .eq("id", leaveId);

      if (error) {
        console.error("Update leave status error:", error);
        return res
          .status(500)
          .json({ message: "Failed to update leave status" });
      }

      res.json({ message: `Leave ${status}` });
    } catch (err) {
      console.error("Update leave status catch error:", err);
      res.status(500).json({ message: "Failed to update leave status" });
    }
  },
);

module.exports = router;
