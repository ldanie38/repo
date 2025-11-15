// background.js (Manifest V3 service worker)
// Handles logout, openLabels, setToken, testApi, setProfileUrl, ping.
// Preferred UX: open packaged extension pages as popup windows; fallback to opening web pages in tabs.

const WEB_LOGIN_URL = "http://localhost:8000/extension/landing/"; // change if needed
const POPUP_PATH = "popup.html";
const POPUP_WIDTH = 420;
const POPUP_HEIGHT = 700;

function safeLog(...args) {
  try { console.log(...args); } catch (e) {}
}

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  safeLog("[BG] received message:", request);

  if (!request || !request.action) {
    sendResponse({ success: false, error: "invalid_message" });
    return;
  }

  // --- LOGOUT ---
  if (request.action === "logout") {
    (async () => {
      try {
        safeLog("[BG] starting logout flow");

        chrome.storage.local.remove(["jwt", "access_token", "refresh_token", "labels"], () => {
          if (chrome.runtime.lastError) {
            console.error("[BG] storage.remove error:", chrome.runtime.lastError);
            sendResponse({ success: false, error: chrome.runtime.lastError.message });
            return;
          }
          safeLog("[BG] cleared storage keys");

          // Try opening packaged popup as a small window
          const popupUrl = chrome.runtime.getURL(POPUP_PATH);
          chrome.windows.create(
            { url: popupUrl, type: "popup", width: POPUP_WIDTH, height: POPUP_HEIGHT, focused: true },
            (win) => {
              if (chrome.runtime.lastError || !win) {
                console.warn("[BG] windows.create(popup) failed:", chrome.runtime.lastError);

                // Fallback: open the web login/landing page in a tab
                chrome.tabs.create({ url: WEB_LOGIN_URL }, (tab2) => {
                  if (chrome.runtime.lastError || !tab2) {
                    console.error("[BG] fallback tabs.create(web_login) failed:", chrome.runtime.lastError);
                    sendResponse({ success: false, error: chrome.runtime.lastError ? chrome.runtime.lastError.message : "failed_to_open" });
                  } else {
                    safeLog("[BG] opened web login tab id", tab2.id);
                    sendResponse({ success: true, opened: "web_login_fallback" });
                  }
                });

                return;
              }

              safeLog("[BG] opened popup window id", win.id);
              sendResponse({ success: true, opened: "popup_window" });
            }
          );
        });
      } catch (err) {
        console.error("[BG] unexpected logout error:", err);
        sendResponse({ success: false, error: String(err) });
      }
    })();

    return true; // keep sendResponse valid asynchronously
  }

  // --- OPEN LABELS (Go back home) ---
  if (request.action === "openLabels") {
    (async () => {
      try {
        const labelsUrl = chrome.runtime.getURL("labels.html");

        chrome.windows.create(
          { url: labelsUrl, type: "popup", width: POPUP_WIDTH, height: POPUP_HEIGHT, focused: true },
          (win) => {
            if (chrome.runtime.lastError || !win) {
              console.warn("[BG] windows.create(labels) failed:", chrome.runtime.lastError);

              // Fallback: open as a tab
              chrome.tabs.create({ url: labelsUrl }, (tab) => {
                if (chrome.runtime.lastError || !tab) {
                  console.error("[BG] tabs.create(labels) failed:", chrome.runtime.lastError);
                  sendResponse({ success: false, error: chrome.runtime.lastError ? chrome.runtime.lastError.message : "failed_to_open_labels" });
                } else {
                  safeLog("[BG] opened labels as tab id", tab.id);
                  sendResponse({ success: true, opened: "tab" });
                }
              });

              return;
            }

            safeLog("[BG] opened labels popup window id", win.id);
            sendResponse({ success: true, opened: "popup_window", windowId: win.id });
          }
        );
      } catch (err) {
        console.error("[BG] unexpected openLabels error:", err);
        sendResponse({ success: false, error: String(err) });
      }
    })();

    return true;
  }

  // --- setToken ---
  if (request.action === "setToken") {
    chrome.storage.local.set({ jwt: request.token || null }, () => {
      if (chrome.runtime.lastError) {
        console.error("[BG] setToken error:", chrome.runtime.lastError);
        sendResponse({ success: false, error: chrome.runtime.lastError.message });
      } else {
        safeLog("[BG] Token saved to storage.");
        sendResponse({ success: true });
      }
    });
    return true;
  }

  // --- ping (sync) ---
  if (request.action === "ping") {
    sendResponse({ success: true, fromBackground: true });
    return;
  }

  // --- testApi ---
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
        sendResponse({ success: false, error: String(err) });
      });

    return true;
  }

  // --- setProfileUrl ---
  if (request.action === "setProfileUrl") {
    chrome.storage.local.set({ profileUrl: request.profileUrl }, () => {
      if (chrome.runtime.lastError) {
        console.error("[BG] setProfileUrl error:", chrome.runtime.lastError);
        sendResponse({ success: false, error: chrome.runtime.lastError.message });
      } else {
        safeLog("[BG] Profile URL saved:", request.profileUrl);
        sendResponse({ success: true });
      }
    });
    return true;
  }

  // Unknown action
  console.warn("[BG] unknown action:", request.action);
  sendResponse({ success: false, error: "unknown_action" });
});
