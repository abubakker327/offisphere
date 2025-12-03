// backend/src/routes/userRoutes.js
const express = require('express');
const bcrypt = require('bcrypt');
const supabase = require('../supabaseClient');
const { authenticate, authorize } = require('../middleware/authMiddleware');

const router = express.Router();

/**
 * Helper: get users with roles from users.roles column
 */
async function fetchUsersWithRoles() {
  const { data: users, error: usersError } = await supabase
    .from('users')
    .select('id, full_name, email, is_active, created_at, roles')
    .order('created_at', { ascending: false });

  if (usersError) {
    console.error('fetchUsersWithRoles usersError:', usersError);
    throw usersError;
  }

  return (users || []).map((u) => {
    let roles = Array.isArray(u.roles) ? u.roles : [];

    // Ensure seed admin always has admin role
    if (roles.length === 0 && u.email === 'admin@offisphere.local') {
      roles = ['admin'];
    }

    return {
      id: u.id,
      full_name: u.full_name,
      email: u.email,
      is_active:
        typeof u.is_active === 'boolean' ? u.is_active : true,
      created_at: u.created_at || null,
      roles
    };
  });
}

/**
 * GET /api/users
 * Admin only
 */
router.get(
  '/',
  authenticate,
  authorize(['admin']),
  async (req, res) => {
    try {
      const users = await fetchUsersWithRoles();
      res.json(users);
    } catch (err) {
      console.error('List users error:', err);
      res.status(500).json({
        message: err.message || 'Error fetching users'
      });
    }
  }
);

/**
 * POST /api/users
 * Admin creates user
 * body: { full_name, email, password, roles: [] }
 */
router.post(
  '/',
  authenticate,
  authorize(['admin']),
  async (req, res) => {
    const { full_name, email, password, roles = [] } = req.body;

    if (!full_name || !email || !password) {
      return res.status(400).json({
        message: 'full_name, email and password are required'
      });
    }

    try {
      const password_hash = await bcrypt.hash(password, 10);

      const cleanRoles = Array.isArray(roles) ? roles : [];
      const { error: userError } = await supabase
        .from('users')
        .insert({
          full_name,
          email,
          password_hash,
          is_active: true,
          roles: cleanRoles
        });

      if (userError) {
        console.error('Create user error:', userError);
        return res.status(400).json({
          message:
            userError.message || 'Error creating user (users insert)'
        });
      }

      const users = await fetchUsersWithRoles();
      res.status(201).json(users);
    } catch (err) {
      console.error('Create user catch error:', err);
      res.status(500).json({
        message: err.message || 'Error creating user'
      });
    }
  }
);

/**
 * PUT /api/users/:id
 * Admin updates profile + roles
 */
router.put(
  '/:id',
  authenticate,
  authorize(['admin']),
  async (req, res) => {
    const userId = req.params.id;
    const { full_name, email, is_active, roles = [] } = req.body;

    try {
      const updateData = {};
      if (full_name !== undefined) updateData.full_name = full_name;
      if (email !== undefined) updateData.email = email;
      if (is_active !== undefined) updateData.is_active = is_active;
      updateData.roles = Array.isArray(roles) ? roles : [];

      const { error: updateError } = await supabase
        .from('users')
        .update(updateData)
        .eq('id', userId);

      if (updateError) {
        console.error('Update user error:', updateError);
        return res.status(400).json({
          message:
            updateError.message || 'Error updating user (users update)'
        });
      }

      const users = await fetchUsersWithRoles();
      res.json(users);
    } catch (err) {
      console.error('Update user catch error:', err);
      res.status(500).json({
        message: err.message || 'Error updating user'
      });
    }
  }
);

/**
 * DELETE /api/users/:id
 * Admin deletes user
 */
router.delete(
  '/:id',
  authenticate,
  authorize(['admin']),
  async (req, res) => {
    const userId = req.params.id;

    try {
      const { error } = await supabase
        .from('users')
        .delete()
        .eq('id', userId);

      if (error) {
        console.error('Delete user error:', error);
        return res.status(400).json({
          message:
            error.message || 'Error deleting user (users delete)'
        });
      }

      const users = await fetchUsersWithRoles();
      res.json(users);
    } catch (err) {
      console.error('Delete user catch error:', err);
      res.status(500).json({
        message: err.message || 'Error deleting user'
      });
    }
  }
);

module.exports = router;
