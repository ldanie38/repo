document.getElementById('loginBtn').addEventListener('click', async () => {
  const username = document.getElementById('username').value.trim();
  const password = document.getElementById('password').value.trim();
  const statusDiv = document.getElementById('status');

  statusDiv.textContent = 'Logging in...';

  try {
    const res = await fetch('http://localhost:8000/api/auth/login/', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password })
    });
    
    if (!res.ok) {
      throw new Error(`Login failed: ${res.status}`);
    }

    const data = await res.json();
    const token = data.access || data.token; // adjust to your DRF JWT response

    await chrome.storage.local.set({ jwt: token });
    statusDiv.textContent = '✅ Logged in successfully';
  } catch (err) {
    console.error(err);
    statusDiv.textContent = '❌ Login failed';
  }
});
