(() => {
  const usernameEl = document.getElementById('username');
  const uidEl = document.getElementById('uid');
  const logoutBtn = document.getElementById('logoutBtn');

  async function load() {
    try {
      const res = await fetch('/api/user/me', { credentials: 'include' });
      if (!res.ok) return window.location.href = '/auth';
      const u = await res.json();
      usernameEl.textContent = u.username;
      uidEl.textContent = 'ID: ' + u.userId;
    } catch {
      window.location.href = '/auth';
    }
  }

  logoutBtn.addEventListener('click', async () => {
    await fetch('/api/auth/logout', { method: 'POST', credentials: 'include' });
    window.location.href = '/auth';
  });

  load();
})();