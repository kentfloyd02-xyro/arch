import { request } from './client';

export const auditService = {
  getAuditLogs: async (params = {}) => {
    try {
      const query = new URLSearchParams(params).toString();
      const res = await request(`/audit-logs${query ? `?${query}` : ''}`);
      return Array.isArray(res) ? res : (res?.data || []);
    } catch (err) {
      console.warn('Audit logs request failed:', err.message);
      throw err;
    }
  }
};

export default auditService;
