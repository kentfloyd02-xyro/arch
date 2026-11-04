import { request } from './client';

export const otpService = {
  sendOtp: (email) =>
    request('/otp/send', {
      method: 'POST',
      body: JSON.stringify({ email })
    }),

  verifyOtp: (email, code) =>
    request('/otp/verify', {
      method: 'POST',
      body: JSON.stringify({ email, code })
    })
};

export default otpService;
