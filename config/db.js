const mongoose = require('mongoose');

async function connectDB() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('[DB] Connected to MongoDB');
  } catch (err) {
    console.error('[DB] Connection error:', err.message);
    process.exit(1);
  }
}

module.exports = connectDB;