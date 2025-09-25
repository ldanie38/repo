// background.js
// FACRM background service worker

import { pullLabels, pushLabel } from "./api.js";
import { getLabels, setLabels } from "./storage.js";

// On install
chrome.runtime.onInstalled.addListener(() => {
  console.log("FACRM extension installed (background worker ready).");
});

// ----------------------
// MESSAGE HANDLERS
// ----------------------
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  // PING HANDLER
  if (request.action === "ping") {
    console.log("Background received ping:", request.payload);
    sendResponse({ reply: "Pong from background!" });
    return;
  }

  // SAVE TOKEN HANDLER (from popup after login)
  if (request.action === "setToken") {
    chrome.storage.local.set({ jwt: request.token }, () => {
      console.log("[CRM] Token saved to storage.");
      sendResponse({ success: true });
    });
    return true;
  }

  // TEST API HANDLER
  if (request.action === "testApi") {
    console.log("Background received testApi request");

    fetch("http://localhost:8000/api/leads/", {
      method: "GET",
      headers: {
        Authorization: `Bearer ${request.token}`,
      },
    })
      .then((res) => {
        if (!res.ok) throw new Error(`API request failed: ${res.status}`);
        return res.json();
      })
      .then((data) => {
        console.log("API response:", data);
        sendResponse({ success: true, data });
      })
      .catch((err) => {
        console.error("API error:", err);
        sendResponse({ success: false, error: err.toString() });
      });

    return true;
  }

  // PROFILE URL HANDLER (from content.js)
  if (request.action === "setProfileUrl") {
    chrome.storage.local.set({ profileUrl: request.profileUrl }, () => {
      console.log("[CRM] Profile URL saved:", request.profileUrl);
      sendResponse({ success: true });
    });
    return true;
  }

  // FETCH LEAD DETAILS HANDLER
  if (request.action === "fetchLeadDetails") {
    chrome.storage.local.get(["jwt", "profileUrl"], ({ jwt, profileUrl }) => {
      if (!jwt || !profileUrl) {
        sendResponse({ success: false, error: "Missing token or profile URL" });
        return;
      }
      fetch(
        `http://localhost:8000/api/leads/?profile_url=${encodeURIComponent(
          profileUrl
        )}`,
        {
          headers: { Authorization: `Bearer ${jwt}` },
        }
      )
        .then((res) => {
          if (!res.ok) throw new Error(`Lead fetch failed: ${res.status}`);
          return res.json();
        })
        .then((data) => {
          sendResponse({ success: true, data });
        })
        .catch((err) => {
          console.error("Lead fetch error:", err);
          sendResponse({ success: false, error: err.toString() });
        });
    });
    return true;
  }
});

// ----------------------
// HYBRID LABELS SYNC
// ----------------------

// Listen for local label changes and push to backend
chrome.storage.onChanged.addListener((changes, area) => {
  if (area === "local" && changes.labels) {
    console.log("Labels changed locally, pushing to backend...");
    chrome.storage.local.get(["jwt"], async ({ jwt }) => {
      if (!jwt) {
        console.warn("No JWT, cannot push labels");
        return;
      }
      getLabels(async (labels) => {
        for (const label of labels) {
          try {
            await pushLabel(label, jwt); // push one by one
            console.log("Label pushed:", label.name || JSON.stringify(label));
          } catch (err) {
            console.error("Push failed:", err);
          }
        }
      });
    });
  }
});

// Periodically pull labels from backend
chrome.alarms.create("pullLabels", { periodInMinutes: 5 });

chrome.alarms.onAlarm.addListener((alarm) => {
  if (alarm.name === "pullLabels") {
    chrome.storage.local.get(["jwt"], async ({ jwt }) => {
      if (!jwt) return;
      try {
        // list_labels returns an array, not { labels: [...] }
        const remoteLabels = await pullLabels(jwt);

        getLabels((local) => {
          const merged = [
            ...local,
            ...remoteLabels.filter(
              (r) => !local.some((l) => l.name === r.name)
            ),
          ];
          setLabels(merged);
        });

        console.log("Labels pulled and merged from backend");
      } catch (err) {
        console.error("Pull failed:", err);
      }
    });
  }
});

