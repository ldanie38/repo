// storage-util.js
export function chromeGet(keys) {
    return new Promise(resolve => {
      if (typeof chrome === 'undefined' || !chrome.storage || !chrome.storage.local) return resolve({});
      chrome.storage.local.get(keys, res => resolve(res || {}));
    });
  }
  
  export function chromeSet(obj) {
    return new Promise(resolve => chrome.storage.local.set(obj, () => resolve()));
  }
  
  export async function saveTokens({ access, refresh, expires_in = null }) {
    // compute approximate expiry timestamp (seconds -> ms)
    const expiresAt = expires_in ? (Date.now() + (expires_in * 1000)) : null;
    const jwt = { access, refresh, expires_at: expiresAt };
    await chromeSet({ jwt });
    return jwt;
  }
  
  export async function getStoredJwt() {
    const { jwt } = await chromeGet(['jwt']);
    return jwt ?? null;
  }
  
  export async function getAccessToken() {
    const jwt = await getStoredJwt();
    if (!jwt) return null;
    if (typeof jwt === 'string') return jwt;
    return jwt.access ?? jwt.token ?? jwt.accessToken ?? null;
  }
  
  export async function clearTokens() {
    await chromeSet({ jwt: null });
  }
  