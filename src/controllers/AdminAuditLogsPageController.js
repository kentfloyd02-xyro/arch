import { useState, useEffect } from 'react';
import { api } from '../services/api';

export function getAuditBadgeClass(action = '') {
  if (
    action.includes('LOCKED') ||
    action.includes('ABORTED') ||
    action.includes('FAILED')
  ) {
    return 'bg-rose-500/20 text-rose-300 border-rose-500/30';
  }
  if (action.includes('SUCCESS') || action.includes('INITIALIZED')) {
    return 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30';
  }
  if (
    action.includes('RESET') ||
    action.includes('STOCK') ||
    action.includes('REFUND')
  ) {
    return 'bg-amber-500/20 text-amber-300 border-amber-500/30';
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

  return {
    auditSearch,
    setAuditSearch,
    auditActionFilter,
    setAuditActionFilter,
    auditLoading,
    fetchAuditLogs,
    filteredAuditLogs
  };
}

export default useAdminAuditLogsPageController;
