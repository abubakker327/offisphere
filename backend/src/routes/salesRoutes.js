// backend/src/routes/salesRoutes.js

const express = require('express');
const supabase = require('../supabaseClient');
const { authenticate, authorize } = require('../middleware/authMiddleware');

const router = express.Router();

function isAdminOrManager(user) {
  const roles = user?.roles || [];
  return roles.includes('admin') || roles.includes('manager');
}

/**
 * GET /api/sales/summary
 * Sales overview (pipeline, revenue, win rate, recent leads/payments)
 */
router.get(
  '/summary',
  authenticate,
  authorize([]), // allow all logged-in for now; change to ['admin','manager'] if you want to restrict
  async (req, res) => {
    try {
      // 1) Load all leads (for aggregates) – only select existing columns
      const { data: leadsData, error: leadsError } = await supabase
        .from('leads')
        .select('id, stage, expected_value, created_at');

      if (leadsError) {
        console.error('Sales summary leads error:', leadsError);
        return res.status(500).json({ message: 'Error loading leads for sales summary' });
      }

      // 2) Load all payments (for aggregates)
      const { data: paymentsData, error: paymentsError } = await supabase
        .from('payments')
        .select('id, amount, currency, status, paid_at, created_at');

      if (paymentsError) {
        console.error('Sales summary payments error:', paymentsError);
        return res.status(500).json({ message: 'Error loading payments for sales summary' });
      }

      // 3) Recent leads
      const { data: recentLeads, error: recentLeadsError } = await supabase
        .from('leads')
        .select('id, name, status, expected_value, currency, created_at')
        .order('created_at', { ascending: false })
        .limit(5);

      if (recentLeadsError) {
        console.error('Sales summary recent leads error:', recentLeadsError);
      }

      // 4) Recent payments with lead names
      const { data: recentPaymentsRaw, error: recentPaymentsError } = await supabase
        .from('payments')
        .select(
          `
          id,
          amount,
          currency,
          status,
          paid_at,
          created_at,
          reference_type,
          reference_id
        `
        )
        .order('paid_at', { ascending: false, nullsFirst: false })
        .limit(5);

      if (recentPaymentsError) {
        console.error('Sales summary recent payments error:', recentPaymentsError);
      }

      const leadIds = (recentPaymentsRaw || [])
        .filter((p) => p.reference_type === 'lead' && p.reference_id)
        .map((p) => p.reference_id);
      const { data: leadRows } = leadIds.length
        ? await supabase
            .from('leads')
            .select('id, name')
            .in('id', leadIds)
        : { data: [] };
      const leadMap = (leadRows || []).reduce((acc, row) => {
        acc[row.id] = row.name;
        return acc;
      }, {});

      const recentPayments = (recentPaymentsRaw || []).map((p) => ({
        id: p.id,
        amount: p.amount,
        currency: p.currency,
        status: p.status,
        paid_at: p.paid_at,
        created_at: p.created_at,
        lead_name:
          p.reference_type === 'lead' ? leadMap[p.reference_id] || null : null
      }));

      // ---- Aggregations in JS ----
      const leads = leadsData || [];
      const payments = paymentsData || [];

      const totalLeads = leads.length;

      // Pipeline value: treat Hot/Warm as active, Cold as lost
      let totalPipelineValue = 0;
      let totalWonValue = 0; // no explicit "won" stage currently
      let wonCount = 0;
      let lostCount = 0;
      const leadsByStatus = {};

      for (const lead of leads) {
        const val = Number(lead.expected_value || 0);
        const stage = (lead.stage || '').toLowerCase();

        leadsByStatus[stage] = (leadsByStatus[stage] || 0) + 1;

        if (stage !== 'cold') {
          totalPipelineValue += val;
        } else {
          lostCount += 1;
        }
      }

      const winRate =
        wonCount + lostCount === 0
          ? 0
          : Math.round((wonCount / (wonCount + lostCount)) * 100);

      let totalPaymentsReceived = 0;
      const paymentsByStatus = {};

      for (const p of payments) {
        const val = Number(p.amount || 0);
        const status = p.status || 'received';

        paymentsByStatus[status] = (paymentsByStatus[status] || 0) + 1;

        if (status === 'received') {
          totalPaymentsReceived += val;
        }
      }

      const summary = {
        totals: {
          totalLeads,
          totalPipelineValue,
          totalWonValue,
          totalPaymentsReceived,
          winRate
        },
        leadsByStatus,
        paymentsByStatus,
        recentLeads: recentLeads || [],
        recentPayments
      };

      res.json(summary);
    } catch (err) {
      console.error('Sales summary catch error:', err);
      res.status(500).json({ message: 'Error building sales summary' });
    }
  }
);

module.exports = router;
