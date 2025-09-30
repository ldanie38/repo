// api.js

const BASE = "http://localhost:8000/api";

// strip any leading colon so "/:1/" → "/1/"
function sanitizeId(rawId) {
  const s = `${rawId}`;
  return s.startsWith(":") ? s.slice(1) : s;
}

// 1) GET all labels
export async function pullLabels(token) {
  const res = await fetch(`${BASE}/labels/`, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json"
    }
  });
  if (!res.ok) throw new Error(`Pull failed: ${res.status}`);
  return res.json();
}

// 2) POST new label
export async function pushLabel(label, token) {
  const res = await fetch(`${BASE}/labels/`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      name: label.name,
      color: label.color || "#ffffff"
    })
  });
  if (!res.ok) {
    const err = await res.json().catch(() => null);
    console.error("pushLabel error:", err);
    throw new Error(`Push failed: ${res.status}`);
  }
  return res.json();
}

// 3) PUT update
export async function updateLabel(rawId, data, token) {
  const id = sanitizeId(rawId);
  const url = `${BASE}/labels/${id}/`;
  console.log("▶ updateLabel URL:", url);
  const res = await fetch(url, {
    method: "PUT",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify(data)
  });
  if (!res.ok) {
    const err = await res.json().catch(() => null);
    console.error("updateLabel error:", err);
    throw new Error(`Update failed: ${res.status}`);
  }
  return res.json();
}

// 4) DELETE by id
export async function deleteLabel(rawId, token) {
  const id = sanitizeId(rawId);
  const url = `${BASE}/labels/${id}/`;
  console.log("▶ deleteLabel URL:", url);
  const res = await fetch(url, {
    method: "DELETE",
    headers: {
      Authorization: `Bearer ${token}`
    }
  });
  if (!res.ok) {
    const err = await res.text().catch(() => null);
    console.error("deleteLabel error:", err);
    throw new Error(`Delete failed: ${res.status}`);
  }
}
