import { request } from './client';

const DEFAULT_VOUCHERS = [
  { code: 'ARCHON20', discountType: 'PERCENTAGE', discountValue: 20, minSpend: 1000, isActive: true },
  { code: 'FREESHIP', discountType: 'FREE_SHIPPING', discountValue: 0, minSpend: 0, isActive: true },
  { code: 'ARCHON500', discountType: 'FIXED_AMOUNT', discountValue: 500, minSpend: 3000, isActive: true }
];

export const voucherService = {
  getVouchers: async () => {
    try {
      const res = await request('/shop/vouchers');
      const list = Array.isArray(res?.data) ? res.data : (Array.isArray(res) ? res : []);
      return list.length > 0 ? list : DEFAULT_VOUCHERS;
    } catch {
      return DEFAULT_VOUCHERS;
    }
  },

  validateVoucher: (code, subtotal) =>
    request('/shop/vouchers/validate', {
      method: 'POST',
      body: JSON.stringify({ code, subtotal })
    })
};

export default voucherService;
