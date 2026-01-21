// backend/src/routes/emailRoutes.js

const express = require("express");
const supabase = require("../supabaseClient");
const { authenticate, authorize } = require("../middleware/authMiddleware");

const router = express.Router();

function isAdmin(user) {
  const roles = user?.roles || [];
  return roles.includes("admin");
}

/**
 * GET /api/email/templates
 * List all email templates
 */
router.get("/templates", authenticate, authorize([]), async (req, res) => {
  try {
    const { data, error } = await supabase
      .from("email_templates")
      .select("*")
      .order("name", { ascending: true });

    if (error) {
      console.error("List email templates error:", error);
      return res
        .status(500)
        .json({ message: "Error fetching email templates" });
    }

    res.json(data || []);
  } catch (err) {
    console.error("List email templates catch error:", err);
    res.status(500).json({ message: "Error fetching email templates" });
  }
});

/**
 * POST /api/email/templates
 * Create new template (admin only)
 * body: { template_key, name, subject, body, is_active }
 */
router.post("/templates", authenticate, authorize([]), async (req, res) => {
  try {
    if (!isAdmin(req.user)) {
      return res
        .status(403)
        .json({ message: "Only admins can create email templates" });
    }

    const { template_key, name, subject, body, is_active } = req.body;

    if (!template_key || !name || !subject || !body) {
      return res.status(400).json({
        message: "template_key, name, subject and body are required",
      });
    }

    const { data, error } = await supabase
      .from("email_templates")
      .insert([
        {
          template_key,
          name,
          subject,
          body,
          is_active: typeof is_active === "boolean" ? is_active : true,
        },
      ])
      .select("*")
      .single();

    if (error) {
      console.error("Create email template error:", error);
      return res.status(500).json({ message: "Error creating email template" });
    }

    res.status(201).json(data);
  } catch (err) {
    console.error("Create email template catch error:", err);
    res.status(500).json({ message: "Error creating email template" });
  }
});

/**
 * PUT /api/email/templates/:id
 * Update template (admin only)
 */
router.put("/templates/:id", authenticate, authorize([]), async (req, res) => {
  try {
    if (!isAdmin(req.user)) {
      return res
        .status(403)
        .json({ message: "Only admins can update email templates" });
    }

    const { id } = req.params;
    const { name, subject, body, is_active } = req.body;

    const update = {};
    if (name !== undefined) update.name = name;
    if (subject !== undefined) update.subject = subject;
    if (body !== undefined) update.body = body;
    if (is_active !== undefined) update.is_active = is_active;

    const { data, error } = await supabase
      .from("email_templates")
      .update(update)
      .eq("id", id)
      .select("*")
      .single();

    if (error) {
      console.error("Update email template error:", error);
      return res.status(500).json({ message: "Error updating email template" });
    }

    res.json(data);
  } catch (err) {
    console.error("Update email template catch error:", err);
    res.status(500).json({ message: "Error updating email template" });
  }
});

module.exports = router;
