// backend/src/services/taskOverdueAutomationEngine.js
// Task overdue detection, dependency blocking, auto-reopen

const supabase = require("../supabaseClient");

// ============================================
// CONFIG CACHE
// ============================================
let configCache = null;
let configCacheTime = null;
const CONFIG_CACHE_TTL = 5 * 60 * 1000; // 5 minutes

async function loadTaskConfig() {
  try {
    // Check cache
    if (configCache && configCacheTime && Date.now() - configCacheTime < CONFIG_CACHE_TTL) {
      return configCache;
    }

    // Load from DB
    const { data, error } = await supabase
      .from("task_overdue_config")
      .select("*")
      .eq("is_active", true)
      .single();

    if (error || !data) {
      console.warn("Task config error, using defaults:", error?.message);
      return getDefaultTaskConfig();
    }

    configCache = data;
    configCacheTime = Date.now();
    return data;
  } catch (err) {
    console.error("loadTaskConfig error:", err);
    return getDefaultTaskConfig();
  }
}

function getDefaultTaskConfig() {
  return {
    level_1_days_after_due: 0,
    level_2_days_after_due: 3,
    level_3_days_after_due: 5,
    level_1_target_role: "employee",
    level_2_target_role: "manager",
    level_3_target_role: "admin",
    auto_reopen_if_blocked: true,
    allow_post_due_extension: true,
    require_manager_approval_if_extended: true,
    block_completion_if_dependencies_pending: true,
    auto_fail_dependent_tasks: false,
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
 * Check for overdue tasks and apply escalations
 * Runs daily or on-demand
 */
async function checkOverdueTasks() {
  try {
    const config = await loadTaskConfig();
    const today = new Date();
    const todayStr = today.toISOString().split("T")[0];

    // Get all tasks that are not completed and have due dates
    const { data: tasks, error: tasksError } = await supabase
      .from("tasks")
      .select("id, assigned_to, due_date, status, created_at")
      .neq("status", "completed")
      .neq("status", "cancelled")
      .not("due_date", "is", null)
      .order("due_date", { ascending: true });

    if (tasksError) {
      console.error("checkOverdueTasks query error:", tasksError);
      return { processed: 0, escalations: [], reopened: [] };
    }

    if (!tasks || tasks.length === 0) {
      return { processed: 0, escalations: [], reopened: [] };
    }

    const escalations = [];
    const reopened = [];

    // Check each task
    for (const task of tasks) {
      const dueDate = new Date(task.due_date);
      const daysOverdue = Math.floor((today - dueDate) / (1000 * 60 * 60 * 24));

      // Only process if actually overdue
      if (daysOverdue < 0) continue;

      // Check for blocking dependencies
      const blockingResult = await checkBlockingDependencies(task.id);

      if (blockingResult.hasBlockingDependencies && config.auto_reopen_if_blocked) {
        // Auto-reopen if blocked
        const reopenResult = await autoReopenBlockedTask(task.id, task.assigned_to, blockingResult.blockingTasks);
        reopened.push(reopenResult);
      }

      // Get or create tracking record
      const { data: tracking } = await supabase
        .from("task_overdue_tracking")
        .select("*")
        .eq("task_id", task.id)
        .single();

      if (!tracking) {
        // Create new tracking
        const { data: newTracking, error: trackError } = await supabase
          .from("task_overdue_tracking")
          .insert({
            task_id: task.id,
            assigned_to: task.assigned_to,
            due_date: task.due_date,
            days_overdue: daysOverdue,
            status: "overdue",
            overdue_detected_at: new Date().toISOString(),
          })
          .select()
          .single();

        if (trackError) {
          console.error("Failed to create tracking:", trackError);
          continue;
        }

        // Determine escalation level
        const level = determineEscalationLevel(daysOverdue, config);
        if (level > 0) {
          const result = await applyEscalation(newTracking.id, task.id, task.assigned_to, level, config);
          escalations.push(result);
        }
      } else {
        // Check if escalation level changed
        const newLevel = determineEscalationLevel(daysOverdue, config);
        if (newLevel > tracking.escalation_level) {
          const result = await applyEscalation(tracking.id, task.id, task.assigned_to, newLevel, config, tracking);
          escalations.push(result);
        }

        // Update days overdue
        await supabase
          .from("task_overdue_tracking")
          .update({ days_overdue: daysOverdue, updated_at: new Date().toISOString() })
          .eq("id", tracking.id);
      }
    }

    return { processed: tasks.length, escalations, reopened };
  } catch (err) {
    console.error("checkOverdueTasks exception:", err);
    return { processed: 0, escalations: [], reopened: [], error: err.message };
  }
}

/**
 * Determine escalation level based on days overdue
 */
function determineEscalationLevel(daysOverdue, config) {
  if (daysOverdue >= config.level_3_days_after_due) return 3;
  if (daysOverdue >= config.level_2_days_after_due) return 2;
  if (daysOverdue >= config.level_1_days_after_due) return 1;
  return 0;
}

/**
 * Check if task has blocking dependencies that are incomplete
 */
async function checkBlockingDependencies(taskId) {
  try {
    const { data: dependencies, error } = await supabase
      .from("task_dependencies")
      .select(
        `id, blocking_task_id, blocked_task_id, status, 
        blocking_task:blocking_task_id(id, status, title)`
      )
      .eq("blocked_task_id", taskId)
      .eq("is_active", true)
      .neq("status", "resolved");

    if (error) {
      console.error("checkBlockingDependencies error:", error);
      return { hasBlockingDependencies: false, blockingTasks: [] };
    }

    // Filter for incomplete blocking tasks
    const blockingTasks = (dependencies || []).filter(
      (dep) => dep.blocking_task && !["completed", "cancelled"].includes(dep.blocking_task.status)
    );

    return {
      hasBlockingDependencies: blockingTasks.length > 0,
      blockingTasks: blockingTasks,
    };
  } catch (err) {
    console.error("checkBlockingDependencies exception:", err);
    return { hasBlockingDependencies: false, blockingTasks: [] };
  }
}

/**
 * Apply escalation to an overdue task
 */
async function applyEscalation(trackingId, taskId, assignedTo, newLevel, config, existingTracking = null) {
  try {
    const now = new Date().toISOString();
    const updates = {
      escalation_level: newLevel,
      status: "escalated",
      updated_at: now,
    };

    let eventType = null;
    let targetRole = null;

    if (newLevel === 1 && (!existingTracking || !existingTracking.level_1_triggered_at)) {
      updates.level_1_triggered_at = now;
      eventType = "task_overdue_level_1";
      targetRole = config.level_1_target_role;
    } else if (newLevel === 2 && (!existingTracking || !existingTracking.level_2_triggered_at)) {
      updates.level_2_triggered_at = now;
      eventType = "task_overdue_level_2";
      targetRole = config.level_2_target_role;
    } else if (newLevel === 3 && (!existingTracking || !existingTracking.level_3_triggered_at)) {
      updates.level_3_triggered_at = now;
      eventType = "task_overdue_level_3";
      targetRole = config.level_3_target_role;
    }

    // Update tracking
    const { error: updateError } = await supabase
      .from("task_overdue_tracking")
      .update(updates)
      .eq("id", trackingId);

    if (updateError) {
      console.error("Failed to update tracking:", updateError);
      return { success: false, error: updateError.message };
    }

    // Create escalation event
    let escalationEventId = null;
    if (eventType) {
      const { data: escalationEvent, error: eventError } = await supabase
        .from("escalation_events")
        .insert({
          event_type: eventType,
          entity_type: "task",
          entity_id: taskId,
          user_id: assignedTo,
          escalation_level: newLevel,
          escalation_target_role: targetRole,
          status: "pending",
          reason: `Task overdue at escalation level ${newLevel}`,
          details: {
            notification_type: newLevel === 1 ? "email" : newLevel === 2 ? (config.send_sms_level_2 ? "email+sms" : "email") : config.send_sms_level_3 ? "email+sms" : "email",
          },
        })
        .select()
        .single();

      if (eventError) {
        console.error("Failed to create escalation event:", eventError);
      } else {
        escalationEventId = escalationEvent.id;

        // Update tracking with event ID
        const levelField = `escalation_event_id_level${newLevel}`;
        await supabase
          .from("task_overdue_tracking")
          .update({ [levelField]: escalationEventId })
          .eq("id", trackingId);
      }
    }

    // Log audit
    await supabase.from("task_escalation_audit").insert({
      task_id: taskId,
      overdue_tracking_id: trackingId,
      action: `triggered_level_${newLevel}`,
      escalation_level: newLevel,
      triggered_by: null, // System
    });

    return {
      success: true,
      trackingId,
      taskId,
      assignedTo,
      escalationLevel: newLevel,
      escalationEventId,
    };
  } catch (err) {
    console.error("applyEscalation error:", err);
    return { success: false, error: err.message };
  }
}

/**
 * Auto-reopen a task that is blocked by incomplete dependencies
 */
async function autoReopenBlockedTask(taskId, assignedTo, blockingTasks) {
  try {
    const config = await loadTaskConfig();
    const now = new Date().toISOString();

    // Get task details
    const { data: task, error: taskError } = await supabase
      .from("tasks")
      .select("id, status, assigned_to, due_date, title")
      .eq("id", taskId)
      .single();

    if (taskError || !task) {
      console.error("Task not found:", taskError);
      return { success: false, error: "Task not found" };
    }

    // Only reopen if in completed/cancelled state
    if (!["completed", "cancelled"].includes(task.status)) {
      return { success: false, error: "Task not in completed/cancelled state" };
    }

    // Reopen the task
    const newStatus = "reopened";
    const { error: updateError } = await supabase
      .from("tasks")
      .update({
        status: newStatus,
        updated_at: now,
      })
      .eq("id", taskId);

    if (updateError) {
      console.error("Failed to reopen task:", updateError);
      return { success: false, error: updateError.message };
    }

    // Log reopen history
    const blockingTaskIds = blockingTasks.map((bt) => bt.blocking_task_id);
    const blockingTaskId = blockingTaskIds.length > 0 ? blockingTaskIds[0] : null;

    const { error: historyError } = await supabase
      .from("task_reopen_history")
      .insert({
        task_id: taskId,
        user_id: assignedTo,
        reopen_reason: "dependency_blocked",
        reopened_by: null, // System
        status_before: task.status,
        assigned_to_before: task.assigned_to,
        reason: `Auto-reopened: ${blockingTasks.length} blocking task(s) incomplete`,
        blocking_task_id: blockingTaskId,
      });

    if (historyError) {
      console.warn("Warning logging reopen history:", historyError.message);
    }

    // Create escalation event for manager
    const { error: eventError } = await supabase
      .from("escalation_events")
      .insert({
        event_type: "task_reopen",
        entity_type: "task",
        entity_id: taskId,
        user_id: assignedTo,
        escalation_level: 2,
        escalation_target_role: "manager",
        status: "pending",
        reason: `Task ${task.title} reopened due to blocked dependencies`,
        details: {
          blocking_tasks: blockingTasks.length,
          original_status: task.status,
          reason: "dependency_blocked",
        },
      });

    if (eventError) {
      console.warn("Warning creating escalation event:", eventError.message);
    }

    // Log audit
    await supabase.from("task_escalation_audit").insert({
      task_id: taskId,
      action: "reopened",
      triggered_by: null, // System
      reason: "Auto-reopen: blocked by incomplete dependencies",
      details: {
        blocking_tasks: blockingTasks.length,
      },
    });

    return {
      success: true,
      taskId,
      assignedTo,
      reason: "dependency_blocked",
      blockingTaskCount: blockingTasks.length,
    };
  } catch (err) {
    console.error("autoReopenBlockedTask error:", err);
    return { success: false, error: err.message };
  }
}

/**
 * Create task dependency
 */
async function createDependency(blockingTaskId, blockedTaskId, dependencyType, createdBy, reason) {
  try {
    const { data: dependency, error } = await supabase
      .from("task_dependencies")
      .insert({
        blocking_task_id: blockingTaskId,
        blocked_task_id: blockedTaskId,
        dependency_type: dependencyType,
        created_by: createdBy,
        reason: reason,
        is_active: true,
        status: "active",
      })
      .select()
      .single();

    if (error) {
      console.error("Failed to create dependency:", error);
      return { success: false, error: error.message };
    }

    return { success: true, dependency };
  } catch (err) {
    console.error("createDependency error:", err);
    return { success: false, error: err.message };
  }
}

/**
 * Resolve a task dependency
 */
async function resolveDependency(dependencyId, resolvedBy, resolutionNotes) {
  try {
    const now = new Date().toISOString();

    const { error } = await supabase
      .from("task_dependencies")
      .update({
        status: "resolved",
        resolved_at: now,
        resolved_by: resolvedBy,
        resolution_notes: resolutionNotes,
      })
      .eq("id", dependencyId);

    if (error) {
      console.error("Failed to resolve dependency:", error);
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (err) {
    console.error("resolveDependency error:", err);
    return { success: false, error: err.message };
  }
}

/**
 * Extend task due date
 */
async function extendTaskDueDate(taskId, newDueDate, extendedBy, extensionReason) {
  try {
    const now = new Date().toISOString();

    const { error } = await supabase
      .from("tasks")
      .update({
        due_date: newDueDate,
        updated_at: now,
      })
      .eq("id", taskId);

    if (error) {
      console.error("Failed to extend due date:", error);
      return { success: false, error: error.message };
    }

    // Log extension in audit
    await supabase.from("task_escalation_audit").insert({
      task_id: taskId,
      action: "extended",
      triggered_by: extendedBy,
      reason: extensionReason,
      details: { new_due_date: newDueDate },
    });

    return { success: true };
  } catch (err) {
    console.error("extendTaskDueDate error:", err);
    return { success: false, error: err.message };
  }
}

/**
 * Get overdue tasks for a user
 */
async function getOverdueTasks(userId) {
  try {
    const { data: tasks, error } = await supabase
      .from("tasks")
      .select(
        `id, title, status, due_date, assigned_to, created_at,
        task_overdue_tracking(escalation_level, status, days_overdue, level_1_triggered_at, level_2_triggered_at, level_3_triggered_at),
        task_dependencies(id, blocking_task_id, blocked_task_id, status)`
      )
      .eq("assigned_to", userId)
      .not("due_date", "is", null)
      .order("due_date", { ascending: true });

    if (error) {
      console.error("getOverdueTasks error:", error);
      return [];
    }

    return tasks || [];
  } catch (err) {
    console.error("getOverdueTasks exception:", err);
    return [];
  }
}

/**
 * Get task dependencies for a task
 */
async function getTaskDependencies(taskId) {
  try {
    // Get blocking tasks (tasks that block this one)
    const { data: blocking, error: blockingError } = await supabase
      .from("task_dependencies")
      .select(
        `id, blocking_task_id, blocked_task_id, dependency_type, status,
        blocking_task:blocking_task_id(id, title, status, assigned_to)`
      )
      .eq("blocked_task_id", taskId)
      .eq("is_active", true);

    // Get blocked tasks (tasks this one blocks)
    const { data: blocked, error: blockedError } = await supabase
      .from("task_dependencies")
      .select(
        `id, blocking_task_id, blocked_task_id, dependency_type, status,
        blocked_task:blocked_task_id(id, title, status, assigned_to)`
      )
      .eq("blocking_task_id", taskId)
      .eq("is_active", true);

    if (blockingError || blockedError) {
      console.error("getTaskDependencies error:", blockingError || blockedError);
      return { blocking: [], blocked: [] };
    }

    return {
      blocking: blocking || [],
      blocked: blocked || [],
    };
  } catch (err) {
    console.error("getTaskDependencies exception:", err);
    return { blocking: [], blocked: [] };
  }
}

module.exports = {
  loadTaskConfig,
  getDefaultTaskConfig,
  checkOverdueTasks,
  determineEscalationLevel,
  checkBlockingDependencies,
  applyEscalation,
  autoReopenBlockedTask,
  createDependency,
  resolveDependency,
  extendTaskDueDate,
  getOverdueTasks,
  getTaskDependencies,
};
