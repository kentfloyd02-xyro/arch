import React from 'react';
import { useAdminViewController } from '../controllers/AdminViewController';
import { ShieldCheck, ArrowLeft, LogOut } from 'lucide-react';

import AdminDashboardPage from '../pages/admin/AdminDashboardPage';
import AdminInventoryPage from '../pages/admin/AdminInventoryPage';
import AdminOrdersPage from '../pages/admin/AdminOrdersPage';
import AdminShipmentsPage from '../pages/admin/AdminShipmentsPage';
import AdminRefundsPage from '../pages/admin/AdminRefundsPage';
import AdminUsersPage from '../pages/admin/AdminUsersPage';
import AdminAuditLogsPage from '../pages/admin/AdminAuditLogsPage';

export default function AdminView() {
  const {
    setCurrentView,
    logoutUser,
    activeTab,
    setActiveTab,
    navigation
  } = useAdminViewController();

  return (
    <div className="admin-view min-h-screen bg-[#07132c] text-slate-100 py-4 sm:py-8 px-3 sm:px-6 lg:px-8">
      <div className="mx-auto grid max-w-[1600px] grid-cols-[250px_minmax(0,1fr)] items-start gap-6 max-[800px]:grid-cols-1 max-[800px]:gap-3.5">
        {/* Sidebar Workspace Navigation */}
        <aside className="sticky top-6 flex min-h-[calc(100vh-48px)] flex-col rounded-[22px] border border-[#142958] bg-[#0b1b3d] px-3.5 py-5 max-[800px]:static max-[800px]:min-h-0 max-[800px]:rounded-[18px] max-[800px]:p-3">
          <div className="flex items-center gap-[11px] border-b border-[#142958] px-2 pb-[22px] pt-0.5 max-[800px]:hidden">
            <span className="grid h-[38px] w-[38px] place-items-center rounded-xl bg-amber-500 text-[#07132c]">
              <ShieldCheck size={19} />
            </span>
            <div>
              <strong className="block text-sm text-white">Archon Nell</strong>
              <span className="mt-[3px] block text-[11px] text-slate-400">Admin Console</span>
            </div>
          </div>

          <nav className="mt-6 grid gap-1.5 max-[800px]:mt-0 max-[800px]:flex max-[800px]:gap-1.5 max-[800px]:overflow-x-auto" aria-label="Admin sections">
            <span className="px-2.5 pb-2 text-[10px] font-extrabold tracking-[.12em] text-[#8294b3] max-[800px]:hidden">
              WORKSPACE
            </span>
            {navigation.map(({ id, label, icon: Icon, count }) => (
              <button
                key={id}
                type="button"
                onClick={() => setActiveTab(id)}
                className={`flex w-full cursor-pointer items-center gap-[11px] rounded-xl border px-2.5 py-[11px] text-left text-xs font-bold transition-colors max-[800px]:w-auto max-[800px]:shrink-0 max-[800px]:px-2.5 max-[800px]:py-2.5 max-[520px]:gap-[7px] max-[520px]:text-[10px] ${
                  activeTab === id
                    ? 'border-blue-500 bg-blue-700 text-white'
                    : 'border-transparent bg-transparent text-slate-300 hover:bg-[#10234a] hover:text-white'
                }`}
                aria-current={activeTab === id ? 'page' : undefined}
              >
                <Icon size={17} />
                <span className="whitespace-nowrap">{label}</span>
                {count !== undefined && (
                  <small
                    className={`ml-auto text-[10px] max-[800px]:hidden ${
                      activeTab === id ? 'text-blue-100' : 'text-[#a9b8d0]'
                    }`}
                  >
                    {count}
                  </small>
                )}
              </button>
            ))}
          </nav>

          <div className="mt-auto border-0 pt-5 max-[800px]:hidden">
            <button
              type="button"
              onClick={() => setCurrentView('store')}
              className="flex w-full cursor-pointer items-center gap-[9px] rounded-xl border border-[#142958] bg-[#07132c] px-2.5 py-[11px] text-xs font-bold text-blue-300 hover:text-white transition-colors"
            >
              <ArrowLeft size={16} /> Back to Store
            </button>
          </div>
        </aside>

        {/* Main Content Area */}
        <main className="min-w-0">
          <div className="mx-auto max-w-none space-y-4 sm:space-y-6">
            {/* Top Bar Header */}
            <div className="bg-[#0b1b3d] p-3.5 sm:p-5 rounded-2xl sm:rounded-3xl border border-[#142958] shadow-lg flex flex-col sm:flex-row justify-between sm:items-center gap-3">
              <div className="flex items-center justify-between sm:justify-start gap-3 w-full sm:w-auto">
                <button
                  onClick={() => setCurrentView('store')}
                  className="px-3 py-2 bg-[#07132c] hover:bg-blue-600/30 text-blue-300 hover:text-white rounded-xl border border-[#142958] transition-all flex items-center gap-1.5 text-xs font-bold active:scale-95"
                >
                  <ArrowLeft className="w-4 h-4 text-blue-400" />
                  <span>Back to Store</span>
                </button>

                <button
                  onClick={logoutUser}
                  className="sm:hidden px-3 py-2 bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/30 text-rose-300 rounded-xl text-xs font-bold flex items-center gap-1"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span>Sign Out</span>
                </button>
              </div>

              <div className="hidden sm:block text-center sm:text-left flex-1 sm:ml-4">
                <div className="flex items-center gap-2">
                  <span className="p-1 bg-amber-500 rounded-md text-slate-950 font-bold">
                    <ShieldCheck className="w-3.5 h-3.5" />
                  </span>
                  <h1 className="text-base sm:text-lg font-extrabold text-white leading-tight">
                    Admin Operations Center
                  </h1>
                </div>
                <p className="text-[11px] text-slate-400">
                  Warehouse inventory, stock levels, and dispatch logistics
                </p>
              </div>

              <div className="hidden sm:flex items-center gap-2">
                <span className="bg-amber-500/10 text-amber-300 border border-amber-500/30 px-2.5 py-1 rounded-xl text-xs font-bold">
                  Cainta Central Plant
                </span>
                <button
                  onClick={logoutUser}
                  className="px-3.5 py-1.5 bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/30 text-rose-300 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span>Sign Out</span>
                </button>
              </div>
            </div>

            {/* Individual Sub-Pages */}
            {activeTab === 'dashboard' && <AdminDashboardPage onNavigateTab={setActiveTab} />}
            {activeTab === 'inventory' && <AdminInventoryPage />}
            {activeTab === 'orders' && <AdminOrdersPage />}
            {activeTab === 'shipments' && <AdminShipmentsPage />}
            {activeTab === 'refunds' && <AdminRefundsPage />}
            {activeTab === 'users' && <AdminUsersPage />}
            {activeTab === 'audit' && <AdminAuditLogsPage />}
          </div>
        </main>
      </div>
    </div>
  );
}
