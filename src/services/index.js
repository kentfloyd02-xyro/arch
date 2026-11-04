export { API_BASE, BASE_URL, request, checkApiHealth } from './client';
export { authService } from './authService';
export { productService } from './productService';
export { orderService } from './orderService';
export { reviewService } from './reviewService';
export { voucherService } from './voucherService';
export { otpService } from './otpService';
export { projectService } from './projectService';
export { uploadService } from './uploadService';
export { auditService } from './auditService';

import { authService } from './authService';
import { productService } from './productService';
import { orderService } from './orderService';
import { reviewService } from './reviewService';
import { voucherService } from './voucherService';
import { otpService } from './otpService';
import { projectService } from './projectService';
import { uploadService } from './uploadService';
import { auditService } from './auditService';

export const api = {
  ...authService,
  ...productService,
  ...orderService,
  ...reviewService,
  ...voucherService,
  ...otpService,
  ...projectService,
  ...uploadService,
  ...auditService
};

export default api;
