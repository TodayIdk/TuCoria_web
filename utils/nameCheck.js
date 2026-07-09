const HARD_BLOCK_EN = [
  /n[i1!|l]+[gq]{1,}[e3a@]*[rl]*/i,
  /f[a@4]+g+(ot|it)?/i,
  /r[e3]+t[a@4]+rd/i,
  /k[i1]k[e3]/i,
  /ch[i1]nk/i,
  /sp[i1]c/i,
  /tr[a@4]nn[yi]/i,
  /wh[o0]r[e3]/i,
  /\bsl[u\*v]+t/i,
  /b[i1!]+tch/i,
  /c[u\*v]+nt/i,
  /d[i1]+ck/i,
  /p[e3]n[i1]s/i,
  /v[a@4]g[i1]n[a@4]/i,
  /p[u\*v]+ssy/i,
  /b[o0]{2,}b/i,
  /[a@4]ss?h[o0]l[e3]/i,
  /m[o0]th[e3]rf[u\*v]/i,
  /f[u\*v]+[cкk]+[k]?/i,
  /sh[i1!]+t/i,
  /r[a@4]p[e3]/i,
  /p[e3]d[o0]/i,
  /p[e3]d[i1]ph/i,
  /l[o0]l[i1](con)?/i,
  /sh[o0]t[a@4](con)?/i,
  /n[a@4]z[i1]/i,
  /h[i1]tl[e3]r/i,
  /st[a@4]l[i1]n/i,
  /\bis[i1]s\b/i,
  /t[e3]rr[o0]r/i,
  /\bkill/i,
  /murd[e3]r/i,
  /su[i1]c[i1]d[e3]/i,
  /\bkys\b/i,
  /c[o0]c[a@4][i1]n/i,
  /h[e3]r[o0][i1]n/i,
  /\bmeth\b/i,
  /\bw[e3]{2}d\b/i,
  /m[a@4]r[i1]ju[a@4]n/i,
  /\bcp\b/i,
  /p[o0]rn/i,
  /nsfw/i,
  /\bsex+/i,
  /xxx/i,
  /1488/,
  /kkk/i,
  /whit[e3]?p[o0]w[e3]r/i,
  /hang/i,
  /lynch/i,
  /\bbomb/i,
  /tal[i1]ban/i,
  /qa[e3]da/i,
  /18\+/,
  /adult\s*only/i,
  /onlyfans/i,
  /hentai/i,
  /anal/i,
  /oral/i,
  /blowjob/i,
  /handjob/i,
  /jerk/i,
  /masturb/i,
  /orgasm/i,
  /cum+/i,
  /semen/i,
  /nude/i,
  /naked/i,
  /erotic/i,
  /fetish/i,
  /bdsm/i,
  /milf/i,
  /gilf/i,
  /dilf/i,
  /incest/i,
  /rape/i
];

const HARD_BLOCK_RU = [
  /х[уyu]+[йиеeяюiюeйe]/i,
  /х[уy]+[ийл]/i,
  /п[иi]+зд/i,
  /пёзд/i,
  /бл[яa]+[тд]?/i,
  /еб[аaнлушвыa]/i,
  /ёб[аaнлушвыa]/i,
  /еб[уy]+[чщш]?/i,
  /выеб/i,
  /наеб/i,
  /заеб/i,
  /уеб/i,
  /долб[оаe]+[её]+б/i,
  /дое[бп]/i,
  /муд[аи]+[кл]/i,
  /гнид/i,
  /гандон/i,
  /урод/i,
  /даун/i,
  /дебил/i,
  /кретин/i,
  /имбецил/i,
  /сук[аиуе]+/i,
  /шлюх/i,
  /бляд/i,
  /пид[оa]*р/i,
  /пидар/i,
  /педик/i,
  /пед[оa]фил/i,
  /гей+/i,
  /говн/i,
  /гавн/i,
  /жоп/i,
  /член/i,
  /писюн/i,
  /писк[аи]/i,
  /сис[ькь]/i,
  /голы[йе]/i,
  /порн/i,
  /секс+/i,
  /трах/i,
  /минет/i,
  /онанизм/i,
  /дроч/i,
  /кончил/i,
  /сперм/i,
  /нацист/i,
  /фашист/i,
  /гитлер/i,
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
  /суицид/i,
  /повеш/i,
  /героин/i,
  /кокаин/i,
  /мет[аиео]+мф/i,
  /наркот/i,
  /травк[аи]/i,
  /шишк[аи]/i,
  /соси/i,
  /отсос/i,
  /насил/i,
  /изнасил/i,
  /бомб[аи]/i,
  /голая/i,
  /голый/i,
  /порнуха/i,
  /порево/i,
  /ебля/i,
  /ебало/i,
  /мразь/i,
  /падла/i,
  /чмо/i
];

const RESERVED = [
  'owner', 'creator', 'admin', 'administrator', 'moderator', 'mod',
  'developer', 'dev', 'staff', 'support', 'official', 'system',
  'root', 'server', 'bot', 'null', 'undefined', 'anonymous',
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
    .replace(/[_\-\.\s\|\/\\\+\=]/g, '');
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

  const systemPrompt = `You are a strict content moderator. Analyze usernames for a family-friendly game "TuCoria" (owners: Today_Idk, KAMKIN). Reply ONLY with valid JSON: {"allow": boolean, "reason": "short english reason"}. No markdown, no explanation.`;

  const userPrompt = `Username: "${username}"

Reject (allow=false) if it contains, hints at, encodes, transliterates, reverses, or disguises ANY of:
- Profanity/swears in any language (English, Russian, Spanish, Arabic, etc.)
- Sexual/NSFW/18+/adult content, body parts, sex acts, "porn", "sex", "xxx", "18+", "adult", "hentai", "milf", "onlyfans"
- Slurs (racial, homophobic, ableist)
- Nazism, fascism, terrorism, 1488, 88, KKK, SS, ISIS, Hitler
- Violence: kill, murder, rape, suicide, kys, die
- Drugs: cocaine, weed, meth, heroin
- Pedophilia, CP, loli, shota, child sexualization
- Impersonation: admin, mod, owner, staff, developer, bot, system, "TuCoria staff", fake "Today_Idk"/"KAMKIN" variants
- Spam: URLs, phone numbers, promo codes, "@handle", .com/.gg
- Obfuscation to bypass filters: "f_u_c_k", "sh1t", homoglyphs, spacing

Allow only clean creative nicknames like "NightWolf99", "PixelHunter", "Кекс_Крутой".

BE PARANOID. If ANY doubt, reject.`;

  const attempts = [
    async () => {
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
          seed: 42
        }),
        signal: AbortSignal.timeout(12000)
      });
      if (!res.ok) throw new Error('bad status');
      const data = await res.json();
      return data.choices?.[0]?.message?.content || data.content || JSON.stringify(data);
    },
    async () => {
      const full = systemPrompt + '\n\n' + userPrompt;
      const url = 'https://text.pollinations.ai/' + encodeURIComponent(full) + '?model=openai&json=true';
      const res = await fetch(url, { signal: AbortSignal.timeout(12000) });
      if (!res.ok) throw new Error('bad status');
      return await res.text();
    }
  ];

  for (const attempt of attempts) {
    try {
      const raw = await attempt();
      const match = raw.match(/\{[\s\S]*?"allow"[\s\S]*?\}/i);
      if (!match) continue;
      const parsed = JSON.parse(match[0]);
      if (typeof parsed.allow !== 'boolean') continue;
      if (parsed.allow === false)
        return { ok: false, reason: parsed.reason || 'Username violates community guidelines' };
      return { ok: true };
    } catch { continue; }
  }

  return { ok: true };
}

async function checkUsername(username) {
  const local = localCheck(username);
  if (!local.ok) return local;
  const ai = await aiCheck(username);
  if (!ai.ok) return ai;
  return { ok: true };
}

module.exports = { checkUsername, aiCheck, localCheck };