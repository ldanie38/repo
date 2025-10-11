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

let draggedId = null;

function getContrastColor(hex) {
  if (!hex || typeof hex !== "string" || !hex.startsWith("#")) return "#fff";
  const r = parseInt(hex.substr(1, 2), 16);
  const g = parseInt(hex.substr(3, 2), 16);
  const b = parseInt(hex.substr(5, 2), 16);
  const brightness = (r * 299 + g * 587 + b * 114) / 1000;
  return brightness > 128 ? "#000" : "#fff";
}

// Attach drag handlers to a <li>
function attachDragHandlers(li) {
  li.addEventListener("dragstart", e => {
    draggedId = li.dataset.id;
    e.dataTransfer.effectAllowed = "move";
  });

  li.addEventListener("dragover", e => {
    e.preventDefault();
    li.classList.add("drag-over");
  });

  li.addEventListener("dragleave", () => {
    li.classList.remove("drag-over");
  });

  li.addEventListener("drop", () => {
    li.classList.remove("drag-over");
    reorderLabels(draggedId, li.dataset.id);
  });
}

// Reorder DOM, local cache, and optional backend sync
function reorderLabels(fromId, toId) {
  const listEl = byId("labelList");
  const fromEl = listEl.querySelector(`[data-id="${fromId}"]`);
  const toEl   = listEl.querySelector(`[data-id="${toId}"]`);

  if (fromEl && toEl) {
    listEl.insertBefore(fromEl, toEl.nextSibling);
  }

  const newOrder = Array.from(listEl.children).map(li => li.dataset.id);

  // update local cache
  getLabels(cache => {
    const reordered = newOrder
      .map(id => cache.find(l => l.id.toString() === id))
      .filter(Boolean);
    setLabels(reordered);
  });

  // push to backend if endpoint exists
  fetch(`${api.labelsList}reorder/`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${localStorage.getItem("jwt")}`
    },
    body: JSON.stringify({ order: newOrder })
  }).catch(console.error);
}

// Render one label row
function addLabelToUI(name, color, id, listEl) {
  const li = document.createElement("li");
  li.draggable = true;
  li.dataset.id = id;

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
  span.style.flex      = "1";
  span.style.textAlign = "left";
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

  // attach drag handlers
  attachDragHandlers(li);

  listEl.appendChild(li);
}

// Fetch & return an array of labels
async function loadLabels() {
  const { jwt } = await chrome.storage.local.get(["jwt"]);
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
  if (!res.ok) return [];
  try {
    const data = await res.json();
    return Array.isArray(data) ? data : [];
  } catch {
    return [];
  }
}

// Wire up page
document.addEventListener("DOMContentLoaded", () => {
  const listEl     = byId("labelList");
  const nameInput  = byId("newLabelInput");
  const colorInput = byId("newLabelColorInput");
  const createBtn  = byId("createLabelBtn");

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
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
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
    listEl.innerHTML = "";
    labels.forEach(l => addLabelToUI(l.name, l.color, l.id, listEl));
    setLabels(labels);
  });
});
