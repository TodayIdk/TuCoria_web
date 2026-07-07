(() => {
  const card = document.getElementById('profileCard');
  const notFound = document.getElementById('notFound');
  const avatar = document.getElementById('avatar');
  const usernameEl = document.getElementById('username');
  const uidEl = document.getElementById('uid');
  const createdEl = document.getElementById('createdAt');
  const lastLoginEl = document.getElementById('lastLogin');

  function getIdFromPath() {
    const parts = window.location.pathname.split('/').filter(Boolean);
    return parts[1];
  }

  function fmtDate(iso) {
    if (!iso) return '—';
    const d = new Date(iso);
    return d.toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' });
  }

  async function load() {
    const id = getIdFromPath();
    if (!id) return showNotFound();

    try {
      const res = await fetch('/api/user/' + encodeURIComponent(id));
      if (res.status === 404) return showNotFound();
      if (!res.ok) return showNotFound();

      const u = await res.json();
      document.title = 'TuCoria — ' + u.username;
      avatar.textContent = u.username.charAt(0).toUpperCase();
      usernameEl.textContent = u.username;
      uidEl.textContent = 'ID: ' + u.userId;
      createdEl.textContent = fmtDate(u.createdAt);
      lastLoginEl.textContent = fmtDate(u.lastLogin);
    } catch {
      showNotFound();
    }
  }

  function showNotFound() {
    card.style.display = 'none';
    notFound.style.display = 'block';
  }

  load();
})();