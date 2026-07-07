const express = require('express');
const { authRequired } = require('../middleware/auth');
const User = require('../models/User');

const router = express.Router();

router.get('/me', authRequired, (req, res) => {
  const u = req.user;
  res.json({
    userId: u.userId,
    username: u.username,
    createdAt: u.createdAt,
    lastLogin: u.lastLogin
  });
});

router.get('/:id(\\d+)', async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    if (!Number.isFinite(id) || id < 1)
      return res.status(400).json({ error: 'Invalid id' });

    const user = await User.findOne({ userId: id }).select('userId username createdAt lastLogin');
    if (!user) return res.status(404).json({ error: 'User not found' });

    res.json({
      userId: user.userId,
      username: user.username,
      createdAt: user.createdAt,
      lastLogin: user.lastLogin
    });
  } catch {
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;