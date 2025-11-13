const BASE = "http://localhost:8000/api";
function rootFromBase(base) {
  return base.replace(/\/api\/?$/, "");
}

const ROOT = rootFromBase(BASE);
const TOKEN_ENDPOINT = `${ROOT}/api/token/`;
const REFRESH_ENDPOINT = `${ROOT}/api/token/refresh/`;

/* storage helper: prefer chrome.storage.local, fall back to localStorage.
   JSON-serializes values for localStorage compatibility. */
const storage = {
  async get(key) {
    if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local) {
      return new Promise(resolve => {
        chrome.storage.local.get(key, res => {
          resolve(res && typeof res === 'object' ? (res[key] ?? null) : null);
        });
      });
    }
    const raw = localStorage.getItem(key);
    if (raw === null) return null;
    try { return JSON.parse(raw); } catch { return raw; }
  },
  async set(key, val) {
    if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local) {
      return new Promise(resolve => chrome.storage.local.set({ [key]: val }, () => resolve()));
    }
    try { localStorage.setItem(key, JSON.stringify(val)); } catch { localStorage.setItem(key, String(val)); }
    return Promise.resolve();
  },
  async remove(key) {
    if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local) {
      return new Promise(resolve => chrome.storage.local.remove(key, () => resolve()));
    }
    localStorage.removeItem(key);
    return Promise.resolve();
  }
};

/* Utility: sanitize id strings like ":1" -> "1" */
function sanitizeId(rawId) {
  const s = `${rawId}`;
  return s.startsWith(":") ? s.slice(1) : s;
}

/* ---------------------------
   Token normalization helpers
   --------------------------- */

/* Read stored tokens with compatibility for:
   - explicit accessToken / refreshToken keys
   - legacy 'jwt' string (treated as access)
   - legacy 'jwt' object { access, refresh } or similar shapes
*/
async function getStoredTokens() {
  // explicit keys take precedence
  const accessToken = await storage.get('accessToken');
  const refreshToken = await storage.get('refreshToken');
  if (accessToken || refreshToken) return { access: accessToken ?? null, refresh: refreshToken ?? null };

  // fallback to legacy jwt key
  const jwt = await storage.get('jwt');
  if (!jwt) return { access: null, refresh: null };

  if (typeof jwt === 'string') {
    return { access: jwt, refresh: null };
  }

  // object shapes: try common property names
  return {
    access: jwt.access ?? jwt.token ?? jwt.accessToken ?? null,
    refresh: jwt.refresh ?? jwt.refreshToken ?? null
  };
}

/* ---------------------------
   Auth helpers (JWT flow)
   --------------------------- */

/**
 * Login to obtain access & refresh tokens.
 * Stores explicit keys and legacy jwt object for compatibility.
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

  // store explicit keys and a legacy jwt object for pages that read 'jwt'
  const jwtObj = { access: data.access ?? data.token ?? null, refresh: data.refresh ?? null };
  if (jwtObj.access) await storage.set('accessToken', jwtObj.access);
  if (jwtObj.refresh) await storage.set('refreshToken', jwtObj.refresh);
  await storage.set('jwt', jwtObj);

  return data;
}

/**
 * Refresh access token using stored refresh token.
 * Returns new access token and stores it.
 */
export async function refreshToken() {
  const { refresh } = await getStoredTokens();
  if (!refresh) {
    // clear stale tokens
    await storage.remove('jwt');
    await storage.remove('accessToken');
    await storage.remove('refreshToken');
    throw new Error('No refresh token available');
  }

  const res = await fetch(REFRESH_ENDPOINT, {
    method: 'POST',
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ refresh })
  });

  if (!res.ok) {
    // clear stored tokens on failure to force re-login
    await storage.remove('jwt');
    await storage.remove('accessToken');
    await storage.remove('refreshToken');
    const err = await res.json().catch(() => null);
    throw new Error(err?.detail || `Refresh failed: ${res.status}`);
  }

  const data = await res.json();
  const newAccess = data.access ?? data.token ?? null;
  const newRefresh = data.refresh ?? null;

  const jwtObj = { access: newAccess, refresh: newRefresh };
  if (jwtObj.access) await storage.set('accessToken', jwtObj.access);
  if (jwtObj.refresh) await storage.set('refreshToken', jwtObj.refresh);
  await storage.set('jwt', jwtObj);

  return jwtObj.access;
}

/**
 * Authenticated fetch wrapper.
 * - If token param provided, uses it.
 * - Else uses stored accessToken/jwt and will attempt refresh on 401.
 * Throws Error('auth_required') when refresh cannot recover.
 */
export async function authFetch(url, options = {}, token = null) {
  const tokens = await getStoredTokens();
  let access = token || tokens.access;

  const buildHeaders = (extra = {}) => ({ 'Content-Type': 'application/json', ...(extra || {}) });

  const reqHeaders = { ...(options.headers || {}) };
  if (access) reqHeaders['Authorization'] = `Bearer ${access}`;

  let res;
  try {
    res = await fetch(url, { ...options, headers: buildHeaders(reqHeaders) });
  } catch (err) {
    // Network or other low-level failure
    throw err;
  }

  if (res.status === 401 && !token) {
    // attempt refresh once
    try {
      const newAccess = await refreshToken();
      const retryHeaders = { ...(options.headers || {}) };
      if (newAccess) retryHeaders['Authorization'] = `Bearer ${newAccess}`;
      res = await fetch(url, { ...options, headers: buildHeaders(retryHeaders) });
    } catch (err) {
      // bubble up a signal the UI can detect and prompt login
      throw new Error('auth_required');
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
   --------------------------- */

/**
 * GET all labels
 */
export async function pullLabels(token = null) {
  const res = await authFetch(`${BASE}/labels/`, { method: "GET" }, token);
  if (!res.ok) {
    // surface auth_required specially if thrown earlier
    if (res.status === 401) throw new Error('auth_required');
    throw new Error(`Pull labels failed: ${res.status}`);
  }
  return res.json();
}

/**
 * POST new label
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

export async function fetchTemplates(token = null) {
  const res = await authFetch(`${BASE}/templates/`, { method: "GET" }, token);
  if (!res.ok) {
    if (res.status === 401) throw new Error('auth_required');
    throw new Error(`Fetch templates failed: ${res.status}`);
  }
  return res.json();
}

export async function fetchTemplate(id, token = null) {
  const res = await authFetch(`${BASE}/templates/${id}/`, { method: "GET" }, token);
  if (!res.ok) {
    if (res.status === 401) throw new Error('auth_required');
    throw new Error(`Fetch template failed: ${res.status}`);
  }
  return res.json();
}

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

export async function deleteTemplate(id, token = null) {
  const res = await authFetch(`${BASE}/templates/${id}/`, { method: 'DELETE' }, token);
  if (!res.ok) {
    const err = await res.text().catch(() => null);
    console.error("deleteTemplate error:", err);
    throw new Error(`Delete failed: ${res.status}`);
  }
  return true;
}
