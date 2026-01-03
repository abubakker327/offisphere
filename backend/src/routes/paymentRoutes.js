// backend/src/routes/paymentRoutes.js

const express = require('express');
const supabase = require('../supabaseClient');
const { authenticate, authorize } = require('../middleware/authMiddleware');

const router = express.Router();

function isAdminOrManager(user) {
  const roles = user?.roles || [];
  return roles.includes('admin') || roles.includes('manager');
}

const toNumericLeadId = (value) => {
  if (value === null || value === undefined || value === '') return null;
  const num = Number(value);
  return Number.isNaN(num) ? null : num;
};

/**
 * GET /api/payments
 * Admin/Manager: all payments
 * Others: only payments recorded by them (user_id)
 * Optional: ?status=pending|received|failed|refunded|all
 */
router.get('/', authenticate, authorize([]), async (req, res) => {
  try {
    const { status } = req.query;
    const user = req.user;
    const adminManager = isAdminOrManager(user);

    let query = supabase
      .from('payments')
      .select('*')
      .order('created_at', { ascending: false });

    if (!adminManager) {
      query = query.eq('user_id', user.id);
    }

    if (status && status !== 'all') {
      query = query.eq('status', status);
    }

    const { data, error } = await query;

    if (error) {
      console.error('List payments error:', error);
      return res.status(500).json({ message: 'Error fetching payments' });
    }

    // Return raw payments without joining lead/user names
    res.json(data || []);
  } catch (err) {
    console.error('List payments catch error:', err);
    res.status(500).json({ message: 'Error fetching payments' });
  }
});

/**
 * POST /api/payments
 * Any logged-in user can record a payment
 */
router.post('/', authenticate, authorize([]), async (req, res) => {
  try {
    const user = req.user;
    const {
      lead_id,
      amount,
      currency,
      status,
      method,
      reference,
      notes,
      paid_at
    } = req.body;

    if (!amount) {
      return res
        .status(400)
        .json({ message: 'Amount is required for payment' });
    }

    const insertPayload = {
      lead_id: toNumericLeadId(lead_id),
      user_id: user.id,
      amount,
      currency: currency || 'INR',
      status: status || 'received',
      method: method || null,
      reference: reference || null,
      notes: notes || null,
      paid_at: paid_at || new Date().toISOString()
    };

    const { error: insertError } = await supabase
      .from('payments')
      .insert([insertPayload], { returning: 'minimal' });

    if (insertError) {
      console.error('Create payment error:', insertError);
      return res.status(500).json({ message: 'Error recording payment' });
    }

    // Reload list for user / admin
    const adminManager = isAdminOrManager(user);
    let reloadQuery = supabase
      .from('payments')
      .select('*')
      .order('created_at', { ascending: false });

    if (!adminManager) {
      reloadQuery = reloadQuery.eq('user_id', user.id);
    }

    const { data: list, error: listError } = await reloadQuery;

    if (listError) {
      console.error('Reload payments error:', listError);
      return res.json([]);
    }

    res.status(201).json(list || []);
  } catch (err) {
    console.error('Create payment catch error:', err);
    res.status(500).json({ message: 'Error recording payment' });
  }
});

/**
 * PUT /api/payments/:id
 * Admin/Manager can adjust status / notes / reference / method / paid_at
 */
router.put(
  '/:id',
  authenticate,
  authorize(['admin', 'manager']),
  async (req, res) => {
    try {
      const { id } = req.params;
      const { status, notes, reference, method, paid_at } = req.body;

      const updatePayload = {};

      if (status !== undefined) updatePayload.status = status;
      if (notes !== undefined) updatePayload.notes = notes || null;
      if (reference !== undefined) updatePayload.reference = reference || null;
      if (method !== undefined) updatePayload.method = method || null;
      if (paid_at !== undefined)
        updatePayload.paid_at = paid_at || new Date().toISOString();

      const { error: updateError } = await supabase
        .from('payments')
        .update(updatePayload)
        .eq('id', id);

      if (updateError) {
        console.error('Update payment error:', updateError);
        return res.status(500).json({ message: 'Error updating payment' });
      }

      const { data, error } = await supabase
        .from('payments')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Reload payments error:', error);
        return res.json([]);
      }

      res.json(data || []);
    } catch (err) {
      console.error('Update payment catch error:', err);
      res.status(500).json({ message: 'Error updating payment' });
    }
  }
);

module.exports = router;
