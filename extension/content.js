// content.js — runs inside Messenger's page
console.log("[CRM] content.js loaded on", location.href);

let lastSentUrl = null;

/**
 * Extract Messenger profile URL from the chat header and send it to background.js
 */
function sendProfileUrl() {
  // This selector targets either numeric profile.php links or username links in the Messenger header
  const link = document.querySelector('a[href*="/profile.php"], a[href^="/"][role="link"]');
  if (link && link.getAttribute("href")) {
    const profileUrl = "https://facebook.com" + link.getAttribute("href");

    // Only send if it’s different from the last one we sent
    if (profileUrl !== lastSentUrl) {
      lastSentUrl = profileUrl;
      chrome.runtime.sendMessage({ action: "setProfileUrl", profileUrl }, () => {
        console.log("[CRM] Sent profileUrl to background:", profileUrl);
      });
    }
  } else {
    console.log("[CRM] No profile URL found in Messenger DOM.");
  }
}

/**
 * Listen for lead data from background.js and render the sidebar
 */
chrome.runtime.onMessage.addListener((message) => {
  if (message.type === 'LEAD_DETAILS') {
    console.log('[CRM] Received lead details:', message.data);
    renderSidebar(message.data);
  }
});

/**
 * Inject or update the CRM sidebar in Messenger
 */
function renderSidebar(leadData) {
  let sidebar = document.getElementById('crm-sidebar');
  if (!sidebar) {
    sidebar = document.createElement('div');
    sidebar.id = 'crm-sidebar';
    sidebar.style.cssText = `
      position: fixed;
      right: 0;
      top: 0;
      width: 250px;
      height: 100%;
      background: #f5f6f7;
      border-left: 1px solid #ccc;
      padding: 10px;
      overflow-y: auto;
      z-index: 9999;
      font-family: sans-serif;
    `;
    document.body.appendChild(sidebar);
  }

  sidebar.innerHTML = `
    <h3>Lead Details</h3>
    <p><strong>Name:</strong> ${leadData.name || 'N/A'}</p>
    <p><strong>Email:</strong> ${leadData.email || 'N/A'}</p>
    <p><strong>Status:</strong> ${leadData.status || 'N/A'}</p>
    <p><strong>Tags:</strong> ${(leadData.tags || []).join(', ') || 'None'}</p>
    <p><strong>Notes:</strong> ${leadData.notes || '—'}</p>
  `;
}

// Run immediately and observe DOM changes (Messenger is a SPA)
sendProfileUrl();
const observer = new MutationObserver(() => sendProfileUrl());
observer.observe(document.body, { childList: true, subtree: true });
