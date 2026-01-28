/**
 * Attendance Automation Engine
 * Handles:
 * - RFID ingestion with debouncing
 * - Deterministic rule-based attendance determination
 * - Anomaly detection and workflow
 * - LOP (Loss of Pay) auto-calculation
 */

const supabase = require("../supabaseClient");

// ============================================
// CONFIGURATION LOADER
// ============================================
let configCache = {};
let configCacheTime = 0;
const CONFIG_CACHE_TTL = 5 * 60 * 1000; // 5 minutes

async function loadConfig() {
  const now = Date.now();

  // Use cache if fresh
  if (now - configCacheTime < CONFIG_CACHE_TTL && Object.keys(configCache).length > 0) {
    return configCache;
  }

  try {
    const { data, error } = await supabase
      .from("system_config")
      .select("config_key, config_value")
      .eq("is_active", true);

    if (error) throw error;

    // Convert to convenient object
    configCache = {};
    (data || []).forEach((row) => {
      configCache[row.config_key] = row.config_value;
    });

    configCacheTime = now;
    return configCache;
  } catch (err) {
    console.error("Error loading system config:", err);
    // Return defaults if load fails
    return getDefaultConfig();
  }
}

function getDefaultConfig() {
  return {
    "attendance.ontime_threshold": { hours: 9, minutes: 30 },
    "attendance.late_threshold": { hours: 9, minutes: 45 },
    "attendance.exit_anomaly_threshold": { hours: 18, minutes: 30 },
    "attendance.debounce_window_seconds": { value: 60, unit: "seconds" },
    "attendance.missing_exit_grace_period": { hours: 21, minutes: 0 },
    "attendance.auto_lop_on_unresolved_anomaly": { value: 0.5, unit: "days" },
  };
}

// ============================================
// HELPER: CONVERT TIME CONFIG TO MINUTES
// ============================================
function timeToMinutes(timeObj) {
  if (!timeObj) return 0;
  return (timeObj.hours || 0) * 60 + (timeObj.minutes || 0);
}

// ============================================
// 1. RFID INGESTION & DEBOUNCE
// ============================================
/**
 * Process RFID scan from hardware device
 * Handles debouncing and employee mapping
 */
async function ingestRfidScan(rfidData) {
  const { employee_id, scan_timestamp, device_id, device_location, raw_data } = rfidData;

  if (!employee_id || !scan_timestamp) {
    throw new Error("Missing required RFID data: employee_id, scan_timestamp");
  }

  try {
    const config = await loadConfig();
    const debounceWindow = (config["attendance.debounce_window_seconds"]?.value || 60) * 1000; // Convert to ms

    // Step 1: Insert RFID log
    const { data: rfidLog, error: rfidError } = await supabase
      .from("rfid_logs")
      .insert({
        employee_id,
        scan_timestamp,
        device_id,
        device_location,
        raw_data: raw_data || {},
      })
      .select("*")
      .single();

    if (rfidError) {
      console.error("RFID insert error:", rfidError);
      throw rfidError;
    }

    // Step 2: Debounce check (ignore duplicate scans within window)
    const debounceThreshold = new Date(new Date(scan_timestamp).getTime() - debounceWindow);

    const { data: dupes, error: dupeError } = await supabase
      .from("rfid_logs")
      .select("id")
      .eq("employee_id", employee_id)
      .eq("device_location", device_location || "")
      .gt("scan_timestamp", debounceThreshold.toISOString())
      .lt("scan_timestamp", scan_timestamp)
      .limit(1);

    if (dupeError) {
      console.error("Debounce check error:", dupeError);
    } else if (dupes && dupes.length > 0) {
      // Mark as duplicate
      await supabase
        .from("rfid_logs")
        .update({
          is_duplicate: true,
          duplicate_of_id: dupes[0].id,
        })
        .eq("id", rfidLog.id);

      console.log(`RFID scan marked as duplicate: ${rfidLog.id}`);
      return { status: "duplicate", rfid_log_id: rfidLog.id };
    }

    // Step 3: Try to map employee_id to user_id
    const { data: user, error: userError } = await supabase
      .from("users")
      .select("id")
      .or(`employee_id.eq.${employee_id},email.eq.${employee_id}`)
      .limit(1)
      .single();

    let userId = null;
    if (!userError && user) {
      userId = user.id;
      await supabase.from("rfid_logs").update({ user_id: userId }).eq("id", rfidLog.id);
    }

    // Step 4: Process attendance
    const result = await processAttendanceFromRfid(rfidLog, userId);

    return { status: "processed", rfid_log_id: rfidLog.id, attendance_result: result };
  } catch (err) {
    console.error("RFID ingestion error:", err);
    throw err;
  }
}

// ============================================
// 2. RFID → ATTENDANCE PROCESSING
// ============================================
/**
 * Process RFID scan into attendance check-in/check-out
 */
async function processAttendanceFromRfid(rfidLog, userId) {
  if (!userId) {
    console.warn(`Cannot process RFID scan: user not found for employee_id ${rfidLog.employee_id}`);
    return { status: "user_not_found" };
  }

  try {
    const scanDate = new Date(rfidLog.scan_timestamp);
    const attendanceDateStr = scanDate.toISOString().slice(0, 10); // YYYY-MM-DD

    // Get or create attendance record for the day
    const { data: existing, error: getError } = await supabase
      .from("attendance")
      .select("id, check_in, check_out")
      .eq("user_id", userId)
      .eq("attendance_date", attendanceDateStr)
      .limit(1);

    if (getError) {
      console.error("Attendance fetch error:", getError);
      throw getError;
    }

    let attendanceId;
    let isCheckIn = false;

    if (!existing || existing.length === 0) {
      // First scan of the day = check-in
      const { data: created, error: createError } = await supabase
        .from("attendance")
        .insert({
          user_id: userId,
          attendance_date: attendanceDateStr,
          check_in: rfidLog.scan_timestamp,
          status: "present",
          is_rfid_scanned: true,
          rfid_scan_id: rfidLog.id,
        })
        .select("id")
        .single();

      if (createError) throw createError;

      attendanceId = created.id;
      isCheckIn = true;
    } else {
      const record = existing[0];

      if (!record.check_out) {
        // No checkout yet = this is checkout
        const { error: updateError } = await supabase
          .from("attendance")
          .update({
            check_out: rfidLog.scan_timestamp,
            is_rfid_scanned: true,
          })
          .eq("id", record.id);

        if (updateError) throw updateError;

        attendanceId = record.id;
        isCheckIn = false;
      } else {
        // Already checked out = duplicate/anomaly
        console.warn(`Duplicate scan attempt for user ${userId} on ${attendanceDateStr}`);
        return { status: "already_processed" };
      }
    }

    // Link RFID log to attendance
    await supabase
      .from("rfid_logs")
      .update({ is_processed: true, processed_at: new Date().toISOString() })
      .eq("id", rfidLog.id);

    return {
      status: "processed",
      attendance_id: attendanceId,
      is_check_in: isCheckIn,
      timestamp: rfidLog.scan_timestamp,
    };
  } catch (err) {
    console.error("RFID attendance processing error:", err);
    throw err;
  }
}

// ============================================
// 3. ATTENDANCE RULE ENGINE
// ============================================
/**
 * Evaluate attendance against business rules
 * Determines: present, late, absent, anomaly, etc.
 */
async function evaluateAttendanceRules(userId, attendanceDateStr) {
  try {
    const config = await loadConfig();

    // Fetch attendance record
    const { data: att, error: attError } = await supabase
      .from("attendance")
      .select("*")
      .eq("user_id", userId)
      .eq("attendance_date", attendanceDateStr)
      .single();

    if (attError || !att) {
      console.warn(`No attendance record for ${userId} on ${attendanceDateStr}`);
      return null;
    }

    const checkInTime = att.check_in ? new Date(att.check_in) : null;
    const checkOutTime = att.check_out ? new Date(att.check_out) : null;

    // Parse thresholds
    const onTimeThreshold = timeToMinutes(config["attendance.ontime_threshold"]);
    const lateThreshold = timeToMinutes(config["attendance.late_threshold"]);
    const exitAnomalyHour = config["attendance.exit_anomaly_threshold"]?.hours || 18;
    const exitAnomalyMin = config["attendance.exit_anomaly_threshold"]?.minutes || 30;

    let status = "absent";
    let anomalyType = null;
    let rulesFired = [];

    // ========== RULE: Check-in Check ==========
    if (checkInTime) {
      const attendanceDate = new Date(attendanceDateStr);
      attendanceDate.setHours(0, 0, 0, 0);

      const checkInMinutes = checkInTime.getHours() * 60 + checkInTime.getMinutes();

      if (checkInMinutes <= onTimeThreshold) {
        status = "present";
        rulesFired.push({ rule: "ontime_check", result: "pass" });
      } else if (checkInMinutes <= lateThreshold) {
        status = "present";
        rulesFired.push({ rule: "late_check", result: "late" });
      } else {
        status = "absent"; // Very late = absent
        rulesFired.push({ rule: "very_late_check", result: "absent" });
      }
    }

    // ========== RULE: Missing Checkout ==========
    if (checkInTime && !checkOutTime) {
      const now = new Date();
      const checkInDate = new Date(checkInTime);
      checkInDate.setHours(0, 0, 0, 0);
      const todayDate = new Date();
      todayDate.setHours(0, 0, 0, 0);

      // Only flag missing checkout if it's past the exit anomaly time OR it's past attendance date
      if (checkInDate < todayDate || now.getHours() >= exitAnomalyHour) {
        if (now.getHours() > exitAnomalyHour || (now.getHours() === exitAnomalyHour && now.getMinutes() >= exitAnomalyMin)) {
          anomalyType = "missing_checkout";
          rulesFired.push({
            rule: "missing_checkout",
            result: "anomaly",
            reason: `No checkout recorded after ${exitAnomalyHour}:${String(exitAnomalyMin).padStart(2, "0")}`,
          });
        }
      }
    }

    // Log rule evaluation
    if (rulesFired.length > 0) {
      await supabase.from("attendance_rules_log").insert({
        user_id: userId,
        attendance_date: attendanceDateStr,
        rule_name: rulesFired.map((r) => r.rule).join(","),
        rule_result: anomalyType ? "flag" : "pass",
        rule_reason: rulesFired.map((r) => r.reason).join("; "),
        check_in_time: checkInTime?.toISOString(),
        checkout_time: checkOutTime?.toISOString(),
        ontime_threshold_minutes: onTimeThreshold,
        late_threshold_minutes: lateThreshold,
        determined_status: status,
        rule_engine_version: "1.0",
      });
    }

    // Handle anomaly
    if (anomalyType) {
      await createAttendanceAnomaly(userId, att.id, attendanceDateStr, anomalyType, {
        detected_at: new Date().toISOString(),
        check_in_time: checkInTime?.toISOString(),
        checkout_time: checkOutTime?.toISOString(),
        rules_fired: rulesFired,
      });

      status = "anomaly";
    }

    return {
      user_id: userId,
      attendance_date: attendanceDateStr,
      determined_status: status,
      anomaly_type: anomalyType,
      rules_fired: rulesFired,
    };
  } catch (err) {
    console.error("Attendance rule evaluation error:", err);
    throw err;
  }
}

// ============================================
// 4. ANOMALY CREATION & WORKFLOW
// ============================================
/**
 * Create attendance anomaly and trigger workflow
 */
async function createAttendanceAnomaly(userId, attendanceId, attendanceDateStr, anomalyType, details) {
  try {
    const { data: anomaly, error: anomalyError } = await supabase
      .from("attendance_anomalies")
      .insert({
        attendance_id: attendanceId,
        user_id: userId,
        attendance_date: attendanceDateStr,
        anomaly_type: anomalyType,
        anomaly_severity: anomalyType === "missing_checkout" ? "medium" : "low",
        description: `${anomalyType} detected for ${attendanceDateStr}`,
        details: details || {},
        status: "open",
        detected_at: new Date().toISOString(),
      })
      .select("*")
      .single();

    if (anomalyError) {
      console.error("Anomaly creation error:", anomalyError);
      throw anomalyError;
    }

    // Create escalation event for manager review
    await supabase.from("escalation_events").insert({
      event_type: "attendance_anomaly",
      entity_type: "attendance",
      entity_id: attendanceId,
      user_id: userId,
      escalation_level: 2,
      escalation_target_role: "manager",
      escalation_triggered_at: new Date().toISOString(),
      reason: `Attendance anomaly: ${anomalyType}`,
      details: details || {},
      status: "pending",
    });

    console.log(`Anomaly created: ${anomaly.id} for user ${userId}`);
    return anomaly;
  } catch (err) {
    console.error("Anomaly creation error:", err);
    throw err;
  }
}

// ============================================
// 5. MISSING CHECKOUT REQUEST WORKFLOW
// ============================================
/**
 * Employee submits request for missing checkout
 * Valid until grace period (default 21:00 same day)
 */
async function submitMissingCheckoutRequest(userId, attendanceId, attendanceDateStr, requestedCheckoutTime) {
  try {
    const config = await loadConfig();
    const gracePeriod = config["attendance.missing_exit_grace_period"];
    const graceHour = gracePeriod?.hours || 21;

    // Grace period until 21:00 same day
    const gracePeriodUntil = new Date(attendanceDateStr);
    gracePeriodUntil.setHours(graceHour, 0, 0, 0);

    const now = new Date();
    if (now > gracePeriodUntil) {
      throw new Error(`Grace period expired at ${graceHour}:00. Cannot submit missing checkout request.`);
    }

    // Get attendance record and anomaly
    const { data: att } = await supabase
      .from("attendance")
      .select("id")
      .eq("id", attendanceId)
      .single();

    const { data: anomaly } = await supabase
      .from("attendance_anomalies")
      .select("id")
      .eq("attendance_id", attendanceId)
      .eq("anomaly_type", "missing_checkout")
      .single();

    if (!att) throw new Error("Attendance record not found");
    if (!anomaly) throw new Error("No missing checkout anomaly found");

    // Create request
    const { data: request, error: reqError } = await supabase
      .from("missing_checkout_requests")
      .insert({
        attendance_id: attendanceId,
        anomaly_id: anomaly.id,
        user_id: userId,
        attendance_date: attendanceDateStr,
        requested_checkout_time: requestedCheckoutTime || new Date().toISOString(),
        grace_period_until: gracePeriodUntil.toISOString(),
        status: "pending",
      })
      .select("*")
      .single();

    if (reqError) throw reqError;

    // Create escalation for manager approval
    await supabase.from("escalation_events").insert({
      event_type: "attendance_anomaly",
      entity_type: "attendance",
      entity_id: attendanceId,
      user_id: userId,
      escalation_level: 2,
      escalation_target_role: "manager",
      escalation_triggered_at: new Date().toISOString(),
      reason: "Missing checkout - waiting for manager approval",
      details: { request_id: request.id },
      status: "pending",
    });

    return request;
  } catch (err) {
    console.error("Missing checkout request error:", err);
    throw err;
  }
}

// ============================================
// 6. AUTO-LOP APPLICATION
// ============================================
/**
 * Apply Loss of Pay (LOP) for unresolved anomalies
 * Should run daily at end of day
 */
async function applyAutoLopForUnresolvedAnomalies() {
  try {
    const config = await loadConfig();
    const autoLopDays = config["attendance.auto_lop_on_unresolved_anomaly"]?.value || 0.5;

    // Find unresolved anomalies from YESTERDAY
    // (Give manager a day to approve/reject)
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = yesterday.toISOString().slice(0, 10);

    const { data: unresolved, error: fetchError } = await supabase
      .from("attendance_anomalies")
      .select("id, attendance_id, user_id, attendance_date")
      .eq("status", "open")
      .eq("attendance_date", yesterdayStr)
      .eq("anomaly_type", "missing_checkout");

    if (fetchError) throw fetchError;

    console.log(`Found ${(unresolved || []).length} unresolved anomalies to auto-LOP`);

    // Apply LOP to each
    for (const anomaly of unresolved || []) {
      // Update anomaly status
      await supabase
        .from("attendance_anomalies")
        .update({
          status: "resolved_auto_lop",
          lop_days_applied: autoLopDays,
          resolution_type: "auto_lop_applied",
          resolution_notes: `Auto-LOP applied: ${autoLopDays} days (unresolved by manager deadline)`,
          resolved_at: new Date().toISOString(),
        })
        .eq("id", anomaly.id);

      // Update attendance with LOP
      await supabase
        .from("attendance")
        .update({
          lop_applied: autoLopDays,
          has_unresolved_anomaly: false,
        })
        .eq("id", anomaly.attendance_id);

      console.log(`Auto-LOP applied: ${autoLopDays} days for user ${anomaly.user_id} on ${anomaly.attendance_date}`);
    }

    return { processed: (unresolved || []).length };
  } catch (err) {
    console.error("Auto-LOP application error:", err);
    throw err;
  }
}

// ============================================
// EXPORTS
// ============================================
module.exports = {
  loadConfig,
  ingestRfidScan,
  processAttendanceFromRfid,
  evaluateAttendanceRules,
  createAttendanceAnomaly,
  submitMissingCheckoutRequest,
  applyAutoLopForUnresolvedAnomalies,
};
