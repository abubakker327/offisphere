// backend/src/routes/reimbursementRoutes.js
const express = require("express");
const supabase = require("../supabaseClient");
const { authenticate, authorize } = require("../middleware/authMiddleware");

const router = express.Router();

/**
 * Helpers
 */
function isAdminOrManager(user) {
  const roles = user?.roles || [];
  return roles.includes("admin") || roles.includes("manager");
}

/**
 * GET /api/reimbursements
 * - Admin / Manager: see all
 * - Employee: see own only
 * Optional query: ?status=pending|approved|rejected|paid
 */
router.get("/", authenticate, authorize([]), async (req, res) => {
  try {
    const { status } = req.query;
    const user = req.user;
    const adminManager = isAdminOrManager(user);

    let query = supabase
      .from("reimbursements")
      .select(
        `
        id,
        user_id,
        title,
        category,
        amount,
        currency,
        expense_date,
        status,
        submitted_at,
        approved_by,
        approved_at,
        notes,
        receipt_url,
        users!reimbursements_user_id_fkey(full_name)
      `,
      )
      .order("submitted_at", { ascending: false });

    if (!adminManager) {
      query = query.eq("user_id", user.id);
    }

    if (status && status !== "all") {
      query = query.eq("status", status);
    }

    const { data, error } = await query;

    if (error) {
      console.error("List reimbursements error:", error);
      return res.status(500).json({ message: "Error fetching reimbursements" });
    }

    const rows = (data || []).map((r) => ({
      ...r,
      employee_name: r.users?.full_name || "",
    }));

    res.json(rows);
  } catch (err) {
    console.error("List reimbursements catch error:", err);
    res.status(500).json({ message: "Error fetching reimbursements" });
  }
});

/**
 * POST /api/reimbursements
 * Any logged-in user can create a reimbursement
 */
router.post("/", authenticate, authorize([]), async (req, res) => {
  try {
    const user = req.user;
    const {
      title,
      category,
      amount,
      currency,
      expense_date,
      notes,
      receipt_url,
    } = req.body;

    if (!title || !category || !amount || !expense_date) {
      return res
        .status(400)
        .json({ message: "Title, category, amount and date are required" });
    }

    const { error: insertError } = await supabase.from("reimbursements").insert(
      [
        {
          user_id: user.id,
          title,
          category,
          amount,
          currency: currency || "INR",
          expense_date,
          notes: notes || null,
          receipt_url: receipt_url || null,
        },
      ],
      { returning: "minimal" },
    );

    if (insertError) {
      console.error("Create reimbursement error:", insertError);
      return res.status(500).json({ message: "Error creating reimbursement" });
    }

    // Return updated list
    const { data: list, error: listError } = await supabase
      .from("reimbursements")
      .select(
        `
        id,
        user_id,
        title,
        category,
        amount,
        currency,
        expense_date,
        status,
        submitted_at,
        approved_by,
        approved_at,
        notes,
        receipt_url,
        users!reimbursements_user_id_fkey(full_name)
      `,
      )
      .order("submitted_at", { ascending: false })
      .eq("user_id", user.id);

    if (listError) {
      console.error("Reload reimbursements error:", listError);
      return res.json([]);
    }

    const rows = (list || []).map((r) => ({
      ...r,
      employee_name: r.users?.full_name || "",
    }));

    res.status(201).json(rows);
  } catch (err) {
    console.error("Create reimbursement catch error:", err);
    res.status(500).json({ message: "Error creating reimbursement" });
  }
});

/**
 * PUT /api/reimbursements/:id
 * Admin / Manager can update status and approval fields
 */
router.put(
  "/:id",
  authenticate,
  authorize(["admin", "manager"]),
  async (req, res) => {
    try {
      const { id } = req.params;
      const { status, notes } = req.body;
      const user = req.user;

      if (!status) {
        return res.status(400).json({ message: "Status is required" });
      }

      if (!["pending", "approved", "rejected", "paid"].includes(status)) {
        return res.status(400).json({ message: "Invalid status value" });
      }

      const updatePayload = {
        status,
        notes: notes ?? null,
      };

      if (status === "approved" || status === "rejected" || status === "paid") {
        updatePayload.approved_by = user.id;
        updatePayload.approved_at = new Date().toISOString();
      }

      const { error: updateError } = await supabase
        .from("reimbursements")
        .update(updatePayload)
        .eq("id", id);

      if (updateError) {
        console.error("Update reimbursement error:", updateError);
        return res
          .status(500)
          .json({ message: "Error updating reimbursement" });
      }

      const { data, error } = await supabase
        .from("reimbursements")
        .select(
          `
          id,
          user_id,
          title,
          category,
          amount,
          currency,
          expense_date,
          status,
          submitted_at,
          approved_by,
          approved_at,
          notes,
          receipt_url,
          users!reimbursements_user_id_fkey(full_name)
        `,
        )
        .order("submitted_at", { ascending: false });

      if (error) {
        console.error("Reload reimbursements error:", error);
        return res.json([]);
      }

      const rows = (data || []).map((r) => ({
        ...r,
        employee_name: r.users?.full_name || "",
      }));

      res.json(rows);
    } catch (err) {
      console.error("Update reimbursement catch error:", err);
      res.status(500).json({ message: "Error updating reimbursement" });
    }
  },
);

module.exports = router;
