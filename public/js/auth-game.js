(() => {
  const params = new URLSearchParams(window.location.search);
  const gameToken = params.get('token');

  function showState(id) {
    ['loadingState', 'loginRequired', 'authorizeState', 'doneState', 'errorState']
      .forEach(s => {
        const el = document.getElementById(s);
        if (el) el.style.display = 'none';
      });
    const target = document.getElementById(id);
    if (target) target.style.display = 'block';
  }

  function showError(text) {
    const el = document.getElementById('errorText');
    if (el) el.textContent = text;
    showState('errorState');
  }

  async function init() {
    if (!gameToken || gameToken.length < 16) {
      showError('Invalid or missing token.');
      return;
    }

    try {
      const res = await fetch('/api/user/me', { credentials: 'include' });
      if (!res.ok) {
        showState('loginRequired');
        return;
      }
      const user = await res.json();
      const display = document.getElementById('userDisplay');
      if (display) display.textContent = '@' + user.username + ' (ID: ' + user.userId + ')';
      showState('authorizeState');
    } catch {
      showState('loginRequired');
    }
  }

  async function approveAuth() {
    const btn = document.getElementById('authorizeBtn');
    const msg = document.getElementById('statusMsg');
    if (btn) btn.disabled = true;
    if (msg) { msg.textContent = 'Authorizing...'; msg.className = 'status-msg'; }

    try {
      const res = await fetch('/api/auth/game-authorize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ token: gameToken })
      });
      const data = await res.json();

      if (res.ok && data.ok) {
        showState('doneState');
      } else {
        if (msg) { msg.textContent = data.error || 'Authorization failed'; msg.className = 'status-msg error'; }
        if (btn) btn.disabled = false;
      }
    } catch {
      if (msg) { msg.textContent = 'Network error'; msg.className = 'status-msg error'; }
      if (btn) btn.disabled = false;
    }
  }

  function denyAuth() {
    window.close();
    setTimeout(() => { window.location.href = '/home'; }, 500);
  }

  // Bind events
  const authorizeBtn = document.getElementById('authorizeBtn');
  const denyBtn = document.getElementById('denyBtn');
  if (authorizeBtn) authorizeBtn.addEventListener('click', approveAuth);
  if (denyBtn) denyBtn.addEventListener('click', denyAuth);

  init();
})();