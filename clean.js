require('dotenv').config({ path: __dirname + '/.env' });
const mongoose = require('mongoose');

const KEEP = ['today_idk', 'kamkin'];

async function run() {
  try {
    const uri = process.env.MONGO_URI || 'mongodb+srv://Today_Idk:TpdauT434odayTodayToday23@cluster0.rlgkop5.mongodb.net/TuCoria?retryWrites=true&w=majority&appName=Cluster0';
    await mongoose.connect(uri);
    console.log('[DB] Connected');

    const users = mongoose.connection.collection('users');
    const counters = mongoose.connection.collection('counters');

    const all = await users.find({}).toArray();
    console.log(`[CLEAN] Total users: ${all.length}`);

    const toDelete = all.filter(u => !KEEP.includes((u.username || '').toLowerCase()));
    for (const u of toDelete) {
      await users.deleteOne({ _id: u._id });
      console.log(`[DEL] ${u.username}`);
    }

    const order = ['today_idk', 'kamkin'];
    let i = 1;
    for (const name of order) {
      const u = await users.findOne({
        $or: [
          { username: new RegExp(`^${name}$`, 'i') },
          { usernameLower: name }
        ]
      });
      if (u) {
        await users.updateOne(
          { _id: u._id },
          { $set: { userId: i, usernameLower: (u.username || '').toLowerCase() } }
        );
        console.log(`[SET] ${u.username} -> ID ${i}`);
        i++;
      }
    }

    await counters.updateOne(
      { _id: 'userId' },
      { $set: { seq: i - 1 } },
      { upsert: true }
    );
    console.log(`[COUNTER] reset to ${i - 1}`);

    const after = await users.find({}, { projection: { userId: 1, username: 1, _id: 0 } })
      .sort({ userId: 1 }).toArray();
    console.log('\n[FINAL]');
    after.forEach(u => console.log(`  #${u.userId} — ${u.username}`));

    await mongoose.disconnect();
    console.log('\n[DONE] ✅');
  } catch (err) {
    console.error('[ERROR]', err);
    process.exit(1);
  }
}

run();