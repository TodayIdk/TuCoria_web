const mongoose = require('mongoose');
const { getNextId } = require('../utils/counter');

const userSchema = new mongoose.Schema({
  userId: { type: Number, unique: true, index: true },
  username: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    minlength: 3,
    maxlength: 20,
    index: true
  },
  passwordHash: { type: String, required: true },
  createdAt: { type: Date, default: Date.now },
  lastLogin: { type: Date, default: null },
  tokenVersion: { type: Number, default: 0 }
});

userSchema.pre('save', async function(next) {
  if (this.isNew && !this.userId) {
    this.userId = await getNextId('userId');
  }
  next();
});

module.exports = mongoose.model('User', userSchema);