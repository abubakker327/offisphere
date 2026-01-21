// backend/src/routes/deviceRoutes.js
const express = require("express");
const supabase = require("../supabaseClient");
const { authenticate, authorize } = require("../middleware/authMiddleware");

const router = express.Router();

/**
 * Helper: enrich devices with assigned user name
 */
async function enrichDevices(records) {
  if (!records || records.length === 0) return [];

  const userIds = new Set();
  records.forEach((d) => {
    if (d.assigned_to) userIds.add(d.assigned_to);
  });

  const ids = Array.from(userIds);
  let usersMap = {};

  if (ids.length > 0) {
    const { data: users, error: usersError } = await supabase
      .from("users")
      .select("id, full_name, email")
      .in("id", ids);

    if (usersError) {
      console.error("enrichDevices usersError:", usersError);
    } else {
      (users || []).forEach((u) => {
        usersMap[u.id] = u.full_name || u.email;
      });
    }
  }

  return (records || []).map((d) => ({
    ...d,
    assigned_to_name: d.assigned_to ? usersMap[d.assigned_to] || "" : "",
  }));
}

/**
 * GET /api/devices
 * - Admin/Manager: all
 * - Employee: all (for now read-only; could be filtered later)
 */
router.get("/", authenticate, authorize([]), async (req, res) => {
  try {
    const { data, error } = await supabase
      .from("devices")
      .select(
        "id, name, device_type, serial_number, status, assigned_to, assigned_at, notes, created_at",
      )
      .order("created_at", { ascending: false });

    if (error) {
      console.error("List devices error:", error);
      return res.status(500).json({ message: "Error fetching devices" });
    }

    const enriched = await enrichDevices(data || []);
    res.json(enriched);
  } catch (err) {
    console.error("List devices catch error:", err);
    res.status(500).json({ message: "Error fetching devices" });
  }
});

/**
 * POST /api/devices
 * Admin / Manager only
 * body: { name, device_type, serial_number, status, assigned_to, notes }
 */
router.post(
  "/",
  authenticate,
  authorize(["admin", "manager"]),
  async (req, res) => {
    const {
      name,
      device_type,
      serial_number,
      status = "available",
      assigned_to,
      notes,
    } = req.body;

    if (!name) {
      return res.status(400).json({ message: "Name is required" });
    }

    try {
      const insertData = {
        name,
        device_type: device_type || null,
        serial_number: serial_number || null,
        status,
        notes: notes || null,
      };

      if (assigned_to) {
        insertData.assigned_to = assigned_to;
        insertData.assigned_at = new Date().toISOString();
      }

      const { error: insertError } = await supabase
        .from("devices")
        .insert(insertData);

      if (insertError) {
        console.error("Create device error:", insertError);
        return res.status(400).json({
          message: insertError.message || "Error creating device",
        });
      }

      const { data, error: listError } = await supabase
        .from("devices")
        .select(
          "id, name, device_type, serial_number, status, assigned_to, assigned_at, notes, created_at",
        )
        .order("created_at", { ascending: false });

      if (listError) {
        console.error("List devices after create error:", listError);
        return res.status(500).json({ message: "Error fetching devices" });
      }

      const enriched = await enrichDevices(data || []);
      res.status(201).json(enriched);
    } catch (err) {
      console.error("Create device catch error:", err);
      res.status(500).json({ message: "Error creating device" });
    }
  },
);

/**
 * PUT /api/devices/:id
 * Admin / Manager only
 */
router.put(
  "/:id",
  authenticate,
  authorize(["admin", "manager"]),
  async (req, res) => {
    const deviceId = req.params.id;
    const { name, device_type, serial_number, status, assigned_to, notes } =
      req.body;

    try {
      const updateData = {};
      if (name !== undefined) updateData.name = name;
      if (device_type !== undefined)
        updateData.device_type = device_type || null;
      if (serial_number !== undefined)
        updateData.serial_number = serial_number || null;
      if (status !== undefined) updateData.status = status;
      if (notes !== undefined) updateData.notes = notes || null;

      if (assigned_to !== undefined) {
        if (assigned_to) {
          updateData.assigned_to = assigned_to;
          updateData.assigned_at = new Date().toISOString();
        } else {
          updateData.assigned_to = null;
          updateData.assigned_at = null;
        }
      }

      const { error: updateError } = await supabase
        .from("devices")
        .update(updateData)
        .eq("id", deviceId);

      if (updateError) {
        console.error("Update device error:", updateError);
        return res.status(400).json({
          message: updateError.message || "Error updating device",
        });
      }

      const { data, error: listError } = await supabase
        .from("devices")
        .select(
          "id, name, device_type, serial_number, status, assigned_to, assigned_at, notes, created_at",
        )
        .order("created_at", { ascending: false });

      if (listError) {
        console.error("List devices after update error:", listError);
        return res.status(500).json({ message: "Error fetching devices" });
      }

      const enriched = await enrichDevices(data || []);
      res.json(enriched);
    } catch (err) {
      console.error("Update device catch error:", err);
      res.status(500).json({ message: "Error updating device" });
    }
  },
);

/**
 * DELETE /api/devices/:id
 * Admin / Manager only
 */
router.delete(
  "/:id",
  authenticate,
  authorize(["admin", "manager"]),
  async (req, res) => {
    const deviceId = req.params.id;

    try {
      const { error } = await supabase
        .from("devices")
        .delete()
        .eq("id", deviceId);

      if (error) {
        console.error("Delete device error:", error);
        return res.status(400).json({
          message: error.message || "Error deleting device",
        });
      }

      const { data, error: listError } = await supabase
        .from("devices")
        .select(
          "id, name, device_type, serial_number, status, assigned_to, assigned_at, notes, created_at",
        )
        .order("created_at", { ascending: false });

      if (listError) {
        console.error("List devices after delete error:", listError);
        return res.status(500).json({ message: "Error fetching devices" });
      }

      const enriched = await enrichDevices(data || []);
      res.json(enriched);
    } catch (err) {
      console.error("Delete device catch error:", err);
      res.status(500).json({ message: "Error deleting device" });
    }
  },
);

module.exports = router;
