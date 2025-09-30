import { getLabels, setLabels } from "./storage.js";

// ==============================
// Helpers & Constants
// ==============================
const byId = id => document.getElementById(id);

const baseURL = "http://localhost:8000";
const api = {
  labelsList:   `${baseURL}/api/labels/`,     // GET
  labelsCreate: `${baseURL}/api/labels/`,     // POST
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
// Render a single label with Edit/Delete
// ==============================
function addLabelToUI(name, color, id, listEl) {
  const li = document.createElement("li");
  li.style.backgroundColor  = color || "#777";
  li.style.color            = getContrastColor(color || "#777");
  li.style.padding          = "8px 12px";
  li.style.borderRadius     = "6px";
  li.style.display          = "flex";
  li.style.alignItems       = "center";
  li.style.justifyContent   = "space-between";
  li.style.marginBottom     = "4px";

  const span = document.createElement("span");
  span.textContent = name;
  span.style.flex      = "1";
  span.style.textAlign = "left";

  // Edit button
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
      // Sync cache
      const cache = await new Promise(r => getLabels(r));
      const synced = cache.map(l => l.id === id ? { ...l, name: updated.name } : l);
      setLabels(synced);
    } catch (e) {
      console.error("Update error:", e);
      alert("Could not update label");
    }
  });

  // Delete button
  const deleteBtn = document.createElement("button");
  deleteBtn.textContent   = "🗑️";
  deleteBtn.style.border  = "none";
  deleteBtn.style.background = "transparent";
  deleteBtn.style.cursor  = "pointer";
  deleteBtn.addEventListener("click", async () => {
    if (!confirm(`Delete "${name}"?`)) return;

    const { jwt } = await chrome.storage.local.get(["jwt"]);
    if (!jwt) {
      alert("Please log in first.");
      return;
    }

    try {
      const res = await fetch(api.labelsDetail(id), {
        method: "DELETE",
        headers: { "Authorization": `Bearer ${jwt}` }
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        alert(`Delete failed: ${err.detail || res.status}`);
        return;
      }
      li.remove();
      // Remove from cache
      const cache = await new Promise(r => getLabels(r));
      setLabels(cache.filter(l => l.id !== id));
    } catch (e) {
      console.error("Delete error:", e);
      alert("Could not delete label");
    }
  });

  li.appendChild(span);
  li.appendChild(editBtn);
  li.appendChild(deleteBtn);
  listEl.appendChild(li);
}

// ==============================
// Load all labels & sync cache
// ==============================
async function loadLabels(jwt) {
  const listEl = byId("labelList");
  if (!listEl) return;

  try {
    const res = await fetch(api.labelsList, {
      headers: { "Authorization": `Bearer ${jwt}` }
    });
    if (!res.ok) {
      console.warn("Failed to fetch labels:", res.status);
      return;
    }

    const labels = await res.json().catch(() => []);
    listEl.innerHTML = "";
    labels.forEach(l => addLabelToUI(l.name, l.color, l.id, listEl));
    setLabels(labels);
  } catch (e) {
    console.error("Error loading labels:", e);
  }
}

// ==============================
// Page Wiring
// ==============================
document.addEventListener("DOMContentLoaded", () => {
  const labelList  = byId("labelList");
  const nameInput  = byId("newLabelInput");
  const colorInput = byId("newLabelColorInput");
  const createBtn  = byId("createLabelBtn");
  const statusEl   = byId("status");

  // Create-Label Handler
  createBtn.addEventListener("click", async () => {
    const name  = nameInput.value.trim();
    const color = colorInput.value;
    if (!name) {
      alert("Enter a label name");
      return;
    }

    // Check cache for dupes
    const existing = await new Promise(r => getLabels(r));
    if (existing.some(l => l.name.toLowerCase() === name.toLowerCase())) {
      alert("That label already exists.");
      return;
    }

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
        body: JSON.stringify({ name, color })
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        alert(`Error creating label: ${data.error || res.status}`);
        return;
      }

      // Re-fetch & render full list (with new id)
      await loadLabels(jwt);
      nameInput.value  = "";
      colorInput.value = "#ff0000";
    } catch (e) {
      console.error("Create error:", e);
      alert("Could not create label");
    }
  });

  // Initial load
  chrome.storage.local.get(["jwt"], ({ jwt }) => {
    if (jwt) {
      loadLabels(jwt);
    } else {
      statusEl.textContent = "Please log in to view labels";
    }
  });
});
