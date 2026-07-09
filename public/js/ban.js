(() => {
  const el = {
    card: document.getElementById('banCard'),
    icon: document.getElementById('banIcon'),
    badge: document.getElementById('banBadge'),
    title: document.getElementById('banTitle'),
    message: document.getElementById('banMessage'),
    username: document.getElementById('banUsername'),
    userId: document.getElementById('banUserId'),
    date: document.getElementById('banDate'),
    expiresRow: document.getElementById('expiresRow'),
    expires: document.getElementById('banExpires'),
    severity: document.getElementById('banSeverity'),
    reason: document.getElementById('banReason'),
    acknowledge: document.getElementById('acknowledgeBtn')
  };

  let banData = null;
  let countdownTimer = null;

  const TYPE_CONFIG = {
    warn: { icon: '!', badge: 'Warning', title: 'Friendly Warning' },
    temp: { icon: '⏱', badge: 'Temporary Ban', title: 'Account Restricted' },
    permanent: { icon: '✕', badge: 'Permanent Ban', title: 'Account Disabled' },
    auto_renamed: { icon: '✓', badge: 'Auto-Renamed', title: 'Username Changed' }
  };

  function fmtDate(d) {
    if (!d) return '—';
    return new Date(d).toLocaleString('en-US', {
      day: 'numeric', month: 'short', year: 'numeric',
      hour: '2-digit', minute: '2-digit'
    });
  }

  function fmtRemaining(ms) {
    if (ms <= 0) return '0s';
    const s = Math.floor(ms / 1000);
    const h = Math.floor(s / 3600);
    const m = Math.floor((s % 3600) / 60);
    const sec = s % 60;
    if (h > 0) return `${h}h ${m}m ${sec}s`;
    if (m > 0) return `${m}m ${sec}s`;
    return `${sec}s`;
  }

  function updateCountdown() {
    if (!banData || !banData.banExpiresAt) return;
    const remaining = new Date(banData.banExpiresAt).getTime() - Date.now();
    if (remaining <= 0) {
      el.expires.textContent = 'Unlocked — refreshing...';
      clearInterval(countdownTimer);
      setTimeout(() => window.location.href = '/home', 1500);
      return;
    }
    el.expires.textContent = fmtRemaining(remaining);
    el.expires.classList.add('countdown');
  }

  async function load() {
    try {
      const r = await fetch('/api/auth/ban-info', { credentials: 'include' });
      if (r.status === 401) return window.location.href = '/auth';
      const d = await r.json();

      if (d.expired) return window.location.href = '/home';
      if (!r.ok) return window.location.href = '/auth';

      banData = d;
      const cfg = TYPE_CONFIG[d.banType] || TYPE_CONFIG.temp;

      el.card.classList.add(d.banType);
      el.icon.textContent = cfg.icon;
      el.badge.textContent = cfg.badge;
      el.title.textContent = cfg.title;
      el.message.textContent = d.banMessage || 'Your account has been reviewed by our AI moderator.';
      el.username.textContent = d.username;
      el.userId.textContent = '#' + d.userId;
      el.date.textContent = fmtDate(d.bannedAt);
      el.reason.textContent = d.banReason || '—';
      el.severity.textContent = (d.severity || '—') + ' / 10';

      if (d.banExpiresAt) {
        el.expiresRow.style.display = 'flex';
        updateCountdown();
        countdownTimer = setInterval(updateCountdown, 1000);
      } else {
        el.expiresRow.style.display = 'none';
      }

      if (d.banType === 'permanent') {
        el.acknowledge.textContent = 'Log Out';
      } else if (d.banType === 'warn') {
        el.acknowledge.textContent = 'I Understand — Log Out';
      } else {
        el.acknowledge.textContent = 'Log Out and Wait';
      }
    } catch {
      window.location.href = '/auth';
    }
  }

  el.acknowledge.addEventListener('click', async () => {
    el.acknowledge.disabled = true;
    try {
      await fetch('/api/auth/acknowledge-ban', { method: 'POST', credentials: 'include' });
    } catch {}
    window.location.href = '/auth';
  });

  load();
})();