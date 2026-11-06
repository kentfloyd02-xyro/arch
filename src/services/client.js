const rawApiBase =
  import.meta.env.VITE_API_BASE_URL ||
  (typeof window !== 'undefined' && window.location.hostname !== 'localhost'
    ? `${window.location.origin}/api/v1`
    : 'http://localhost:4000/api/v1');

export const API_BASE = rawApiBase.replace(/\/+$/, '');
export const BASE_URL = (
  import.meta.env.VITE_BASE_URL ||
  API_BASE.replace(/\/api\/v1$/, '').replace(/\/api$/, '') ||
  'http://localhost:4000'
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

  try {
    const res = await fetch(url, { ...options, headers });
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
    throw err;
  }
}

export async function checkApiHealth() {
  try {
    const res = await fetch(`${BASE_URL}/health`, { method: 'GET' });
    return res.ok;
  } catch {
    return false;
  }
}

export default { API_BASE, BASE_URL, request, checkApiHealth };
