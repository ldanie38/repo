

const BASE = "http://localhost:8000/api";
function rootFromBase(base) {
  return base.replace(/\/api\/?$/, "");
}

const ROOT = rootFromBase(BASE);
const TOKEN_ENDPOINT = `${ROOT}/api/token/`;
const REFRESH_ENDPOINT = `${ROOT}/api/token/refresh/`;

/* Storage abstraction (swap with chrome.storage.local if desired) */
const storage = {
  async get(key) { return Promise.resolve(localStorage.getItem(key)); },
  async set(key, val) { localStorage.setItem(key, val); return Promise.resolve(); },
  async remove(key) { localStorage.removeItem(key); return Promise.resolve(); },
};

/* Utility: sanitize id strings like ":1" -> "1" */
function sanitizeId(rawId) {
  const s = `${rawId}`;
  return s.startsWith(":") ? s.slice(1) : s;
}

/* ---------------------------
   Auth helpers (JWT flow)
   --------------------------- */

/**
 * Login to obtain access & refresh tokens.
 * Stores 'accessToken' and 'refreshToken' in storage.
 */
export async function login(username, password) {
  const res = await fetch(TOKEN_ENDPOINT, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username, password })
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: 'Login failed' }));
    throw new Error(err.detail || `Login failed: ${res.status}`);
  }
  const data = await res.json();
  await storage.set('accessToken', data.access);
  await storage.set('refreshToken', data.refresh);
  return data;
}

/**
 * Refresh access token using stored refresh token.
 * Returns new access token.
 */
export async function refreshToken() {
  const refresh = await storage.get('refreshToken');
  if (!refresh) throw new Error('No refresh token available');
  const res = await fetch(REFRESH_ENDPOINT, {
    method: 'POST',
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ refresh })
  });
  if (!res.ok) {
    // clear tokens on failed refresh
    await storage.remove('accessToken');
    await storage.remove('refreshToken');
    const err = await res.json().catch(() => null);
    throw new Error(err?.detail || `Refresh failed: ${res.status}`);
  }
  const data = await res.json();
  await storage.set('accessToken', data.access);
  return data.access;
}

/**
 * Authenticated fetch wrapper.
 * - If token param provided, uses it.
 * - Else uses stored accessToken and will attempt refresh on 401.
 */
export async function authFetch(url, options = {}, token = null) {
  let access = token || await storage.get('accessToken');
  const headers = {
    ...(options.headers || {}),
    'Authorization': `Bearer ${access}`,
    'Content-Type': headersContentType(options.headers)
  };

  let res = await fetch(url, { ...options, headers });
  if (res.status === 401 && !token) {
    // try refresh flow once
    try {
      access = await refreshToken();
      const retryHeaders = { ...(options.headers || {}), 'Authorization': `Bearer ${access}`, 'Content-Type': headersContentType(options.headers) };
      res = await fetch(url, { ...options, headers: retryHeaders });
    } catch (err) {
      throw err;
    }
  }
  return res;
}

/* Helper to preserve any provided Content-Type, default to application/json */
function headersContentType(providedHeaders = {}) {
  if (!providedHeaders) return 'application/json';
  if (providedHeaders['Content-Type']) return providedHeaders['Content-Type'];
  if (providedHeaders['content-type']) return providedHeaders['content-type'];
  return 'application/json';
}

/* ---------------------------
   Label endpoints
   (existing helpers: pullLabels, pushLabel, updateLabel, deleteLabel)
   --------------------------- */

/**
 * GET all labels
 * Optionally pass token; if omitted uses stored token
 */
export async function pullLabels(token = null) {
  const res = await authFetch(`${BASE}/labels/`, { method: "GET" }, token);
  if (!res.ok) throw new Error(`Pull labels failed: ${res.status}`);
  return res.json();
}

/**
 * POST new label
 * label: { name, color? }
 */
export async function pushLabel(label, token = null) {
  const res = await authFetch(`${BASE}/labels/`, {
    method: "POST",
    body: JSON.stringify({ name: label.name, color: label.color || "#ffffff" })
  }, token);

  if (!res.ok) {
    const err = await res.json().catch(() => null);
    console.error("pushLabel error:", err);
    throw new Error(`Push failed: ${res.status}`);
  }
  return res.json();
}

/**
 * PUT update label
 * rawId may be like ":1" or "1"
 */
export async function updateLabel(rawId, data, token = null) {
  const id = sanitizeId(rawId);
  const url = `${BASE}/labels/${id}/`;
  console.log("▶ updateLabel URL:", url);

  const res = await authFetch(url, {
    method: "PUT",
    body: JSON.stringify(data)
  }, token);

  if (!res.ok) {
    const err = await res.json().catch(() => null);
    console.error("updateLabel error:", err);
    throw new Error(`Update failed: ${res.status}`);
  }
  return res.json();
}

/**
 * DELETE label by id
 */
export async function deleteLabel(rawId, token = null) {
  const id  = sanitizeId(rawId);
  const url = `${BASE}/labels/${id}/`;
  console.log("▶ deleteLabel URL:", url);

  const res = await authFetch(url, { method: "DELETE" }, token);

  // Treat 404 as “already deleted”
  if (res.status === 404) {
    console.warn(`deleteLabel: label ${id} not found on server (404)`);
    return;
  }

  if (!res.ok) {
    const err = await res.text().catch(() => null);
    console.error("deleteLabel error:", err);
    throw new Error(`Delete failed: ${res.status}`);
  }
}

/* ---------------------------
   Template endpoints (CRUD)
   --------------------------- */

/**
 * GET all templates
 */
export async function fetchTemplates(token = null) {
  const res = await authFetch(`${BASE}/templates/`, { method: "GET" }, token);
  if (!res.ok) throw new Error(`Fetch templates failed: ${res.status}`);
  return res.json();
}

/**
 * GET single template by id
 */
export async function fetchTemplate(id, token = null) {
  const res = await authFetch(`${BASE}/templates/${id}/`, { method: "GET" }, token);
  if (!res.ok) throw new Error(`Fetch template failed: ${res.status}`);
  return res.json();
}

/**
 * POST create template
 * payload: { name, content, label }
 */
export async function createTemplate(payload, token = null) {
  const res = await authFetch(`${BASE}/templates/`, {
    method: 'POST',
    body: JSON.stringify(payload)
  }, token);

  if (!res.ok) {
    const err = await res.json().catch(() => null);
    console.error("createTemplate error:", err);
    throw new Error(`Create failed: ${res.status}`);
  }
  return res.json();
}

/**
 * PATCH update template
 */
export async function updateTemplate(id, payload, token = null) {
  const res = await authFetch(`${BASE}/templates/${id}/`, {
    method: 'PATCH',
    body: JSON.stringify(payload)
  }, token);

  if (!res.ok) {
    const err = await res.json().catch(() => null);
    console.error("updateTemplate error:", err);
    throw new Error(`Update failed: ${res.status}`);
  }
  return res.json();
}

/**
 * DELETE template
 */
export async function deleteTemplate(id, token = null) {
  const res = await authFetch(`${BASE}/templates/${id}/`, { method: 'DELETE' }, token);
  if (!res.ok) {
    const err = await res.text().catch(() => null);
    console.error("deleteTemplate error:", err);
    throw new Error(`Delete failed: ${res.status}`);
  }
  return true;
}
