require('dotenv').config({ path: __dirname + '/.env' });
const mongoose = require('mongoose');
const User = require('./models/User');
const { checkUsername } = require('./utils/nameCheck');
const { judgeUser, generateSafeUsername } = require('./utils/banJudge');

const DELAY_MS = 1500;

async function applyJudgement(user, judgement, originalReason) {
  const now = new Date();
  const historyEntry = {
    date: now,
    reason: judgement.reason,
    action: judgement.action,
    username: user.username
  };

  if (judgement.action === 'auto_renamed') {
    let newName;
    for (let i = 0; i < 10; i++) {
      newName = generateSafeUsername();
      const exists = await User.findOne({ usernameLower: newName.toLowerCase() }).lean();
      if (!exists) break;
    }
    await User.updateOne(
      { _id: user._id },
      {
        $set: {
          previousUsername: user.username,
          username: newName,
          usernameLower: newName.toLowerCase(),
          banned: false,
          banType: 'auto_renamed',
          banReason: judgement.reason,
          banMessage: judgement.message,
          banSeverity: judgement.severity,
          bannedAt: now,
          banExpiresAt: null
        },
        $inc: { tokenVersion: 1 },
        $push: { violationHistory: historyEntry }
      }
    );
    return { type: 'auto_renamed', newName };
  }

  if (judgement.action === 'permanent') {
    await User.updateOne(
      { _id: user._id },
      {
        $set: {
          banned: true,
          banType: 'permanent',
          banReason: judgement.reason,
          banMessage: judgement.message,
          banSeverity: judgement.severity,
          bannedAt: now,
          banExpiresAt: null
        },
        $inc: { tokenVersion: 1 },
        $push: { violationHistory: historyEntry }
      }
    );
    return { type: 'permanent' };
  }

  const durationMs = (judgement.durationMinutes || (judgement.action === 'warn' ? 1 : 60)) * 60 * 1000;
  const expiresAt = new Date(now.getTime() + durationMs);
  await User.updateOne(
    { _id: user._id },
    {
      $set: {
        banned: true,
        banType: judgement.action,
        banReason: judgement.reason,
        banMessage: judgement.message,
        banSeverity: judgement.severity,
        bannedAt: now,
        banExpiresAt: expiresAt
      },
      $inc: { tokenVersion: 1 },
      $push: { violationHistory: historyEntry }
    }
  );
  return { type: judgement.action, expiresAt };
}

async function run() {
  try {
    const uri = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/tucoria';
    await mongoose.connect(uri);
    console.log('[MOD] Connected\n');

    const users = await User.find({
      $or: [
        { banned: false },
        { banned: true, banType: 'warn' },
        { banned: true, banType: 'temp' }
      ]
    }).lean();

    console.log(`[MOD] Scanning ${users.length} users...\n`);
    let banned = 0, clean = 0, renamed = 0, warned = 0, perma = 0;

    for (let i = 0; i < users.length; i++) {
      const u = users[i];
      const num = `[${i + 1}/${users.length}]`;

      try {
        const check = await checkUsername(u.username, u.userId);
        if (check.ok) {
          console.log(`${num} ✅ OK      #${u.userId}  ${u.username}`);
          clean++;
        } else {
          const judgement = await judgeUser(u.username, check.reason, u.violationHistory || []);
          const result = await applyJudgement(u, judgement, check.reason);
          if (result.type === 'auto_renamed') {
            console.log(`${num} ✏️  RENAMED #${u.userId}  ${u.username} → ${result.newName}`);
            renamed++;
          } else if (result.type === 'permanent') {
            console.log(`${num} 🚫 PERMA   #${u.userId}  ${u.username}`);
            perma++;
          } else if (result.type === 'warn') {
            console.log(`${num} ⚠️  WARN    #${u.userId}  ${u.username} (1 min)`);
            warned++;
          } else {
            console.log(`${num} ⏱️  TEMP    #${u.userId}  ${u.username} (${judgement.durationMinutes} min)`);
            banned++;
          }
        }
      } catch (e) {
        console.log(`${num} ⚠️  ERROR   #${u.userId}  ${u.username}  →  ${e.message}`);
      }

      if (i < users.length - 1) await new Promise(r => setTimeout(r, DELAY_MS));
    }

    console.log('\n────────────────────────────────');
    console.log(`✅ Clean:      ${clean}`);
    console.log(`⚠️  Warned:    ${warned}`);
    console.log(`✏️  Renamed:   ${renamed}`);
    console.log(`⏱️  Temp bans: ${banned}`);
    console.log(`🚫 Perma:      ${perma}`);
    console.log('────────────────────────────────\n');

    await mongoose.disconnect();
    console.log('[MOD] Done ✅');
  } catch (err) {
    console.error('[MOD] Error:', err);
    process.exit(1);
  }
}

run();