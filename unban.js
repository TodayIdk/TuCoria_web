require('dotenv').config({ path: __dirname + '/.env' });
const mongoose = require('mongoose');

async function run() {
  const target = process.argv[2];
  if (!target) { console.log('Usage: node unbanUser.js <username>'); process.exit(1); }

  await mongoose.connect('mongodb+srv://Today_Idk:TpdauT434odayTodayToday23@cluster0.rlgkop5.mongodb.net/TuCoria?retryWrites=true&w=majority&appName=Cluster0');
  const r = await mongoose.connection.collection('users').updateOne(
    { usernameLower: target.toLowerCase() },
    {
      $set: {
        banned: false,
        banReason: '',
        bannedAt: null,
        pendingDeletion: false,
        deletionScheduledAt: null
      },
      $inc: { tokenVersion: 1 }
    }
  );
  console.log(r.matchedCount ? `✅ Unbanned ${target}` : '❌ User not found');
  await mongoose.disconnect();
}
run();