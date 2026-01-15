// backend/src/routes/authRoutes.js
const express = require('express');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const rateLimit = require('express-rate-limit');
const supabase = require('../supabaseClient');

const router = express.Router();

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: 'Too many login attempts. Try again later.' }
});

/**
 * POST /api/auth/login
 * body: { email, password }
 */
router.post('/login', loginLimiter, async (req, res) => {
  const { email, password, remember = true } = req.body;

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
      { expiresIn: '100d' }
    );

    const isProd = process.env.NODE_ENV === 'production';
    const cookieOptions = {
      httpOnly: true,
      secure: isProd,
      sameSite: isProd ? 'none' : 'lax'
    };

    if (remember) {
      cookieOptions.maxAge = 1000 * 60 * 60 * 24 * 100;
    }

    res.cookie('offisphere_token', token, cookieOptions);

    return res.json({
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

/**
 * GET /api/auth/me
 * Returns current user from cookie-auth token
 */
router.get('/me', async (req, res) => {
  const authHeader = req.headers.authorization || '';
  let token = authHeader.startsWith('Bearer ')
    ? authHeader.slice(7)
    : null;

  if (!token && req.cookies?.offisphere_token) {
    token = req.cookies.offisphere_token;
  }

  if (!token) {
    return res.status(401).json({ message: 'No token provided' });
  }

  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    const { data: user, error } = await supabase
      .from('users')
      .select('id, full_name, email, roles')
      .eq('id', payload.id)
      .single();

    if (error || !user) {
      return res.status(401).json({ message: 'Invalid user' });
    }

    return res.json({
      user: {
        id: user.id,
        full_name: user.full_name,
        email: user.email,
        roles: Array.isArray(user.roles) ? user.roles : []
      }
    });
  } catch (err) {
    console.error('Auth me error:', err);
    return res.status(401).json({ message: 'Invalid or expired token' });
  }
});

/**
 * POST /api/auth/logout
 * Clears auth cookie
 */
router.post('/logout', (req, res) => {
  const isProd = process.env.NODE_ENV === 'production';
  res.clearCookie('offisphere_token', {
    httpOnly: true,
    secure: isProd,
    sameSite: isProd ? 'none' : 'lax'
  });
  res.json({ message: 'Logged out' });
});

module.exports = router;
