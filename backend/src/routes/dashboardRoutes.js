// backend/src/routes/dashboardRoutes.js
const express = require("express");
const supabase = require("../supabaseClient");
const { authenticate, authorize } = require("../middleware/authMiddleware");

const router = express.Router();

/**
 * Helper: get map userId -> full_name/email
 */
async function buildUsersMap(userIds) {
  if (!userIds || userIds.length === 0) return {};
  const uniqueIds = Array.from(new Set(userIds));

  const { data: users, error } = await supabase
    .from("users")
    .select("id, full_name, email")
    .in("id", uniqueIds);

  if (error) {
    console.error("buildUsersMap error:", error);
    return {};
  }

  const map = {};
  (users || []).forEach((u) => {
    map[u.id] = u.full_name || u.email || "";
  });
  return map;
}

/**
 * GET /api/dashboard/summary
 */
router.get(
  "/summary",
  authenticate,
  authorize([]), // any logged-in user
  async (req, res) => {
    try {
      // Today boundaries for created_at-based filters
      const now = new Date();
      const startOfDay = new Date(
        now.getFullYear(),
        now.getMonth(),
        now.getDate(),
      ).toISOString();
      const endOfDay = new Date(
        now.getFullYear(),
        now.getMonth(),
        now.getDate() + 1,
      ).toISOString();

      const todayStr = now.toISOString().slice(0, 10); // YYYY-MM-DD

      const [
        // LEAVES: your table is "leaves"
        { data: leaveRows, error: leaveError },

        // ATTENDANCE TODAY: column is "attendance_date"
        { data: attendanceTodayRows, error: attTodayError },

        // RECENT ATTENDANCE
        { data: recentAttRows, error: recentAttError },

        // USERS
        { data: userRows, error: usersError },

        // TIMESHEETS TODAY
        { data: timesheetRows, error: tsError },

        // TASKS
        { data: taskRows, error: tasksError },

        // DEVICES
        { data: deviceRows, error: devError },

        // DOCUMENTS
        { data: docRows, error: docsError },

        // USER ROLES
        { data: userRoleRows, error: userRolesError },
      ] = await Promise.all([
        // Leaves – we assume columns: status, leave_type, total_days
        supabase.from("leaves").select("id, status, leave_type, total_days"),

        // Attendance today
        supabase
          .from("attendance")
          .select("id, user_id, attendance_date, check_in, check_out, status")
          .eq("attendance_date", todayStr),

        // Recent attendance (last 5)
        supabase
          .from("attendance")
          .select(
            "id, user_id, attendance_date, check_in, check_out, status, created_at",
          )
          .order("created_at", { ascending: false })
          .limit(5),

        // Users
        supabase.from("users").select("id, is_active"),

        // Timesheets today – filter by created_at
        supabase
          .from("timesheets")
          .select("id, hours, created_at")
          .gte("created_at", startOfDay)
          .lt("created_at", endOfDay),

        // Tasks
        supabase.from("tasks").select("id, status, due_date"),

        // Devices
        supabase.from("devices").select("id, status, assigned_to"),

        // Documents
        supabase.from("documents").select("id"),

        // User roles – schema-safe
        supabase.from("user_roles").select("user_id"),
      ]);

      if (
        leaveError ||
        attTodayError ||
        recentAttError ||
        usersError ||
        tsError ||
        tasksError ||
        devError ||
        docsError ||
        userRolesError
      ) {
        console.error("Dashboard summary errors:", {
          leaveError,
          attTodayError,
          recentAttError,
          usersError,
          tsError,
          tasksError,
          devError,
          docsError,
          userRolesError,
        });
        return res
          .status(500)
          .json({ message: "Error fetching dashboard summary" });
      }

      // ---- Leaves metrics ----
      const leaves = leaveRows || [];
      const leavesPending = leaves.filter((l) => l.status === "pending").length;
      const leavesApproved = leaves.filter(
        (l) => l.status === "approved",
      ).length;
      const leavesRejected = leaves.filter(
        (l) => l.status === "rejected",
      ).length;

      // Leave summary by type (approved only)
      const leaveSummary = {
        cl_days: 0,
        sl_days: 0,
        el_days: 0,
        lop_days: 0,
      };

      leaves.forEach((l) => {
        if (l.status !== "approved") return;
        const days = Number(l.total_days) || 0;
        const t = (l.leave_type || "").toLowerCase();

        if (t === "cl" || t === "casual") {
          leaveSummary.cl_days += days;
        } else if (t === "sl" || t === "sick") {
          leaveSummary.sl_days += days;
        } else if (t === "el" || t === "earned") {
          leaveSummary.el_days += days;
        } else if (t === "lop" || t === "loss_of_pay") {
          leaveSummary.lop_days += days;
        }
      });

      // ---- Attendance metrics ----
      const attendanceToday = attendanceTodayRows || [];
      const checkinsToday = attendanceToday.length;

      const users = userRows || [];
      const totalUsers = users.length;
      const activeUsers = users.filter((u) => u.is_active !== false).length;

      // ---- Roles metrics (approx: users that have any role)
      const userRoles = userRoleRows || [];
      const adminUserIds = new Set(userRoles.map((r) => r.user_id));
      const adminCount = adminUserIds.size;

      // ---- Timesheet metrics ----
      const timesheets = timesheetRows || [];
      let totalHoursToday = 0;
      timesheets.forEach((t) => {
        const hrs = parseFloat(t.hours);
        if (!isNaN(hrs)) totalHoursToday += hrs;
      });

      // ---- Task metrics ----
      const tasks = taskRows || [];
      const tasksOpen = tasks.filter((t) => t.status === "pending").length;
      const tasksInProgress = tasks.filter(
        (t) => t.status === "in_progress",
      ).length;
      const tasksCompleted = tasks.filter(
        (t) => t.status === "completed",
      ).length;

      const todayDateOnly = new Date(todayStr);
      const tasksOverdue = tasks.filter((t) => {
        if (!t.due_date) return false;
        if (t.status === "completed") return false;
        const due = new Date(t.due_date);
        return due < todayDateOnly;
      }).length;

      // ---- Device metrics ----
      const devices = deviceRows || [];
      const devicesTotal = devices.length;
      const devicesAssigned = devices.filter((d) => d.assigned_to).length;
      const devicesAvailable = devices.filter(
        (d) => d.status === "available",
      ).length;

      // ---- Document metrics ----
      const documents = docRows || [];
      const documentsTotal = documents.length;

      // ---- Recent attendance with employee names ----
      const recentAttendanceRaw = recentAttRows || [];
      const userIdsForRecent = recentAttendanceRaw
        .map((r) => r.user_id)
        .filter(Boolean);

      const usersMap = await buildUsersMap(userIdsForRecent);

      const recentAttendance = recentAttendanceRaw.map((r) => ({
        id: r.id,
        employee_name: usersMap[r.user_id] || "",
        date: r.attendance_date,
        check_in: r.check_in,
        check_out: r.check_out,
        status: r.status,
      }));

      const summary = {
        leaves: {
          pending: leavesPending,
          approved: leavesApproved,
          rejected: leavesRejected,
        },
        leave_summary: leaveSummary,
        attendance: {
          checkins_today: checkinsToday,
          total_users: totalUsers,
        },
        users: {
          total: totalUsers,
          active: activeUsers,
          admins: adminCount,
        },
        timesheets: {
          entries_today: timesheets.length,
          hours_today: totalHoursToday,
        },
        tasks: {
          open: tasksOpen,
          in_progress: tasksInProgress,
          completed: tasksCompleted,
          overdue: tasksOverdue,
        },
        devices: {
          total: devicesTotal,
          assigned: devicesAssigned,
          available: devicesAvailable,
        },
        documents: {
          total: documentsTotal,
        },
        recent_attendance: recentAttendance,
      };

      res.json(summary);
    } catch (err) {
      console.error("Dashboard summary catch error:", err);
      res.status(500).json({ message: "Error fetching dashboard summary" });
    }
  },
);

module.exports = router;
