require('dotenv').config({ path: __dirname + '/.env' });
const mongoose = require('mongoose');

async function run() {
  const target = process.argv[2];
  const reason = process.argv.slice(3).join(' ') || 'Username violates community guidelines';
  if (!target) { console.log('Usage: node banUser.js <username> [reason]'); process.exit(1); }

  await mongoose.connect('mongodb+srv://Today_Idk:TpdauT434odayTodayToday23@cluster0.rlgkop5.mongodb.net/TuCoria?retryWrites=true&w=majority&appName=Cluster0');
  const users = mongoose.connection.collection('users');
  const r = await users.updateOne(
    { usernameLower: target.toLowerCase() },
    { $set: { banned: true, banReason: reason, bannedAt: new Date() } }
  );
  console.log(r.matchedCount ? `Banned ${target}: ${reason}` : 'User not found');
  await mongoose.disconnect();
}
run();