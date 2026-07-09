const BLOCKED_KEYWORDS = [
  'owner', 'creator', 'admin', 'moderator', 'developer', 'dev',
  'staff', 'support', 'official', 'system', 'root', 'server',
  'tucoria', 'tucoriateam',
  'today_idk', 'todayidk', 'kamkin',
  'сoздатель', 'создатель', 'админ', 'модератор', 'модер',
  'разработчик', 'офиц', 'саппорт', 'поддержка', 'владелец'
];

const HARD_BLOCK = /nazi|hitler|nigg|f[a@]g|k[uy]k|н[аa]ц|фаш|негр|пидор|педик|хуй|бляд|ебан|сук[аи]|пизд/i;

function normalizeForCheck(s) {
  return s
    .toLowerCase()
    .replace(/0/g, 'o').replace(/1/g, 'i').replace(/3/g, 'e')
    .replace(/4/g, 'a').replace(/5/g, 's').replace(/7/g, 't')
    .replace(/@/g, 'a').replace(/\$/g, 's')
    .replace(/[_\-\.\s]/g, '');
}

function localCheck(username) {
  const norm = normalizeForCheck(username);
  if (HARD_BLOCK.test(username) || HARD_BLOCK.test(norm))
    return { ok: false, reason: 'Inappropriate content' };
  for (const kw of BLOCKED_KEYWORDS) {
    if (norm.includes(kw.toLowerCase().replace(/[_\-\s]/g, '')))
      return { ok: false, reason: 'Reserved / impersonation not allowed' };
  }
  return { ok: true };
}

async function aiCheck(username) {
  if (process.env.POLLINATIONS_ENABLED !== 'true') return { ok: true };

  try {
    const prompt = `You are a strict username moderator for a game called "TuCoria". The owners/creators of TuCoria are ONLY "Today_Idk" and "KAMKIN" — nobody else.

Check this username: "${username}"

Return ONLY valid JSON, no other text:
{"allow": true/false, "reason": "short reason if false"}

Reject (allow=false) if the username:
- Impersonates owners/staff/admin/moderator/developer of TuCoria or any generic authority
- Contains slurs, hate speech, sexual content, drugs, violence
- Contains phone numbers, addresses, links
- Pretends to be system/bot/server account
- Is a variation of "Today_Idk" or "KAMKIN" (like "Today_ldk", "KAMK1N", "Kamkin2")

Allow (allow=true) if it's just a normal creative nickname.
Length ${username.length}, characters: ${/[а-яА-Я]/.test(username) ? 'contains Cyrillic' : 'Latin/digits'}.`;

    const url = 'https://text.pollinations.ai/' + encodeURIComponent(prompt) + '?model=openai&json=true';
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 8000);

    const res = await fetch(url, { signal: controller.signal });
    clearTimeout(timeout);

    if (!res.ok) return { ok: true };
    const text = await res.text();

    const match = text.match(/\{[\s\S]*?\}/);
    if (!match) return { ok: true };

    const parsed = JSON.parse(match[0]);
    if (parsed.allow === false)
      return { ok: false, reason: parsed.reason || 'Username not allowed' };
    return { ok: true };
  } catch {
    return { ok: true };
  }
}

async function checkUsername(username) {
  const local = localCheck(username);
  if (!local.ok) return local;
  const ai = await aiCheck(username);
  if (!ai.ok) return ai;
  return { ok: true };
}

module.exports = { checkUsername };