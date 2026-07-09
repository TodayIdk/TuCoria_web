const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  userId: { type: Number, unique: true, index: true },
  username: { type: String, required: true, trim: true, minlength: 4, maxlength: 32 },
  usernameLower: { type: String, required: true, unique: true, lowercase: true, trim: true, index: true },
  passwordHash: { type: String, required: true },
  createdAt: { type: Date, default: Date.now },
  lastLogin: { type: Date, default: null },
  tokenVersion: { type: Number, default: 0 },

  banned: { type: Boolean, default: false },
  banType: { type: String, enum: ['warn', 'temp', 'permanent', 'auto_renamed', ''], default: '' },
  banReason: { type: String, default: '' },
  banMessage: { type: String, default: '' },
  banSeverity: { type: Number, default: 0 },
  bannedAt: { type: Date, default: null },
  banExpiresAt: { type: Date, default: null },
  previousUsername: { type: String, default: '' },

  pendingDeletion: { type: Boolean, default: false },
  deletionScheduledAt: { type: Date, default: null },

  violationHistory: [{
    date: { type: Date, default: Date.now },
    reason: String,
    action: String,
    username: String
  }]
}, { versionKey: false });

userSchema.pre('validate', function(next) {
  if (this.username) this.usernameLower = this.username.toLowerCase();
  next();
});

module.exports = mongoose.model('User', userSchema);