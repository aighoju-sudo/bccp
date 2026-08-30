async function updateHomeButtons() {
  try {
    const res = await fetch('/api/session');
    const data = await res.json();
    const loggedIn = !!data.loggedIn;

    document.getElementById('loginButton').style.display = loggedIn ? 'none' : 'block';
    document.getElementById('signupButton').style.display = loggedIn ? 'none' : 'block';
    document.getElementById('chatButton').style.display = loggedIn ? 'block' : 'none';
    document.getElementById('logoutButton').style.display = loggedIn ? 'block' : 'none';

    document.getElementById('status').innerHTML = loggedIn
      ? '로그인된 계정: <strong>' + data.user.username + '</strong>'
      : 'Not logged in';
  } catch (err) {
    console.error('session check failed', err);
    document.getElementById('status').textContent = 'Session check failed';
  }
}

document.getElementById('logoutButton').addEventListener('click', () => {
  window.location.href = '/logout';
});

updateHomeButtons();
