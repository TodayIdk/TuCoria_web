const User = require('../models/User');
const { checkUsername } = require('./nameCheck');
const { judgeUser, generateSafeUsername } = require('./banJudge');

const SCAN_INTERVAL_MS = 30 * 60 * 1000;
const START_DELAY_MS = 60 * 1000;
const DELAY_BETWEEN_USERS_MS = 2000;
const BATCH_PAUSE_MS = 8000;
const BATCH_SIZE = 15;

let isRunning = false;
let scanCount = 0;

async function applyJudgement(user, judgement) {
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

async function scanAllUsers() {
  if (isRunning) {
    console.log('[MOD] Scan already running, skipping');
    return;
  }
  isRunning = true;
  scanCount++;
  const startedAt = Date.now();
  console.log(`\n[MOD] ═══ Scan #${scanCount} started at ${new Date().toISOString()} ═══`);

  try {
    const users = await User.find({
      $or: [
        { banned: false },
        { banned: true, banType: { $in: ['warn', 'temp'] } }
      ]
    }).lean();

    console.log(`[MOD] Checking ${users.length} users`);
    let stats = { clean: 0, warned: 0, renamed: 0, temp: 0, perma: 0, errors: 0 };

    for (let i = 0; i < users.length; i++) {
      const u = users[i];
      try {
        const check = await checkUsername(u.username, u.userId);
        if (check.ok) {
          stats.clean++;
        } else {
          const judgement = await judgeUser(u.username, check.reason, u.violationHistory || []);
          const result = await applyJudgement(u, judgement);
          if (result.type === 'auto_renamed') { stats.renamed++; console.log(`[MOD] ✏️  RENAMED #${u.userId} ${u.username} → ${result.newName}`); }
          else if (result.type === 'permanent') { stats.perma++; console.log(`[MOD] 🚫 PERMA #${u.userId} ${u.username}`); }
          else if (result.type === 'warn') { stats.warned++; console.log(`[MOD] ⚠️  WARN #${u.userId} ${u.username}`); }
          else { stats.temp++; console.log(`[MOD] ⏱️  TEMP #${u.userId} ${u.username} (${judgement.durationMinutes}m)`); }
        }
      } catch (e) {
        stats.errors++;
        console.error(`[MOD] Error scanning #${u.userId} ${u.username}:`, e.message);
      }

      if (i < users.length - 1) {
        if ((i + 1) % BATCH_SIZE === 0) {
          await new Promise(r => setTimeout(r, BATCH_PAUSE_MS));
        } else {
          await new Promise(r => setTimeout(r, DELAY_BETWEEN_USERS_MS));
        }
      }
    }

    const durationSec = ((Date.now() - startedAt) / 1000).toFixed(1);
    console.log(`[MOD] ═══ Scan #${scanCount} done in ${durationSec}s ═══`);
    console.log(`[MOD] ✅ ${stats.clean} clean · ⚠️  ${stats.warned} warned · ✏️  ${stats.renamed} renamed · ⏱️  ${stats.temp} temp · 🚫 ${stats.perma} perma · ⚠️  ${stats.errors} errors\n`);
  } catch (err) {
    console.error('[MOD] Scan failed:', err.message);
  } finally {
    isRunning = false;
  }
}

async function cleanupExpiredBans() {
  try {
    const now = new Date();
    const res = await User.updateMany(
      {
        banned: true,
        banExpiresAt: { $ne: null, $lte: now }
      },
      {
        $set: {
          banned: false,
          banType: '',
          banReason: '',
          banMessage: '',
          banExpiresAt: null
        }
      }
    );
    if (res.modifiedCount > 0) {
      console.log(`[MOD] Auto-unbanned ${res.modifiedCount} users (ban expired)`);
    }
  } catch (e) {
    console.error('[MOD] cleanupExpiredBans:', e.message);
  }
}

async function cleanupPendingDeletions() {
  try {
    const now = new Date();
    const res = await User.deleteMany({
      pendingDeletion: true,
      deletionScheduledAt: { $lte: now }
    });
    if (res.deletedCount > 0) {
      console.log(`[MOD] Deleted ${res.deletedCount} accounts (pending deletion)`);
    }
  } catch (e) {
    console.error('[MOD] cleanupPendingDeletions:', e.message);
  }
}

function startModerator() {
  console.log('[MOD] Background moderator enabled');
  console.log(`[MOD] Scan interval: ${SCAN_INTERVAL_MS / 60000} min`);
  console.log(`[MOD] First scan in: ${START_DELAY_MS / 1000}s`);

  setTimeout(scanAllUsers, START_DELAY_MS);
  setInterval(scanAllUsers, SCAN_INTERVAL_MS);

  setInterval(cleanupExpiredBans, 60 * 1000);
  setInterval(cleanupPendingDeletions, 10 * 60 * 1000);
}

module.exports = { startModerator, scanAllUsers, cleanupExpiredBans, cleanupPendingDeletions };