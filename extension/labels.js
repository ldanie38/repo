// labels.js

import { getLabels, setLabels } from "./storage.js";

// ==============================
// Helpers & Constants
// ==============================
const byId = id => document.getElementById(id);
const baseURL = "http://localhost:8000";
const api = {
  labelsList:   `${baseURL}/api/labels/`,
  labelsCreate: `${baseURL}/api/labels/`,
  labelsDetail: id => `${baseURL}/api/labels/${id}/`
};

function getContrastColor(hex) {
  if (!hex || typeof hex !== "string" || !hex.startsWith("#")) return "#fff";
  const r = parseInt(hex.substr(1, 2), 16);
  const g = parseInt(hex.substr(3, 2), 16);
  const b = parseInt(hex.substr(5, 2), 16);
  const brightness = (r * 299 + g * 587 + b * 114) / 1000;
  return brightness > 128 ? "#000" : "#fff";
}

// Render one label row
function addLabelToUI(name, color, id, listEl) {
  const li = document.createElement("li");
  // styling...
  li.style.backgroundColor = color || "#777";
  li.style.color           = getContrastColor(color);
  li.style.padding         = "8px 12px";
  li.style.borderRadius    = "6px";
  li.style.display         = "flex";
  li.style.alignItems      = "center";
  li.style.justifyContent  = "space-between";
  li.style.marginBottom    = "4px";

  const span = document.createElement("span");
  span.textContent = name;
  span.style.flex           = "1";
  span.style.textAlign      = "left";
  li.appendChild(span);

  // EDIT button
  const editBtn = document.createElement("button");
  editBtn.textContent      = "✏️";
  editBtn.style.border     = "none";
  editBtn.style.background = "transparent";
  editBtn.style.cursor     = "pointer";
  editBtn.addEventListener("click", async () => {
    const newName = prompt("Edit label name:", name);
    if (!newName) return;

    const { jwt } = await chrome.storage.local.get(["jwt"]);
    if (!jwt) return alert("Please log in.");

    const res = await fetch(api.labelsDetail(id), {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${jwt}`
      },
      body: JSON.stringify({ name: newName, color })
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      return alert(`Update failed: ${err.detail || res.status}`);
    }
    const updated = await res.json();
    span.textContent = updated.name;
    name = updated.name;

    // sync storage
    const cache = await new Promise(r => getLabels(r));
    setLabels(cache.map(l => l.id === id ? { ...l, name: updated.name } : l));
  });
  li.appendChild(editBtn);

  // DELETE button
  const deleteBtn = document.createElement("button");
  deleteBtn.textContent      = "🗑️";
  deleteBtn.style.border     = "none";
  deleteBtn.style.background = "transparent";
  deleteBtn.style.cursor     = "pointer";
  deleteBtn.addEventListener("click", async () => {
    if (!confirm(`Delete "${name}"?`)) return;

    const { jwt } = await chrome.storage.local.get(["jwt"]);
    if (!jwt) return alert("Please log in.");

    const res = await fetch(api.labelsDetail(id), {
      method: "DELETE",
      headers: { Authorization: `Bearer ${jwt}` }
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      return alert(`Delete failed: ${err.detail || res.status}`);
    }
    li.remove();
    const cache = await new Promise(r => getLabels(r));
    setLabels(cache.filter(l => l.id !== id));
  });
  li.appendChild(deleteBtn);

  listEl.appendChild(li);
}

// Fetch & return an array of labels
async function loadLabels() {
  const { jwt } = await chrome.storage.local.get(["jwt"]);
  console.log("⚙️ loadLabels token →", jwt);
  if (!jwt) {
    console.warn("No JWT, skipping labels fetch");
    return [];
  }

  const res = await fetch(api.labelsList, {
    headers: {
      Authorization: `Bearer ${jwt}`,
      "Content-Type":  "application/json"
    }
  });
  if (res.status === 401) {
    console.error("Labels fetch unauthorized (401)");
    return [];
  }
  if (!res.ok) {
    console.warn("Labels list request not OK", res.status);
    return [];
  }
  try {
    const data = await res.json();
    return Array.isArray(data) ? data : [];
  } catch (err) {
    console.error("Failed to parse labels JSON", err);
    return [];
  }
}

// Wire up page
document.addEventListener("DOMContentLoaded", () => {
  const listEl     = byId("labelList");
  const nameInput  = byId("newLabelInput");
  const colorInput = byId("newLabelColorInput");
  const createBtn  = byId("createLabelBtn");
  const statusEl   = byId("status");

  // CREATE
  createBtn.addEventListener("click", async () => {
    const name  = nameInput.value.trim();
    const color = colorInput.value;
    if (!name) return alert("Enter a label name.");

    const existing = await new Promise(r => getLabels(r));
    if (existing.some(l => l.name.toLowerCase() === name.toLowerCase())) {
      return alert("That label already exists.");
    }

    const { jwt } = await chrome.storage.local.get(["jwt"]);
    if (!jwt) return alert("Please log in.");

    const res = await fetch(api.labelsCreate, {
      method: "POST",
      headers: {
        "Content-Type":  "application/json",
        Authorization: `Bearer ${jwt}`
      },
      body: JSON.stringify({ name, color })
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      return alert(`Error creating label: ${data.detail || res.status}`);
    }

    // reload list
    const labels = await loadLabels();
    listEl.innerHTML = "";
    labels.forEach(l => addLabelToUI(l.name, l.color, l.id, listEl));
    setLabels(labels);
    nameInput.value  = "";
    colorInput.value = "#ff0000";
  });

  // INITIAL LOAD
  loadLabels().then(labels => {
    if (!labels.length) {
      statusEl.textContent = "No labels or not authenticated.";
      return;
    }
    listEl.innerHTML = "";
    labels.forEach(l => addLabelToUI(l.name, l.color, l.id, listEl));
    setLabels(labels);
  });
});
