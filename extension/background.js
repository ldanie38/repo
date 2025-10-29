  // background.js
// Single onMessage listener, async-safe with return true where needed.

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  console.log("[BG] received message:", request);

  // LOGOUT: clear tokens & labels, then respond
  if (request.action === "logout") {
    chrome.storage.local.remove(["jwt", "labels"], () => {
      const err = chrome.runtime.lastError;
      if (err) {
        console.error("[BG] logout clear error:", err);
        sendResponse({ success: false, error: err.message });
      } else {
        console.log("[BG] cleared jwt & labels");
        sendResponse({ success: true });
      }
    });
    return true; // keep channel open for async response
  }

  // SET TOKEN: save jwt token
  if (request.action === "setToken") {
    chrome.storage.local.set({ jwt: request.token }, () => {
      const err = chrome.runtime.lastError;
      if (err) {
        console.error("[BG] setToken error:", err);
        sendResponse({ success: false, error: err.message });
      } else {
        console.log("[BG] Token saved to storage.");
        sendResponse({ success: true });
      }
    });
    return true;
  }

  // PING (sync)
  if (request.action === "ping") {
    sendResponse({ fromBackground: true, payload: request.payload || null });
    return; // synchronous
  }

  // TEST API (async fetch)
  if (request.action === "testApi") {
    fetch(request.url, {
      headers: { Authorization: `Bearer ${request.token}` }
    })
      .then(res => {
        if (!res.ok) throw new Error(`API request failed: ${res.status}`);
        return res.json();
      })
      .then(data => sendResponse({ success: true, data }))
      .catch(err => {
        console.error("[BG] API error:", err);
        sendResponse({ success: false, error: err.toString() });
      });

    return true;
  }

  // SET PROFILE URL (fixed)
  if (request.action === "setProfileUrl") {
    chrome.storage.local.set({ profileUrl: request.profileUrl }, () => {
      const err = chrome.runtime.lastError;
      if (err) {
        console.error("[BG] setProfileUrl error:", err);
        sendResponse({ success: false, error: err.message });
      } else {
        console.log("[BG] Profile URL saved:", request.profileUrl);
        sendResponse({ success: true });
      }
    });
    return true;
  }

  // unknown action
  sendResponse({ success: false, error: "unknown_action" });
});
