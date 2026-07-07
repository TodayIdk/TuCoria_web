(() => {
  const tabs = document.querySelectorAll('.tab');
  const forms = {
    login: document.getElementById('loginForm'),
    register: document.getElementById('registerForm')
  };
  const errs = {
    login: document.getElementById('loginErr'),
    register: document.getElementById('regErr')
  };

  tabs.forEach(t => {
    t.addEventListener('click', () => {
      tabs.forEach(x => x.classList.remove('active'));
      t.classList.add('active');
      Object.values(forms).forEach(f => f.classList.remove('active'));
      forms[t.dataset.tab].classList.add('active');
      Object.values(errs).forEach(e => e.textContent = '');
    });
  });

  async function post(url, data) {
    try {
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(data)
      });
      const json = await res.json().catch(() => ({}));
      return { ok: res.ok, status: res.status, data: json };
    } catch {
      return { ok: false, status: 0, data: { error: 'Network error' } };
    }
  }

  function readForm(form) {
    const u = form.querySelector('input[name=username]');
    const p = form.querySelector('input[name=password]');
    return {
      username: (u?.value || '').trim(),
      password: (p?.value || '').trim()
    };
  }

  forms.login.addEventListener('submit', async (e) => {
    e.preventDefault();
    errs.login.textContent = '';
    const { username, password } = readForm(forms.login);
    if (!username || !password) return errs.login.textContent = 'All fields required';

    const btn = forms.login.querySelector('button[type=submit]');
    btn.disabled = true;
    const r = await post('/api/auth/login', { username, password });
    btn.disabled = false;

    if (!r.ok) return errs.login.textContent = r.data.error || 'Error';
    window.location.href = '/home';
  });

  forms.register.addEventListener('submit', async (e) => {
    e.preventDefault();
    errs.register.textContent = '';
    const { username, password } = readForm(forms.register);
    if (!username || !password) return errs.register.textContent = 'All fields required';

    const btn = forms.register.querySelector('button[type=submit]');
    btn.disabled = true;
    const r = await post('/api/auth/register', { username, password });
    btn.disabled = false;

    if (!r.ok) return errs.register.textContent = r.data.error || 'Error';
    window.location.href = '/home';
  });
})();