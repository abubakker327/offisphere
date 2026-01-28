// backend/src/services/timesheetEscalationEngine.js
// Timesheet escalation automation with hard cutoff times
// Levels: 20:00 (employee), 20:05 (manager), 20:10 (admin)

const supabase = require("../supabaseClient");

// ============================================
// CONFIG CACHE
// ============================================
let configCache = null;
let configCacheTime = null;
const CONFIG_CACHE_TTL = 5 * 60 * 1000; // 5 minutes

async function loadTimesheetConfig() {
  try {
    // Check cache
    if (configCache && configCacheTime && Date.now() - configCacheTime < CONFIG_CACHE_TTL) {
      return configCache;
    }

    // Load from DB
    const { data, error } = await supabase
      .from("timesheet_cutoff_config")
      .select("*")
      .eq("is_active", true)
      .single();

    if (error || !data) {
      console.warn("Timesheet config error, using defaults:", error?.message);
      return getDefaultTimesheetConfig();
    }

    configCache = data;
    configCacheTime = Date.now();
    return data;
  } catch (err) {
    console.error("loadTimesheetConfig error:", err);
    return getDefaultTimesheetConfig();
  }
}

function getDefaultTimesheetConfig() {
  return {
    level_1_time: "20:00:00",
    level_2_time: "20:05:00",
    level_3_time: "20:10:00",
    hard_deadline_time: "23:59:59",
    level_1_target_role: "employee",
    level_2_target_role: "manager",
    level_3_target_role: "admin",
    auto_lock_after_deadline: true,
    allow_post_deadline_submission: false,
    require_manager_approval_if_late: true,
    send_email_level_1: true,
    send_email_level_2: true,
    send_email_level_3: true,
    send_sms_level_2: false,
    send_sms_level_3: false,
  };
}

// ============================================
// CORE FUNCTIONS
// ============================================

/**
 * Check for incomplete timesheets and determine escalation level
 * Called every minute via cron job at specific times
 */
async function checkIncompleteTimesheets() {
  try {
    const config = await loadTimesheetConfig();
    const today = new Date().toISOString().split("T")[0];
    const now = new Date();

    // Get all timesheets for today that are incomplete
    const { data: incompleteTimesheets, error: tsError } = await supabase
      .from("timesheets")
      .select("id, user_id, hours, status")
      .eq("timesheet_date", today)
      .in("status", ["draft", "pending"]);

    if (tsError) {
      console.error("checkIncompleteTimesheets error:", tsError);
      return { processed: 0, escalations: [] };
    }

    if (!incompleteTimesheets || incompleteTimesheets.length === 0) {
      return { processed: 0, escalations: [] };
    }

    const escalations = [];

    // Check each incomplete timesheet
    for (const ts of incompleteTimesheets) {
      // Check if tracking record exists
      const { data: tracking } = await supabase
        .from("timesheet_escalation_tracking")
        .select("*")
        .eq("timesheet_id", ts.id)
        .single();

      if (!tracking) {
        // Create new tracking record
        const { data: newTracking, error: trackError } = await supabase
          .from("timesheet_escalation_tracking")
          .insert({
            timesheet_id: ts.id,
            user_id: ts.user_id,
            timesheet_date: today,
            escalation_level: 0,
            status: "pending",
          })
          .select()
          .single();

        if (trackError) {
          console.error("Failed to create tracking:", trackError);
          continue;
        }

        // Determine current escalation level based on time
        const escalationLevel = determineCurrentEscalationLevel(now, config);

        if (escalationLevel > 0) {
          // Apply escalation immediately
          const result = await applyEscalation(
            newTracking.id,
            ts.id,
            ts.user_id,
            escalationLevel,
            config
          );
          escalations.push(result);
        }
      } else {
        // Check if escalation level changed
        const newLevel = determineCurrentEscalationLevel(now, config);

        if (newLevel > tracking.escalation_level) {
          const result = await applyEscalation(
            tracking.id,
            ts.id,
            ts.user_id,
            newLevel,
            config,
            tracking
          );
          escalations.push(result);
        }
      }
    }

    return { processed: incompleteTimesheets.length, escalations };
  } catch (err) {
    console.error("checkIncompleteTimesheets exception:", err);
    return { processed: 0, escalations: [], error: err.message };
  }
}

/**
 * Determine escalation level based on current time vs cutoff times
 */
function determineCurrentEscalationLevel(now, config) {
  const timeStr = now.toLocaleTimeString("en-US", { hour12: false, hour: "2-digit", minute: "2-digit", second: "2-digit" });

  // Parse cutoff times
  const level1Time = config.level_1_time.substring(0, 5); // HH:MM
  const level2Time = config.level_2_time.substring(0, 5);
  const level3Time = config.level_3_time.substring(0, 5);
  const timeOnly = timeStr.substring(0, 5); // HH:MM

  if (timeOnly >= level3Time) return 3;
  if (timeOnly >= level2Time) return 2;
  if (timeOnly >= level1Time) return 1;
  return 0;
}

/**
 * Apply escalation to a timesheet tracking record
 */
async function applyEscalation(trackingId, timesheetId, userId, newLevel, config, existingTracking = null) {
  try {
    const updates = {
      escalation_level: newLevel,
      status: "escalated",
      updated_at: new Date().toISOString(),
    };

    let eventType = null;
    let targetRole = null;

    if (newLevel === 1 && (!existingTracking || !existingTracking.level_1_triggered_at)) {
      updates.level_1_triggered_at = new Date().toISOString();
      eventType = "timesheet_pending_level_1";
      targetRole = config.level_1_target_role;
    } else if (newLevel === 2 && (!existingTracking || !existingTracking.level_2_triggered_at)) {
      updates.level_2_triggered_at = new Date().toISOString();
      eventType = "timesheet_pending_level_2";
      targetRole = config.level_2_target_role;
    } else if (newLevel === 3 && (!existingTracking || !existingTracking.level_3_triggered_at)) {
      updates.level_3_triggered_at = new Date().toISOString();
      eventType = "timesheet_pending_level_3";
      targetRole = config.level_3_target_role;
    }

    // Update tracking record
    const { error: updateError } = await supabase
      .from("timesheet_escalation_tracking")
      .update(updates)
      .eq("id", trackingId);

    if (updateError) {
      console.error("Failed to update tracking:", updateError);
      return { success: false, error: updateError.message };
    }

    // Create escalation event if we have a new level
    let escalationEventId = null;
    if (eventType) {
      const { data: escalationEvent, error: eventError } = await supabase
        .from("escalation_events")
        .insert({
          event_type: eventType,
          entity_type: "timesheet",
          entity_id: timesheetId,
          user_id: userId,
          escalation_level: newLevel,
          escalation_target_role: targetRole,
          status: "pending",
          reason: `Timesheet incomplete at escalation level ${newLevel}`,
          details: {
            cutoff_time: newLevel === 1 ? config.level_1_time : newLevel === 2 ? config.level_2_time : config.level_3_time,
            notification_type: newLevel === 1 ? "email" : newLevel === 2 ? (config.send_sms_level_2 ? "email+sms" : "email") : config.send_sms_level_3 ? "email+sms" : "email",
          },
        })
        .select()
        .single();

      if (eventError) {
        console.error("Failed to create escalation event:", eventError);
      } else {
        escalationEventId = escalationEvent.id;

        // Update tracking with escalation event ID
        const levelField = `escalation_event_id_level${newLevel}`;
        await supabase
          .from("timesheet_escalation_tracking")
          .update({ [levelField]: escalationEventId })
          .eq("id", trackingId);
      }
    }

    // Log to history
    await supabase.from("timesheet_escalation_history").insert({
      escalation_tracking_id: trackingId,
      user_id: userId,
      timesheet_id: timesheetId,
      action: `triggered_level_${newLevel}`,
      escalation_level: newLevel,
      triggered_by: null, // System triggered
    });

    return {
      success: true,
      trackingId,
      timesheetId,
      userId,
      escalationLevel: newLevel,
      escalationEventId,
    };
  } catch (err) {
    console.error("applyEscalation error:", err);
    return { success: false, error: err.message };
  }
}

/**
 * Mark timesheet as complete and resolve escalation
 */
async function markTimesheetComplete(timesheetId, userId) {
  try {
    // Get tracking record
    const { data: tracking, error: trackingError } = await supabase
      .from("timesheet_escalation_tracking")
      .select("*")
      .eq("timesheet_id", timesheetId)
      .single();

    if (trackingError || !tracking) {
      console.error("Tracking record not found:", trackingError);
      return { success: false, error: "Tracking record not found" };
    }

    const now = new Date().toISOString();

    // Update tracking
    const { error: updateError } = await supabase
      .from("timesheet_escalation_tracking")
      .update({
        status: "completed",
        completed_at: now,
        acknowledged_by: userId,
        acknowledged_at: now,
        updated_at: now,
      })
      .eq("id", tracking.id);

    if (updateError) {
      console.error("Failed to update tracking:", updateError);
      return { success: false, error: updateError.message };
    }

    // Resolve escalation events
    if (tracking.escalation_event_id_level1) {
      await supabase
        .from("escalation_events")
        .update({ status: "resolved", resolved_at: now, resolved_by: userId })
        .eq("id", tracking.escalation_event_id_level1);
    }
    if (tracking.escalation_event_id_level2) {
      await supabase
        .from("escalation_events")
        .update({ status: "resolved", resolved_at: now, resolved_by: userId })
        .eq("id", tracking.escalation_event_id_level2);
    }
    if (tracking.escalation_event_id_level3) {
      await supabase
        .from("escalation_events")
        .update({ status: "resolved", resolved_at: now, resolved_by: userId })
        .eq("id", tracking.escalation_event_id_level3);
    }

    // Log to history
    await supabase.from("timesheet_escalation_history").insert({
      escalation_tracking_id: tracking.id,
      user_id: userId,
      timesheet_id: timesheetId,
      action: "completed",
      triggered_by: userId,
    });

    return { success: true, trackingId: tracking.id };
  } catch (err) {
    console.error("markTimesheetComplete error:", err);
    return { success: false, error: err.message };
  }
}

/**
 * Get incomplete timesheets for a user (for dashboard)
 */
async function getIncompleteTimesheets(userId) {
  try {
    const { data: timesheets, error } = await supabase
      .from("timesheets")
      .select(
        `id, user_id, timesheet_date, hours, status, created_at,
        timesheet_escalation_tracking(escalation_level, status, level_1_triggered_at, level_2_triggered_at, level_3_triggered_at)`
      )
      .eq("user_id", userId)
      .in("status", ["draft", "pending"])
      .order("timesheet_date", { ascending: false });

    if (error) {
      console.error("getIncompleteTimesheets error:", error);
      return [];
    }

    return timesheets || [];
  } catch (err) {
    console.error("getIncompleteTimesheets exception:", err);
    return [];
  }
}

/**
 * Get all escalations for managers/admins
 */
async function getEscalatedTimesheets(targetRole, limit = 50) {
  try {
    const { data: escalations, error } = await supabase
      .from("escalation_events")
      .select(
        `id, event_type, user_id, escalation_level, status, escalation_triggered_at, reason,
        details, resolution_notes`
      )
      .eq("event_type", "timesheet_pending_level_2")
      .or(`event_type.eq.timesheet_pending_level_3`)
      .eq("escalation_target_role", targetRole)
      .in("status", ["pending", "escalated"])
      .order("escalation_triggered_at", { ascending: false })
      .limit(limit);

    if (error) {
      console.error("getEscalatedTimesheets error:", error);
      return [];
    }

    return escalations || [];
  } catch (err) {
    console.error("getEscalatedTimesheets exception:", err);
    return [];
  }
}

/**
 * Record timesheet submission audit for compliance
 */
async function recordSubmissionAudit(timesheetId, userId, hoursSubmitted, ipAddress = null, userAgent = null) {
  try {
    const config = await loadTimesheetConfig();
    const now = new Date();

    const timeStr = now.toLocaleTimeString("en-US", { hour12: false, hour: "2-digit", minute: "2-digit", second: "2-digit" });
    const level1Time = config.level_1_time.substring(0, 5);
    const level2Time = config.level_2_time.substring(0, 5);
    const level3Time = config.level_3_time.substring(0, 5);
    const hardDeadline = config.hard_deadline_time.substring(0, 5);
    const timeOnly = timeStr.substring(0, 5);

    const { error } = await supabase
      .from("timesheet_submission_audit")
      .insert({
        timesheet_id: timesheetId,
        user_id: userId,
        submission_time: now.toISOString(),
        hours_submitted: hoursSubmitted,
        submitted_before_level_1: timeOnly < level1Time,
        submitted_before_level_2: timeOnly < level2Time,
        submitted_before_level_3: timeOnly < level3Time,
        submitted_after_deadline: timeOnly > hardDeadline,
        ip_address: ipAddress,
        user_agent: userAgent,
      });

    if (error) {
      console.warn("recordSubmissionAudit warning:", error.message);
    }

    return { success: !error };
  } catch (err) {
    console.error("recordSubmissionAudit error:", err);
    return { success: false };
  }
}

module.exports = {
  loadTimesheetConfig,
  getDefaultTimesheetConfig,
  checkIncompleteTimesheets,
  determineCurrentEscalationLevel,
  applyEscalation,
  markTimesheetComplete,
  getIncompleteTimesheets,
  getEscalatedTimesheets,
  recordSubmissionAudit,
};
