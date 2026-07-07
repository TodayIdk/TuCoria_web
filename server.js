require('dotenv').config();
const path = require('path');
const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const cookieParser = require('cookie-parser');
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
      scriptSrc: ["'self'"],
      connectSrc: ["'self'"]
    }
  },
  crossOriginResourcePolicy: { policy: "same-origin" }
}));

app.use('/api/auth', authRoutes);
app.use('/api/user', userRoutes);

app.use(express.static(path.join(__dirname, 'public')));

app.get('/', (req, res) => res.sendFile(path.join(__dirname, 'public/pages/auth.html')));
app.get('/home', (req, res) => res.sendFile(path.join(__dirname, 'public/pages/home.html')));
app.get('/auth', (req, res) => res.sendFile(path.join(__dirname, 'public/pages/auth.html')));
app.get('/profile/:id(\\d+)', (req, res) => res.sendFile(path.join(__dirname, 'public/pages/profile.html')));

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
    await coll.updateMany({ email: { $exists: true } }, { $unset: { email: '' } });

    const User = require('./models/User');
    const users = await User.find({ usernameLower: { $exists: false } });
    for (const u of users) {
      u.usernameLower = u.username.toLowerCase();
      await u.save();
    }
    if (users.length) console.log(`[DB] Backfilled usernameLower for ${users.length} users`);

    await User.syncIndexes();
    console.log('[DB] Indexes synced');
  } catch (err) {
    console.error('[DB] fixOldIndexes error:', err.message);
  }
}

connectDB().then(async () => {
  await fixOldIndexes();
  const PORT = process.env.PORT || 3000;
  app.listen(PORT, () => console.log(`[Server] http://localhost:${PORT}`));
});