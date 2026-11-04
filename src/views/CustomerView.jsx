import React from 'react';
import { useCustomerViewController } from '../controllers/CustomerViewController';
import {
  UserRound,
  ArrowLeft,
  LogOut,
  ShieldCheck
} from 'lucide-react';

import CustomerOverviewPage from '../pages/customer/CustomerOverviewPage';
import CustomerOrdersPage from '../pages/customer/CustomerOrdersPage';
import CustomerProfilePage from '../pages/customer/CustomerProfilePage';
import CustomerRewardsPage from '../pages/customer/CustomerRewardsPage';
import CustomerSupportPage from '../pages/customer/CustomerSupportPage';

export default function CustomerView() {
  const {
    currentUser,
    activeSection,
    setActiveSection,
    currentSectionLabel,
    sections,
    setCurrentView,
    logoutUser
  } = useCustomerViewController();

  return (
    <div className="min-h-screen bg-[#07132c] px-3 py-4 text-slate-100 sm:px-6 sm:py-8">
      <div className="mx-auto grid max-w-[1500px] items-start gap-5 lg:grid-cols-[245px_minmax(0,1fr)]">
        {/* Sidebar Navigation */}
        <aside className="rounded-2xl border border-[#142958] bg-[#0b1b3d] p-4 lg:sticky lg:top-6">
          <div className="mb-5 hidden items-center gap-3 border-b border-[#142958] pb-5 lg:flex">
            <div className="grid h-10 w-10 place-items-center rounded-xl bg-blue-600">
              <UserRound size={20} />
            </div>
            <div className="min-w-0">
              <div className="truncate text-sm font-extrabold text-white">
                {currentUser?.name || 'Customer'}
              </div>
              <div className="text-[10px] text-slate-400">Customer account</div>
            </div>
          </div>

          <nav className="flex gap-1 overflow-x-auto lg:grid lg:overflow-visible" aria-label="Customer portal sections">
            {sections.map(({ id, label, icon: Icon, count }) => (
              <button
                key={id}
                type="button"
                onClick={() => setActiveSection(id)}
                className={`flex shrink-0 items-center gap-2 rounded-xl px-3 py-2.5 text-left text-xs font-bold transition-colors ${
                  activeSection === id ? 'bg-blue-600 text-white' : 'text-slate-300 hover:bg-[#142958]'
                }`}
              >
                <Icon size={16} />
                <span className="whitespace-nowrap">{label}</span>
                {count !== undefined && (
                  <span className="ml-auto hidden text-[10px] opacity-70 lg:inline">
                    {count}
                  </span>
                )}
              </button>
            ))}
          </nav>

          <div className="mt-5 hidden border-t border-[#142958] pt-4 lg:block">
            <button
              type="button"
              onClick={() => setCurrentView('store')}
              className="flex w-full items-center gap-2 rounded-xl border border-[#142958] px-3 py-2.5 text-xs font-bold text-blue-200 hover:bg-[#142958] transition-colors"
            >
              <ArrowLeft size={15} />
              Back to store
            </button>
            <button
              type="button"
              onClick={logoutUser}
              className="mt-2 flex w-full items-center gap-2 rounded-xl px-3 py-2.5 text-xs font-bold text-rose-300 hover:bg-rose-500/10 transition-colors"
            >
              <LogOut size={15} />
              Sign out
            </button>
          </div>
        </aside>

        {/* Main Section Content */}
        <main className="min-w-0 space-y-5">
          {/* Top Header */}
          <header className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-[#142958] bg-[#0b1b3d] p-4 sm:p-5">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[.15em] text-blue-300">
                Customer portal
              </p>
              <h1 className="mt-1 text-xl font-black text-white">
                {activeSection === 'overview'
                  ? `Welcome back, ${currentUser?.name?.split(' ')[0] || 'there'}`
                  : currentSectionLabel}
              </h1>
              <p className="mt-1 text-xs text-slate-400">
                Review purchases, keep your account details current, and get help.
              </p>
            </div>

            <div className="flex gap-2 lg:hidden">
              <button
                onClick={() => setCurrentView('store')}
                className="rounded-lg border border-[#142958] p-2 text-blue-200"
                aria-label="Back to store"
              >
                <ArrowLeft size={16} />
              </button>
              <button
                onClick={logoutUser}
                className="rounded-lg border border-[#142958] p-2 text-rose-300"
                aria-label="Sign out"
              >
                <LogOut size={16} />
              </button>
            </div>

            <span className="hidden items-center gap-1.5 rounded-full border border-emerald-500/25 bg-emerald-500/10 px-3 py-1.5 text-[10px] font-bold text-emerald-300 sm:inline-flex">
              <ShieldCheck size={13} />
              Verified Customer Account
            </span>
          </header>

          {/* Individual Sub-Pages */}
          {activeSection === 'overview' && (
            <CustomerOverviewPage onNavigateSection={setActiveSection} />
          )}
          {activeSection === 'orders' && <CustomerOrdersPage />}
          {activeSection === 'profile' && <CustomerProfilePage />}
          {activeSection === 'rewards' && <CustomerRewardsPage />}
          {activeSection === 'support' && <CustomerSupportPage />}
        </main>
      </div>
    </div>
  );
}
