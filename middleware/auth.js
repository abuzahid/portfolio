const crypto = require('crypto');
const rateLimit = require('express-rate-limit');
const config = require('../config');

function requireAuth(req, res, next) {
  if (req.session && req.session.isAdmin) {
    return next();
  }
  res.redirect('/admin/login');
}

function login(req, res) {
  const { password } = req.body;

  // Constant-time comparison to prevent timing attacks
  const input = Buffer.from(password || '');
  const stored = Buffer.from(config.adminPassword);

  const maxLen = Math.max(input.length, stored.length);
  const a = Buffer.alloc(maxLen);
  const b = Buffer.alloc(maxLen);
  input.copy(a);
  stored.copy(b);

  if (input.length === stored.length && crypto.timingSafeEqual(a, b)) {
    req.session.isAdmin = true;
    return res.redirect('/admin/dashboard');
  }

  res.render('admin/login', { error: 'Invalid password' });
}

function logout(req, res) {
  req.session.destroy(() => {
    res.redirect('/admin/login');
  });
}

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10,
  message: 'Too many login attempts. Please try again later.',
});

module.exports = { requireAuth, login, logout, loginLimiter };
