require('dotenv').config();
const path = require('path');
const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');
const connectDB = require('./config/db');
const User = require('./models/User');

const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/user');
const { startModerator } = require('./utils/moderator');

const app = express();
app.set('trust proxy', 1);

app.use(express.json({ limit: '10kb' }));
app.use(cookieParser());
app.use(cors({ origin: true, credentials: true }));

app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "https://fonts.googleapis.com", "'unsafe-inline'"],
      fontSrc: ["'self'", "https://fonts.gstatic.com"],
      imgSrc: ["'self'", "data:"],
      scriptSrc: ["'self'", "https://challenges.cloudflare.com"],
      frameSrc: ["'self'", "https://challenges.cloudflare.com"],
      connectSrc: ["'self'", "https://challenges.cloudflare.com"]
    }
  },
  crossOriginResourcePolicy: { policy: "same-origin" }
}));

app.use('/api/auth', authRoutes);
app.use('/api/user', userRoutes);

async function getUserFromCookie(req) {
  try {
    if (!req.cookies.token) return null;
    const payload = jwt.verify(req.cookies.token, process.env.JWT_SECRET);
    const user = await User.findById(payload.uid);
    if (!user || user.tokenVersion !== payload.tv) return null;

    if (user.banned && user.banExpiresAt && new Date(user.banExpiresAt).getTime() <= Date.now()) {
      user.banned = false;
      user.banType = '';
      user.banReason = '';
      user.banMessage = '';
      user.banExpiresAt = null;
      await user.save();
    }
    return user.toObject();
  } catch { return null; }
}

async function pageGuard(req, res, next) {
  const user = await getUserFromCookie(req);
  req._pageUser = user;
  next();
}

app.get('/', pageGuard, (req, res) => {
  const u = req._pageUser;
  if (!u) return res.redirect('/auth');
  if (u.banned) return res.redirect('/ban');
  return res.redirect('/home');
});

app.get('/auth', pageGuard, (req, res) => {
  const u = req._pageUser;
  if (u && u.banned) return res.redirect('/ban');
  if (u) return res.redirect('/home');
  res.sendFile(path.join(__dirname, 'public/pages/auth.html'));
});

app.get('/home', pageGuard, (req, res) => {
  const u = req._pageUser;
  if (!u) return res.redirect('/auth');
  if (u.banned) return res.redirect('/ban');
  res.sendFile(path.join(__dirname, 'public/pages/home.html'));
});

app.get('/profile/:id(\\d+)', pageGuard, (req, res) => {
  const u = req._pageUser;
  if (u && u.banned) return res.redirect('/ban');
  res.sendFile(path.join(__dirname, 'public/pages/profile.html'));
});

app.get('/rules', pageGuard, (req, res) => {
  const u = req._pageUser;
  if (u && u.banned) return res.redirect('/ban');
  res.sendFile(path.join(__dirname, 'public/pages/rules.html'));
});

app.get('/ban', async (req, res) => {
  const u = await getUserFromCookie(req);
  if (!u) return res.redirect('/auth');
  if (!u.banned) return res.redirect('/home');
  res.sendFile(path.join(__dirname, 'public/pages/ban.html'));
});

app.use(express.static(path.join(__dirname, 'public')));

app.use((req, res) => res.status(404).json({ error: 'Not found' }));

async function fixOldIndexes() {
  try {
    const coll = mongoose.connection.collection('users');
    const indexes = await coll.indexes();
    for (const idx of indexes) {
      if (idx.name === 'email_1') {
        await coll.dropIndex('email_1');
        console.log('[DB] Dropped old email_1 index');
      }
    }
    await User.syncIndexes();
  } catch (err) {
    console.error('[DB] fixOldIndexes:', err.message);
  }
}

async function cleanupPendingDeletions() {
  try {
    const now = new Date();
    const res = await User.deleteMany({
      pendingDeletion: true,
      deletionScheduledAt: { $lte: now }
    });
    if (res.deletedCount) console.log(`[MOD] Deleted ${res.deletedCount} pending accounts`);
  } catch (e) { console.error('[MOD] cleanup:', e.message); }
}

connectDB().then(async () => {
  await fixOldIndexes();
  const PORT = process.env.PORT || 3000;
  app.listen(PORT, () => console.log(`[Server] http://localhost:${PORT}`));

  if (process.env.MODERATOR_ENABLED !== 'false') {
    startModerator();
  }
  setInterval(cleanupPendingDeletions, 10 * 60 * 1000);
});