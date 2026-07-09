const express = require('express');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const rateLimit = require('express-rate-limit');
const User = require('../models/User');
const { getNextId } = require('../utils/counter');
const { verifyTurnstile } = require('../utils/turnstile');
const { checkUsername } = require('../utils/nameCheck');

const router = express.Router();

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 30,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many requests, try later' }
});

const USERNAME_REGEX = /^[a-zA-Z0-9_\-\.]{4,32}$/;

function signToken(user) {
  return jwt.sign(
    { uid: user._id.toString(), tv: user.tokenVersion },
    process.env.JWT_SECRET,
    { expiresIn: '7d' }
  );
}

function setAuthCookie(res, token) {
  res.cookie('token', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 7 * 24 * 60 * 60 * 1000,
    path: '/'
  });
}

function getIp(req) {
  return req.headers['cf-connecting-ip'] ||
         req.headers['x-forwarded-for']?.split(',')[0].trim() ||
         req.ip;
}

router.get('/config', (req, res) => {
  res.json({ turnstileSiteKey: process.env.TURNSTILE_SITE_KEY || null });
});

router.post('/register', authLimiter, async (req, res) => {
  try {
    let { username, password, turnstileToken } = req.body || {};

    if (typeof username !== 'string' || typeof password !== 'string')
      return res.status(400).json({ error: 'All fields required' });

    username = username.normalize('NFC').trim();
    password = password;

    if (!username || !password)
      return res.status(400).json({ error: 'All fields required' });

    if (username.length < 4 || username.length > 32)
      return res.status(400).json({ error: 'Username must be 4-32 characters' });

    if (!USERNAME_REGEX.test(username))
      return res.status(400).json({ error: 'Username: only Latin letters, digits, _ - .' });
    
    if (/\s/.test(username))
      return res.status(400).json({ error: 'No spaces allowed in username' });

    if (password.length < 8 || password.length > 100)
      return res.status(400).json({ error: 'Password must be 8-100 chars' });

    const okCaptcha = await verifyTurnstile(turnstileToken, getIp(req));
    if (!okCaptcha) return res.status(400).json({ error: 'Captcha verification failed' });

    const usernameLower = username.toLowerCase();
    const exists = await User.findOne({ usernameLower }).lean();
    if (exists) return res.status(409).json({ error: 'Username already taken' });

    const nameCheck = await checkUsername(username);
    if (!nameCheck.ok) return res.status(400).json({ error: nameCheck.reason || 'Username not allowed' });

    const passwordHash = await bcrypt.hash(password, 12);
    const userId = await getNextId('userId');

    let user;
    try {
      user = await User.create({ userId, username, usernameLower, passwordHash });
    } catch (err) {
      if (err && err.code === 11000)
        return res.status(409).json({ error: 'Username already taken' });
      throw err;
    }

    const token = signToken(user);
    setAuthCookie(res, token);

    res.json({ ok: true, user: { userId: user.userId, username: user.username } });
  } catch (err) {
    console.error('[REGISTER]', err);
    res.status(500).json({ error: 'Server error' });
  }
});

router.post('/login', authLimiter, async (req, res) => {
  try {
    let { username, password, turnstileToken } = req.body || {};

    if (typeof username !== 'string' || typeof password !== 'string')
      return res.status(400).json({ error: 'All fields required' });

    if (!username || !password)
      return res.status(400).json({ error: 'All fields required' });

    const okCaptcha = await verifyTurnstile(turnstileToken, getIp(req));
    if (!okCaptcha) return res.status(400).json({ error: 'Captcha verification failed' });

    const user = await User.findOne({ usernameLower: username.toLowerCase() });
    if (!user) return res.status(401).json({ error: 'Invalid credentials' });

    const ok = await bcrypt.compare(password, user.passwordHash);
    if (!ok) return res.status(401).json({ error: 'Invalid credentials' });

    user.lastLogin = new Date();
    await user.save();

    const token = signToken(user);
    setAuthCookie(res, token);

    res.json({ ok: true, user: { userId: user.userId, username: user.username } });
  } catch (err) {
    console.error('[LOGIN]', err);
    res.status(500).json({ error: 'Server error' });
  }
});

router.post('/logout', (req, res) => {
  res.clearCookie('token', { path: '/' });
  res.json({ ok: true });
});

module.exports = router;