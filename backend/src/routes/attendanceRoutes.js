// backend/src/routes/attendanceRoutes.js
const express = require('express');
const supabase = require('../supabaseClient');
const { authenticate, authorize } = require('../middleware/authMiddleware');

const router = express.Router();

/**
 * Helper: attach full_name to attendance rows
 */
async function attachUserNames(records) {
  if (!records || records.length === 0) return [];

  const userIds = [...new Set(records.map((r) => r.user_id))];

  const { data: users, error } = await supabase
    .from('users')
    .select('id, full_name')
    .in('id', userIds);

  if (error) {
    console.error('Attendance users error:', error);
    return records;
  }

  const map = {};
  (users || []).forEach((u) => {
    map[u.id] = u.full_name || u.email || '';
  });

  return records.map((r) => ({
    ...r,
    full_name: map[r.user_id] || '',
    employee_name: map[r.user_id] || '',
    user_name: map[r.user_id] || ''
  }));
}

/**
 * GET /api/attendance
 * - admin/manager: all records
 * - employee: their own records only
 */
router.get('/', authenticate, authorize([]), async (req, res) => {
  const userId = req.user.id;
  const roles = req.user.roles || [];
  const isAdminOrManager =
    roles.includes('admin') || roles.includes('manager');

  try {
    let query = supabase
      .from('attendance')
      .select(
        'id, user_id, attendance_date, check_in, check_out, status, created_at'
      )
      .order('attendance_date', { ascending: false })
      .order('created_at', { ascending: false });

    if (!isAdminOrManager) {
      query = query.eq('user_id', userId);
    }

    const { data, error } = await query;

    if (error) {
      console.error('List attendance error:', error);
      return res.status(500).json({ message: 'Error fetching attendance' });
    }

    const enriched = await attachUserNames(data || []);
    res.json(enriched);
  } catch (err) {
    console.error('List attendance catch error:', err);
    res.status(500).json({ message: 'Error fetching attendance' });
  }
});

/**
 * POST /api/attendance/check-in
 */
router.post(
  '/check-in',
  authenticate,
  authorize([]),
  async (req, res) => {
    const userId = req.user.id;
    const today = new Date().toISOString().slice(0, 10);
    const now = new Date().toISOString();

    try {
      // Check if already have a record for today
      const { data: existing, error: existingError } = await supabase
        .from('attendance')
        .select('id, check_in')
        .eq('user_id', userId)
        .eq('attendance_date', today)
        .limit(1);

      if (existingError) {
        console.error('Check-in existing error:', existingError);
        return res.status(500).json({ message: 'Check-in failed' });
      }

      if (existing && existing.length > 0 && existing[0].check_in) {
        return res
          .status(400)
          .json({ message: 'You have already checked in today' });
      }

      let response;
      if (existing && existing.length > 0) {
        // Update existing record
        const { error: updateError } = await supabase
          .from('attendance')
          .update({ check_in: now, status: 'present' })
          .eq('id', existing[0].id);

        if (updateError) {
          console.error('Check-in update error:', updateError);
          return res.status(500).json({ message: 'Check-in failed' });
        }
        response = existing[0];
      } else {
        const { data: insertData, error: insertError } = await supabase
          .from('attendance')
          .insert({
            user_id: userId,
            attendance_date: today,
            check_in: now,
            status: 'present'
          })
          .select('*')
          .single();

        if (insertError) {
          console.error('Check-in insert error:', insertError);
          return res.status(500).json({ message: 'Check-in failed' });
        }
        response = insertData;
      }

      res.json({ message: 'Check-in recorded', record: response });
    } catch (err) {
      console.error('Check-in catch error:', err);
      res.status(500).json({ message: 'Check-in failed' });
    }
  }
);

/**
 * POST /api/attendance/check-out
 */
router.post(
  '/check-out',
  authenticate,
  authorize([]),
  async (req, res) => {
    const userId = req.user.id;
    const today = new Date().toISOString().slice(0, 10);
    const now = new Date().toISOString();

    try {
      const { data: existing, error: existingError } = await supabase
        .from('attendance')
        .select('id, check_out')
        .eq('user_id', userId)
        .eq('attendance_date', today)
        .limit(1);

      if (existingError) {
        console.error('Check-out existing error:', existingError);
        return res.status(500).json({ message: 'Check-out failed' });
      }

      if (!existing || existing.length === 0) {
        return res
          .status(400)
          .json({ message: 'You have not checked in today' });
      }

      if (existing[0].check_out) {
        return res
          .status(400)
          .json({ message: 'You have already checked out today' });
      }

      const { error: updateError } = await supabase
        .from('attendance')
        .update({ check_out: now })
        .eq('id', existing[0].id);

      if (updateError) {
        console.error('Check-out update error:', updateError);
        return res.status(500).json({ message: 'Check-out failed' });
      }

      res.json({ message: 'Check-out recorded' });
    } catch (err) {
      console.error('Check-out catch error:', err);
      res.status(500).json({ message: 'Check-out failed' });
    }
  }
);

module.exports = router;
