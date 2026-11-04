import { request } from './client';

export const voucherService = {
  getVouchers: () =>
    request('/shop/vouchers').catch(() => []),

  validateVoucher: (code, subtotal) =>
    request('/shop/vouchers/validate', {
      method: 'POST',
      body: JSON.stringify({ code, subtotal })
    })
};

export default voucherService;
