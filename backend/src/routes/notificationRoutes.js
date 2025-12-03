// backend/src/routes/notificationRoutes.js

const express = require('express');
const supabase = require('../supabaseClient');
const { authenticate } = require('../middleware/authMiddleware');

const router = express.Router();

/**
 * GET /api/notifications
 * Fetch notifications for logged-in user
 */
router.get('/', authenticate, async (req, res) => {
  try {
    const userId = req.user.id;

    const { data, error } = await supabase
      .from('notifications')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Fetch notifications error:', error);
      return res.status(500).json({ message: 'Failed to fetch notifications' });
    }

    res.json(data || []);
  } catch (err) {
    console.error('Fetch notifications crash:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

/**
 * POST /api/notifications
 * Used internally to create notifications
 */
router.post('/', authenticate, async (req, res) => {
  try {
    const { user_id, title, message, type } = req.body;

    if (!user_id || !title || !message || !type) {
      return res.status(400).json({ message: 'Missing required fields' });
    }

    const { error } = await supabase.from('notifications').insert([
      { user_id, title, message, type }
    ]);

    if (error) {
      console.error('Create notification error:', error);
      return res.status(500).json({ message: 'Failed to create notification' });
    }

    res.json({ success: true });
  } catch (err) {
    console.error('Create notification crash:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

/**
 * PATCH /api/notifications/:id/read
 */
router.patch('/:id/read', authenticate, async (req, res) => {
  try {
    const { id } = req.params;

    const { error } = await supabase
      .from('notifications')
      .update({ is_read: true })
      .eq('id', id);

    if (error) {
      console.error('Mark read error:', error);
      return res.status(500).json({ message: 'Failed to mark as read' });
    }

    res.json({ success: true });
  } catch (err) {
    console.error('Mark read crash:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
