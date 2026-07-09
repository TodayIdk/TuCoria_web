const ADJ = ['Silent', 'Brave', 'Swift', 'Cosmic', 'Neon', 'Shadow', 'Crystal', 'Frozen', 'Golden', 'Mystic', 'Radiant', 'Iron', 'Storm', 'Nova', 'Echo', 'Vivid', 'Lunar', 'Solar', 'Rapid', 'Wild', 'Quiet', 'Noble', 'Fierce', 'Gentle'];
const NOUN = ['Wolf', 'Falcon', 'Dragon', 'Panda', 'Tiger', 'Hunter', 'Rider', 'Knight', 'Pixel', 'Comet', 'Blade', 'Fox', 'Raven', 'Phoenix', 'Titan', 'Nomad', 'Ranger', 'Sage', 'Warden', 'Sparrow', 'Ghost', 'Star', 'Storm', 'Ember'];

function generateSafeUsername() {
  const adj = ADJ[Math.floor(Math.random() * ADJ.length)];
  const noun = NOUN[Math.floor(Math.random() * NOUN.length)];
  const num = Math.floor(100 + Math.random() * 9000);
  return `${adj}${noun}${num}`;
}

function fallbackJudgement(username, reason, history) {
  const repeated = history && history.length >= 2;
  const veryBad = /nazi|hitler|1488|cp|pedo|rape|kill|kys|nigg|педо|убью|суицид/i.test(username);

  if (veryBad || repeated) {
    return {
      action: 'permanent',
      severity: 10,
      message: 'This violation is severe and cannot be appealed. Your account has been permanently disabled.',
      reason: reason || 'Severe violation of community rules',
      durationMinutes: 0
    };
  }
  return {
    action: 'temp',
    severity: 5,
    message: 'Your username violates our rules. Your account is temporarily restricted. It will unlock automatically and you must pick a new username.',
    reason: reason || 'Inappropriate username',
    durationMinutes: 60
  };
}

async function judgeUser(username, reason, history = []) {
  if (process.env.POLLINATIONS_ENABLED !== 'true') {
    return fallbackJudgement(username, reason, history);
  }

  const historyText = history.length > 0
    ? history.slice(-5).map(h => `- ${new Date(h.date).toISOString()}: "${h.username}" — ${h.action} (${h.reason})`).join('\n')
    : 'No prior violations.';

  const systemPrompt = `You are a fair but strict AI judge for the game "TuCoria" (owners: Today_Idk, KAMKIN). You decide punishments for users with rule-violating usernames. Your goal is proportional justice. Reply ONLY with valid JSON.`;

  const userPrompt = `A user's username was flagged.

Username: "${username}"
Detected reason: "${reason}"
Prior violations:
${historyText}

Decide the punishment. Choose ONE action:

1. "warn" — light violation, first offense, borderline. Give a 1-minute temporary ban as a warning. User keeps their username.
2. "auto_renamed" — mild-to-medium violation. You take pity and auto-assign a safe random username. User is unbanned instantly.
3. "temp" — clear violation. Temporary restriction (10 min to 24 hours). User must pick a new username after unlock.
4. "permanent" — severe violation (nazi/CP/extreme slurs/repeated offender). Account permanently disabled. No appeal.

Consider:
- Severity of the word/content
- Whether it's obfuscated (harder = more suspicious)
- Prior violation history (repeated = harsher)
- Context: is it borderline or clearly malicious?

Reply with ONLY this JSON:
{
  "action": "warn" | "auto_renamed" | "temp" | "permanent",
  "severity": 1-10,
  "durationMinutes": number (0 for permanent, 1 for warn, 5-1440 for temp, 0 for auto_renamed),
  "message": "personal message to the user explaining the decision (2-4 sentences, respectful but firm, in English)",
  "reason": "short technical reason (english, 3-8 words)"
}`;

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
        jsonMode: true
      }),
      signal: AbortSignal.timeout(15000)
    });

    if (!res.ok) throw new Error('bad status');
    const data = await res.json();
    const raw = data.choices?.[0]?.message?.content || data.content || '';
    const match = raw.match(/\{[\s\S]*"action"[\s\S]*?\}/);
    if (!match) throw new Error('no json');
    const parsed = JSON.parse(match[0]);

    const validActions = ['warn', 'auto_renamed', 'temp', 'permanent'];
    if (!validActions.includes(parsed.action)) throw new Error('bad action');

    return {
      action: parsed.action,
      severity: Math.min(10, Math.max(1, parsed.severity || 5)),
      durationMinutes: Math.max(0, Math.min(1440, parseInt(parsed.durationMinutes) || 0)),
      message: (parsed.message || 'Your username violates our rules.').slice(0, 500),
      reason: (parsed.reason || reason || 'Rule violation').slice(0, 200)
    };
  } catch {
    return fallbackJudgement(username, reason, history);
  }
}

module.exports = { judgeUser, generateSafeUsername };