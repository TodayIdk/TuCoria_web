const mongoose = require('mongoose');

const gameSessionSchema = new mongoose.Schema({
  token: { type: String, required: true, unique: true, index: true },
  status: { type: String, enum: ['pending', 'authorized', 'expired'], default: 'pending' },
  userId: { type: Number, default: null },
  username: { type: String, default: '' },
  createdAt: { type: Date, default: Date.now, expires: 300 }
}, { versionKey: false });

module.exports = mongoose.model('GameSession', gameSessionSchema);