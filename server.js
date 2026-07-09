require('dotenv').config();
const path = require('path');
const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');
const connectDB = require('./config/db');

const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/user');

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

function hasValidCookie(req) {
  try {
    if (!req.cookies.token) return false;
    jwt.verify(req.cookies.token, process.env.JWT_SECRET);
    return true;
  } catch { return false; }
}

app.get('/', (req, res) => {
  if (hasValidCookie(req)) return res.redirect('/home');
  res.redirect('/auth');
});

app.get('/auth', (req, res) => {
  if (hasValidCookie(req)) return res.redirect('/home');
  res.sendFile(path.join(__dirname, 'public/pages/auth.html'));
});

app.get('/home', (req, res) => {
  if (!hasValidCookie(req)) return res.redirect('/auth');
  res.sendFile(path.join(__dirname, 'public/pages/home.html'));
});

app.get('/ban', (req, res) => {
  res.sendFile(path.join(__dirname, 'public/pages/ban.html'));
});

app.get('/rules', (req, res) => {
  res.sendFile(path.join(__dirname, 'public/pages/rules.html'));
});

app.get('/profile/:id(\\d+)', (req, res) => {
  res.sendFile(path.join(__dirname, 'public/pages/profile.html'));
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
    const User = require('./models/User');
    await User.syncIndexes();
  } catch (err) {
    console.error('[DB] fixOldIndexes:', err.message);
  }
}

connectDB().then(async () => {
  await fixOldIndexes();
  const PORT = process.env.PORT || 3000;
  app.listen(PORT, () => console.log(`[Server] http://localhost:${PORT}`));
});