document.addEventListener('DOMContentLoaded', () => {
  const configEl = document.getElementById('supabase-config');
  const SUPABASE_URL = configEl?.dataset?.url;
  const SUPABASE_ANON_KEY = configEl?.dataset?.key;

  const errorDiv = document.querySelector('#error-message');
  const successDiv = document.querySelector('#success-message');
  const signupErrorDiv = document.querySelector('#signup-error-message');
  const signupSuccessDiv = document.querySelector('#signup-success-message');

  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
    showError(errorDiv, 'Supabase configuration is missing. Please check server environment variables.');
    return;
  }

  const { createClient } = window.supabase;
  const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

  const authContainer = document.querySelector('#auth-container');
  const signupContainer = document.querySelector('#signup-container');
  const toggleSignupBtn = document.querySelector('#toggle-signup');
  const toggleLoginBtn = document.querySelector('#toggle-login');
  const loginForm = document.querySelector('#login-form');
  const signupForm = document.querySelector('#signup-form');
  const loginBtn = document.querySelector('#login-btn');
  const signupBtn = document.querySelector('#signup-btn');

  function showError(div, msg) {
    if (!div) return;
    div.textContent = msg;
    div.classList.remove('hidden');
  }
  function showSuccess(div, msg) {
    if (!div) return;
    div.textContent = msg;
    div.classList.remove('hidden');
  }
  function hideAllMessages() {
    [errorDiv, successDiv, signupErrorDiv, signupSuccessDiv].forEach(d => { if (d) d.classList.add('hidden'); });
  }

  const setLoading = (btn, label) => {
    if (!btn) return;
    if (!btn.dataset.orig) btn.dataset.orig = btn.innerHTML;
    btn.disabled = true;
    btn.innerHTML = `<span class="spinner" aria-hidden="true"></span> ${label}`;
  };
  const clearLoading = (btn) => {
    if (!btn) return;
    btn.disabled = false;
    btn.innerHTML = btn.dataset.orig || btn.textContent || '';
  };

  const titleEl = document.querySelector('.form__title');
  const subtitleEl = document.querySelector('.form__subtitle');
  const LOGIN_TITLE = 'Login to Your Account';
  const LOGIN_SUB = 'Sign in to create and manage your blog posts.';
  const SIGNUP_TITLE = 'Create an account';
  const SIGNUP_SUB = 'Create an account to publish and manage posts.';

  // Toggle to signup view
  toggleSignupBtn?.addEventListener('click', (e) => {
    e.preventDefault();
    authContainer?.classList.add('hidden');
    signupContainer?.classList.remove('hidden');
    hideAllMessages();
    if (titleEl) { titleEl.textContent = SIGNUP_TITLE; }
    if (subtitleEl) { subtitleEl.textContent = SIGNUP_SUB; }
    const el = document.querySelector('#signup-email'); if (el) el.focus();
  });

  // Toggle back to login view
  toggleLoginBtn?.addEventListener('click', (e) => {
    e.preventDefault();
    signupContainer?.classList.add('hidden');
    authContainer?.classList.remove('hidden');
    hideAllMessages();
    if (titleEl) { titleEl.textContent = LOGIN_TITLE; }
    if (subtitleEl) { subtitleEl.textContent = LOGIN_SUB; }
    const el = document.querySelector('#email'); if (el) el.focus();
  });

  // Password toggle (delegated for both forms)
  document.addEventListener('click', (e) => {
    const t = e.target;
    if (!t || !t.classList) return;
    if (t.classList.contains('password-toggle')) {
      const container = t.closest('.password-input');
      const input = container?.querySelector('input[type="password"], input[type="text"]');
      if (!input) return;
      if (input.type === 'password') { input.type = 'text'; t.textContent = 'Hide'; }
      else { input.type = 'password'; t.textContent = 'Show'; }
    }
  });

  // Login form submit
  loginForm?.addEventListener('submit', async (e) => {
    e.preventDefault();
    hideAllMessages();
    const email = loginForm.email.value.trim();
    const password = loginForm.password.value;
    if (!email || !password) { showError(errorDiv, 'Please enter both email and password'); return; }
    setLoading(loginBtn, 'Signing in...');
    try {
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) { showError(errorDiv, error.message || 'Failed to sign in'); clearLoading(loginBtn); return; }
      if (data?.session) {
        localStorage.setItem('sb_access_token', data.session.access_token);
        localStorage.setItem('sb_refresh_token', data.session.refresh_token);
        showSuccess(successDiv, 'Logged in successfully! Redirecting...');
        setTimeout(() => { window.location.href = '/blogs/create'; }, 1200);
      } else { clearLoading(loginBtn); }
    } catch (err) { showError(errorDiv, 'An error occurred: ' + (err.message || err)); clearLoading(loginBtn); }
  });

  // Signup form submit
  signupForm?.addEventListener('submit', async (e) => {
    e.preventDefault();
    hideAllMessages();
    const email = signupForm.email.value.trim();
    const password = signupForm.password.value;
    if (!email || !password) { showError(signupErrorDiv, 'Please enter both email and password'); return; }
    if (password.length < 6) { showError(signupErrorDiv, 'Password must be at least 6 characters'); return; }
    setLoading(signupBtn, 'Creating account...');
    try {
      const { data, error } = await supabase.auth.signUp({ email, password });
      if (error) { showError(signupErrorDiv, error.message || 'Failed to create account'); clearLoading(signupBtn); return; }
      if (data?.user) {
        showSuccess(signupSuccessDiv, 'Account created successfully! Please check your email to confirm, then sign in.');
        signupForm.reset();
        clearLoading(signupBtn);
        setTimeout(() => {
          signupContainer?.classList.add('hidden');
          authContainer?.classList.remove('hidden');
          hideAllMessages();
          if (titleEl) { titleEl.textContent = LOGIN_TITLE; }
          if (subtitleEl) { subtitleEl.textContent = LOGIN_SUB; }
        }, 3000);
      } else { clearLoading(signupBtn); }
    } catch (err) { showError(signupErrorDiv, 'An error occurred: ' + (err.message || err)); clearLoading(signupBtn); }
  });

  // redirect if token present
  if (localStorage.getItem('sb_access_token')) { window.location.href = '/blogs/create'; }
});
