// backend/src/routes/leadRoutes.js

const express = require('express');
const supabase = require('../supabaseClient');
const { authenticate, authorize } = require('../middleware/authMiddleware');

const router = express.Router();

/**
 * Helper: check if user is admin or manager
 */
function isAdminOrManager(user) {
  const roles = user?.roles || [];
  return roles.includes('admin') || roles.includes('manager');
}

/**
 * GET /api/leads
 * - Admin/Manager: see all leads
 * - Others: only leads they own (owner_id = user.id)
 * Optional query params:
 *   ?status=new|contacted|qualified|proposal|won|lost|all
 */
router.get('/', authenticate, authorize([]), async (req, res) => {
  try {
    const { status } = req.query;
    const user = req.user;
    const adminManager = isAdminOrManager(user);

    let query = supabase
      .from('leads')
      .select(
        `
        id,
        name,
        email,
        phone,
        company,
        source,
        status,
        owner_id,
        expected_value,
        currency,
        created_at,
        updated_at,
        users!leads_owner_id_fkey(full_name)
      `
      )
      .order('created_at', { ascending: false });

    if (!adminManager) {
      query = query.eq('owner_id', user.id);
    }

    if (status && status !== 'all') {
      query = query.eq('status', status);
    }

    const { data, error } = await query;

    if (error) {
      console.error('List leads error:', error);
      return res.status(500).json({ message: 'Error fetching leads' });
    }

    const rows = (data || []).map((row) => ({
      ...row,
      owner_name: row.users?.full_name || ''
    }));

    res.json(rows);
  } catch (err) {
    console.error('List leads catch error:', err);
    res.status(500).json({ message: 'Error fetching leads' });
  }
});

/**
 * POST /api/leads
 * Any logged-in user can create a lead
 * Owner is current user unless owner_id is provided (for admins)
 */
router.post('/', authenticate, authorize([]), async (req, res) => {
  try {
    const user = req.user;
    const {
      name,
      email,
      phone,
      company,
      source,
      status,
      expected_value,
      currency,
      owner_id
    } = req.body;

    if (!name) {
      return res.status(400).json({ message: 'Lead name is required' });
    }

    const adminManager = isAdminOrManager(user);

    const insertPayload = {
      name,
      email: email || null,
      phone: phone || null,
      company: company || null,
      source: source || null,
      status: status || 'new',
      expected_value:
        expected_value !== undefined && expected_value !== null
          ? expected_value
          : null,
      currency: currency || 'INR',
      owner_id: adminManager && owner_id ? owner_id : user.id
    };

    const { error: insertError } = await supabase
      .from('leads')
      .insert([insertPayload], { returning: 'minimal' });

    if (insertError) {
      console.error('Create lead error:', insertError);
      return res.status(500).json({ message: 'Error creating lead' });
    }

    // Notification to owner
    const ownerId = insertPayload.owner_id;
    if (ownerId) {
      const { error: notifError } = await supabase.from('notifications').insert(
        [
          {
            user_id: ownerId,
            title: 'New lead assigned',
            message: `Lead "${name}" has been added to your pipeline.`,
            type: 'system'
          }
        ],
        { returning: 'minimal' }
      );
      if (notifError) {
        console.error('Lead notify error:', notifError);
      }
    }

    // Return updated list for this user
    const adminReload = adminManager;
    let reloadQuery = supabase
      .from('leads')
      .select(
        `
        id,
        name,
        email,
        phone,
        company,
        source,
        status,
        owner_id,
        expected_value,
        currency,
        created_at,
        updated_at,
        users!leads_owner_id_fkey(full_name)
      `
      )
      .order('created_at', { ascending: false });

    if (!adminReload) {
      reloadQuery = reloadQuery.eq('owner_id', user.id);
    }

    const { data: list, error: listError } = await reloadQuery;

    if (listError) {
      console.error('Reload leads error:', listError);
      return res.json([]);
    }

    const rows = (list || []).map((row) => ({
      ...row,
      owner_name: row.users?.full_name || ''
    }));

    res.status(201).json(rows);
  } catch (err) {
    console.error('Create lead catch error:', err);
    res.status(500).json({ message: 'Error creating lead' });
  }
});

/**
 * PUT /api/leads/:id
 * Admin/Manager can update any lead
 */
router.put(
  '/:id',
  authenticate,
  authorize(['admin', 'manager']),
  async (req, res) => {
    try {
      const { id } = req.params;
      const {
        name,
        email,
        phone,
        company,
        source,
        status,
        expected_value,
        currency,
        owner_id
      } = req.body;

      const updatePayload = {
        updated_at: new Date().toISOString()
      };

      if (name !== undefined) updatePayload.name = name;
      if (email !== undefined) updatePayload.email = email || null;
      if (phone !== undefined) updatePayload.phone = phone || null;
      if (company !== undefined) updatePayload.company = company || null;
      if (source !== undefined) updatePayload.source = source || null;
      if (status !== undefined) updatePayload.status = status;
      if (expected_value !== undefined)
        updatePayload.expected_value =
          expected_value !== null ? expected_value : null;
      if (currency !== undefined) updatePayload.currency = currency || 'INR';
      if (owner_id !== undefined) updatePayload.owner_id = owner_id || null;

      const { error: updateError } = await supabase
        .from('leads')
        .update(updatePayload)
        .eq('id', id);

      if (updateError) {
        console.error('Update lead error:', updateError);
        return res.status(500).json({ message: 'Error updating lead' });
      }

      // If status is updated to won/lost, notify owner
      if (status && ['won', 'lost'].includes(status)) {
        // Fetch lead with owner
        const { data: leadData, error: leadError } = await supabase
          .from('leads')
          .select('name, owner_id')
          .eq('id', id)
          .single();

        if (!leadError && leadData?.owner_id) {
          const { error: notifError } = await supabase
            .from('notifications')
            .insert(
              [
                {
                  user_id: leadData.owner_id,
                  title:
                    status === 'won'
                      ? 'Lead won 🎉'
                      : 'Lead lost',
                  message:
                    status === 'won'
                      ? `Lead "${leadData.name}" has been marked as WON.`
                      : `Lead "${leadData.name}" has been marked as LOST.`,
                  type: 'system'
                }
              ],
              { returning: 'minimal' }
            );
          if (notifError) {
            console.error('Lead status notify error:', notifError);
          }
        }
      }

      const { data, error } = await supabase
        .from('leads')
        .select(
          `
          id,
          name,
          email,
          phone,
          company,
          source,
          status,
          owner_id,
          expected_value,
          currency,
          created_at,
          updated_at,
          users!leads_owner_id_fkey(full_name)
        `
        )
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Reload leads error:', error);
        return res.json([]);
      }

      const rows = (data || []).map((row) => ({
        ...row,
        owner_name: row.users?.full_name || ''
      }));

      res.json(rows);
    } catch (err) {
      console.error('Update lead catch error:', err);
      res.status(500).json({ message: 'Error updating lead' });
    }
  }
);

module.exports = router;
