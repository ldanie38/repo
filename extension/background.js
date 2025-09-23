chrome.runtime.onInstalled.addListener(() => {
  console.log('FACRM extension installed.');
});

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  // PING HANDLER
  if (request.action === 'ping') {
    console.log('Background received ping:', request.payload);
    sendResponse({ reply: 'Pong from background!' });
    return; // synchronous response
  }

  // SAVE TOKEN HANDLER (from popup after login)
  if (request.action === 'setToken') {
    chrome.storage.local.set({ jwt: request.token }, () => {
      console.log('[CRM] Token saved to storage.');
      sendResponse({ success: true });
    });
    return true; // keep message channel open for async sendResponse
  }

  // TEST API HANDLER
  if (request.action === 'testApi') {
    console.log('Background received testApi request');

    fetch('http://localhost:8000/api/leads/', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${request.token}`
      }
    })
      .then(res => {
        if (!res.ok) throw new Error(`API request failed: ${res.status}`);
        return res.json();
      })
      .then(data => {
        console.log('API response:', data);
        sendResponse({ success: true, data });
      })
      .catch(err => {
        console.error('API error:', err);
        sendResponse({ success: false, error: err.toString() });
      });

    return true; // keep channel open for async sendResponse
  }

  // PROFILE URL HANDLER (from content.js)
  if (request.action === 'setProfileUrl') {
    chrome.storage.local.set({ profileUrl: request.profileUrl }, () => {
      console.log('[CRM] Profile URL saved:', request.profileUrl);
      sendResponse({ success: true });
    });
    return true;
  }

  // FETCH LEAD DETAILS HANDLER
  if (request.action === 'fetchLeadDetails') {
    chrome.storage.local.get(['jwt', 'profileUrl'], ({ jwt, profileUrl }) => {
      if (!jwt || !profileUrl) {
        sendResponse({ success: false, error: 'Missing token or profile URL' });
        return;
      }
      fetch(`http://localhost:8000/api/leads/?profile_url=${encodeURIComponent(profileUrl)}`, {
        headers: { Authorization: `Bearer ${jwt}` }
      })
        .then(res => {
          if (!res.ok) throw new Error(`Lead fetch failed: ${res.status}`);
          return res.json();
        })
        .then(data => {
          sendResponse({ success: true, data });
        })
        .catch(err => {
          console.error('Lead fetch error:', err);
          sendResponse({ success: false, error: err.toString() });
        });
    });
    return true;
  }
});
