import { getLabels, setLabels } from "./storage.js";

// ==============================
// Constants & Helpers
// ==============================
const byId = id => document.getElementById(id);

const baseURL = "http://localhost:8000";
const api = {
  labelsList:   `${baseURL}/api/labels/`,    // GET
  labelsCreate: `${baseURL}/api/labels/`,    // POST
  labelsDetail: id => `${baseURL}/api/labels/${id}/`  // PUT, DELETE
};

function getContrastColor(hex) {
  if (!hex || typeof hex !== "string" || !hex.startsWith("#")) return "#fff";
  const r = parseInt(hex.substr(1, 2), 16);
  const g = parseInt(hex.substr(3, 2), 16);
  const b = parseInt(hex.substr(5, 2), 16);
  const brightness = (r * 299 + g * 587 + b * 114) / 1000;
  return brightness > 128 ? "#000" : "#fff";
}

// ==============================
// Render Helpers
// ==============================
function addLabelToUI(name, color, id, labelList) {
  const li = document.createElement("li");
  li.style.backgroundColor  = color || "#777";
  li.style.color            = getContrastColor(color || "#777");
  li.style.padding          = "10px 12px";
  li.style.borderRadius     = "8px";
  li.style.fontWeight       = "600";
  li.style.display          = "flex";
  li.style.alignItems       = "center";
  li.style.justifyContent   = "space-between";
  li.style.gap              = "8px";

  const span = document.createElement("span");
  span.textContent    = name;
  span.style.flex     = "1";
  span.style.textAlign= "center";

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

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        alert(`Update failed: ${err.detail || res.status}`);
        return;
      }

      const updated = await res.json();
      span.textContent = updated.name;
      name = updated.name;
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

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        alert(`Delete failed: ${err.detail || res.status}`);
        return;
      }

      li.remove();

      // 2) Remove from local cache
      const labelsCache = await new Promise(resolve => getLabels(resolve));
      const filtered    = labelsCache.filter(l => l.id !== id);
      setLabels(filtered);

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
// Load + Sync Labels
// ==============================
async function loadLabels(jwt) {
  const labelList = byId("labelList");
  if (!labelList) return;

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

    // Overwrite local cache so “already exists” checks stay accurate
    setLabels(labels);
  } catch (e) {
    console.error("Error loading labels:", e);
  }
}

// ==============================
// Popup Wiring
// ==============================
document.addEventListener("DOMContentLoaded", () => {
  const labelList  = byId("labelList");
  const input      = byId("newLabelInput");
  const colorInput = byId("newLabelColorInput");
  const brushIcon  = byId("brushIcon");
  const btn        = byId("createLabelBtn");

  // Show-Labels Toggle
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

  // Login Flow
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

        const body  = await res.json().catch(() => null);
        const token = body?.access || body?.token || body?.jwt || body?.data?.token || body?.access_token;
        if (!token) {
          console.warn("No token in response", body);
          statusEl.textContent = "Login response missing token";
          return;
        }
        chrome.storage.local.set({ jwt: token }, () => {
          console.log("[CRM] Token saved to storage.");
        
          // 1) Remove any stale labels
          chrome.storage.local.remove(["labels"], () => {
            console.log("[CRM] Old labels cleared");
        
            // 2) Now show the labels UI and fetch fresh labels
            statusEl.textContent        = "Login successful";
            loginSection.style.display  = "none";
            labelsSection.style.display = "block";
            document.body.classList.add("labels-mode");
            loadLabels(token);
          });
        
          // 3) Let the background know about the new token
          try {
            chrome.runtime.sendMessage(
              { action: "setToken", token },
              resp => console.log("background setToken reply", resp)
            );
          } catch (e) {
            console.warn("sendMessage setToken failed", e);
          }
        });
        

        statusEl.textContent   = "Login successful";
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

  // Ping Button
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

  // Drag & Drop Features (if present)
  document.addEventListener("DOMContentLoaded", () => {
    const featuresContainer = document.querySelector(".container_right");
    if (!featuresContainer) {
      console.warn("No .features container found—skipping drag & drop");
      return;
    }
  
    // 1) Make each .feature draggable, and set some drag data so the browser actually starts dragging
    document.querySelectorAll(".container_right").forEach(item => {
      item.setAttribute("draggable", "true");
      item.addEventListener("dragstart", e => {
        e.dataTransfer.effectAllowed = "move";
        // must set some data or Chrome won’t fire dragover in popups
        e.dataTransfer.setData("text/plain", "");
        item.classList.add("dragging");
      });
      item.addEventListener("dragend", () => item.classList.remove("dragging"));
    });
  
    // 2) On dragover, figure out which element you’re hovering and insert accordingly
    featuresContainer.addEventListener("dragover", e => {
      e.preventDefault();
  
      // helper: find the element immediately after the pointer
      const getAfterElement = (container, y) => {
        const draggableEls = [
          ...container.querySelectorAll(".feature:not(.dragging)")
        ];
        return draggableEls
          .map(child => {
            const box = child.getBoundingClientRect();
            return { 
              offset: y - box.top - box.height / 2, 
              element: child 
            };
          })
          .filter(item => item.offset < 0)
          .sort((a, b) => b.offset - a.offset)[0]?.element || null;
      };
  
      const afterEl = getAfterElement(featuresContainer, e.clientY);
      const dragging = featuresContainer.querySelector(".dragging");
      // if no element below, append to end; otherwise insert before "afterEl"
      featuresContainer.insertBefore(dragging, afterEl);
    });
  });
  
  // Brush Icon & Color Picker
  if (colorInput && brushIcon) {
    brushIcon.addEventListener("click", () => colorInput.click());
    colorInput.addEventListener("input", () => {
      brushIcon.style.color = colorInput.value;
    });
  }

  // Create Label Handler
  if (btn && input && colorInput && labelList) {
    btn.addEventListener("click", async () => {
      const labelName  = input.value.trim();
      const labelColor = colorInput.value;
      if (!labelName) {
        alert("Please enter a label name");
        return;
      }

      // 1. Check local cache for duplicates
      const labels = await new Promise(r => getLabels(r));
      if (labels.some(l => l.name.toLowerCase() === labelName.toLowerCase())) {
        alert("That label already exists.");
        return;
      }

      // 2. Push to backend
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
        if (!res.ok) {
          alert(`Error: ${data.error || res.status}`);
          return;
        }

        // 3. Update cache & re-render full list
        const newLabel = { name: data.name, color: data.color, id: data.id };
        setLabels([...labels, newLabel]);
        loadLabels(jwt);

        // 4. Reset inputs
        input.value      = "";
        colorInput.value = "#ff0000";
        brushIcon.style.color = "#ff0000";
      } catch (e) {
        console.error("Create error:", e);
        alert("Something went wrong");
      }
    });
  }

  // Initial Load
  if (labelList) {
    chrome.storage.local.get(["jwt"], ({ jwt }) => {
      if (jwt) loadLabels(jwt);
    });
  }

  // Open Full Labels Page
  const openFullPage = byId("openFullPage");
  if (openFullPage) {
    openFullPage.addEventListener("click", e => {
      e.preventDefault();
      chrome.tabs.create({ url: chrome.runtime.getURL("labels.html") });
    });
  }
});

// popup.js - logout (drop-in replacement)
document.getElementById("logoutLink").addEventListener("click", async (e) => {
  e.preventDefault();

  console.log("[POPUP] logout clicked");

  // ask background to clear shared storage (access_token etc.)
  const bgResp = await new Promise(resolve => {
    chrome.runtime.sendMessage({ action: "logout" }, (r) => {
      if (chrome.runtime.lastError) {
        console.error("[POPUP] sendMessage error:", chrome.runtime.lastError);
        resolve({ success: false, error: chrome.runtime.lastError.message });
      } else {
        resolve(r || { success: false });
      }
    });
  });

  console.log("[POPUP] background response:", bgResp);
  if (!bgResp.success) {
    console.error("[POPUP] Background logout failed:", bgResp);
    document.getElementById("status").textContent = "Logout failed.";
    return;
  }

  // promisify storage removal and wait for it to complete
  const storageRemove = (keys) => new Promise(resolve =>
    chrome.storage.local.remove(keys, () => resolve(chrome.runtime.lastError || null))
  );

  const removeErr = await storageRemove(["access_token", "refresh_token", "labels", "jwt"]);
  if (removeErr) {
    console.warn("[POPUP] storage remove error:", removeErr);
  } else {
    console.log("[POPUP] Cleared tokens from storage (popup side)");
  }

  // Reset UI
  const labelsSection = document.getElementById("labelsSection");
  const loginSection = document.getElementById("loginSection");
  if (labelsSection) labelsSection.style.display = "none";
  if (loginSection) loginSection.style.display = "block";
  const status = document.getElementById("status");
  if (status) status.textContent = "Logged out";
});


