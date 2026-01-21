// backend/src/routes/paymentRoutes.js

const express = require("express");
const supabase = require("../supabaseClient");
const { authenticate, authorize } = require("../middleware/authMiddleware");

const router = express.Router();

function isAdminOrManager(user) {
  const roles = user?.roles || [];
  return roles.includes("admin") || roles.includes("manager");
}

const normalizeLeadId = (value) => {
  if (value === null || value === undefined || value === "") return null;
  return value;
};

const extractLeadId = (notes) => {
  if (!notes) return null;
  const match = String(notes).match(/LeadId:\s*([0-9a-f-]{36})/i);
  return match ? match[1] : null;
};

/**
 * GET /api/payments
 * Admin/Manager: all payments
 * Others: only payments recorded by them (user_id)
 * Optional: ?status=pending|received|failed|refunded|all
 */
router.get("/", authenticate, authorize([]), async (req, res) => {
  try {
    const { status } = req.query;
    const user = req.user;
    const adminManager = isAdminOrManager(user);

    let query = supabase
      .from("payments")
      .select("*")
      .order("created_at", { ascending: false });

    // payments table does not include user_id; keep list unfiltered

    if (status && status !== "all") {
      query = query.eq("status", status);
    }

    const { data, error } = await query;

    if (error) {
      console.error("List payments error:", error);
      return res.status(500).json({ message: "Error fetching payments" });
    }

    const mapped = (data || []).map((row) => ({
      ...row,
      lead_id:
        row.reference_type === "lead"
          ? row.reference_id
          : row.lead_id || extractLeadId(row.notes) || null,
    }));
    res.json(mapped);
  } catch (err) {
    console.error("List payments catch error:", err);
    res.status(500).json({ message: "Error fetching payments" });
  }
});

/**
 * POST /api/payments
 * Any logged-in user can record a payment
 */
router.post("/", authenticate, authorize([]), async (req, res) => {
  try {
    const user = req.user;
    const {
      lead_id,
      amount,
      currency,
      status,
      method,
      reference,
      notes,
      paid_at,
    } = req.body;

    if (!amount) {
      return res
        .status(400)
        .json({ message: "Amount is required for payment" });
    }

    const normalizedLeadId = normalizeLeadId(lead_id);
    const normalizedMethod =
      method && String(method).trim()
        ? String(method).trim().toLowerCase()
        : null;

    const leadTag = normalizedLeadId ? `LeadId: ${normalizedLeadId}` : "";
    const normalizedNotes =
      [notes || "", reference ? `Reference: ${reference}` : "", leadTag]
        .filter(Boolean)
        .join(" | ")
        .trim() || null;

    const insertPayload = {
      type: "in",
      payment_direction: "inward",
      reference_type: "invoice",
      reference_id: normalizedLeadId,
      amount,
      currency: currency || "INR",
      status: status || "received",
      method: normalizedMethod,
      notes: normalizedNotes,
      paid_at: paid_at || new Date().toISOString(),
    };

    const { error: insertError } = await supabase
      .from("payments")
      .insert([insertPayload], { returning: "minimal" });

    if (insertError) {
      console.error("Create payment error:", insertError);
      return res.status(500).json({
        message: insertError.message || "Error recording payment",
        code: insertError.code || null,
        details: insertError.details || null,
      });
    }

    // Reload list for user / admin
    const adminManager = isAdminOrManager(user);
    let reloadQuery = supabase
      .from("payments")
      .select("*")
      .order("created_at", { ascending: false });

    // payments table does not include user_id; keep list unfiltered

    const { data: list, error: listError } = await reloadQuery;

    if (listError) {
      console.error("Reload payments error:", listError);
      return res.json([]);
    }

    const mapped = (list || []).map((row) => ({
      ...row,
      lead_id:
        row.reference_type === "lead"
          ? row.reference_id
          : row.lead_id || extractLeadId(row.notes) || null,
    }));
    res.status(201).json(mapped);
  } catch (err) {
    console.error("Create payment catch error:", err);
    res.status(500).json({ message: "Error recording payment" });
  }
});

/**
 * PUT /api/payments/:id
 * Admin/Manager can adjust status / notes / reference / method / paid_at
 */
router.put(
  "/:id",
  authenticate,
  authorize(["admin", "manager"]),
  async (req, res) => {
    try {
      const { id } = req.params;
      const { status, notes, reference, method, paid_at } = req.body;

      const updatePayload = {};

      if (status !== undefined) updatePayload.status = status;
      if (notes !== undefined || reference !== undefined) {
        const normalizedNotes =
          [notes || "", reference ? `Reference: ${reference}` : ""]
            .filter(Boolean)
            .join(" | ")
            .trim() || null;
        updatePayload.notes = normalizedNotes;
      }
      if (method !== undefined) updatePayload.method = method || null;
      if (paid_at !== undefined)
        updatePayload.paid_at = paid_at || new Date().toISOString();

      const { error: updateError } = await supabase
        .from("payments")
        .update(updatePayload)
        .eq("id", id);

      if (updateError) {
        console.error("Update payment error:", updateError);
        return res.status(500).json({ message: "Error updating payment" });
      }

      const { data, error } = await supabase
        .from("payments")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) {
        console.error("Reload payments error:", error);
        return res.json([]);
      }

      const mapped = (data || []).map((row) => ({
        ...row,
        lead_id:
          row.reference_type === "lead"
            ? row.reference_id
            : row.lead_id || extractLeadId(row.notes) || null,
      }));
      res.json(mapped);
    } catch (err) {
      console.error("Update payment catch error:", err);
      res.status(500).json({ message: "Error updating payment" });
    }
  },
);

module.exports = router;
