// Helper to get element by ID
const byId = id => document.getElementById(id);

const baseURL = "http://localhost:8000"; // change if needed
const api = {
  labelsList: `${baseURL}/api/labels/`,
  labelsCreate: `${baseURL}/api/labels/create/`,
  labelsUpdate: `${baseURL}/api/labels/update/`,
  labelsDelete: `${baseURL}/api/labels/delete/`
};

document.addEventListener("DOMContentLoaded", () => {
  //
  // Show Labels toggle
  //
  const showToggle = byId("showLabelsToggle");
  if (showToggle) {
    showToggle.addEventListener("change", function () {
      console.log(this.checked ? "Labels ON" : "Labels OFF");
      chrome.storage.local.set({ showLabels: this.checked });
    });
    chrome.storage.local.get('showLabels', ({ showLabels }) => {
      if (typeof showLabels === 'boolean') showToggle.checked = showLabels;
    });
  }

  //
  // Login wiring
  //
  const loginBtn = byId('loginBtn');
  const usernameInput = byId('username');
  const passwordInput = byId('password');
  const statusEl = byId('status');
  const loginSection = byId('loginSection');
  const labelsSection = byId('labelsSection');

  if (loginBtn) {
    loginBtn.addEventListener('click', async () => {
      const user = (usernameInput && usernameInput.value || '').trim();
      const pass = (passwordInput && passwordInput.value || '').trim();
      if (!user || !pass) {
        if (statusEl) statusEl.textContent = 'Enter username and password';
        return;
      }
      if (statusEl) statusEl.textContent = 'Logging in...';

      try {
        // Try with username field first
        let res = await fetch(`${baseURL}/api/auth/login/`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ username: user, password: pass })
        });

        // If 401, try email payload (some backends expect email)
        if (res.status === 401) {
          res = await fetch(`${baseURL}/api/auth/login/`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email: user, password: pass })
          });
        }

        if (!res.ok) {
          const txt = await res.text().catch(() => '<no body>');
          console.error('login failed', res.status, txt);
          if (statusEl) statusEl.textContent = `Login failed: ${res.status}`;
          return;
        }

        const body = await res.json().catch(() => null);
        const token = body && (body.access || body.token || body.jwt || body.data?.token || body?.access_token);
        if (!token) {
          console.warn('No token found in response', body);
          if (statusEl) statusEl.textContent = 'Login response missing token';
          return;
        }

        chrome.storage.local.set({ jwt: token }, () => {
          console.log('[CRM] Token saved to storage.');
          // Inform background (optional)
          try {
            chrome.runtime.sendMessage({ action: 'setToken', token }, (resp) => {
              console.log('background setToken reply', resp);
            });
          } catch (e) {
            console.warn('sendMessage setToken failed', e);
          }
        });

        if (statusEl) statusEl.textContent = 'Login successful';

        if (loginSection) loginSection.style.display = 'none';
        if (labelsSection) labelsSection.style.display = 'block';

        if (typeof loadLabels === 'function') loadLabels(token);
      } catch (err) {
        console.error('Login error', err);
        if (statusEl) statusEl.textContent = 'Network error';
      }
    });
  }

  //
  // Ping button wiring
  //
  const pingBtn = byId('pingBtn');
  if (pingBtn) {
    pingBtn.addEventListener('click', () => {
      chrome.runtime.sendMessage({ action: 'ping', payload: 'from popup' }, (response) => {
        if (chrome.runtime.lastError) {
          console.error('sendMessage error', chrome.runtime.lastError);
          alert('Failed to send message to background');
          return;
        }
        console.log('ping response', response);
        const out = byId('output');
        if (out) out.textContent = JSON.stringify(response);
      });
    });
  }

  //
  // Drag & Drop for .feature items
  //
  const featuresContainer = document.querySelector(".features");
  if (featuresContainer) {
    const featureItems = document.querySelectorAll(".feature");
    featureItems.forEach((item) => {
      item.setAttribute("draggable", "true");
      item.addEventListener("dragstart", () => item.classList.add("dragging"));
      item.addEventListener("dragend", () => item.classList.remove("dragging"));
    });

    featuresContainer.addEventListener("dragover", (e) => {
      e.preventDefault();
      const afterElement = getDragAfterElement(featuresContainer, e.clientY);
      const dragging = document.querySelector(".dragging");
      if (!afterElement) {
        featuresContainer.appendChild(dragging);
      } else {
        featuresContainer.insertBefore(dragging, afterElement);
      }
    });

    function getDragAfterElement(container, y) {
      const draggableElements = [
        ...container.querySelectorAll(".feature:not(.dragging)"),
      ];
      return draggableElements.reduce(
        (closest, child) => {
          const box = child.getBoundingClientRect();
          const offset = y - box.top - box.height / 2;
          if (offset < 0 && offset > closest.offset) {
            return { offset, element: child };
          }
          return closest;
        },
        { offset: Number.NEGATIVE_INFINITY }
      ).element;
    }
  }

  //
  // Brush icon color picker
  //
  const colorInput = byId("newLabelColorInput");
  const brushIcon = document.querySelector(".brush-icon");
  if (colorInput && brushIcon) {
    brushIcon.addEventListener("click", () => colorInput.click());
    colorInput.addEventListener("input", () => {
      brushIcon.style.color = colorInput.value;
    });
  }

  //
  // Create Label (name + color) and render instantly (uses JWT)
  //
  const btn = byId("createLabelBtn");
  const input = byId("newLabelInput");
  const labelList = byId("labelList"); // UL container in popup.html

  if (btn && input && colorInput && labelList) {
    btn.addEventListener("click", async () => {
      const labelName = input.value.trim();
      const labelColor = colorInput.value;
      if (!labelName) {
        alert("Please enter a label name");
        return;
      }

      const jwtObj = await chrome.storage.local.get(['jwt']);
      const jwt = jwtObj && jwtObj.jwt;
      if (!jwt) return alert("Please log in first.");

      try {
        const res = await fetch(api.labelsCreate, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${jwt}`
          },
          body: JSON.stringify({ name: labelName, color: labelColor }),
        });

        const data = await res.json().catch(() => ({}));
        if (res.ok) {
          addLabelToUI(data.name || labelName, data.color || labelColor);
          input.value = "";
          colorInput.value = "#ff0000";
          if (brushIcon) brushIcon.style.color = "#ff0000";
        } else {
          alert(`Error: ${data.error || JSON.stringify(data)}`);
        }
      } catch (err) {
        console.error(err);
        alert("Something went wrong");
      }
    });
  }

  //
  // Load existing labels on popup open (uses JWT)
  //
  if (labelList) {
    (async function initLoad() {
      const jwtObj = await chrome.storage.local.get(['jwt']);
      const jwt = jwtObj && jwtObj.jwt;
      if (jwt) {
        loadLabels(jwt);
      } else {
        console.log("No JWT found; labels not loaded.");
      }
    })();
  }

  async function loadLabels(jwt) {
    try {
      const res = await fetch(api.labelsList, {
        headers: { "Authorization": `Bearer ${jwt}` }
      });
      if (!res.ok) {
        console.warn('Labels list request not OK', res.status);
        return;
      }
      const labels = await res.json().catch(() => []);
      labelList.innerHTML = '';
      (Array.isArray(labels) ? labels : []).forEach((label) => {
        addLabelToUI(label.name, label.color);
      });
    } catch (err) {
      console.error("Error loading labels:", err);
    }
  }

  //
  // Helper: Add label to UI with Edit/Delete (uses JWT for server ops)
  //
  function addLabelToUI(name, color) {
    const li = document.createElement("li");
    li.style.backgroundColor = color || '#777';
    li.style.color = getContrastColor(color || '#777');
    li.style.padding = "10px 12px";
    li.style.borderRadius = "8px";
    li.style.fontWeight = "600";
    li.style.display = "flex";
    li.style.alignItems = "center";
    li.style.justifyContent = "space-between";
    li.style.gap = "8px";

    const span = document.createElement("span");
    span.textContent = name;
    span.style.flex = "1";
    span.style.textAlign = "center";

    // Edit button
    const editBtn = document.createElement("button");
    editBtn.textContent = "✏️";
    editBtn.style.border = "none";
    editBtn.style.background = "rgba(255,255,255,0.15)";
    editBtn.style.color = "#fff";
    editBtn.style.borderRadius = "6px";
    editBtn.style.cursor = "pointer";
    editBtn.title = "Edit label";

    editBtn.addEventListener("click", async () => {
      const newName = prompt("Edit label name:", name);
      if (!newName || !newName.trim()) return;
      const committedName = newName.trim();
      span.textContent = committedName;

      const tempColorInput = document.createElement("input");
      tempColorInput.type = "color";
      tempColorInput.value = color || '#777';
      tempColorInput.style.position = "fixed";
      tempColorInput.style.left = "-9999px";
      document.body.appendChild(tempColorInput);

      let committed = false;

      tempColorInput.addEventListener("change", async () => {
        const newColor = tempColorInput.value;
        li.style.backgroundColor = newColor;
        li.style.color = getContrastColor(newColor);

        try {
          const jwtObj = await chrome.storage.local.get(['jwt']);
          const jwt = jwtObj && jwtObj.jwt;
          await fetch(api.labelsUpdate, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "Authorization": `Bearer ${jwt}`
            },
            body: JSON.stringify({
              oldName: name,
              newName: committedName,
              color: newColor,
            }),
          });
        } catch (e) {
          console.error(e);
        }

        name = committedName;
        color = newColor;
        committed = true;
        document.body.removeChild(tempColorInput);
      }, { once: true });

      tempColorInput.addEventListener("blur", async () => {
        if (committed) return;
        try {
          const jwtObj = await chrome.storage.local.get(['jwt']);
          const jwt = jwtObj && jwtObj.jwt;
          await fetch(api.labelsUpdate, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "Authorization": `Bearer ${jwt}`
            },
            body: JSON.stringify({
              oldName: name,
              newName: committedName,
              color: color, // unchanged
            }),
          });
        } catch (e) {
          console.error(e);
        }
        name = committedName;
        document.body.removeChild(tempColorInput);
      }, { once: true });

      tempColorInput.focus();
      tempColorInput.click();
    });

    // Delete button
    const deleteBtn = document.createElement("button");
    deleteBtn.textContent = "🗑️";
    deleteBtn.style.border = "none";
    deleteBtn.style.background = "rgba(255,255,255,0.15)";
    deleteBtn.style.color = "#fff";
    deleteBtn.style.borderRadius = "6px";
    deleteBtn.style.cursor = "pointer";
    deleteBtn.title = "Delete label";

    deleteBtn.addEventListener("click", async () => {
      if (!confirm(`Delete label "${name}"?`)) return;
      li.remove();
      try {
        const jwtObj = await chrome.storage.local.get(['jwt']);
        const jwt = jwtObj && jwtObj.jwt;
        if (!jwt) {
          alert("Not logged in — cannot delete label.");
          return;
        }
        const res = await fetch(api.labelsDelete, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${jwt}`
          },
          body: JSON.stringify({ name })
        });
        if (!res.ok) {
          console.error("Delete failed:", await res.text().catch(()=>'<no body>'));
        }
      } catch (err) {
        console.error('Error deleting label:', err);
      }
    });

    li.appendChild(span);
    li.appendChild(editBtn);
    li.appendChild(deleteBtn);
    labelList.appendChild(li);
  } // end addLabelToUI

  // Contrast helper
  function getContrastColor(hex) {
    if (!hex || typeof hex !== 'string' || !hex.startsWith('#')) return '#fff';
    const r = parseInt(hex.substr(1, 2), 16);
    const g = parseInt(hex.substr(3, 2), 16);
    const b = parseInt(hex.substr(5, 2), 16);
    const brightness = (r * 299 + g * 587 + b * 114) / 1000;
    return brightness > 128 ? "#000" : "#fff";
  }

}); // end DOMContentLoaded
