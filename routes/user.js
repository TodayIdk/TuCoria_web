const express = require('express');
const { authRequired } = require('../middleware/auth');

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

module.exports = router;