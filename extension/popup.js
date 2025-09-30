import { getLabels, setLabels } from "./storage.js";

// ==============================
// Helpers & Constants
// ==============================
const byId = id => document.getElementById(id);

const baseURL = "http://localhost:8000"; 
const api = {
  labelsList:   `${baseURL}/api/labels/`,   // GET
  labelsCreate: `${baseURL}/api/labels/`,   // POST
  labelsDetail: id => `${baseURL}/api/labels/${id}/`  // PUT, DELETE
};

// ==============================
// Utility: Contrast helper
// ==============================
function getContrastColor(hex) {
  if (!hex || typeof hex !== "string" || !hex.startsWith("#")) return "#fff";
  const r = parseInt(hex.substr(1, 2), 16);
  const g = parseInt(hex.substr(3, 2), 16);
  const b = parseInt(hex.substr(5, 2), 16);
  const brightness = (r * 299 + g * 587 + b * 114) / 1000;
  return brightness > 128 ? "#000" : "#fff";
}

// ==============================
// Helper: Add label to UI with Edit/Delete
// ==============================
function addLabelToUI(name, color, id, labelList) {
  const li = document.createElement("li");
  li.style.backgroundColor = color || "#777";
  li.style.color           = getContrastColor(color || "#777");
  li.style.padding         = "10px 12px";
  li.style.borderRadius    = "8px";
  li.style.fontWeight      = "600";
  li.style.display         = "flex";
  li.style.alignItems      = "center";
  li.style.justifyContent  = "space-between";
  li.style.gap             = "8px";

  const span = document.createElement("span");
  span.textContent = name;
  span.style.flex      = "1";
  span.style.textAlign = "center";

  const editBtn = document.createElement("button");
  editBtn.textContent   = "✏️";
  editBtn.style.border  = "none";
  editBtn.style.background = "transparent";
  editBtn.style.cursor  = "pointer";

  editBtn.addEventListener("click", async () => {
    const newName = prompt("Edit label name:", name);
    if (!newName) return;

    const { jwt } = await chrome.storage.local.get(["jwt"]);
    if (!jwt) {
      alert("Please log in first.");
      return;
    }

    try {
      const res = await fetch(api.labelsDetail(id), {
        method: "PUT",
        headers: {
          "Content-Type":  "application/json",
          "Authorization": `Bearer ${jwt}`
        },
        body: JSON.stringify({ name: newName, color })
      });

      if (res.ok) {
        const updated = await res.json();
        span.textContent = updated.name;
        name = updated.name;
      } else {
        const err = await res.json().catch(() => ({}));
        alert(`Update failed: ${err.detail || res.status}`);
      }
    } catch (e) {
      console.error("Update error:", e);
      alert("Something went wrong updating label");
    }
  });

  const deleteBtn = document.createElement("button");
  deleteBtn.textContent   = "🗑️";
  deleteBtn.style.border  = "none";
  deleteBtn.style.background = "transparent";
  deleteBtn.style.cursor  = "pointer";

  deleteBtn.addEventListener("click", async () => {
    if (!confirm(`Delete label "${name}"?`)) return;

    const { jwt } = await chrome.storage.local.get(["jwt"]);
    if (!jwt) {
      alert("Please log in first.");
      return;
    }

    try {
      const res = await fetch(api.labelsDetail(id), {
        method: "DELETE",
        headers: {
          "Authorization": `Bearer ${jwt}`
        }
      });

      if (res.ok) {
        li.remove();
      } else {
        const err = await res.json().catch(() => ({}));
        alert(`Delete failed: ${err.detail || res.status}`);
      }
    } catch (e) {
      console.error("Delete error:", e);
      alert("Something went wrong deleting label");
    }
  });

  li.appendChild(span);
  li.appendChild(editBtn);
  li.appendChild(deleteBtn);
  labelList.appendChild(li);
}

// ==============================
// Load labels from backend
// ==============================
async function loadLabels(jwt) {
  const labelList = byId("labelList");
  try {
    const res = await fetch(api.labelsList, {
      headers: { "Authorization": `Bearer ${jwt}` }
    });
    if (!res.ok) {
      console.warn("Labels list request not OK", res.status);
      return;
    }
    const labels = await res.json().catch(() => []);
    labelList.innerHTML = "";
    labels.forEach(label => {
      addLabelToUI(label.name, label.color, label.id, labelList);
    });
  } catch (e) {
    console.error("Error loading labels:", e);
  }
}

// ==============================
// DOMContentLoaded wiring
// ==============================
document.addEventListener("DOMContentLoaded", () => {
  // Show Labels toggle
  const showToggle = byId("showLabelsToggle");
  if (showToggle) {
    showToggle.addEventListener("change", function() {
      console.log(this.checked ? "Labels ON" : "Labels OFF");
      chrome.storage.local.set({ showLabels: this.checked });
    });
    chrome.storage.local.get("showLabels", ({ showLabels }) => {
      if (typeof showLabels === "boolean") showToggle.checked = showLabels;
    });
  }

  // Login wiring
  const loginBtn      = byId("loginBtn");
  const usernameInput = byId("username");
  const passwordInput = byId("password");
  const statusEl      = byId("status");
  const loginSection  = byId("loginSection");
  const labelsSection = byId("labelsSection");

  if (loginBtn) {
    loginBtn.addEventListener("click", async () => {
      const user = (usernameInput.value || "").trim();
      const pass = (passwordInput.value || "").trim();
      if (!user || !pass) {
        statusEl.textContent = "Enter username and password";
        return;
      }
      statusEl.textContent = "Logging in...";

      try {
        let res = await fetch(`${baseURL}/api/auth/login/`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ username: user, password: pass })
        });

        if (res.status === 401) {
          res = await fetch(`${baseURL}/api/auth/login/`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ email: user, password: pass })
          });
        }

        if (!res.ok) {
          const txt = await res.text().catch(() => "<no body>");
          console.error("login failed", res.status, txt);
          statusEl.textContent = `Login failed: ${res.status}`;
          return;
        }

        const body = await res.json().catch(() => null);
        const token = body?.access || body?.token || body?.jwt || body?.data?.token || body?.access_token;
        if (!token) {
          console.warn("No token found in response", body);
          statusEl.textContent = "Login response missing token";
          return;
        }

        chrome.storage.local.set({ jwt: token }, () => {
          console.log("[CRM] Token saved to storage.");
          try {
            chrome.runtime.sendMessage({ action: "setToken", token }, resp => {
              console.log("background setToken reply", resp);
            });
          } catch (e) {
            console.warn("sendMessage setToken failed", e);
          }
        });

        statusEl.textContent = "Login successful";
        loginSection.style.display  = "none";
        labelsSection.style.display = "block";
        document.body.classList.add("labels-mode");

        loadLabels(token);
      } catch (e) {
        console.error("Login error", e);
        statusEl.textContent = "Network error";
      }
    });
  }

  // Ping button wiring
  const pingBtn = byId("pingBtn");
  if (pingBtn) {
    pingBtn.addEventListener("click", () => {
      chrome.runtime.sendMessage({ action: "ping", payload: "from popup" }, response => {
        if (chrome.runtime.lastError) {
          console.error("sendMessage error", chrome.runtime.lastError);
          alert("Failed to send message to background");
          return;
        }
        console.log("ping response", response);
        const out = byId("output");
        if (out) out.textContent = JSON.stringify(response);
      });
    });
  }

  // Drag & Drop for .feature items
  const featuresContainer = document.querySelector(".features");
  if (featuresContainer) {
    const featureItems = document.querySelectorAll(".feature");
    featureItems.forEach(item => {
      item.setAttribute("draggable", "true");
      item.addEventListener("dragstart", () => item.classList.add("dragging"));
      item.addEventListener("dragend", () => item.classList.remove("dragging"));
    });

    featuresContainer.addEventListener("dragover", e => {
      e.preventDefault();
      const after = getDragAfterElement(featuresContainer, e.clientY);
      const dragging = document.querySelector(".dragging");
      if (!after) {
        featuresContainer.appendChild(dragging);
      } else {
        featuresContainer.insertBefore(dragging, after);
      }
    });

    function getDragAfterElement(container, y) {
      const elems = [...container.querySelectorAll(".feature:not(.dragging)")];
      return elems.reduce((closest, child) => {
        const box    = child.getBoundingClientRect();
        const offset = y - box.top - box.height / 2;
        if (offset < 0 && offset > closest.offset) {
          return { offset, element: child };
        }
        return closest;
      }, { offset: Number.NEGATIVE_INFINITY }).element;
    }
  }

  // Brush icon color picker
  const colorInput = byId("newLabelColorInput");
  const brushIcon  = document.querySelector(".brush-icon");
  if (colorInput && brushIcon) {
    brushIcon.addEventListener("click", () => colorInput.click());
    colorInput.addEventListener("input", () => {
      brushIcon.style.color = colorInput.value;
    });
  }

  // Create Label (hybrid: local + backend)
  const btn       = byId("createLabelBtn");
  const input     = byId("newLabelInput");
  const labelList = byId("labelList");

  if (btn && input && colorInput && labelList) {
    btn.addEventListener("click", async () => {
      const labelName  = input.value.trim();
      const labelColor = colorInput.value;
      if (!labelName) {
        alert("Please enter a label name");
        return;
      }

      // 1. Check locally for duplicates
      const labels = await new Promise(resolve => getLabels(resolve));
      if (labels.some(l => l.name.toLowerCase() === labelName.toLowerCase())) {
        alert("That label already exists.");
        return;
      }

      // 2. Save locally
      setLabels([...labels, { name: labelName, color: labelColor }]);

      // 3. Push to backend
      const { jwt } = await chrome.storage.local.get(["jwt"]);
      if (!jwt) {
        alert("Please log in first.");
        return;
      }

      try {
        const res = await fetch(api.labelsCreate, {
          method: "POST",
          headers: {
            "Content-Type":  "application/json",
            "Authorization": `Bearer ${jwt}`
          },
          body: JSON.stringify({ name: labelName, color: labelColor })
        });

        const data = await res.json().catch(() => ({}));
        if (res.ok) {
          addLabelToUI(data.name || labelName,
                       data.color || labelColor,
                       data.id,
                       labelList);
          input.value      = "";
          colorInput.value = "#ff0000";
          brushIcon.style.color = "#ff0000";
        } else {
          alert(`Error: ${data.error || JSON.stringify(data)}`);
        }
      } catch (e) {
        console.error(e);
        alert("Something went wrong");
      }
    });
  }

  // Load existing labels on popup open
  if (labelList) {
    (async () => {
      const { jwt } = await chrome.storage.local.get(["jwt"]);
      if (jwt) loadLabels(jwt);
    })();
  }

  // Open full labels page
  const openFullPage = byId("openFullPage");
  if (openFullPage) {
    openFullPage.addEventListener("click", e => {
      e.preventDefault();
      chrome.tabs.create({
        url: chrome.runtime.getURL("labels.html")
      });
    });
  }
});
