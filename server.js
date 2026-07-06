require('dotenv').config();
const path = require('path');
const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const connectDB = require('./config/db');

const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/user');

const app = express();

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
  }
}));
app.use(cors({ origin: true, credentials: true }));
app.use(express.json({ limit: '10kb' }));
app.use(cookieParser());

app.use('/api/auth', authRoutes);
app.use('/api/user', userRoutes);

app.use(express.static(path.join(__dirname, 'public')));

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public/pages/auth.html'));
});
app.get('/home', (req, res) => {
  res.sendFile(path.join(__dirname, 'public/pages/home.html'));
});
app.get('/auth', (req, res) => {
  res.sendFile(path.join(__dirname, 'public/pages/auth.html'));
});

app.use((req, res) => res.status(404).json({ error: 'Not found' }));

connectDB().then(() => {
  const PORT = process.env.PORT || 3000;
  app.listen(PORT, () => console.log(`[Server] http://localhost:${PORT}`));
});