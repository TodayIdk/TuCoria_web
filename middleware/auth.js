const jwt = require('jsonwebtoken');
const User = require('../models/User');

async function authRequired(req, res, next) {
  try {
    const token = req.cookies.token;
    if (!token) return res.status(401).json({ error: 'Unauthorized' });

    const payload = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(payload.uid);

    if (!user || user.tokenVersion !== payload.tv) {
      res.clearCookie('token');
      return res.status(401).json({ error: 'Invalid session' });
    }

    if (user.banned) {
      return res.status(403).json({
        error: 'banned',
        banReason: user.banReason,
        username: user.username,
        userId: user.userId
      });
    }

    req.user = user;
    next();
  } catch {
    res.clearCookie('token');
    res.status(401).json({ error: 'Unauthorized' });
  }
}

module.exports = { authRequired };