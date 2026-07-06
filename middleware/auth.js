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

    req.user = user;
    next();
  } catch (err) {
    res.clearCookie('token');
    res.status(401).json({ error: 'Unauthorized' });
  }
}

module.exports = { authRequired };