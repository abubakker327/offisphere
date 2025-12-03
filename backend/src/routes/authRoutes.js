// backend/src/routes/authRoutes.js
const express = require('express');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const supabase = require('../supabaseClient');

const router = express.Router();

/**
 * POST /api/auth/login
 * body: { email, password }
 */
router.post('/login', async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res
      .status(400)
      .json({ message: 'Email and password are required' });
  }

  try {
    // Get user with roles from users table
    const { data: users, error: userError } = await supabase
      .from('users')
      .select('id, full_name, email, password_hash, roles')
      .eq('email', email)
      .limit(1);

    if (userError) {
      console.error('Login userError:', userError);
      return res.status(500).json({ message: 'Login failed' });
    }

    if (!users || users.length === 0) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const user = users[0];

    if (!user.password_hash) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    // Check password
    let isMatch = false;
    try {
      isMatch = await bcrypt.compare(password, user.password_hash);
    } catch (err) {
      console.error('bcrypt compare error:', err);
    }

    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    // Roles from users.roles column
    let roles = Array.isArray(user.roles) ? user.roles : [];

    // Fallback: seeded admin
    if (roles.length === 0 && email === 'admin@offisphere.local') {
      roles = ['admin'];
    }

    const token = jwt.sign(
      { id: user.id, roles },
      process.env.JWT_SECRET,
      { expiresIn: '1d' }
    );

    return res.json({
      token,
      user: {
        id: user.id,
        full_name: user.full_name,
        email: user.email,
        roles
      }
    });
  } catch (err) {
    console.error('Login catch error:', err);
    return res.status(500).json({ message: 'Login failed' });
  }
});

module.exports = router;
