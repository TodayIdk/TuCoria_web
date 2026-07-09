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
  const captchas = {
    login: document.getElementById('loginCaptcha'),
    register: document.getElementById('registerCaptcha')
  };

  let siteKey = null;
  const widgetIds = { login: null, register: null };

  tabs.forEach(t => {
    t.addEventListener('click', () => {
      tabs.forEach(x => x.classList.remove('active'));
      t.classList.add('active');
      Object.values(forms).forEach(f => f.classList.remove('active'));
      forms[t.dataset.tab].classList.add('active');
      Object.values(errs).forEach(e => e.textContent = '');
    });
  });

  async function loadConfig() {
    try {
      const r = await fetch('/api/auth/config');
      const d = await r.json();
      siteKey = d.turnstileSiteKey;
      if (siteKey) waitForTurnstile();
    } catch {}
  }

  function waitForTurnstile() {
    if (window.turnstile) return renderCaptchas();
    const t = setInterval(() => {
      if (window.turnstile) { clearInterval(t); renderCaptchas(); }
    }, 100);
  }

  function renderCaptchas() {
    for (const key of ['login', 'register']) {
      widgetIds[key] = window.turnstile.render(captchas[key], {
        sitekey: siteKey,
        theme: 'light',
        size: 'flexible'
      });
    }
  }

  function getToken(key) {
    if (!siteKey || widgetIds[key] === null) return '';
    return window.turnstile.getResponse(widgetIds[key]) || '';
  }

  function resetCaptcha(key) {
    if (siteKey && widgetIds[key] !== null) window.turnstile.reset(widgetIds[key]);
  }

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
      password: p?.value || ''
    };
  }

  async function submit(key, url) {
    const form = forms[key];
    errs[key].textContent = '';
    const { username, password } = readForm(form);
    if (!username || !password) return errs[key].textContent = 'All fields required';
  
    const turnstileToken = getToken(key);
    if (siteKey && !turnstileToken) return errs[key].textContent = 'Please complete the captcha';
  
    const btn = form.querySelector('button[type=submit]');
    btn.disabled = true;
    const r = await post(url, { username, password, turnstileToken });
    btn.disabled = false;
  
    if (r.status === 403 && r.data.error === 'banned') {
      window.location.href = '/ban';
      return;
    }
  
    if (!r.ok) {
      errs[key].textContent = r.data.error || 'Error';
      resetCaptcha(key);
      return;
    }
    window.location.href = '/home';
  }
  
  forms.login.addEventListener('submit', e => { e.preventDefault(); submit('login', '/api/auth/login'); });
  forms.register.addEventListener('submit', e => { e.preventDefault(); submit('register', '/api/auth/register'); });

  loadConfig();
})();