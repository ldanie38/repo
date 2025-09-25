


// Simple helpers for pushing/pulling labels to your backend

const BASE = "http://localhost:8000/api";


// Pull all labels
export async function pullLabels(token) {
  const res = await fetch(`${BASE}/labels/`, {
    headers: {
      "Authorization": `Bearer ${token}`,
      "Content-Type": "application/json"
    }
  });
  if (!res.ok) throw new Error(`Pull failed: ${res.status}`);
  return res.json(); // returns an array of labels
}

// Push (create or update) a single label
export async function pushLabel(label, token) {
  const res = await fetch(`${BASE}/labels/create/`, {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${token}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      name: label.name,
      color: label.color || "#ffffff"
    })
  });
  if (!res.ok) throw new Error(`Push failed: ${res.status}`);
  return res.json();
}


