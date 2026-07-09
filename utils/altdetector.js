const User = require('../models/User');

function levenshtein(a, b) {
  const m = a.length, n = b.length;
  if (m === 0) return n;
  if (n === 0) return m;
  const dp = Array.from({ length: m + 1 }, () => new Array(n + 1).fill(0));
  for (let i = 0; i <= m; i++) dp[i][0] = i;
  for (let j = 0; j <= n; j++) dp[0][j] = j;
  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      dp[i][j] = Math.min(dp[i - 1][j] + 1, dp[i][j - 1] + 1, dp[i - 1][j - 1] + cost);
    }
  }
  return dp[m][n];
}

function similarity(a, b) {
  const max = Math.max(a.length, b.length);
  if (max === 0) return 1;
  return 1 - levenshtein(a, b) / max;
}

function normalizeName(s) {
  return s
    .toLowerCase()
    .replace(/0/g, 'o').replace(/1/g, 'i').replace(/3/g, 'e')
    .replace(/4/g, 'a').replace(/5/g, 's').replace(/7/g, 't')
    .replace(/[_\-\.\s]/g, '');
}

function extractCore(s) {
  return normalizeName(s).replace(/\d+$/, '').replace(/[xX]+$/, '');
}

function scoreCandidate(target, candidate) {
  let score = 0;
  const reasons = [];

  const tNorm = normalizeName(target.username);
  const cNorm = normalizeName(candidate.username);
  const tCore = extractCore(target.username);
  const cCore = extractCore(candidate.username);

  const sim = similarity(tNorm, cNorm);
  if (sim >= 0.85) { score += 40; reasons.push(`name similarity ${Math.round(sim * 100)}%`); }
  else if (sim >= 0.7) { score += 25; reasons.push(`name similarity ${Math.round(sim * 100)}%`); }
  else if (sim >= 0.55) { score += 12; reasons.push(`name similarity ${Math.round(sim * 100)}%`); }

  if (tCore && cCore && tCore === cCore && tNorm !== cNorm) {
    score += 30;
    reasons.push('same base name with different suffix');
  }

  if (tCore.length >= 4 && cCore.length >= 4) {
    if (cNorm.includes(tCore) || tNorm.includes(cCore)) {
      score += 20;
      reasons.push('name contains other name as substring');
    }
  }

  const tTime = new Date(target.createdAt).getTime();
  const cTime = new Date(candidate.createdAt).getTime();
  const diffH = Math.abs(tTime - cTime) / 3600000;
  if (diffH <= 1) { score += 25; reasons.push(`registered within ${diffH.toFixed(1)}h`); }
  else if (diffH <= 6) { score += 15; reasons.push(`registered within ${diffH.toFixed(1)}h`); }
  else if (diffH <= 24) { score += 8; reasons.push(`registered within ${diffH.toFixed(1)}h`); }

  const tRev = tNorm.split('').reverse().join('');
  if (tRev === cNorm) { score += 35; reasons.push('reversed name'); }

  return { score, reasons };
}

async function findCandidates(targetUser) {
  const all = await User.find({
    _id: { $ne: targetUser._id }
  }).select('userId username usernameLower createdAt banned').lean();

  const scored = [];
  for (const c of all) {
    const { score, reasons } = scoreCandidate(targetUser, c);
    if (score >= 25) {
      scored.push({
        userId: c.userId,
        username: c.username,
        createdAt: c.createdAt,
        banned: c.banned,
        score,
        reasons
      });
    }
  }
  scored.sort((a, b) => b.score - a.score);
  return scored.slice(0, 15);
}

async function aiConfirmAlts(target, candidates) {
  if (process.env.POLLINATIONS_ENABLED !== 'true' || candidates.length === 0) {
    return candidates.filter(c => c.score >= 50);
  }

  const list = candidates.map(c =>
    `- "${c.username}" (id ${c.userId}, registered ${new Date(c.createdAt).toISOString()}, heuristic score ${c.score}, signals: ${c.reasons.join('; ')})`
  ).join('\n');

  const systemPrompt = `You are an expert alt-account detector for the game "TuCoria". Analyze candidate accounts and determine which are likely alt (secondary) accounts of the same person. Reply ONLY with JSON.`;

  const userPrompt = `Target account:
- Username: "${target.username}"
- User ID: ${target.userId}
- Registered: ${new Date(target.createdAt).toISOString()}

Candidate accounts that share suspicious signals with the target:
${list}

For each candidate decide if it's an alt account of the same person. Consider:
- Very similar or matching base names (variations, added numbers, leetspeak like "Vlad2010" vs "Vlad_2011", "K4mkin" vs "Kamkin")
- Names that clearly reference each other
- Close registration timing combined with name similarity
- Reversed / obfuscated variations
- Common patterns: name + digit, name + "x", name + "2", "real_name", "name_alt"

Reply ONLY with valid JSON in this exact format:
{"alts":[{"userId":123,"confidence":0.0-1.0,"reason":"short explanation"}, ...]}

Only include accounts with confidence >= 0.6. If none look like alts, return {"alts":[]}.`;

  try {
    const res = await fetch('https://text.pollinations.ai/openai', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: 'openai',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
        jsonMode: true,
        seed: 7
      }),
      signal: AbortSignal.timeout(15000)
    });

    if (!res.ok) throw new Error('bad status');
    const data = await res.json();
    const raw = data.choices?.[0]?.message?.content || data.content || '';
    const match = raw.match(/\{[\s\S]*"alts"[\s\S]*?\}/);
    if (!match) throw new Error('no json');

    const parsed = JSON.parse(match[0]);
    if (!Array.isArray(parsed.alts)) throw new Error('bad format');

    const confirmed = [];
    for (const a of parsed.alts) {
      if (a.confidence < 0.6) continue;
      const cand = candidates.find(c => c.userId === a.userId);
      if (cand) {
        confirmed.push({
          ...cand,
          aiConfidence: a.confidence,
          aiReason: a.reason || 'AI-detected alt'
        });
      }
    }
    return confirmed;
  } catch {
    return candidates.filter(c => c.score >= 50);
  }
}

async function detectAlts(userIdOrUser) {
  let target;
  if (typeof userIdOrUser === 'number') {
    target = await User.findOne({ userId: userIdOrUser }).lean();
  } else {
    target = userIdOrUser;
  }
  if (!target) return { target: null, alts: [] };

  const candidates = await findCandidates(target);
  if (candidates.length === 0) return { target, alts: [] };

  const alts = await aiConfirmAlts(target, candidates);
  return { target, alts, candidatesChecked: candidates.length };
}

module.exports = { detectAlts, findCandidates, aiConfirmAlts, similarity };