import { request } from './client';

function normalizeUser(u) {
  if (!u) return u;
  return {
    ...u,
    name: u.full_name || u.name || 'User',
    role: (u.global_role === 'superadmin' || u.global_role === 'admin' || u.role === 'admin') ? 'admin' : (u.role || 'customer')
  };
}

const failedLoginAttempts = {};

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

    const user = normalizeUser(res.user);
    if (res.token) {
      localStorage.setItem('archon_token', res.token);
    }
    if (user) {
      localStorage.setItem('archon_user', JSON.stringify(user));
    }

    return {
      token: res.token,
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
    const payload = {
      fullName: userData.name || userData.fullName,
      email: userData.email,
      password: userData.password,
      role: 'customer'
    };

    const res = await request('/auth/register', {
      method: 'POST',
      body: JSON.stringify(payload)
    });

    if (res?.user) {
      res.user = normalizeUser(res.user);
    }
    return res;
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
    return {
      success: true,
      user: normalizeUser(data)
    };
  },

  getCustomers: async () => {
    return [];
  }
};

export default authService;
