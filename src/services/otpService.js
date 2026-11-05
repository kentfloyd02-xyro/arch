import { request } from './client';

export const otpService = {
  sendOtp: (email) =>
    request('/auth/resend-otp', {
      method: 'POST',
      body: JSON.stringify({ email })
    }),

  verifyOtp: (email, code) =>
    request('/auth/verify-otp', {
      method: 'POST',
      body: JSON.stringify({ email, code })
    })
};

export default otpService;
