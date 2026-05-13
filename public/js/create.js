// Handles create form submission and auth gating
document.addEventListener('DOMContentLoaded', () => {
  const token = localStorage.getItem('sb_access_token');
  if (!token) {
    // Redirect unauthenticated users to login (no popup)
    window.location.href = '/login';
    return;
  }

  const createForm = document.querySelector('#create-form');
  const errorDiv = document.getElementById('create-error');
  if (!createForm) return;

  createForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    errorDiv.style.display = 'none';

    const formData = new FormData(createForm);

    try {
      const response = await fetch('/blogs', {
        method: 'POST',
        body: formData,
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        window.location.href = '/blogs';
        return;
      }

      const text = await response.text();
      let msg = text;
      try { msg = JSON.parse(text).error || text; } catch (e) {}

      errorDiv.innerText = typeof msg === 'string' ? msg : JSON.stringify(msg);
      errorDiv.style.display = 'block';

      if (response.status === 401) {
        window.location.href = '/login';
      }
    } catch (err) {
      console.error(err);
      errorDiv.innerText = 'An unexpected error occurred';
      errorDiv.style.display = 'block';
    }
  });
});