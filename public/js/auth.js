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
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify(data)
    });
    const json = await res.json().catch(() => ({}));
    return { ok: res.ok, status: res.status, data: json };
  }

  forms.login.addEventListener('submit', async (e) => {
    e.preventDefault();
    errs.login.textContent = '';
    const fd = new FormData(forms.login);
    const btn = forms.login.querySelector('button[type=submit]');
    btn.disabled = true;
    const r = await post('/api/auth/login', {
      login: fd.get('login'),
      password: fd.get('password')
    });
    btn.disabled = false;
    if (!r.ok) return errs.login.textContent = r.data.error || 'Error';
    window.location.href = '/home';
  });

  forms.register.addEventListener('submit', async (e) => {
    e.preventDefault();
    errs.register.textContent = '';
    const fd = new FormData(forms.register);
    const btn = forms.register.querySelector('button[type=submit]');
    btn.disabled = true;
    const r = await post('/api/auth/register', {
      username: fd.get('username'),
      email: fd.get('email'),
      password: fd.get('password')
    });
    btn.disabled = false;
    if (!r.ok) return errs.register.textContent = r.data.error || 'Error';
    window.location.href = '/home';
  });
})();