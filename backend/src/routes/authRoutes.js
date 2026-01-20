// backend/src/routes/authRoutes.js
const express = require('express');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const rateLimit = require('express-rate-limit');
const crypto = require('crypto');
const nodemailer = require('nodemailer');
const https = require('https');
const { URL } = require('url');
const supabase = require('../supabaseClient');

const router = express.Router();

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: 'Too many login attempts. Try again later.' }
});

const getMailer = () => {
  const host = process.env.SMTP_HOST;
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;
  if (!host || !user || !pass) return null;

  return nodemailer.createTransport({
    host,
    port: Number(process.env.SMTP_PORT || 587),
    secure: process.env.SMTP_SECURE === 'true',
    auth: { user, pass }
  });
};

const postJson = (url, headers, payload) =>
  new Promise((resolve, reject) => {
    const data = JSON.stringify(payload);
    const parsed = new URL(url);
    const req = https.request(
      {
        method: 'POST',
        hostname: parsed.hostname,
        path: `${parsed.pathname}${parsed.search}`,
        headers: {
          'Content-Type': 'application/json',
          'Content-Length': Buffer.byteLength(data),
          ...headers
        }
      },
      (res) => {
        let body = '';
        res.on('data', (chunk) => {
          body += chunk;
        });
        res.on('end', () => {
          resolve({ statusCode: res.statusCode, body });
        });
      }
    );

    req.on('error', reject);
    req.write(data);
    req.end();
  });

const sendResetEmail = async ({ to, resetUrl }) => {
  const resendKey = process.env.RESEND_API_KEY;
  const from =
    process.env.RESEND_FROM ||
    process.env.SMTP_FROM ||
    'onboarding@resend.dev';
  const subject = 'Reset your Offisphere password';
  const text = `Reset your password using this link: ${resetUrl}`;
  const html = `<p>Reset your password using this link:</p><p><a href="${resetUrl}">${resetUrl}</a></p>`;

  if (resendKey) {
    const payload = { from, to, subject, text, html };
    if (typeof fetch === 'function') {
      const response = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${resendKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Resend error: ${response.status} ${errorText}`);
      }
    } else {
      const { statusCode, body } = await postJson(
        'https://api.resend.com/emails',
        { Authorization: `Bearer ${resendKey}` },
        payload
      );
      if (statusCode < 200 || statusCode >= 300) {
        throw new Error(`Resend error: ${statusCode} ${body}`);
      }
    }

    return;
  }

  const mailer = getMailer();
  if (!mailer) {
    throw new Error('Email service not configured');
  }

  await mailer.sendMail({
    from,
    to,
    subject,
    text,
    html
  });
};

const buildResetToken = () => {
  const token = crypto.randomBytes(32).toString('hex');
  const hash = crypto.createHash('sha256').update(token).digest('hex');
  return { token, hash };
};

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
 * POST /api/auth/forgot
 * body: { email }
 * Sends reset link if user exists.
 */
router.post('/forgot', async (req, res) => {
  const { email } = req.body || {};
  if (!email) {
    return res.status(400).json({ message: 'Email is required' });
  }

  try {
    const normalizedEmail = String(email).trim().toLowerCase();
    const { data: users, error: userError } = await supabase
      .from('users')
      .select('id, email')
      .eq('email', normalizedEmail)
      .limit(1);

    if (userError) {
      console.error('Forgot password user lookup error:', userError);
      return res.status(500).json({ message: 'Unable to process request' });
    }

    if (!users || users.length === 0) {
      return res.json({ message: 'If the email exists, a reset link was sent.' });
    }

    const user = users[0];
    const { token, hash } = buildResetToken();
    const expiresAt = new Date(Date.now() + 1000 * 60 * 30).toISOString();

    const { error: insertError } = await supabase
      .from('password_resets')
      .insert([
        {
          user_id: user.id,
          token_hash: hash,
          expires_at: expiresAt
        }
      ]);

    if (insertError) {
      console.error('Forgot password insert error:', insertError);
      return res.status(500).json({ message: 'Unable to process request' });
    }

    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
    const resetUrl = `${frontendUrl}/reset-password?token=${token}`;
    await sendResetEmail({ to: user.email, resetUrl });

    return res.json({ message: 'If the email exists, a reset link was sent.' });
  } catch (err) {
    console.error('Forgot password catch error:', err);
    return res.status(500).json({ message: 'Unable to process request' });
  }
});

/**
 * POST /api/auth/reset
 * body: { token, password }
 */
router.post('/reset', async (req, res) => {
  const { token, password } = req.body || {};
  if (!token || !password) {
    return res.status(400).json({ message: 'Token and password are required' });
  }
  if (String(password).length < 8) {
    return res.status(400).json({ message: 'Password must be at least 8 characters' });
  }

  try {
    const hash = crypto.createHash('sha256').update(token).digest('hex');
    const nowIso = new Date().toISOString();

    const { data: resets, error: resetError } = await supabase
      .from('password_resets')
      .select('id, user_id, expires_at, used_at')
      .eq('token_hash', hash)
      .limit(1);

    if (resetError) {
      console.error('Reset lookup error:', resetError);
      return res.status(500).json({ message: 'Unable to reset password' });
    }

    const record = resets && resets[0];
    if (!record || record.used_at || record.expires_at <= nowIso) {
      return res.status(400).json({ message: 'Invalid or expired reset token' });
    }

    const password_hash = await bcrypt.hash(password, 10);
    const { error: updateError } = await supabase
      .from('users')
      .update({ password_hash })
      .eq('id', record.user_id);

    if (updateError) {
      console.error('Reset update error:', updateError);
      return res.status(500).json({ message: 'Unable to reset password' });
    }

    await supabase
      .from('password_resets')
      .update({ used_at: nowIso })
      .eq('id', record.id);

    return res.json({ message: 'Password updated' });
  } catch (err) {
    console.error('Reset catch error:', err);
    return res.status(500).json({ message: 'Unable to reset password' });
  }
});

/**
 * GET /api/auth/me
 * Returns current user from cookie-auth token
 */
router.get('/me', async (req, res) => {
  res.set('Cache-Control', 'no-store');
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
