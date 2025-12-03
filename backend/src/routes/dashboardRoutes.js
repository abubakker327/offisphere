// backend/src/routes/dashboardRoutes.js
const express = require('express');
const supabase = require('../supabaseClient');
const { authenticate } = require('../middleware/authMiddleware');

const router = express.Router();

/**
 * GET /api/dashboard/summary
 */
router.get('/summary', authenticate, async (req, res) => {
  try {
    // Users count
    const { count: usersCount, error: usersError } = await supabase
      .from('users')
      .select('*', { count: 'exact', head: true });

    if (usersError) throw usersError;

    // Leaves summary
    const { data: leaves, error: leavesError } = await supabase
      .from('leaves')
      .select('status');

    if (leavesError) throw leavesError;

    const pending =
      leaves?.filter((l) => l.status === 'pending').length || 0;
    const approved =
      leaves?.filter((l) => l.status === 'approved').length || 0;

    // Attendance today
    const today = new Date().toISOString().slice(0, 10);
    const {
      count: attendanceToday,
      error: attendanceError
    } = await supabase
      .from('attendance')
      .select('*', { count: 'exact', head: true })
      .eq('attendance_date', today);

    if (attendanceError) throw attendanceError;

    res.json({
      users: usersCount || 0,
      leaves: { pending, approved },
      attendanceToday: attendanceToday || 0
    });
  } catch (err) {
    console.error('Dashboard summary error:', err);
    res
      .status(500)
      .json({ message: 'Failed to load dashboard summary' });
  }
});

module.exports = router;
