// Helper to get element by ID
const byId = id => document.getElementById(id);

document.addEventListener('DOMContentLoaded', () => {
  // LOGIN
  const loginBtn = byId('loginBtn');
  if (loginBtn) {
    loginBtn.addEventListener('click', async () => {
      const username = byId('username').value.trim();
      const password = byId('password').value.trim();
      const statusDiv = byId('status');

      if (!username || !password) {
        statusDiv.textContent = '❌ Please enter username and password';
        statusDiv.className = 'status error';
        return;
      }

      statusDiv.textContent = 'Logging in...';
      statusDiv.className = 'status';

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
        statusDiv.className = 'status success';

        // Open landing page in a new tab
        chrome.tabs.create({ url: "http://localhost:8000/extension/landing/" });

      } catch (err) {
        console.error(err);
        statusDiv.textContent = '❌ Login failed';
        statusDiv.className = 'status error';
      }
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

  // Load lead info + jobs
  function loadLeadAndJobs() {
    chrome.storage.local.get(['jwt', 'profileUrl'], ({ jwt, profileUrl }) => {
      const leadInfoEl = byId('leadInfo');
      const jobsEl = byId('jobsContainer');

      if (!jwt) {
        leadInfoEl.textContent = 'Please log in to see lead info.';
        jobsEl.textContent = 'Please log in to see automation jobs.';
        return;
      }
      if (!profileUrl) {
        leadInfoEl.textContent = 'Open a Messenger chat to load lead info.';
        jobsEl.textContent = 'Waiting for profile URL…';
        return;
      }

      // Fetch Lead Info
      fetch(`http://localhost:8000/api/leads/?profile_url=${encodeURIComponent(profileUrl)}`, {
        headers: { Authorization: `Bearer ${jwt}` }
      })
        .then(res => res.json())
        .then(data => {
          const lead = Array.isArray(data) ? data[0] : data;
          if (!lead) {
            leadInfoEl.textContent = 'No lead found for this profile.';
            return;
          }

          const tags = Array.isArray(lead.tags)
            ? lead.tags.map(tag => `<span style="color:${tag.color}">${tag.name}</span>`).join(', ')
            : '—';

          leadInfoEl.innerHTML = `
            <strong>${lead.name || '—'}</strong><br>
            <em>Stage: ${lead.pipeline_stage?.name || '—'}</em><br>
            Tags: ${tags || '—'}<br>
            Notes: ${lead.notes || '—'}
          `;
        })
        .catch(err => {
          console.error(err);
          leadInfoEl.textContent = '❌ Failed to fetch lead data.';
        });

      // Fetch Automation Jobs
      fetch('http://localhost:8000/api/automation-jobs/', {
        headers: { Authorization: `Bearer ${jwt}` }
      })
        .then(res => res.json())
        .then(jobs => {
          if (!Array.isArray(jobs) || jobs.length === 0) {
            jobsEl.textContent = 'No automation jobs found.';
            return;
          }
          jobsEl.innerHTML = jobs.map(job => `
            <div>
              <strong>${job.job_type}</strong> — ${job.status}<br>
              Progress: ${job.progress}%
            </div>
          `).join('');
        })
        .catch(err => {
          console.error(err);
          jobsEl.textContent = '❌ Failed to fetch jobs.';
        });
    });
  }

  // Run once on popup open
  loadLeadAndJobs();

  // Re-run whenever jwt or profileUrl changes
  chrome.storage.onChanged.addListener((changes, area) => {
    if (area === 'local' && (changes.jwt || changes.profileUrl)) {
      loadLeadAndJobs();
    }
  });
});
