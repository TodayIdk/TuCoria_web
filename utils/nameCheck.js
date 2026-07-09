const HARD_BLOCK_PATTERNS = [
  /n[i1!|]gg[e3]r/i,
  /f[a@4]g/i,
  /r[e3]t[a@4]rd/i,
  /k[i1]k[e3]/i,
  /ch[i1]nk/i,
  /sp[i1]c/i,
  /tr[a@4]nn[yi]/i,
  /wh[o0]r[e3]/i,
  /sl[u\*]t/i,
  /b[i1]tch/i,
  /c[u\*]nt/i,
  /d[i1]ck/i,
  /p[e3]n[i1]s/i,
  /v[a@4]g[i1]n[a@4]/i,
  /p[u\*]ssy/i,
  /b[o0]{2}b/i,
  /a[s\$]{2}h[o0]l[e3]/i,
  /m[o0]th[e3]rf/i,
  /f[u\*]ck/i,
  /sh[i1]t/i,
  /r[a@4]p[e3]/i,
  /p[e3]d[o0]/i,
  /p[e3]d[i1]ph/i,
  /l[o0]l[i1]/i,
  /sh[o0]t[a@4]/i,
  /n[a@4]z[i1]/i,
  /h[i1]tl[e3]r/i,
  /st[a@4]l[i1]n/i,
  /[a@4]l-?q[a@4][e3]d/i,
  /[i1]s[i1]s/i,
  /t[e3]rr[o0]r/i,
  /k[i1]ll/i,
  /murd[e3]r/i,
  /su[i1]c[i1]d[e3]/i,
  /k[y]s/i,
  /c[o0]c[a@4][i1]n/i,
  /h[e3]r[o0][i1]n/i,
  /m[e3]th/i,
  /w[e3]{2}d/i,
  /m[a@4]r[i1]ju[a@4]n/i,
  /cp/i,
  /porn/i,
  /nsfw/i,
  /sex/i,
  /xxx/i,
  /69/,
  /420/,
  /1488/,
  /88h/i
];

const RU_HARD_BLOCK = [
  /х[уy][йиеeяюiюe]/i,
  /п[иi]зд/i,
  /бл[яa]/i,
  /бля[тд]/i,
  /еб[аaнл]/i,
  /ёб[аaнл]/i,
  /еб[уy]/i,
  /выеб/i,
  /наеб/i,
  /заеб/i,
  /долб[оаe][её]б/i,
  /мудак/i,
  /мудил/i,
  /гнид/i,
  /гандон/i,
  /урод/i,
  /даун/i,
  /сук[аиуе]/i,
  /шлюх/i,
  /бляд/i,
  /пидо?р/i,
  /пидар/i,
  /педик/i,
  /пед[оa]фил/i,
  /гей[аye]/i,
  /говн/i,
  /жоп/i,
  /член/i,
  /писюн/i,
  /писк[аи]/i,
  /сис[еькь]/i,
  /голы[йе]/i,
  /порн/i,
  /секс/i,
  /трах/i,
  /минет/i,
  /онанизм/i,
  /дроч/i,
  /нацист/i,
  /фашист/i,
  /гитлер/i,
  /сталин/i,
  /негр/i,
  /жид/i,
  /чурк/i,
  /хохол/i,
  /кацап/i,
  /москаль/i,
  /террор/i,
  /убий/i,
  /убьт?/i,
  /суицид/i,
  /героин/i,
  /кокаин/i,
  /мет[аиео]мф/i,
  /наркот/i,
  /травк[аи]/i,
  /шишк[аи]/i,
  /план[оa]кур/i
];

const RESERVED = [
  'owner', 'creator', 'admin', 'administrator', 'moderator', 'mod',
  'developer', 'dev', 'staff', 'support', 'official', 'system',
  'root', 'server', 'bot', 'null', 'undefined', 'anonymous',
  'tucoria', 'tucoriateam', 'tucoriaowner', 'tucoriastaff',
  'today_idk', 'todayidk', 'today', 'kamkin',
  'админ', 'админист', 'модератор', 'модер', 'разработчик',
  'создатель', 'владелец', 'офиц', 'саппорт', 'поддержка',
  'систем', 'сервер', 'бот', 'аноним', 'тукория'
];

function normalize(s) {
  return s
    .toLowerCase()
    .replace(/0/g, 'o').replace(/1/g, 'i').replace(/3/g, 'e')
    .replace(/4/g, 'a').replace(/5/g, 's').replace(/7/g, 't')
    .replace(/@/g, 'a').replace(/\$/g, 's').replace(/!/g, 'i')
    .replace(/[_\-\.\s]/g, '');
}

function looksLikeAd(s) {
  if (/https?:\/\//i.test(s)) return true;
  if (/\.(com|net|org|io|gg|ru|xyz|tk|ml)/i.test(s)) return true;
  if (/t\.me\/|discord\.gg|@[a-z]/i.test(s)) return true;
  if (/\d{6,}/.test(s)) return true;
  return false;
}

function localCheck(username) {
  if (looksLikeAd(username))
    return { ok: false, reason: 'Links and ads not allowed' };

  for (const rx of HARD_BLOCK_PATTERNS) {
    if (rx.test(username)) return { ok: false, reason: 'Inappropriate content' };
  }
  for (const rx of RU_HARD_BLOCK) {
    if (rx.test(username)) return { ok: false, reason: 'Inappropriate content' };
  }

  const norm = normalize(username);
  for (const rx of HARD_BLOCK_PATTERNS) {
    if (rx.test(norm)) return { ok: false, reason: 'Inappropriate content' };
  }

  for (const word of RESERVED) {
    const clean = word.toLowerCase().replace(/[_\-\s]/g, '');
    if (norm === clean || norm.includes(clean))
      return { ok: false, reason: 'Reserved / impersonation not allowed' };
  }

  return { ok: true };
}

async function aiCheck(username) {
  if (process.env.POLLINATIONS_ENABLED !== 'true') return { ok: true };

  try {
    const prompt = `You are a STRICT username moderator for a video game "TuCoria".

Username to check: "${username}"

Return ONLY valid JSON, nothing else:
{"allow": true/false, "reason": "short english reason"}

REJECT (allow=false) if the username contains OR hints at (including leetspeak, homoglyphs, transliteration, creative spelling, abbreviations, hidden meanings, initials, reversed text, or combinations):

1. Profanity / swears / insults (any language: English, Russian, Spanish, Arabic, etc.)
2. Sexual / NSFW / 18+ content, body parts, sex acts, porn references
3. Slurs, racism, homophobia, transphobia, sexism, ableism
4. Nazism, fascism, terrorism, extremism (Hitler, Stalin, ISIS, 1488, 88, SS, etc.)
5. Violence: kill, murder, rape, suicide, self-harm, "kys"
6. Drugs: cocaine, heroin, meth, weed, marijuana, LSD, etc.
7. Pedophilia / CP / loli / shota / any child sexualization
8. Impersonation: admin, moderator, owner, creator, developer, staff, support, system, bot, official — of TuCoria or any generic authority. TuCoria owners are ONLY "Today_Idk" and "KAMKIN".
9. Variations pretending to be "Today_Idk" or "KAMKIN" (e.g. "Today_ldk", "T0day_Idk", "KAMK1N", "Kamkin2", "K4MKIN")
10. Spam: URLs, domains, phone numbers, emails, promo codes, "@username", Telegram/Discord invites
11. Gore, death threats, violent imagery
12. Encoded/obfuscated attempts to bypass filters (e.g. "f_u_c_k", "sh1t", "п_и_д_р")

ALLOW (allow=true) ONLY if it is a completely normal, safe, creative nickname with no hidden bad meaning.

Be paranoid. If in ANY doubt — reject. Better false positive than letting through offensive content.`;

    const url = 'https://text.pollinations.ai/' + encodeURIComponent(prompt) + '?model=openai&json=true';
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 10000);

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