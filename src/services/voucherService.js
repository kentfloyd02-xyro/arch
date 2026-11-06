import { request } from './client';

export const voucherService = {
  getVouchers: async () => {
    try {
      const res = await request('/shop/vouchers');
      const list = Array.isArray(res?.data) ? res.data : (Array.isArray(res) ? res : []);
      return list;
    } catch (err) {
      console.warn('Vouchers fetch from database:', err.message);
      return [];
    }
  },

  validateVoucher: (code, subtotal) =>
    request('/shop/vouchers/validate', {
      method: 'POST',
      body: JSON.stringify({ code, subtotal })
    })
};

export default voucherService;
