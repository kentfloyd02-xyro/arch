import { useState, useEffect } from 'react';
import { api } from '../services/api';

export function getAuditBadgeClass(action = '') {
  if (
    action.includes('LOCKED') ||
    action.includes('ABORTED') ||
    action.includes('FAILED') ||
    action.includes('DELETED') ||
    action.includes('CANCELLED')
  ) {
    return 'bg-rose-500/20 text-rose-300 border-rose-500/30';
  }
  if (
    action.includes('SUCCESS') ||
    action.includes('INITIALIZED') ||
    action.includes('ORDER_CREATED') ||
    action.includes('ORDER_PLACED') ||
    action.includes('COMPLETED')
  ) {
    return 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30';
  }
  if (
    action.includes('RESET') ||
    action.includes('STOCK') ||
    action.includes('REFUND') ||
    action.includes('WARNING')
  ) {
    return 'bg-amber-500/20 text-amber-300 border-amber-500/30';
  }
  if (action.includes('ARCHIVE')) {
    return 'bg-purple-500/20 text-purple-300 border-purple-500/30';
  }
  return 'bg-blue-500/20 text-blue-300 border-blue-500/30';
}

export function useAdminAuditLogsPageController() {
  const [auditLogs, setAuditLogs] = useState([]);
  const [auditSearch, setAuditSearch] = useState('');
  const [auditActionFilter, setAuditActionFilter] = useState('all');
  const [auditLoading, setAuditLoading] = useState(false);

  const fetchAuditLogs = () => {
    setAuditLoading(true);
    api.getAuditLogs({ limit: 100 })
      .then((data) => {
        if (Array.isArray(data)) setAuditLogs(data);
      })
      .catch((err) => console.warn('Audit logs fetch:', err.message))
      .finally(() => setAuditLoading(false));
  };

  useEffect(() => {
    fetchAuditLogs();
  }, []);

  const q = auditSearch.toLowerCase().trim();

  const filteredAuditLogs = auditLogs
    .filter((log) => {
      const matchesAction =
        auditActionFilter === 'all' || log.action === auditActionFilter;
      const matchesSearch =
        !q ||
        (log.details && log.details.toLowerCase().includes(q)) ||
        (log.target && log.target.toLowerCase().includes(q)) ||
        (log.action && log.action.toLowerCase().includes(q)) ||
        (log.performedBy?.email &&
          log.performedBy.email.toLowerCase().includes(q)) ||
        (log.performedBy?.name &&
          log.performedBy.name.toLowerCase().includes(q));
      return matchesAction && matchesSearch;
    })
    .map((log, idx) => ({
      ...log,
      id: log._id || idx,
      badgeClass: getAuditBadgeClass(log.action || ''),
      performedByName: log.performedBy?.name || 'System / Anonymous',
      performedByEmail: log.performedBy?.email || 'N/A',
      formattedDate: log.createdAt
        ? new Date(log.createdAt).toLocaleString('en-US', {
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit'
          })
        : '—',
      targetDisplay: log.target || '—',
      detailsDisplay: log.details || '—',
      ipDisplay: log.ip || '127.0.0.1',
      userAgentDisplay: log.userAgent || 'Web Client'
    }));

  const availableActions = Array.from(
    new Set([
      'LOGIN_2FA_SUCCESS',
      'LOGIN_FAILED',
      'LOGIN_TRUSTED_DEVICE',
      'ACCOUNT_LOCKED_5_FAILED_ATTEMPTS',
      'OTP_ABORTED_MAX_ATTEMPTS',
      'ORDER_CREATED',
      'ORDER_CANCELLED',
      'DELIVERY_STATUS_UPDATED',
      'REFUND_REQUESTED',
      'REFUND_STATUS_UPDATED',
      'STOCK_ADJUSTED',
      'PRODUCT_CREATED',
      'PRODUCT_UPDATED',
      'PRODUCT_ARCHIVED',
      'PRODUCT_UNARCHIVED',
      'PRODUCT_DELETED',
      'PASSWORD_RESET_SUCCESS',
      'SYSTEM_SEED_INITIALIZED',
      ...auditLogs.map((l) => l.action).filter(Boolean)
    ])
  ).sort();

  return {
    auditSearch,
    setAuditSearch,
    auditActionFilter,
    setAuditActionFilter,
    auditLoading,
    fetchAuditLogs,
    filteredAuditLogs,
    availableActions
  };
}

export default useAdminAuditLogsPageController;
