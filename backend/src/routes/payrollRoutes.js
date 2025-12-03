// backend/src/routes/payrollRoutes.js

const express = require('express');
const supabase = require('../supabaseClient');
const { authenticate, authorize } = require('../middleware/authMiddleware');

const router = express.Router();

// helper – only admins/managers can manage payroll
function isAdminOrManager(user) {
  const roles = user?.roles || [];
  return roles.includes('admin') || roles.includes('manager');
}

/**
 * GET /api/payroll/runs
 * List payroll runs (latest first)
 */
router.get(
  '/runs',
  authenticate,
  authorize([]), // basic check; we'll filter in code
  async (req, res) => {
    try {
      // everyone can view; if you want restrict, check isAdminOrManager here
      const { data, error } = await supabase
        .from('payroll_runs')
        .select('*')
        .order('period_start', { ascending: false });

      if (error) {
        console.error('List payroll runs error:', error);
        return res
          .status(500)
          .json({ message: 'Error fetching payroll runs' });
      }

      res.json(data || []);
    } catch (err) {
      console.error('List payroll runs catch error:', err);
      res.status(500).json({ message: 'Error fetching payroll runs' });
    }
  }
);

/**
 * POST /api/payroll/runs
 * Create a new payroll run
 * body: { period_start, period_end }
 */
router.post(
  '/runs',
  authenticate,
  authorize([]), // we will enforce admin/manager in code
  async (req, res) => {
    try {
      if (!isAdminOrManager(req.user)) {
        return res
          .status(403)
          .json({ message: 'Only admins/managers can create payroll runs' });
      }

      const { period_start, period_end } = req.body;

      if (!period_start || !period_end) {
        return res
          .status(400)
          .json({ message: 'period_start and period_end are required' });
      }

      const { data, error } = await supabase
        .from('payroll_runs')
        .insert([
          {
            period_start,
            period_end,
            status: 'draft',
            created_by: req.user.id || null
          }
        ])
        .select()
        .single();

      if (error) {
        console.error('Create payroll run error:', error);
        return res
          .status(500)
          .json({ message: 'Error creating payroll run' });
      }

      res.status(201).json(data);
    } catch (err) {
      console.error('Create payroll run catch error:', err);
      res.status(500).json({ message: 'Error creating payroll run' });
    }
  }
);

/**
 * GET /api/payroll/runs/:id
 * Get single run with items
 */
router.get(
  '/runs/:id',
  authenticate,
  authorize([]),
  async (req, res) => {
    try {
      const { id } = req.params;

      const { data: run, error: runError } = await supabase
        .from('payroll_runs')
        .select('*')
        .eq('id', id)
        .single();

      if (runError) {
        console.error('Get payroll run error:', runError);
        return res.status(404).json({ message: 'Payroll run not found' });
      }

      const { data: items, error: itemsError } = await supabase
        .from('payroll_items')
        .select(
          `
          id,
          user_id,
          base_salary,
          bonus,
          deductions,
          net_pay,
          status,
          created_at,
          users!payroll_items_user_id_fkey(full_name, email)
        `
        )
        .eq('run_id', id);

      if (itemsError) {
        console.error('Get payroll items error:', itemsError);
        return res
          .status(500)
          .json({ message: 'Error fetching payroll items' });
      }

      const mappedItems = (items || []).map((it) => ({
        ...it,
        user_name: it.users?.full_name || null,
        user_email: it.users?.email || null
      }));

      res.json({ run, items: mappedItems });
    } catch (err) {
      console.error('Get payroll run catch error:', err);
      res.status(500).json({ message: 'Error fetching payroll run' });
    }
  }
);

module.exports = router;
