const form = document.getElementById('signupForm');
const errorBox = document.getElementById('error');

form.addEventListener('submit', async function (event) {
  event.preventDefault();
  errorBox.textContent = '';

  const username = document.getElementById('username').value.trim();
  const password = document.getElementById('password').value.trim();

  try {
    const res = await fetch('/api/signup', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password })
    });

    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.error || 'Signup failed');
    }

    window.location.href = '/chat';
  } catch (err) {
    errorBox.textContent = err.message;
  }
});
