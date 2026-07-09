const express = require('express');
const { authRequired } = require('../middleware/auth');
const User = require('../models/User');
const { detectAlts } = require('../utils/altDetector');

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

router.get('/:id(\\d+)/alts', authRequired, async (req, res) => {
  try {
    if (req.user.userId !== 1 && req.user.userId !== 2)
      return res.status(403).json({ error: 'Forbidden' });

    const id = parseInt(req.params.id, 10);
    const { target, alts } = await detectAlts(id);
    if (!target) return res.status(404).json({ error: 'Not found' });

    res.json({
      target: { userId: target.userId, username: target.username },
      altsCount: alts.length,
      alts: alts.map(a => ({
        userId: a.userId,
        username: a.username,
        createdAt: a.createdAt,
        banned: a.banned,
        confidence: a.aiConfidence || null,
        heuristicScore: a.score,
        reason: a.aiReason || a.reasons.join('; ')
      }))
    });
  } catch (err) {
    console.error('[ALTS]', err);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;