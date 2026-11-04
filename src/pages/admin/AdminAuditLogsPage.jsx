import React from 'react';
import { useAdminAuditLogsPageController } from '../../controllers/AdminAuditLogsPageController';
import { ClipboardList, RefreshCw, Search } from 'lucide-react';

export default function AdminAuditLogsPage() {
  const {
    auditSearch,
    setAuditSearch,
    auditActionFilter,
    setAuditActionFilter,
    auditLoading,
    fetchAuditLogs,
    filteredAuditLogs
  } = useAdminAuditLogsPageController();

  return (
    <section className="bg-[#0b1b3d] p-4 sm:p-6 rounded-2xl sm:rounded-3xl border border-[#142958] shadow-lg space-y-4">
      {/* Header and Controls */}
      <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-3 pb-3 border-b border-[#142958]">
        <div>
          <h2 className="text-base font-extrabold text-white flex items-center gap-2">
            <ClipboardList className="w-4 h-4 text-amber-400" />
            <span>Audit Logs &amp; Security Compliance ({filteredAuditLogs.length})</span>
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Immutable security audit trail recording 2FA OTP verifications, device trusts, failed logins, lockouts, and order dispatches.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={fetchAuditLogs}
            disabled={auditLoading}
            className="px-3 py-1.5 bg-[#07132c] hover:bg-[#142958] border border-[#142958] text-xs font-bold text-slate-200 rounded-xl flex items-center gap-1.5 transition-all active:scale-95"
          >
            <RefreshCw className={`w-3.5 h-3.5 text-blue-400 ${auditLoading ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </button>

          <select
            value={auditActionFilter}
            onChange={(e) => setAuditActionFilter(e.target.value)}
            className="py-1.5 px-3 bg-[#07132c] text-xs font-semibold text-white rounded-xl border border-[#142958] focus:outline-none cursor-pointer"
          >
            <option value="all">All Actions</option>
            <option value="LOGIN_2FA_SUCCESS">Login 2FA Success</option>
            <option value="LOGIN_FAILED">Login Failed</option>
            <option value="LOGIN_TRUSTED_DEVICE">Login Trusted Device</option>
            <option value="ACCOUNT_LOCKED_5_FAILED_ATTEMPTS">Account Locked (5 Attempts)</option>
            <option value="OTP_ABORTED_MAX_ATTEMPTS">OTP Aborted (5 Attempts)</option>
            <option value="DELIVERY_STATUS_UPDATED">Delivery Status Updated</option>
            <option value="ORDER_CREATED">Order Created</option>
            <option value="ORDER_PLACED">Order Placed</option>
            <option value="REFUND_STATUS_UPDATED">Refund Status Updated</option>
            <option value="PASSWORD_RESET_SUCCESS">Password Reset</option>
            <option value="STOCK_ADJUSTED">Stock Adjusted</option>
            <option value="SYSTEM_SEED_INITIALIZED">System Seed Initialized</option>
          </select>

          <div className="relative">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={auditSearch}
              onChange={(e) => setAuditSearch(e.target.value)}
              placeholder="Search logs..."
              className="pl-8 pr-3 py-1.5 bg-[#07132c] text-xs text-white placeholder-slate-400 rounded-xl border border-[#142958] focus:outline-none w-44 sm:w-52"
            />
          </div>
        </div>
      </div>

      {/* Logs Table */}
      {filteredAuditLogs.length === 0 ? (
        <div className="p-12 text-center text-slate-400 text-xs bg-[#07132c] rounded-2xl border border-[#142958]">
          <ClipboardList className="w-8 h-8 text-slate-500 mx-auto mb-2 opacity-50" />
          No audit log records match your filter criteria.
        </div>
      ) : (
        <div className="overflow-x-auto rounded-2xl border border-[#142958] bg-[#07132c]">
          <table className="w-full border-collapse text-left text-xs">
            <thead>
              <tr className="border-b border-[#142958] bg-[#0b1b3d]/50">
                <th className="p-3 text-[10px] uppercase tracking-wider text-slate-400">Timestamp</th>
                <th className="p-3 text-[10px] uppercase tracking-wider text-slate-400">Action</th>
                <th className="p-3 text-[10px] uppercase tracking-wider text-slate-400">Performed By</th>
                <th className="p-3 text-[10px] uppercase tracking-wider text-slate-400">Target</th>
                <th className="p-3 text-[10px] uppercase tracking-wider text-slate-400">Details</th>
                <th className="p-3 text-[10px] uppercase tracking-wider text-slate-400">IP &amp; Device</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#142958]">
              {filteredAuditLogs.map((log) => (
                <tr key={log.id} className="hover:bg-[#0b1b3d]/60 transition-colors">
                  <td className="p-3 font-mono text-[11px] text-slate-400 whitespace-nowrap">
                    {log.formattedDate}
                  </td>
                  <td className="p-3 whitespace-nowrap">
                    <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold border ${log.badgeClass}`}>
                      {log.action}
                    </span>
                  </td>
                  <td className="p-3 text-slate-200 whitespace-nowrap">
                    <div className="font-semibold text-white">{log.performedByName}</div>
                    <div className="text-[10px] text-slate-400">{log.performedByEmail}</div>
                  </td>
                  <td className="p-3 font-mono text-[11px] text-blue-300 whitespace-nowrap">
                    {log.targetDisplay}
                  </td>
                  <td className="p-3 text-slate-300 max-w-xs break-words text-[11px]">
                    {log.detailsDisplay}
                  </td>
                  <td className="p-3 text-slate-400 font-mono text-[10px] whitespace-nowrap">
                    <div>{log.ipDisplay}</div>
                    <div className="text-[9px] text-slate-500 truncate max-w-[120px]">
                      {log.userAgentDisplay}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}
