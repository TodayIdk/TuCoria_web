const HARD_BLOCK_EN = [
  /n[i1!|l][gq]{1,2}[e3a@][rl]/i,
  /f[a@4]g{1,2}(ot|it)?/i,
  /r[e3][t7][a@4]rd/i,
  /k[i1]k[e3]/i,
  /ch[i1]nk/i,
  /sp[i1]c/i,
  /tr[a@4]nn[yi]/i,
  /wh[o0]r[e3]/i,
  /sl[u\*v]t/i,
  /b[i1!]tch/i,
  /c[u\*v]nt/i,
  /d[i1]ck/i,
  /p[e3]n[i1]s/i,
  /v[a@4]g[i1]n[a@4]/i,
  /p[u\*v]ssy/i,
  /b[o0]{2}b/i,
  /[a@4][s\$]{2}h[o0]l[e3]/i,
  /m[o0]th[e3]rf[u\*v]/i,
  /f[u\*v][cкk]{1,2}[k]?/i,
  /sh[i1!][t7]/i,
  /r[a@4]p[e3]/i,
  /p[e3]d[o0]/i,
  /p[e3]d[i1]ph/i,
  /l[o0]l[i1](con)?/i,
  /sh[o0]t[a@4](con)?/i,
  /n[a@4]z[i1]/i,
  /h[i1]tl[e3]r/i,
  /st[a@4]l[i1]n/i,
  /[i1]s[i1]s/i,
  /t[e3]rr[o0]r/i,
  /k[i1]ll/i,
  /murd[e3]r/i,
  /su[i1]c[i1]d[e3]/i,
  /\bkys\b/i,
  /c[o0]c[a@4][i1]n/i,
  /h[e3]r[o0][i1]n/i,
  /\bmeth\b/i,
  /w[e3]{2}d/i,
  /m[a@4]r[i1]ju[a@4]n/i,
  /\bcp\b/i,
  /p[o0]rn/i,
  /nsfw/i,
  /\bsex\b/i,
  /xxx/i,
  /1488/,
  /\b88\b/,
  /\bss\b/,
  /kkk/i,
  /whit[e3]?p[o0]w[e3]r/i,
  /bl[a@4]ckp[o0]w[e3]r/i,
  /d[i1]e{1,}/i,
  /hang/i,
  /lynch/i,
  /bomb/i,
  /iso?[i1]s/i,
  /tal[i1]ban/i,
  /qa[e3]da/i
];

const HARD_BLOCK_RU = [
  /х[уyuоo][йиеeяюiюeйe]/i,
  /х[уy][ийл]/i,
  /п[иi]зд/i,
  /пёзд/i,
  /бл[яa][тд]?/i,
  /бля[тд]/i,
  /еб[аaнлушвы]/i,
  /ёб[аaнлушвы]/i,
  /еб[уy][чщш]?/i,
  /выеб/i,
  /наеб/i,
  /заеб/i,
  /уеб/i,
  /долб[оаe][её]б/i,
  /дое[бп]/i,
  /муд[аи][кл]/i,
  /гнид/i,
  /гандон/i,
  /урод/i,
  /даун/i,
  /дебил/i,
  /кретин/i,
  /имбецил/i,
  /тварь/i,
  /сук[аиуе]/i,
  /шлюх/i,
  /бляд/i,
  /б[лl][яa][дd]/i,
  /пид[оa]?р/i,
  /пидар/i,
  /педик/i,
  /пед[оa]фил/i,
  /гей[аye]?/i,
  /говн/i,
  /гавн/i,
  /жоп/i,
  /член/i,
  /писюн/i,
  /писк[аи]/i,
  /сис[ькь]/i,
  /голы[йе]/i,
  /порн/i,
  /секс/i,
  /трах/i,
  /минет/i,
  /онанизм/i,
  /дроч/i,
  /кончил/i,
  /сперм/i,
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
  /убью/i,
  /зарежу/i,
  /зарежь/i,
  /суицид/i,
  /повеш/i,
  /героин/i,
  /кокаин/i,
  /мет[аиео]мф/i,
  /наркот/i,
  /травк[аи]/i,
  /шишк[аи]/i,
  /план[оa]кур/i,
  /соси/i,
  /отсос/i,
  /насил/i,
  /изнасил/i,
  /бомб[аи]/i
];

const RESERVED = [
  'owner', 'creator', 'admin', 'administrator', 'moderator', 'mod',
  'developer', 'dev', 'staff', 'support', 'official', 'system',
  'root', 'server', 'bot', 'null', 'undefined', 'anonymous',
  'guest', 'user', 'test', 'account', 'me', 'you',
  'tucoria', 'tucoriateam', 'tucoriaowner', 'tucoriastaff',
  'tucoriabot', 'tucoriamod', 'tucoriaadmin', 'tucoriadev',
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
    .replace(/[_\-\.\s\|\/\\]/g, '');
}

function collapseRepeats(s) {
  return s.replace(/(.)\1{2,}/g, '$1$1');
}

function looksLikeAd(s) {
  if (/https?:\/\//i.test(s)) return true;
  if (/\.(com|net|org|io|gg|ru|xyz|tk|ml|top|site)/i.test(s)) return true;
  if (/t\.me\/|discord\.gg|@[a-z]/i.test(s)) return true;
  if (/\d{6,}/.test(s)) return true;
  return false;
}

function checkAll(str) {
  for (const rx of HARD_BLOCK_EN) if (rx.test(str)) return true;
  for (const rx of HARD_BLOCK_RU) if (rx.test(str)) return true;
  return false;
}

function localCheck(username) {
  if (looksLikeAd(username))
    return { ok: false, reason: 'Links, ads and promotions are not allowed' };

  if (checkAll(username))
    return { ok: false, reason: 'Inappropriate language / content' };

  const norm = normalize(username);
  if (checkAll(norm))
    return { ok: false, reason: 'Inappropriate language / content' };

  const collapsed = collapseRepeats(norm);
  if (checkAll(collapsed))
    return { ok: false, reason: 'Inappropriate language / content' };

  const reversed = norm.split('').reverse().join('');
  if (checkAll(reversed))
    return { ok: false, reason: 'Inappropriate language / content' };

  for (const word of RESERVED) {
    const clean = word.toLowerCase().replace(/[_\-\s]/g, '');
    if (norm === clean || (clean.length >= 4 && norm.includes(clean)))
      return { ok: false, reason: 'Reserved name / impersonation not allowed' };
  }

  return { ok: true };
}

async function aiCheck(username) {
  if (process.env.POLLINATIONS_ENABLED !== 'true') return { ok: true };

  try {
    const prompt = `You are a MAXIMUM STRICTNESS username moderator for the game "TuCoria".
Owners: only "Today_Idk" and "KAMKIN".

Username: "${username}"

Return ONLY JSON (no other text):
{"allow": true/false, "reason": "short english reason"}

INSTANT REJECT if the username contains, hints at, encodes, abbreviates, transliterates, reverses, or creatively disguises ANY of:

1. Any profanity in ANY language (English, Russian, Ukrainian, Spanish, Arabic, Turkish, German, French, Chinese, etc.)
2. Sexual content, genitalia, sex acts, porn, NSFW, "sex", "porn", "xxx", body parts
3. Slurs (racial, homophobic, transphobic, ableist, religious): n-word, f-word, "retard", "tranny", "негр", "жид", "чурка", "пидор" etc.
4. Nazism, fascism, extremism: Hitler, Stalin, SS, 88, 1488, KKK, ISIS, Taliban, Al-Qaeda, swastika
5. Violence: kill, murder, rape, suicide, "kys", "die", hang, lynch, bomb, shoot, stab, "убью", "зарежу", "суицид"
6. Drugs: cocaine, heroin, meth, weed, LSD, MDMA, "наркота", "травка"
7. Pedophilia / CP / loli / shota / any minor sexualization
8. Self-harm, suicide promotion, "kys", cutting
9. Impersonation of authority: admin, owner, creator, moderator, developer, staff, support, system, bot, official (of TuCoria or generally). Reject "TuCoria_Owner", "TuCoriaMod", "AdminHere" etc.
10. Impersonation of owners "Today_Idk" or "KAMKIN" via variations: "Today_ldk" (L not I), "T0day_Idk", "TodayIdk2", "KAMK1N", "K4MKIN", "Kamkin_Real", "TrueKamkin", "Today_Idk_", "ldk_Today"
11. Spam: URLs, domains (.com/.gg/.ru), phone numbers, emails, promo codes, Telegram/Discord invites, "@handle"
12. Gore, death threats, terrorism references
13. Obfuscation attempts: "f_u_c_k", "sh1t", "п.и.д.р", "п и з д", "hUi", "SoSaT", spacing/dots to bypass filters
14. Homoglyphs: latin "o" in place of cyrillic "о" or vice versa to hide bad words
15. Reversed profanity: "kcuf", "tihs", "йух"
16. Numeric codes for hate: 1488, 14, 88, 18, 311, 100%
17. Toxic gaming terms: "ez", "trash", "noob" — ALLOW these (they're normal), but reject "eatshit", "gonoob69" etc.
18. Anything sexualizing children, animals, or non-consenting acts
19. Terrorism praise, mass shooter names (Breivik, Tarrant, etc.)
20. Drugs slang: "420", "weedking", "cokehead", "трипак", "барыга"

ALLOW only if the nickname is 100% clean, creative, and has ZERO bad connotation in any language.

BE PARANOID. If ANY doubt exists — REJECT. False positives are acceptable.
Common safe examples: "Vlad2010", "NightWolf", "Кекс_Крутой", "PixelHunter", "SkyDragon", "MaxPower99".`;

    const url = 'https://text.pollinations.ai/' + encodeURIComponent(prompt) + '?model=openai&json=true&seed=42';
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 12000);

    const res = await fetch(url, { signal: controller.signal });
    clearTimeout(timeout);

    if (!res.ok) return { ok: true };
    const text = await res.text();

    const match = text.match(/\{[\s\S]*?\}/);
    if (!match) return { ok: true };

    const parsed = JSON.parse(match[0]);
    if (parsed.allow === false)
      return { ok: false, reason: parsed.reason || 'Username violates community guidelines' };
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

async function aiCheckExisting(username) {
  return await aiCheck(username);
}

module.exports = { checkUsername, aiCheckExisting, localCheck };