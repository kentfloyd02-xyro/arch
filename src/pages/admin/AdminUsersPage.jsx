import React from 'react';
import { useAdminUsersPageController } from '../../controllers/AdminUsersPageController';
import { Users, Search, RefreshCw, Lock, ShieldCheck, ShieldAlert } from 'lucide-react';

export default function AdminUsersPage() {
  const {
    userSearch,
    setUserSearch,
    userConsentFilter,
    setUserConsentFilter,
    consentedUsersCount,
    withheldUsersCount,
    usersLoading,
    fetchRegisteredUsers,
    filteredCustomers
  } = useAdminUsersPageController();

  return (
    <div className="bg-[#0b1b3d] p-3.5 sm:p-6 rounded-2xl sm:rounded-3xl border border-[#142958] shadow-lg space-y-4">
      {/* Header and Controls */}
      <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-3 pb-3 border-b border-[#142958]">
        <div>
          <h2 className="text-base font-extrabold text-white flex items-center gap-2">
            <Users className="w-4 h-4 text-amber-400" />
            <span>Manage Customers &amp; User Accounts ({filteredCustomers.length})</span>
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Registered accounts, corporate contractors, and customer order profiles with RA 10173 data privacy compliance.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={fetchRegisteredUsers}
            disabled={usersLoading}
            className="px-3 py-1.5 bg-[#07132c] hover:bg-[#142958] border border-[#142958] text-xs font-bold text-slate-200 rounded-xl flex items-center gap-1.5 transition-all active:scale-95"
          >
            <RefreshCw className={`w-3.5 h-3.5 text-blue-400 ${usersLoading ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </button>

          <select
            value={userConsentFilter}
            onChange={(e) => setUserConsentFilter(e.target.value)}
            className="py-1.5 px-3 bg-[#07132c] text-xs font-semibold text-white rounded-xl border border-[#142958] focus:outline-none cursor-pointer"
          >
            <option value="all">All Privacy Statuses</option>
            <option value="consented">Consent Granted</option>
            <option value="withheld">Consent Withheld (Masked)</option>
          </select>

          <div className="relative">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={userSearch}
              onChange={(e) => setUserSearch(e.target.value)}
              placeholder="Search customers..."
              className="pl-8 pr-3 py-1.5 bg-[#07132c] text-xs text-white placeholder-slate-400 rounded-xl border border-[#142958] focus:outline-none w-44 sm:w-52"
            />
          </div>
        </div>
      </div>

      {/* Compliance Metric Badges */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
        <div className="p-3 rounded-xl bg-[#07132c] border border-[#142958] flex items-center justify-between">
          <span className="text-slate-400">Consent Granted (Full Access):</span>
          <span className="font-bold text-emerald-400 font-mono flex items-center gap-1">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>{consentedUsersCount}</span>
          </span>
        </div>
        <div className="p-3 rounded-xl bg-[#07132c] border border-[#142958] flex items-center justify-between">
          <span className="text-slate-400">Consent Withheld (Masked Details):</span>
          <span className="font-bold text-rose-400 font-mono flex items-center gap-1">
            <ShieldAlert className="w-3.5 h-3.5" />
            <span>{withheldUsersCount}</span>
          </span>
        </div>
      </div>

      {/* Users Table */}
      {filteredCustomers.length === 0 ? (
        <div className="p-8 text-center text-slate-400 text-xs bg-[#07132c] rounded-2xl border border-[#142958]">
          No customer records match your filter criteria.
        </div>
      ) : (
        <div className="overflow-x-auto rounded-2xl border border-[#142958] bg-[#07132c]">
          <table className="w-full border-collapse text-left text-xs">
            <thead>
              <tr className="border-b border-[#142958] bg-[#0b1b3d]/50">
                <th className="p-3 text-[10px] uppercase tracking-wider text-slate-400">Customer &amp; Company</th>
                <th className="p-3 text-[10px] uppercase tracking-wider text-slate-400">Personal Contact</th>
                <th className="p-3 text-[10px] uppercase tracking-wider text-slate-400">Site / Delivery Address</th>
                <th className="p-3 text-[10px] uppercase tracking-wider text-slate-400 text-center">RA 10173 Consent</th>
                <th className="p-3 text-[10px] uppercase tracking-wider text-slate-400 text-center">Orders</th>
                <th className="p-3 text-[10px] uppercase tracking-wider text-slate-400 text-right">Lifetime Spend</th>
                <th className="p-3 text-[10px] uppercase tracking-wider text-slate-400">Last Order Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#142958]">
              {filteredCustomers.map((customer) => (
                <tr key={customer.customerEmail || customer.customerPhone} className="hover:bg-[#0b1b3d]/60 transition-colors">
                  <td className="p-3 text-white">
                    <strong className="block text-slate-100">{customer.customerName}</strong>
                    <span className="text-[10px] text-slate-400">{customer.company}</span>
                  </td>
                  <td className="p-3 text-slate-300">
                    {customer.isConsented ? (
                      <>
                        <div className="font-mono text-[11px] text-blue-300">{customer.displayEmail}</div>
                        <div className="text-[10px] text-slate-400 font-mono mt-0.5">{customer.displayPhone}</div>
                      </>
                    ) : (
                      <>
                        <div className="font-mono text-[11px] text-rose-300 flex items-center gap-1">
                          <Lock className="w-3 h-3 text-rose-400 shrink-0" />
                          <span>{customer.displayEmail}</span>
                        </div>
                        <div className="text-[10px] text-slate-400 font-mono mt-0.5">{customer.displayPhone}</div>
                        <span className="inline-block mt-0.5 px-1.5 py-0.2 rounded bg-rose-500/10 border border-rose-500/20 text-[9px] text-rose-300">
                          Masked per RA 10173
                        </span>
                      </>
                    )}
                  </td>
                  <td className="p-3 text-slate-300 max-w-xs text-[11px]">
                    {customer.isConsented ? (
                      customer.displayAddress
                    ) : (
                      <span className="text-slate-400 italic font-mono text-[10px]">
                        {customer.displayAddress}
                      </span>
                    )}
                  </td>
                  <td className="p-3 text-center whitespace-nowrap">
                    {customer.isConsented ? (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                        <ShieldCheck className="w-3 h-3" />
                        <span>Granted</span>
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-rose-500/20 text-rose-300 border border-rose-500/30">
                        <Lock className="w-3 h-3" />
                        <span>Withheld</span>
                      </span>
                    )}
                  </td>
                  <td className="p-3 text-center font-bold text-white font-mono">
                    {customer.orderCount}
                  </td>
                  <td className="p-3 text-right font-mono font-bold text-emerald-400">
                    {customer.lifetimeSpendFormatted}
                  </td>
                  <td className="p-3 text-slate-400 font-mono text-[11px] whitespace-nowrap">
                    {customer.lastOrderDateFormatted}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
