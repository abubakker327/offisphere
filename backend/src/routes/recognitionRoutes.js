// backend/src/routes/recognitionRoutes.js

const express = require('express');
const supabase = require('../supabaseClient');
const { authenticate, authorize } = require('../middleware/authMiddleware');

const router = express.Router();

/**
 * GET /api/recognitions
 * List recent recognitions (latest first)
 */
router.get(
  '/',
  authenticate,
  authorize([]),
  async (req, res) => {
    try {
      const { data, error } = await supabase
        .from('recognitions')
        .select(
          `
          id,
          title,
          message,
          badge,
          created_at,
          giver:users!recognitions_giver_id_fkey (full_name, email),
          receiver:users!recognitions_receiver_id_fkey (full_name, email)
        `
        )
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) {
        console.error('List recognitions error:', error);
        return res
          .status(500)
          .json({ message: 'Error fetching recognitions' });
      }

      const mapped = (data || []).map((r) => ({
        id: r.id,
        title: r.title,
        message: r.message,
        badge: r.badge,
        created_at: r.created_at,
        giver_name: r.giver?.full_name || null,
        giver_email: r.giver?.email || null,
        receiver_name: r.receiver?.full_name || null,
        receiver_email: r.receiver?.email || null
      }));

      res.json(mapped);
    } catch (err) {
      console.error('List recognitions catch error:', err);
      res.status(500).json({ message: 'Error fetching recognitions' });
    }
  }
);

/**
 * POST /api/recognitions
 * body: { receiver_email, title, message, badge }
 */
router.post(
  '/',
  authenticate,
  authorize([]),
  async (req, res) => {
    try {
      const { receiver_email, title, message, badge } = req.body;

      if (!receiver_email || !title) {
        return res.status(400).json({
          message: 'receiver_email and title are required'
        });
      }

      // find receiver user by email
      const { data: receiver, error: receiverError } = await supabase
        .from('users')
        .select('id, email, full_name')
        .ilike('email', receiver_email)
        .single();

      if (receiverError || !receiver) {
        console.error('Find receiver error:', receiverError);
        return res
          .status(404)
          .json({ message: 'Receiver user not found for that email' });
      }

      const giverId = req.user?.id || null;

      const { data, error } = await supabase
        .from('recognitions')
        .insert([
          {
            giver_id: giverId,
            receiver_id: receiver.id,
            title,
            message: message || '',
            badge: badge || null
          }
        ])
        .select(
          `
          id,
          title,
          message,
          badge,
          created_at,
          giver:users!recognitions_giver_id_fkey (full_name, email),
          receiver:users!recognitions_receiver_id_fkey (full_name, email)
        `
        )
        .single();

      if (error) {
        console.error('Create recognition error:', error);
        return res
          .status(500)
          .json({ message: 'Error creating recognition' });
      }

      const mapped = {
        id: data.id,
        title: data.title,
        message: data.message,
        badge: data.badge,
        created_at: data.created_at,
        giver_name: data.giver?.full_name || null,
        giver_email: data.giver?.email || null,
        receiver_name: data.receiver?.full_name || null,
        receiver_email: data.receiver?.email || null
      };

      res.status(201).json(mapped);
    } catch (err) {
      console.error('Create recognition catch error:', err);
      res.status(500).json({ message: 'Error creating recognition' });
    }
  }
);

module.exports = router;
