/**
 * Payroll Coupling Engine
 * Integrates attendance, leaves, and payroll
 * Validates payroll against attendance anomalies
 * Enforces dual approval workflow
 */

const supabase = require("../supabaseClient");

// ============================================
// 1. PAYROLL VALIDATION ENGINE
// ============================================
/**
 * Validate payroll run against attendance/leave data
 * Blocks payroll if critical anomalies exist
 */
async function validatePayrollRun(payrollRunId) {
  try {
    const { data: payrollRun, error: runError } = await supabase
      .from("payroll_runs")
      .select("*")
      .eq("id", payrollRunId)
      .single();

    if (runError) throw runError;

    const { period_start, period_end } = payrollRun;

    // Fetch all employees in payroll
    const { data: payrollItems, error: itemsError } = await supabase
      .from("payroll_items")
      .select("id, user_id")
      .eq("run_id", payrollRunId);

    if (itemsError) throw itemsError;

    const validationResults = [];
    let hasBlockingIssues = false;

    // Validate each employee
    for (const item of payrollItems || []) {
      const checks = await performEmployeePayrollValidation(
        item.user_id,
        period_start,
        period_end,
        payrollRunId
      );

      if (checks.has_blocking_issues) {
        hasBlockingIssues = true;
      }

      // Record validation results
      for (const check of checks.validation_checks) {
        await supabase.from("payroll_validation_results").insert({
          payroll_run_id: payrollRunId,
          payroll_item_id: item.id,
          user_id: item.user_id,
          check_name: check.name,
          check_result: check.result,
          check_message: check.message,
          is_blocking: check.is_blocking,
          is_warning: check.is_warning,
          details: check.details || {},
        });
      }

      validationResults.push({
        user_id: item.user_id,
        checks: checks.validation_checks,
      });
    }

    // Update payroll run status
    const validationStatus = hasBlockingIssues ? "blocked" : "validated";

    await supabase
      .from("payroll_runs")
      .update({
        validation_status: validationStatus,
        has_attendance_anomalies: hasBlockingIssues,
        is_blocked_for_anomalies: hasBlockingIssues,
        blocked_reason: hasBlockingIssues
          ? "Attendance anomalies detected. Please resolve anomalies before proceeding."
          : null,
        validated_at: new Date().toISOString(),
      })
      .eq("id", payrollRunId);

    console.log(`Payroll validation complete: ${validationStatus} (Blocking: ${hasBlockingIssues})`);

    return {
      payroll_run_id: payrollRunId,
      validation_status: validationStatus,
      has_blocking_issues: hasBlockingIssues,
      validation_results: validationResults,
    };
  } catch (err) {
    console.error("Payroll validation error:", err);
    throw err;
  }
}

// ============================================
// 2. EMPLOYEE-LEVEL PAYROLL VALIDATION
// ============================================
/**
 * Validate individual employee for payroll
 */
async function performEmployeePayrollValidation(userId, periodStart, periodEnd, payrollRunId) {
  const validationChecks = [];
  let hasBlockingIssues = false;

  try {
    // ========== CHECK 1: Attendance Anomalies ==========
    const { data: anomalies } = await supabase
      .from("attendance_anomalies")
      .select("*")
      .eq("user_id", userId)
      .gte("attendance_date", periodStart)
      .lte("attendance_date", periodEnd)
      .eq("status", "open"); // Only unresolved

    if (anomalies && anomalies.length > 0) {
      const blockingAnomalies = anomalies.filter((a) => a.anomaly_severity === "high" || a.anomaly_severity === "critical");

      if (blockingAnomalies.length > 0) {
        validationChecks.push({
          name: "attendance_anomalies_blocking",
          result: "fail",
          message: `${blockingAnomalies.length} critical attendance anomalies unresolved`,
          is_blocking: true,
          is_warning: false,
          details: {
            anomaly_count: blockingAnomalies.length,
            anomaly_ids: blockingAnomalies.map((a) => a.id),
          },
        });
        hasBlockingIssues = true;
      } else if (anomalies.length > 0) {
        validationChecks.push({
          name: "attendance_anomalies_warning",
          result: "warning",
          message: `${anomalies.length} attendance anomalies pending review`,
          is_blocking: false,
          is_warning: true,
          details: {
            anomaly_count: anomalies.length,
          },
        });
      }
    } else {
      validationChecks.push({
        name: "attendance_anomalies",
        result: "pass",
        message: "No unresolved attendance anomalies",
        is_blocking: false,
        is_warning: false,
      });
    }

    // ========== CHECK 2: Timesheet Completion ==========
    const { data: timesheets, error: tsError } = await supabase
      .from("timesheets")
      .select("status")
      .eq("user_id", userId)
      .gte("work_date", periodStart)
      .lte("work_date", periodEnd);

    if (!tsError && timesheets) {
      const pending = timesheets.filter((ts) => ts.status === "submitted" || ts.status === "rejected");
      if (pending.length > 0) {
        validationChecks.push({
          name: "timesheet_pending",
          result: "warning",
          message: `${pending.length} timesheets pending approval`,
          is_blocking: false,
          is_warning: true,
          details: { pending_count: pending.length },
        });
      } else {
        validationChecks.push({
          name: "timesheet_completion",
          result: "pass",
          message: "All timesheets approved or not required",
          is_blocking: false,
          is_warning: false,
        });
      }
    }

    // ========== CHECK 3: Leave Balance ==========
    const { data: leaves, error: leaveError } = await supabase
      .from("leaves")
      .select("leave_type, total_days, status")
      .eq("user_id", userId)
      .gte("start_date", periodStart)
      .lte("end_date", periodEnd)
      .eq("status", "approved");

    if (!leaveError && leaves) {
      const totalLeaveDays = leaves.reduce((sum, l) => sum + (l.total_days || 0), 0);
      validationChecks.push({
        name: "leave_data",
        result: "pass",
        message: `Approved leave days: ${totalLeaveDays}`,
        is_blocking: false,
        is_warning: false,
        details: { approved_leave_days: totalLeaveDays },
      });
    }

    // ========== CHECK 4: Attendance Data Completeness ==========
    const { data: attendance } = await supabase
      .from("attendance")
      .select("attendance_date, status")
      .eq("user_id", userId)
      .gte("attendance_date", periodStart)
      .lte("attendance_date", periodEnd);

    if (attendance) {
      const workDays = attendance.length;
      const absentDays = attendance.filter((a) => a.status === "absent").length;

      if (workDays === 0) {
        validationChecks.push({
          name: "attendance_data",
          result: "warning",
          message: "No attendance data for period",
          is_blocking: false,
          is_warning: true,
        });
      } else {
        validationChecks.push({
          name: "attendance_data",
          result: "pass",
          message: `Attendance data complete: ${workDays} days, ${absentDays} absent`,
          is_blocking: false,
          is_warning: false,
          details: { work_days: workDays, absent_days: absentDays },
        });
      }
    }
  } catch (err) {
    console.error("Employee validation error:", err);
    validationChecks.push({
      name: "validation_error",
      result: "fail",
      message: `Validation error: ${err.message}`,
      is_blocking: true,
      is_warning: false,
    });
    hasBlockingIssues = true;
  }

  return {
    user_id: userId,
    has_blocking_issues: hasBlockingIssues,
    validation_checks: validationChecks,
  };
}

// ============================================
// 3. PAYROLL AGGREGATION FROM ATTENDANCE
// ============================================
/**
 * Aggregate attendance/leave data into payroll components
 */
async function aggregatePayrollSourceData(payrollRunId, userId, periodStart, periodEnd) {
  try {
    // ========== ATTENDANCE AGGREGATION ==========
    const { data: attendanceData } = await supabase
      .from("attendance")
      .select("attendance_date, status, check_in, check_out, lop_applied")
      .eq("user_id", userId)
      .gte("attendance_date", periodStart)
      .lte("attendance_date", periodEnd);

    const totalWorkingDays = attendanceData?.length || 0;
    const daysPresent = attendanceData?.filter((a) => a.status === "present").length || 0;
    const daysAbsent = attendanceData?.filter((a) => a.status === "absent").length || 0;
    const daysLate = attendanceData?.filter((a) => a.status === "late").length || 0;

    const totalLopApplied = (attendanceData || [])
      .reduce((sum, a) => sum + (a.lop_applied || 0), 0);

    // ========== LEAVE AGGREGATION ==========
    const { data: leaveData } = await supabase
      .from("leaves")
      .select("leave_type, total_days, status")
      .eq("user_id", userId)
      .gte("start_date", periodStart)
      .lte("end_date", periodEnd)
      .eq("status", "approved");

    const approvedLeaveDays = leaveData?.reduce((sum, l) => sum + (l.total_days || 0), 0) || 0;
    const clUsed = leaveData?.filter((l) => l.leave_type === "CL").reduce((sum, l) => sum + (l.total_days || 0), 0) || 0;
    const slUsed = leaveData?.filter((l) => l.leave_type === "SL").reduce((sum, l) => sum + (l.total_days || 0), 0) || 0;
    const elUsed = leaveData?.filter((l) => l.leave_type === "EL").reduce((sum, l) => sum + (l.total_days || 0), 0) || 0;

    // ========== TIMESHEET AGGREGATION ==========
    const { data: timesheetData } = await supabase
      .from("timesheets")
      .select("hours, status")
      .eq("user_id", userId)
      .gte("work_date", periodStart)
      .lte("work_date", periodEnd);

    const timesheetHoursTotal = timesheetData?.reduce((sum, ts) => sum + (ts.hours || 0), 0) || 0;
    const timesheetPendingCount = timesheetData?.filter((ts) => ts.status === "submitted").length || 0;

    // ========== ANOMALIES ==========
    const { data: anomalies } = await supabase
      .from("attendance_anomalies")
      .select("*")
      .eq("user_id", userId)
      .gte("attendance_date", periodStart)
      .lte("attendance_date", periodEnd);

    const daysWithAnomalies = anomalies?.length || 0;
    const unresolvedAnomalies = anomalies?.filter((a) => a.status === "open").length || 0;

    // Check if blocking anomalies exist
    const blockingAnomalies = anomalies?.filter((a) => a.status === "open" && (a.anomaly_severity === "high" || a.anomaly_severity === "critical"));
    const hasBlockingAnomalies = (blockingAnomalies?.length || 0) > 0;

    // Create aggregation record
    const { data: agg, error: aggError } = await supabase
      .from("payroll_aggregation_source")
      .insert({
        payroll_run_id: payrollRunId,
        user_id: userId,
        period_start: periodStart,
        period_end: periodEnd,

        // Attendance
        total_working_days: totalWorkingDays,
        days_present: daysPresent,
        days_absent: daysAbsent,
        days_late: daysLate,
        days_with_anomalies: daysWithAnomalies,
        unresolved_anomalies_count: unresolvedAnomalies,

        // Leave
        approved_leave_days: approvedLeaveDays,
        cl_used: clUsed,
        sl_used: slUsed,
        el_used: elUsed,

        // LOP
        lop_days_calculated: totalLopApplied,
        lop_days_total: totalLopApplied,

        // Timesheet
        timesheet_entries_submitted: timesheetData?.length || 0,
        timesheet_hours_total: timesheetHoursTotal,
        timesheet_pending_approval: timesheetPendingCount,

        // Flags
        has_blocking_anomalies: hasBlockingAnomalies,
        blocking_anomalies_reason: hasBlockingAnomalies
          ? `${unresolvedAnomalies} unresolved critical anomalies`
          : null,

        aggregated_at: new Date().toISOString(),
      })
      .select("*")
      .single();

    if (aggError) throw aggError;

    console.log(
      `Aggregation complete for user ${userId}: ${daysPresent} present, ${approvedLeaveDays} approved leave, ${totalLopApplied} LOP days`
    );

    return agg;
  } catch (err) {
    console.error("Payroll aggregation error:", err);
    throw err;
  }
}

// ============================================
// 4. PAYROLL HOLD/BLOCK LOGIC
// ============================================
/**
 * Create payroll halt record for blocking issues
 */
async function haltPayrollForAnomalies(payrollRunId, userId, haltReason, details) {
  try {
    const { error } = await supabase.from("payroll_halt_log").insert({
      payroll_run_id: payrollRunId,
      user_id: userId,
      halt_reason: haltReason,
      halt_description: `Payroll blocked: ${haltReason}`,
      details: details || {},
      halted_by: "system", // System-generated
      halted_at: new Date().toISOString(),
      status: "active",
    });

    if (error) throw error;

    // Mark payroll run as blocked
    await supabase
      .from("payroll_runs")
      .update({
        is_blocked_for_anomalies: true,
        blocked_reason: haltReason,
      })
      .eq("id", payrollRunId);

    console.log(`Payroll halted: ${haltReason} for user ${userId}`);
  } catch (err) {
    console.error("Payroll halt error:", err);
    throw err;
  }
}

// ============================================
// 5. DUAL APPROVAL WORKFLOW
// ============================================
/**
 * HR (or manager) approval step 1
 */
async function approvePayrollHR(payrollRunId, hrUserId, notes) {
  try {
    const now = new Date().toISOString();

    const { data: signOff, error: fetchError } = await supabase
      .from("payroll_sign_offs")
      .select("*")
      .eq("payroll_run_id", payrollRunId)
      .single();

    if (!signOff) {
      // Create new sign-off record
      await supabase.from("payroll_sign_offs").insert({
        payroll_run_id: payrollRunId,
        hr_sign_off_by: hrUserId,
        hr_sign_off_at: now,
        hr_sign_off_notes: notes || "",
        sign_off_status: "partial",
      });
    } else {
      // Update existing
      await supabase
        .from("payroll_sign_offs")
        .update({
          hr_sign_off_by: hrUserId,
          hr_sign_off_at: now,
          hr_sign_off_notes: notes || "",
          sign_off_status: signOff.finance_sign_off_by ? "complete" : "partial",
        })
        .eq("payroll_run_id", payrollRunId);
    }

    console.log(`HR approval: Payroll ${payrollRunId} approved by ${hrUserId}`);
    return { status: "approved", step: "hr" };
  } catch (err) {
    console.error("HR approval error:", err);
    throw err;
  }
}

/**
 * Finance approval step 2
 */
async function approvePayrollFinance(payrollRunId, financeUserId, notes) {
  try {
    const now = new Date().toISOString();

    const { data: signOff } = await supabase
      .from("payroll_sign_offs")
      .select("*")
      .eq("payroll_run_id", payrollRunId)
      .single();

    if (!signOff) {
      // Create new sign-off record
      await supabase.from("payroll_sign_offs").insert({
        payroll_run_id: payrollRunId,
        finance_sign_off_by: financeUserId,
        finance_sign_off_at: now,
        finance_sign_off_notes: notes || "",
        sign_off_status: "partial",
      });
    } else {
      // Check if HR already approved
      const isComplete = signOff.hr_sign_off_by && financeUserId;

      await supabase
        .from("payroll_sign_offs")
        .update({
          finance_sign_off_by: financeUserId,
          finance_sign_off_at: now,
          finance_sign_off_notes: notes || "",
          sign_off_status: isComplete ? "complete" : "partial",
          finalized_at: isComplete ? now : null,
          finalized_by: isComplete ? financeUserId : null,
        })
        .eq("payroll_run_id", payrollRunId);

      if (isComplete) {
        // Both approved - mark payroll as approved
        await supabase
          .from("payroll_runs")
          .update({
            status: "approved",
            approved_by_finance: financeUserId,
            approved_at: now,
          })
          .eq("id", payrollRunId);
      }
    }

    console.log(`Finance approval: Payroll ${payrollRunId} approved by ${financeUserId}`);
    return { status: "approved", step: "finance" };
  } catch (err) {
    console.error("Finance approval error:", err);
    throw err;
  }
}

// ============================================
// EXPORTS
// ============================================
module.exports = {
  validatePayrollRun,
  performEmployeePayrollValidation,
  aggregatePayrollSourceData,
  haltPayrollForAnomalies,
  approvePayrollHR,
  approvePayrollFinance,
};
