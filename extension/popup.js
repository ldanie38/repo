document.addEventListener('DOMContentLoaded', () => {
  const byId = id => document.getElementById(id);

  // LOGIN
  const loginBtn = byId('loginBtn');
  if (loginBtn) {
    loginBtn.addEventListener('click', async () => {
      const username = byId('username').value.trim();
      const password = byId('password').value.trim();
      const statusDiv = byId('status');

      if (!username || !password) {
        statusDiv.textContent = '❌ Please enter username and password';
        return;
      }

      statusDiv.textContent = 'Logging in...';
      try {
        const res = await fetch('http://localhost:8000/api/auth/login/', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ username, password })
        });
        if (!res.ok) throw new Error(`Login failed: ${res.status}`);

        const data = await res.json();
        const token = data.access || data.token;
        if (!token) throw new Error('No token returned from server');

        await chrome.storage.local.set({ jwt: token });
        statusDiv.textContent = '✅ Logged in successfully';
      } catch (err) {
        console.error(err);
        statusDiv.textContent = '❌ Login failed';
      }
    });
  }

  // TEST API
  const testApiBtn = byId('testApi');
  if (testApiBtn) {
    testApiBtn.addEventListener('click', () => {
      const resultBox = byId('apiResult');
      resultBox.textContent = 'Calling API...';

      chrome.storage.local.get('jwt', ({ jwt }) => {
        if (!jwt) {
          resultBox.textContent = '❌ No token found. Please log in first.';
          return;
        }
        chrome.runtime.sendMessage({ action: 'testApi', token: jwt }, (response) => {
          if (chrome.runtime.lastError) {
            resultBox.textContent = `Extension error: ${chrome.runtime.lastError.message}`;
            return;
          }
          if (response.success) {
            resultBox.textContent = JSON.stringify(response.data, null, 2);
          } else {
            resultBox.textContent = `Error: ${response.error}`;
          }
        });
      });
    });
  }

  // PING
  const pingBtn = byId('pingBtn');
  if (pingBtn) {
    pingBtn.addEventListener('click', () => {
      const output = byId('output');
      output.textContent = 'Sending message to background…';
      chrome.runtime.sendMessage({ action: 'ping', payload: 'Hello from popup!' }, (response) => {
        if (chrome.runtime.lastError) {
          output.textContent = `❌ Error: ${chrome.runtime.lastError.message}`;
          return;
        }
        output.textContent = `✅ Got reply: ${JSON.stringify(response)}`;
      });
    });
  }

  // EXTRA BUTTONS
  const testBtn = byId('testBtn');
  if (testBtn) testBtn.addEventListener('click', () => console.log('Extra Test button clicked'));

  const signupBtn = byId('signupBtn');
  if (signupBtn) signupBtn.addEventListener('click', () => console.log('Sign Up button clicked'));

  const signinBtn = byId('signinBtn');
  if (signinBtn) signinBtn.addEventListener('click', () => console.log('Sign In button clicked'));
});

