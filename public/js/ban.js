(() => {
  const el = {
    username: document.getElementById('banUsername'),
    userId: document.getElementById('banUserId'),
    date: document.getElementById('banDate'),
    reason: document.getElementById('banReason'),
    newUsername: document.getElementById('newUsername'),
    err: document.getElementById('banErr'),
    submit: document.getElementById('submitBtn'),
    logout: document.getElementById('logoutBtn'),
    captcha: document.getElementById('banCaptcha')
  };

  let siteKey = null;
  let widgetId = null;

  function fmtDate(d) {
    if (!d) return '—';
    return new Date(d).toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' });
  }

  async function loadInfo() {
    try {
      const r = await fetch('/api/auth/ban-info', { credentials: 'include' });
      if (!r.ok) return window.location.href = '/auth';
      const d = await r.json();
      el.username.textContent = d.username;
      el.userId.textContent = '#' + d.userId;
      el.date.textContent = fmtDate(d.bannedAt);
      el.reason.textContent = d.banReason || 'Username violates community guidelines';
    } catch { window.location.href = '/auth'; }
  }

  async function loadConfig() {
    try {
      const r = await fetch('/api/auth/config');
      const d = await r.json();
      siteKey = d.turnstileSiteKey;
      if (siteKey) waitTurnstile();
    } catch {}
  }

  function waitTurnstile() {
    if (window.turnstile) return renderCaptcha();
    const t = setInterval(() => { if (window.turnstile) { clearInterval(t); renderCaptcha(); } }, 100);
  }

  function renderCaptcha() {
    widgetId = window.turnstile.render(el.captcha, { sitekey: siteKey, theme: 'light', size: 'flexible' });
  }

  function getToken() {
    if (!siteKey || widgetId === null) return '';
    return window.turnstile.getResponse(widgetId) || '';
  }

  el.submit.addEventListener('click', async () => {
    el.err.textContent = '';
    const newUsername = el.newUsername.value.trim();
    if (!newUsername) return el.err.textContent = 'Enter new username';
    if (newUsername.length < 4) return el.err.textContent = 'Minimum 4 characters';

    const turnstileToken = getToken();
    if (siteKey && !turnstileToken) return el.err.textContent = 'Please complete the captcha';

    el.submit.disabled = true;
    try {
      const r = await fetch('/api/auth/change-username', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ newUsername, turnstileToken })
      });
      const d = await r.json();
      if (!r.ok) {
        el.err.textContent = d.error || 'Error';
        if (siteKey && widgetId !== null) window.turnstile.reset(widgetId);
        return;
      }
      window.location.href = '/home';
    } catch {
      el.err.textContent = 'Network error';
    } finally {
      el.submit.disabled = false;
    }
  });

  el.logout.addEventListener('click', async () => {
    await fetch('/api/auth/logout', { method: 'POST', credentials: 'include' });
    window.location.href = '/auth';
  });

  loadInfo();
  loadConfig();
})();