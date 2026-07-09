const User = require('../models/User');
const { checkUsername } = require('./nameCheck');

const SCAN_INTERVAL_MS = 30 * 60 * 1000;
const BATCH_SIZE = 20;
const DELAY_BETWEEN_MS = 1500;

let running = false;

async function scanAllUsers() {
  if (running) return;
  running = true;
  console.log('[MOD] Background scan started');

  try {
    const users = await User.find({ banned: false }).select('_id username usernameLower').lean();
    console.log(`[MOD] Scanning ${users.length} users`);

    for (let i = 0; i < users.length; i++) {
      const u = users[i];
      try {
        const result = await checkUsername(u.username, u.userId);
        if (!result.ok) {
          await User.updateOne(
            { _id: u._id },
            {
              $set: {
                banned: true,
                banReason: '[AI 24/7] ' + (result.reason || 'Username violates guidelines'),
                bannedAt: new Date()
              },
              $inc: { tokenVersion: 1 }
            }
          );
          console.log(`[MOD] BANNED: ${u.username} — ${result.reason}`);
        }
      } catch (e) {
        console.error('[MOD] scan error for', u.username, e.message);
      }

      if ((i + 1) % BATCH_SIZE === 0) {
        await new Promise(r => setTimeout(r, DELAY_BETWEEN_MS * 5));
      } else {
        await new Promise(r => setTimeout(r, DELAY_BETWEEN_MS));
      }
    }

    console.log('[MOD] Scan complete');
  } catch (err) {
    console.error('[MOD] Scan failed:', err.message);
  } finally {
    running = false;
  }
}

function startModerator() {
  console.log('[MOD] Background moderator enabled');
  setTimeout(scanAllUsers, 60000);
  setInterval(scanAllUsers, SCAN_INTERVAL_MS);
}

async function findAltAccounts(userId) {
  try {
    const user = await User.findOne({ userId }).lean();
    if (!user) return [];

    const registeredNear = await User.find({
      _id: { $ne: user._id },
      createdAt: {
        $gte: new Date(user.createdAt.getTime() - 24 * 60 * 60 * 1000),
        $lte: new Date(user.createdAt.getTime() + 24 * 60 * 60 * 1000)
      }
    }).select('userId username usernameLower createdAt banned').lean();

    const lower = user.usernameLower;
    const similar = await User.find({
      _id: { $ne: user._id },
      $or: [
        { usernameLower: new RegExp(lower.substring(0, Math.max(3, lower.length - 2))) },
        { usernameLower: { $regex: lower.substring(0, 4) } }
      ]
    }).select('userId username usernameLower createdAt banned').lean();

    const map = new Map();
    for (const x of [...registeredNear, ...similar]) {
      map.set(x.userId, x);
    }
    return [...map.values()];
  } catch { return []; }
}

module.exports = { startModerator, scanAllUsers, findAltAccounts };