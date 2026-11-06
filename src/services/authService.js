import { request } from './client';

function normalizeUser(u) {
  if (!u) return u;
  const raw = u.data || u;
  const phone = raw.phone_number || raw.phone || raw.phoneNumber || '';
  const address = raw.default_address || raw.defaultAddress || raw.address || '';
  const consent = raw.privacy_consent || raw.privacyConsent || {
    granted: true,
    consentedAt: raw.created_at || new Date().toISOString(),
    policyVersion: 'RA10173-2026.1'
  };
  return {
    ...raw,
    name: raw.full_name || raw.name || 'User',
    fullName: raw.full_name || raw.name || 'User',
    phone,
    phoneNumber: phone,
    defaultAddress: address,
    address,
    privacyConsent: consent,
    role: (raw.global_role === 'superadmin' || raw.global_role === 'admin' || raw.role === 'admin') ? 'admin' : (raw.role || 'customer')
  };
}

const failedLoginAttempts = {};

export const TRUST_DURATION_MS = 5 * 24 * 60 * 60 * 1000; // 5 days

export function getOrCreateDeviceId() {
  let id = localStorage.getItem('archon_device_id');
  if (!id) {
    id = 'dev-' + Math.random().toString(36).substring(2, 12) + '-' + Date.now().toString(36);
    localStorage.setItem('archon_device_id', id);
  }
  return id;
}

export function getDeviceTrustKey(email) {
  const clean = (email || '').trim().toLowerCase();
  return `archon_trusted_device_${clean}`;
}

export function isDeviceTrusted(email) {
  try {
    const key = getDeviceTrustKey(email);
    const raw = localStorage.getItem(key);
    if (!raw) return false;
    const data = JSON.parse(raw);
    const deviceId = getOrCreateDeviceId();
    if (data && data.deviceId === deviceId && data.expiresAt && Date.now() < data.expiresAt) {
      return true;
    }
    // Expired or mismatched device
    localStorage.removeItem(key);
    return false;
  } catch (e) {
    return false;
  }
}

export function saveDeviceTrust(email) {
  try {
    const clean = (email || '').trim().toLowerCase();
    if (!clean) return;
    const key = getDeviceTrustKey(clean);
    const deviceId = getOrCreateDeviceId();
    const data = {
      email: clean,
      deviceId,
      trustedAt: Date.now(),
      expiresAt: Date.now() + TRUST_DURATION_MS
    };
    localStorage.setItem(key, JSON.stringify(data));
  } catch (e) {
    console.error('Failed to save device trust:', e);
  }
}

export function clearDeviceTrust(email) {
  try {
    const key = getDeviceTrustKey(email);
    localStorage.removeItem(key);
  } catch (e) {}
}

export const authService = {
  login: async (email, password) => {
    const res = await request('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password })
    });
    if (res?.user) {
      res.user = normalizeUser(res.user);
    }
    return res;
  },

  loginInit: async (email, password, deviceId = null, trustDevice = false) => {
    const cleanEmail = (email || '').trim().toLowerCase();

    // Check account lockout threshold (5 failed password attempts)
    if ((failedLoginAttempts[cleanEmail] || 0) >= 5) {
      throw {
        forcePasswordReset: true,
        message: 'Maximum password attempts exceeded (5/5). Your account has been locked. Please reset your password.'
      };
    }

    // CHECK IF THIS BROWSER/DEVICE IS TRUSTED FOR THIS EMAIL (5-DAY TRUST)
    if (isDeviceTrusted(cleanEmail)) {
      try {
        const directRes = await authService.login(cleanEmail, password);
        failedLoginAttempts[cleanEmail] = 0;

        if (trustDevice !== false) {
          saveDeviceTrust(cleanEmail);
        }

        if (directRes.token) {
          localStorage.setItem('archon_token', directRes.token);
        }
        if (directRes.user) {
          localStorage.setItem('archon_user', JSON.stringify(directRes.user));
        }

        return {
          requireOtp: false,
          trustedDevice: true,
          email: cleanEmail,
          token: directRes.token,
          user: directRes.user,
          message: 'Trusted device recognized. OTP verification skipped.'
        };
      } catch (err) {
        failedLoginAttempts[cleanEmail] = (failedLoginAttempts[cleanEmail] || 0) + 1;
        if (failedLoginAttempts[cleanEmail] >= 5) {
          throw {
            forcePasswordReset: true,
            message: 'Maximum password attempts exceeded (5/5). Your account has been locked. Please reset your password.'
          };
        }
        throw new Error(err.message || 'Invalid email or password.');
      }
    }

    try {
      // Backend validates credentials, generates 6-digit OTP, and dispatches real email via Brevo
      const res = await request('/auth/login-init', {
        method: 'POST',
        body: JSON.stringify({ email: cleanEmail, password })
      });

      failedLoginAttempts[cleanEmail] = 0;

      return {
        requireOtp: true,
        email: cleanEmail,
        message: res.message || `Verification code sent to ${cleanEmail}.`
      };
    } catch (err) {
      failedLoginAttempts[cleanEmail] = (failedLoginAttempts[cleanEmail] || 0) + 1;
      if (failedLoginAttempts[cleanEmail] >= 5) {
        throw {
          forcePasswordReset: true,
          message: 'Maximum password attempts exceeded (5/5). Your account has been locked. Please reset your password.'
        };
      }
      throw new Error(err.message || 'Invalid email or password.');
    }
  },

  loginVerifyOtp: async (email, code, deviceId = null, trustDevice = false) => {
    const cleanEmail = (email || '').trim().toLowerCase();
    const enteredCode = String(code || '').trim();

    const res = await request('/auth/verify-otp', {
      method: 'POST',
      body: JSON.stringify({ email: cleanEmail, code: enteredCode })
    });

    const token = res.token || res.data?.token;
    const user = normalizeUser(res.user || res.data?.user);
    if (token) {
      localStorage.setItem('archon_token', token);
    }
    if (user) {
      localStorage.setItem('archon_user', JSON.stringify(user));
    }

    if (trustDevice) {
      saveDeviceTrust(cleanEmail);
    } else {
      clearDeviceTrust(cleanEmail);
    }

    return {
      token,
      user
    };
  },

  forgotPasswordInit: async (email) => {
    const cleanEmail = (email || '').trim().toLowerCase();
    if (!cleanEmail) {
      throw new Error('Please enter your registered email address.');
    }

    // Backend checks email existence, generates code, and dispatches email via Brevo
    const res = await request('/auth/forgot-password', {
      method: 'POST',
      body: JSON.stringify({ email: cleanEmail })
    });

    return {
      requireOtp: true,
      email: cleanEmail,
      message: res.message || `Security reset code dispatched to ${cleanEmail}.`
    };
  },

  forgotPasswordVerify: async (email, code, newPassword) => {
    const cleanEmail = (email || '').trim().toLowerCase();
    const enteredCode = String(code || '').trim();

    // Password Policy: 5 requirements
    const hasMinLength = newPassword.length >= 8;
    const hasUppercase = /[A-Z]/.test(newPassword);
    const hasLowercase = /[a-z]/.test(newPassword);
    const hasNumber = /[0-9]/.test(newPassword);
    const hasSpecial = /[^A-Za-z0-9]/.test(newPassword);

    if (!hasMinLength || !hasUppercase || !hasLowercase || !hasNumber || !hasSpecial) {
      throw new Error('New password must satisfy all 5 requirements of the Password Policy.');
    }

    // Backend verifies code and updates password hash in PostgreSQL auth_core.users
    const res = await request('/auth/reset-password', {
      method: 'POST',
      body: JSON.stringify({ email: cleanEmail, code: enteredCode, newPassword })
    });

    failedLoginAttempts[cleanEmail] = 0;

    return {
      success: true,
      message: res.message || 'Password successfully updated! Your account is unlocked.'
    };
  },

  resendOtp: async (email, purpose) => {
    const cleanEmail = (email || '').trim().toLowerCase();

    const res = await request('/auth/resend-otp', {
      method: 'POST',
      body: JSON.stringify({ email: cleanEmail, purpose })
    });

    return {
      success: true,
      requireOtp: true,
      message: res.message || `New verification code sent to ${cleanEmail}.`
    };
  },

  register: async (userData) => {
    const cleanPhone = (userData.phone || userData.phoneNumber || '').replace(/\D/g, '').slice(0, 11);
    const cleanEmail = (userData.email || '').trim().toLowerCase();
    const cleanAddress = (userData.defaultAddress || userData.address || '').trim();
    const payload = {
      fullName: userData.name || userData.fullName,
      email: cleanEmail,
      password: userData.password,
      phoneNumber: cleanPhone,
      phone: cleanPhone,
      company: userData.company || '',
      defaultAddress: cleanAddress,
      address: cleanAddress,
      role: 'customer'
    };

    const res = await request('/auth/register', {
      method: 'POST',
      body: JSON.stringify(payload)
    });

    const user = res?.user || res?.data?.user || {
      id: 'usr_' + Date.now(),
      email: cleanEmail,
      full_name: payload.fullName,
      phone_number: cleanPhone,
      default_address: cleanAddress,
      privacy_consent: { granted: true, policyVersion: 'RA10173-2026.1' }
    };
    const normalizedUser = normalizeUser(user);

    try {
      const raw = localStorage.getItem('archon_registered_customers_cache');
      const list = raw ? JSON.parse(raw) : [];
      const filtered = list.filter((u) => u.email?.toLowerCase() !== cleanEmail);
      filtered.unshift(normalizedUser);
      localStorage.setItem('archon_registered_customers_cache', JSON.stringify(filtered));
    } catch {}

    return {
      success: true,
      user: normalizedUser,
      email: cleanEmail
    };
  },

  logout: async () => {
    try {
      await request('/auth/logout', { method: 'POST' });
    } catch {}
    localStorage.removeItem('archon_token');
    localStorage.removeItem('archon_user');
    return { success: true };
  },

  getMe: async () => {
    try {
      const res = await request('/auth/me');
      return normalizeUser(res);
    } catch {
      return null;
    }
  },

  updateProfile: async (data) => {
    try {
      const res = await request('/auth/profile', {
        method: 'PUT',
        body: JSON.stringify(data)
      });
      const user = res?.user || res?.data || data;
      const normalized = normalizeUser(user);

      // Keep registered customer cache updated with revoked/granted consent or new profile info
      try {
        const raw = localStorage.getItem('archon_registered_customers_cache');
        if (raw) {
          const list = JSON.parse(raw);
          const email = (normalized.email || '').toLowerCase();
          const idx = list.findIndex((u) => (u.email || '').toLowerCase() === email);
          if (idx !== -1) {
            list[idx] = { ...list[idx], ...normalized };
            localStorage.setItem('archon_registered_customers_cache', JSON.stringify(list));
          }
        }
      } catch {}

      return {
        success: true,
        user: normalized
      };
    } catch {
      const normalized = normalizeUser(data);
      try {
        const raw = localStorage.getItem('archon_registered_customers_cache');
        if (raw) {
          const list = JSON.parse(raw);
          const email = (normalized.email || '').toLowerCase();
          const idx = list.findIndex((u) => (u.email || '').toLowerCase() === email);
          if (idx !== -1) {
            list[idx] = { ...list[idx], ...normalized };
            localStorage.setItem('archon_registered_customers_cache', JSON.stringify(list));
          }
        }
      } catch {}
      return {
        success: true,
        user: normalized
      };
    }
  },

  getCustomers: async () => {
    let serverCustomers = [];
    try {
      const res = await request('/auth/customers');
      const list = res?.data || res;
      if (Array.isArray(list)) {
        serverCustomers = list.map(normalizeUser);
      }
    } catch (e) {
      console.warn('[authService.getCustomers fetch failed]:', e.message);
    }

    let localCache = [];
    try {
      const raw = localStorage.getItem('archon_registered_customers_cache');
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) localCache = parsed.map(normalizeUser);
      }
    } catch {}

    const map = new Map();
    serverCustomers.forEach((u) => {
      const key = (u.email || '').toLowerCase();
      if (key) map.set(key, u);
    });
    localCache.forEach((u) => {
      const key = (u.email || '').toLowerCase();
      if (key) {
        if (!map.has(key)) {
          map.set(key, u);
        } else {
          // If local has newer privacy consent or address, overlay it
          const existing = map.get(key);
          map.set(key, { ...existing, ...u, privacyConsent: u.privacyConsent || existing.privacyConsent });
        }
      }
    });

    return Array.from(map.values());
  }
};

export default authService;
