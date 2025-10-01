// background.js

import { pullLabels, pushLabel, updateLabel, deleteLabel } from "./api.js";
import { getLabels, setLabels } from "./storage.js";

const SYNC_FLAG = "_syncing_labels";



chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  // — Handle logout: clear both jwt & labels, then confirm
  if (request.action === "logout") {
    chrome.storage.local.remove(["jwt", "labels"], () => {
      sendResponse({ success: true });
    });
    return true;  // keep the message channel open for async sendResponse
  }

  // — (Optional)  setToken if you’re sending it
  if (request.action === "setToken") {
    // no extra work needed here, but we confirm receipt
    sendResponse({ ok: true });
  }

  //  existing ping handler
  if (request.action === "ping") {
    sendResponse({ fromBackground: true, payload: request.payload });
  }
});


// 1) INSTALL HOOK
chrome.runtime.onInstalled.addListener(() => {
  console.log("FACRM extension installed (background worker ready).");
});

// 2) MESSAGE HANDLER (popup ↔ background)
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === "ping") {
    console.log("Background received ping:", request.payload);
    sendResponse({ reply: "Pong from background!" });
    return;
  }

  if (request.action === "setToken") {
    chrome.storage.local.set({ jwt: request.token }, () => {
      console.log("[CRM] Token saved to storage.");
      sendResponse({ success: true });
    });
    return true;
  }

  if (request.action === "testApi") {
    fetch(request.url, {
      headers: { Authorization: `Bearer ${request.token}` }
    })
      .then(res => res.ok ? res.json() : Promise.reject(res.status))
      .then(data => sendResponse({ success: true, data }))
      .catch(err => sendResponse({ success: false, error: err }));
    return true;
  }
});

// 3) DIFF & PUSH LOCAL CHANGES → BACKEND
chrome.storage.onChanged.addListener((changes, area) => {
  if (area !== "local" || !changes.labels) return;
  if (changes[SYNC_FLAG]?.newValue) return;

  const oldLabels = changes.labels.oldValue || [];
  const newLabels = changes.labels.newValue || [];
  const added   = newLabels.filter(n => !n.id);
  const removed = oldLabels.filter(o => o.id && !newLabels.some(n => n.id === o.id));
  const updated = newLabels.filter(n => {
    const o = oldLabels.find(o => o.id === n.id);
    return o && (o.name !== n.name || o.color !== n.color);
  });

  chrome.storage.local.get(["jwt"], async ({ jwt }) => {
    if (!jwt) return console.warn("No JWT, cannot push label diffs");

    // CREATE
    for (const label of added) {
      try {
        const created = await pushLabel(label, jwt);
        console.log("→ created on server:", created);
        label.id = created.id;
      } catch (err) {
        console.error("Create failed:", err);
      }
    }

    // UPDATE
    for (const label of updated) {
      try {
        await updateLabel(label.id, { name: label.name, color: label.color }, jwt);
        console.log("→ updated on server:", label.id);
      } catch (err) {
        console.error("Update failed:", err);
      }
    }

    // DELETE
    for (const label of removed) {
      try {
        await deleteLabel(label.id, jwt);
        console.log("→ deleted on server:", label.id);
      } catch (err) {
        console.error("Delete failed:", err);
      }
    }

    // PERSIST ALL IDs & STATES BACK TO LOCAL
    console.log("After sync, labels:", newLabels);
    setLabels(newLabels);
  });
});

// 4) PERIODIC PULL & MERGE
chrome.alarms.create("pullLabels", { periodInMinutes: 5 });
chrome.alarms.onAlarm.addListener(alarm => {
  if (alarm.name !== "pullLabels") return;
  chrome.storage.local.get(["jwt"], ({ jwt }) => {
    if (!jwt) return;
    chrome.storage.local.set({ [SYNC_FLAG]: true }, () => {
      pullLabels(jwt)
        .then(remote => getLabels(local => {
          const merged = [
            ...local,
            ...remote.filter(r => !local.some(l => l.name === r.name))
          ];
          setLabels(merged);
        }))
        .catch(err => console.error("Pull failed:", err))
        .finally(() => chrome.storage.local.remove(SYNC_FLAG));
    });
  });
});
