document.addEventListener('DOMContentLoaded', async () => {
  const ownerEls = Array.from(document.querySelectorAll('.owner-only'));
  const deleteButton = document.querySelector('a.delete');
  if (!deleteButton) return;

  // Prefer explicit data-author on delete button, fall back to owner-only elements
  let authorId = deleteButton.dataset.author || (ownerEls[0] && ownerEls[0].dataset.author) || null;

  const token = localStorage.getItem('sb_access_token');
  if (!token) return;

  let userId = null;
  try {
    const res = await fetch('/blogs/whoami', {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    if (!res.ok) return;
    const data = await res.json();
    userId = data.userId || (data.user && data.user.id) || null;
    if (!userId) return;

    if (authorId && userId === authorId) {
      ownerEls.forEach(el => el.style.display = '');
    }
  } catch (err) {
    console.error('Owner check failed:', err);
    return;
  }

  // Attach delete handler (only performs delete when server authorizes)
  deleteButton.addEventListener('click', async (e) => {
    e.preventDefault();

    // Quick client-side check to avoid needless requests
    if (authorId && userId !== authorId) {
      window.alert('Permission denied');
      return;
    }

    try {
      const response = await fetch(`/blogs/${deleteButton.dataset.doc}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (response.status === 401) {
        window.location.href = '/login';
        return;
      }

      const data = await response.json();
      if (data.redirect) window.location.href = data.redirect;
    } catch (err) {
      console.error('Error deleting post:', err);
    }
  });
});
