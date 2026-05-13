// Toggle visibility of elements with class 'auth-only' based on presence of sb_access_token
(function () {
  const token = localStorage.getItem('sb_access_token');

  document.querySelectorAll('.auth-only').forEach(el => {
    el.style.display = token ? '' : 'none';
  });

  const loginLink = document.getElementById('nav-login-link');
  if (!loginLink) return;

  if (token) {
    loginLink.innerText = 'Logout';
    loginLink.href = '#';
    loginLink.addEventListener('click', (e) => {
      e.preventDefault();
      localStorage.removeItem('sb_access_token');
      localStorage.removeItem('sb_refresh_token');
      window.location.href = '/';
    });
  } else {
    loginLink.innerText = 'Login';
    loginLink.href = '/login';
  }
})();