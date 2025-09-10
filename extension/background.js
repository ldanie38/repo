chrome.runtime.onInstalled.addListener(() => {
  console.log('FACRM extension installed (Base Project Scaffold).');
});

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  // PING HANDLER
  if (request.action === 'ping') {
    console.log('Background received ping:', request.payload);
    sendResponse({ reply: 'Pong from background!' });
    return; // no async work here
  }

  // TEST API HANDLER
  if (request.action === 'testApi') {
    console.log('Background received testApi request');

    fetch('http://localhost:8000/api/v1/leads/', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
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
});

