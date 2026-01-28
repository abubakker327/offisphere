const express = require("express");
const router = express.Router();
const supabase = require("../supabaseClient");
const { authenticate, authorize } = require("../middleware/authMiddleware");

// Helper: Check if user can manage events (admin or manager)
const canManageEvents = (role) => ["admin", "manager"].includes(role?.toLowerCase());

// GET /api/events - Fetch all events user is authorized to view
router.get("/", authenticate, async (req, res) => {
  try {
    const { id: user_id } = req.user;
    const role = req.user?.roles?.[0] || null; // Get first role
    
    console.log("Fetching events for user:", user_id, "role:", role);

    // Role-based filtering:
    // Admin/Manager: see all events
    // User: see only events they created or public events
    let query = supabase.from("events").select("*");

    if (!canManageEvents(role)) {
      // Regular users see only their own events and public events
      query = query.or(`created_by.eq.${user_id},visibility.eq.public`, {
        foreignTable: undefined,
      });
    }

    const { data, error } = await query.order("start_time", {
      ascending: true,
    });

    if (error) {
      console.error("Supabase query error:", error);
      throw error;
    }

    console.log("Fetched events:", data?.length || 0, "events");
    return res.status(200).json(data);
  } catch (err) {
    console.error("GET /events error:", err);
    return res
      .status(500)
      .json({ message: "Error fetching events", error: err.message });
  }
});

// GET /api/events/:id - Fetch single event with authorization check
router.get("/:id", authenticate, async (req, res) => {
  try {
    const { id } = req.params;
    const { id: user_id } = req.user;
    const role = req.user?.roles?.[0] || null;

    const { data: event, error } = await supabase
      .from("events")
      .select("*")
      .eq("id", id)
      .single();

    if (error || !event) {
      return res.status(404).json({ message: "Event not found" });
    }

    // Check authorization
    const isCreator = event.created_by === user_id;
    const isManager = canManageEvents(role);
    const isPublic = event.visibility === "public";

    if (!isCreator && !isManager && !isPublic) {
      return res.status(403).json({ message: "Not authorized to view event" });
    }

    return res.status(200).json(event);
  } catch (err) {
    console.error("GET /events/:id error:", err);
    return res
      .status(500)
      .json({ message: "Error fetching event", error: err.message });
  }
});

// POST /api/events - Create event (all authenticated users)
router.post("/", authenticate, async (req, res) => {
  try {
    const { id: user_id } = req.user;
    const role = req.user?.roles?.[0] || null;
    const { title, description, start_time, end_time, visibility } = req.body;

    // Validation
    if (!title || !start_time || !end_time) {
      return res
        .status(400)
        .json({ message: "Missing required fields: title, start_time, end_time" });
    }

    if (new Date(end_time) <= new Date(start_time)) {
      return res
        .status(400)
        .json({ message: "end_time must be after start_time" });
    }

    const { data: newEvent, error } = await supabase
      .from("events")
      .insert({
        title,
        description: description || "",
        start_time,
        end_time,
        created_by: user_id,
        visibility: visibility || "public",
      })
      .select()
      .single();

    if (error) throw error;

    return res.status(201).json(newEvent);
  } catch (err) {
    console.error("POST /events error:", err);
    return res
      .status(500)
      .json({ message: "Error creating event", error: err.message });
  }
});

// PUT /api/events/:id - Update event (admin/manager or creator only)
router.put("/:id", authenticate, async (req, res) => {
  try {
    const { id } = req.params;
    const { id: user_id } = req.user;
    const role = req.user?.roles?.[0] || null;
    const { title, description, start_time, end_time, visibility } = req.body;

    // RBAC: only admin/manager can update
    if (!canManageEvents(role)) {
      return res.status(403).json({ message: "Only Admin/Manager can update events" });
    }

    // Fetch existing event
    const { data: event, error: fetchError } = await supabase
      .from("events")
      .select("*")
      .eq("id", id)
      .single();

    if (fetchError || !event) {
      return res.status(404).json({ message: "Event not found" });
    }

    // Validate dates if provided
    if (start_time && end_time) {
      if (new Date(end_time) <= new Date(start_time)) {
        return res
          .status(400)
          .json({ message: "end_time must be after start_time" });
      }
    }

    const updateData = {};
    if (title !== undefined) updateData.title = title;
    if (description !== undefined) updateData.description = description;
    if (start_time !== undefined) updateData.start_time = start_time;
    if (end_time !== undefined) updateData.end_time = end_time;
    if (visibility !== undefined) updateData.visibility = visibility;

    const { data: updatedEvent, error } = await supabase
      .from("events")
      .update(updateData)
      .eq("id", id)
      .select()
      .single();

    if (error) throw error;

    return res.status(200).json(updatedEvent);
  } catch (err) {
    console.error("PUT /events/:id error:", err);
    return res
      .status(500)
      .json({ message: "Error updating event", error: err.message });
  }
});

// DELETE /api/events/:id - Delete event (all authenticated users)
router.delete("/:id", authenticate, async (req, res) => {
  try {
    const { id } = req.params;
    const { id: user_id } = req.user;
    const role = req.user?.roles?.[0] || null;

    // Verify event exists
    const { data: event, error: fetchError } = await supabase
      .from("events")
      .select("id, created_by")
      .eq("id", id)
      .single();

    if (fetchError || !event) {
      return res.status(404).json({ message: "Event not found" });
    }

    // Allow deletion if user is admin/manager OR if they created the event
    const isCreator = event.created_by === user_id;
    const isManager = canManageEvents(role);

    if (!isCreator && !isManager) {
      return res.status(403).json({ message: "Only event creator or admin/manager can delete events" });
    }

    const { error } = await supabase.from("events").delete().eq("id", id);

    if (error) throw error;

    return res.status(204).send();
  } catch (err) {
    console.error("DELETE /events/:id error:", err);
    return res
      .status(500)
      .json({ message: "Error deleting event", error: err.message });
  }
});

module.exports = router;
