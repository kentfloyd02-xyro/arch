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
  },

  logActivity: async (module, action, details, resourceId = null) => {
    try {
      return await request('/audit-logs', {
        method: 'POST',
        body: JSON.stringify({
          module,
          action,
          details: typeof details === 'object' ? details : { details },
          resourceId
        })
      });
    } catch (err) {
      console.warn('[Audit Log Activity Error]:', err.message);
    }
  }
};

export default auditService;
