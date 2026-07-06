const express = require('express');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const rateLimit = require('express-rate-limit');
const User = require('../models/User');

const router = express.Router();

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many requests, try later' }
});

const USERNAME_REGEX = /^[a-zA-Z0-9_]{3,20}$/;

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

router.post('/register', authLimiter, async (req, res) => {
  try {
    let { username, password } = req.body || {};
    if (!username || !password)
      return res.status(400).json({ error: 'All fields required' });

    username = String(username).trim();
    password = String(password);

    if (!USERNAME_REGEX.test(username))
      return res.status(400).json({ error: 'Invalid username (3-20, a-z0-9_)' });
    if (password.length < 8 || password.length > 100)
      return res.status(400).json({ error: 'Password 8-100 chars' });

    const exists = await User.findOne({ username });
    if (exists) return res.status(409).json({ error: 'Username already taken' });

    const passwordHash = await bcrypt.hash(password, 12);
    const user = await User.create({ username, passwordHash });

    const token = signToken(user);
    setAuthCookie(res, token);

    res.json({ ok: true, user: { userId: user.userId, username: user.username } });
  } catch (err) {
    if (err.code === 11000)
      return res.status(409).json({ error: 'Username already taken' });
    res.status(500).json({ error: 'Server error' });
  }
});

router.post('/login', authLimiter, async (req, res) => {
  try {
    let { username, password } = req.body || {};
    if (!username || !password)
      return res.status(400).json({ error: 'All fields required' });

    username = String(username).trim();
    password = String(password);

    const user = await User.findOne({ username });
    if (!user) return res.status(401).json({ error: 'Invalid credentials' });

    const ok = await bcrypt.compare(password, user.passwordHash);
    if (!ok) return res.status(401).json({ error: 'Invalid credentials' });

    user.lastLogin = new Date();
    await user.save();

    const token = signToken(user);
    setAuthCookie(res, token);

    res.json({ ok: true, user: { userId: user.userId, username: user.username } });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

router.post('/logout', async (req, res) => {
  res.clearCookie('token', { path: '/' });
  res.json({ ok: true });
});

module.exports = router;