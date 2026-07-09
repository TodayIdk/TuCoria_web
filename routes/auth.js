const express = require('express');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const rateLimit = require('express-rate-limit');
const User = require('../models/User');
const { getNextId } = require('../utils/counter');
const { verifyTurnstile } = require('../utils/turnstile');
const { checkUsername, aiCheckExisting } = require('../utils/nameCheck');
const GameSession = require('../models/GameSession');

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

    const now = Date.now();
    if (user.banned && user.banExpiresAt && new Date(user.banExpiresAt).getTime() <= now) {
      await User.updateOne(
        { _id: user._id },
        { $set: { banned: false, banType: '', banReason: '', banMessage: '', banExpiresAt: null } }
      );
      return res.json({ expired: true });
    }

    if (!user.banned) return res.status(400).json({ error: 'Not banned' });

    res.json({
      userId: user.userId,
      username: user.username,
      banType: user.banType,
      banReason: user.banReason,
      banMessage: user.banMessage,
      bannedAt: user.bannedAt,
      banExpiresAt: user.banExpiresAt,
      severity: user.banSeverity,
      canAppeal: user.banType !== 'permanent'
    });
  } catch {
    res.status(401).json({ error: 'Unauthorized' });
  }
});

router.post('/acknowledge-ban', async (req, res) => {
  try {
    const token = req.cookies.token;
    if (!token) return res.status(401).json({ error: 'Unauthorized' });
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(payload.uid);
    if (!user) return res.status(404).json({ error: 'Not found' });

    const now = Date.now();
    if (user.banned && user.banExpiresAt && new Date(user.banExpiresAt).getTime() <= now) {
      user.banned = false;
      user.banType = '';
      user.banReason = '';
      user.banMessage = '';
      user.banExpiresAt = null;
      await user.save();
      return res.json({ ok: true, unbanned: true });
    }

    res.clearCookie('token', { path: '/' });
    res.json({ ok: true, loggedOut: true });
  } catch {
    res.status(500).json({ error: 'Server error' });
  }
});


router.get('/rename-check/:username', async (req, res) => {
  try {
    const q = req.params.username.toLowerCase();
    const user = await User.findOne({
      $or: [
        { usernameLower: q },
        { previousUsername: { $regex: new RegExp('^' + q + '$', 'i') } }
      ]
    }).lean();
    if (!user || user.banType !== 'auto_renamed') return res.json({ renamed: false });
    if (user.previousUsername && user.previousUsername.toLowerCase() === q) {
      return res.json({ renamed: true, oldName: user.previousUsername, newName: user.username });
    }
    res.json({ renamed: false });
  } catch { res.json({ renamed: false }); }
});


// Game client creates a session token
router.post('/game-session', async (req, res) => {
  try {
    const { token } = req.body;
    if (!token || typeof token !== 'string' || token.length < 16 || token.length > 128)
      return res.status(400).json({ error: 'Invalid token' });

    // Delete old if exists
    await GameSession.deleteMany({ token });

    await GameSession.create({ token, status: 'pending' });
    res.json({ ok: true });
  } catch (err) {
    console.error('[GAME-SESSION]', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// Game client polls this to check if authorized
router.get('/game-check', async (req, res) => {
  try {
    const { token } = req.query;
    if (!token) return res.status(400).json({ error: 'No token' });

    const session = await GameSession.findOne({ token });
    if (!session) return res.json({ status: 'expired' });

    if (session.status === 'authorized') {
      // Clean up
      await GameSession.deleteOne({ token });
      return res.json({
        status: 'authorized',
        userId: session.userId,
        username: session.username
      });
    }

    res.json({ status: 'pending' });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

// User authorizes game session (from browser, must be logged in)
router.post('/game-authorize', authLimiter, async (req, res) => {
  try {
    const { token } = req.body;
    if (!token) return res.status(400).json({ error: 'No token' });

    // Get user from cookie
    const cookieToken = req.cookies.token;
    if (!cookieToken) return res.status(401).json({ error: 'Not logged in' });

    let payload;
    try {
      payload = jwt.verify(cookieToken, process.env.JWT_SECRET);
    } catch {
      return res.status(401).json({ error: 'Invalid session' });
    }

    const user = await User.findById(payload.uid);
    if (!user || user.tokenVersion !== payload.tv)
      return res.status(401).json({ error: 'Invalid session' });

    if (user.banned)
      return res.status(403).json({ error: 'Account banned' });

    const session = await GameSession.findOne({ token, status: 'pending' });
    if (!session)
      return res.status(404).json({ error: 'Session not found or expired' });

    session.status = 'authorized';
    session.userId = user.userId;
    session.username = user.username;
    await session.save();

    res.json({ ok: true, username: user.username });
  } catch (err) {
    console.error('[GAME-AUTH]', err);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;