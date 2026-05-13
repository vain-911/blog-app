document.addEventListener('DOMContentLoaded', () => {
  const token = localStorage.getItem('sb_access_token');
  if (!token) {
    window.location.href = '/login';
    return;
  }

  const editForm = document.querySelector('#edit-form');
  const errorDiv = document.getElementById('edit-error');
  if (!editForm) return;

  const id = editForm.dataset.doc;
  const endpoint = `/blogs/${id}`;

  editForm.addEventListener('submit', (e) => {
    e.preventDefault();
    errorDiv.style.display = 'none';

    const formData = new FormData(editForm);

    fetch(endpoint, {
      method: 'PUT',
      body: formData,
      headers: {
        'Authorization': `Bearer ${token}`
      }
    }).then(async (response) => {
      if (response.status === 401) {
        window.location.href = '/login';
        return;
      }
      if (response.status === 403) {
        errorDiv.innerText = 'You do not have permission to edit this post';
        errorDiv.style.display = 'block';
        throw new Error('Forbidden');
      }
      const data = await response.json();
      if (data.redirect) {
        window.location.href = data.redirect;
      }
    }).catch(err => {
      console.error(err);
      if (!errorDiv.innerText) {
        errorDiv.innerText = 'An unexpected error occurred';
        errorDiv.style.display = 'block';
      }
    });
  });
});