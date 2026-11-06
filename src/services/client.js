const isHttpsOrigin = typeof window !== 'undefined' && window.location.protocol === 'https:';
const isLocalhostHost = typeof window !== 'undefined' && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1');

const envApiBase = import.meta.env.VITE_API_BASE_URL;

let rawApiBase = envApiBase;
if (!rawApiBase || (isHttpsOrigin && rawApiBase.startsWith('http://localhost') && !isLocalhostHost)) {
  if (typeof window !== 'undefined' && !isLocalhostHost) {
    rawApiBase = `${window.location.origin}/api/v1`;
  } else {
    rawApiBase = 'http://localhost:4000/api/v1';
  }
}

export const API_BASE = rawApiBase.replace(/\/+$/, '');
export const BASE_URL = (
  import.meta.env.VITE_BASE_URL ||
  API_BASE.replace(/\/api\/v1$/, '').replace(/\/api$/, '') ||
  (typeof window !== 'undefined' && !isLocalhostHost ? window.location.origin : 'http://localhost:4000')
).replace(/\/+$/, '');

export async function request(endpoint, options = {}) {
  const cleanEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
  const url = `${API_BASE}${cleanEndpoint}`;
  const token = localStorage.getItem('archon_token');

  const headers = {
    ...options.headers
  };

  if (token && !headers['Authorization']) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  if (!(options.body instanceof FormData) && !headers['Content-Type']) {
    headers['Content-Type'] = 'application/json';
  }

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 6000);
  const signal = options.signal || controller.signal;

  try {
    const res = await fetch(url, { ...options, headers, signal });
    clearTimeout(timeoutId);
    const data = await res.json().catch(() => ({}));

    if (!res.ok) {
      const errorMsg =
        data.error?.message ||
        data.message ||
        data.error ||
        `Request failed with status ${res.status}`;
      const err = new Error(errorMsg);
      err.status = res.status;
      err.code = data.error?.code;
      err.forcePasswordReset = Boolean(data.forcePasswordReset);
      err.otpAborted = Boolean(data.otpAborted);
      err.remainingAttempts = data.remainingAttempts;
      err.cooldownSeconds = data.cooldownSeconds;
      throw err;
    }

    // In arch_api, standard response format is { success: true, data: [...] }
    return data.data !== undefined ? data.data : data;
  } catch (err) {
    clearTimeout(timeoutId);
    throw err;
  }
}

export async function checkApiHealth() {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 3500);
    const res = await fetch(`${BASE_URL}/health`, { method: 'GET', signal: controller.signal });
    clearTimeout(timeoutId);
    return res.ok;
  } catch {
    return false;
  }
}

export default { API_BASE, BASE_URL, request, checkApiHealth };
