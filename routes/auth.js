const express = require('express');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const rateLimit = require('express-rate-limit');
const User = require('../models/User');
const { getNextId } = require('../utils/counter');
const { verifyTurnstile } = require('../utils/turnstile');
const { checkUsername, aiCheckExisting } = require('../utils/nameCheck');

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
    { expiresIn: '30d' }
  );
}

function setAuthCookie(res, token) {
  res.cookie('token', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 30 * 24 * 60 * 60 * 1000,
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

    username = username.trim();

    if (!username || !password)
      return res.status(400).json({ error: 'All fields required' });

    if (username.length < 4 || username.length > 32)
      return res.status(400).json({ error: 'Username must be 4-32 characters' });

    if (!USERNAME_REGEX.test(username))
      return res.status(400).json({ error: 'Username: only Latin letters, digits, _ - .' });

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

    username = username.trim();

    if (!username || !password)
      return res.status(400).json({ error: 'All fields required' });

    const okCaptcha = await verifyTurnstile(turnstileToken, getIp(req));
    if (!okCaptcha) return res.status(400).json({ error: 'Captcha verification failed' });

    const user = await User.findOne({ usernameLower: username.toLowerCase() });
    if (!user) return res.status(401).json({ error: 'Invalid credentials' });

    const ok = await bcrypt.compare(password, user.passwordHash);
    if (!ok) return res.status(401).json({ error: 'Invalid credentials' });

    if (user.banned) {
      const token = signToken(user);
      setAuthCookie(res, token);
      return res.status(403).json({
        error: 'banned',
        banReason: user.banReason,
        username: user.username,
        userId: user.userId
      });
    }

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

router.get('/ban-info', async (req, res) => {
  try {
    const token = req.cookies.token;
    if (!token) return res.status(401).json({ error: 'Unauthorized' });
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(payload.uid).lean();
    if (!user) return res.status(404).json({ error: 'Not found' });
    if (!user.banned) return res.status(400).json({ error: 'Not banned' });
    res.json({
      userId: user.userId,
      username: user.username,
      banReason: user.banReason,
      bannedAt: user.bannedAt
    });
  } catch {
    res.status(401).json({ error: 'Unauthorized' });
  }
});

router.post('/change-username', authLimiter, async (req, res) => {
  try {
    const token = req.cookies.token;
    if (!token) return res.status(401).json({ error: 'Unauthorized' });
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(payload.uid);
    if (!user) return res.status(404).json({ error: 'Not found' });

    let { newUsername, turnstileToken } = req.body || {};
    if (typeof newUsername !== 'string')
      return res.status(400).json({ error: 'Invalid input' });

    newUsername = newUsername.trim();

    if (newUsername.length < 4 || newUsername.length > 32)
      return res.status(400).json({ error: 'Username must be 4-32 characters' });
    if (!USERNAME_REGEX.test(newUsername))
      return res.status(400).json({ error: 'Username: only Latin letters, digits, _ - .' });

    const okCaptcha = await verifyTurnstile(turnstileToken, getIp(req));
    if (!okCaptcha) return res.status(400).json({ error: 'Captcha verification failed' });

    const newLower = newUsername.toLowerCase();
    if (newLower !== user.usernameLower) {
      const exists = await User.findOne({ usernameLower: newLower }).lean();
      if (exists) return res.status(409).json({ error: 'Username already taken' });
    }

    const nameCheck = await checkUsername(newUsername);
    if (!nameCheck.ok) return res.status(400).json({ error: nameCheck.reason });

    user.username = newUsername;
    user.usernameLower = newLower;
    user.banned = false;
    user.banReason = '';
    user.bannedAt = null;
    user.tokenVersion = (user.tokenVersion || 0) + 1;
    await user.save();

    const newToken = signToken(user);
    setAuthCookie(res, newToken);

    res.json({ ok: true, user: { userId: user.userId, username: user.username } });
  } catch (err) {
    console.error('[CHANGE-USERNAME]', err);
    res.status(500).json({ error: 'Server error' });
  }
});

router.post('/refuse-rename', async (req, res) => {
  try {
    const token = req.cookies.token;
    if (!token) return res.status(401).json({ error: 'Unauthorized' });
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(payload.uid);
    if (!user) return res.status(404).json({ error: 'Not found' });
    if (!user.banned) return res.status(400).json({ error: 'Not banned' });

    const { detectAlts } = require('../utils/altDetector');
    const { alts } = await detectAlts(user.toObject());

    let bannedAlts = 0;
    for (const alt of alts) {
      if (alt.banned) continue;
      await User.updateOne(
        { userId: alt.userId },
        {
          $set: {
            banned: true,
            banReason: `[ALT-BAN] AI-detected alt of banned #${user.userId} (${user.username}). Confidence: ${(alt.aiConfidence || 0).toFixed(2)}. ${alt.aiReason || alt.reasons.join('; ')}`,
            bannedAt: new Date()
          },
          $inc: { tokenVersion: 1 }
        }
      );
      bannedAlts++;
    }

    user.pendingDeletion = true;
    user.deletionScheduledAt = new Date(Date.now() + 24 * 60 * 60 * 1000);
    user.tokenVersion = (user.tokenVersion || 0) + 1;
    await user.save();

    res.clearCookie('token', { path: '/' });
    res.json({
      ok: true,
      altsBanned: bannedAlts,
      message: 'Account scheduled for deletion. All AI-detected alt accounts have been banned.'
    });
  } catch (err) {
    console.error('[REFUSE-RENAME]', err);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;