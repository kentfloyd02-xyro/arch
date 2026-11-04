import React from 'react';
import { AppProvider, useApp } from './context/AppContext';
import TopStrip from './components/layout/TopStrip';
import Navbar from './components/layout/Navbar';
import Footer from './components/layout/Footer';
import HeroSection from './components/sections/HeroSection';
import AboutSection from './components/sections/AboutSection';
import ProductsSection from './components/sections/ProductsSection';
import ProjectsSection from './components/sections/ProjectsSection';
import ReviewsSection from './components/sections/ReviewsSection';
import CartDrawer from './components/cart/CartDrawer';
import CheckoutModal from './components/modals/CheckoutModal';
import OtpModal from './components/modals/OtpModal';
import OrderTrackingModal from './components/modals/OrderTrackingModal';
import ReviewsModal from './components/modals/ReviewsModal';
import RefundModal from './components/modals/RefundModal';
import CsModal from './components/modals/CsModal';
import AuthModal from './components/modals/AuthModal';
import AccountSettingsModal from './components/modals/AccountSettingsModal';
import RateOrderModal from './components/modals/RateOrderModal';
import CustomerView from './views/CustomerView.jsx';
import AdminView from './views/AdminView.jsx';
import Toast from './components/ui/Toast';

function AppContent() {
  const { currentView, isApiConnected, isApiLoading, refreshAllData } = useApp();

  // Wait for active connection to online backend API
  if (!isApiConnected || isApiLoading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-[#0b1b3d] text-white p-6 relative overflow-hidden">
        {/* Background ambient glow */}
        <div className="absolute w-96 h-96 bg-blue-600/10 rounded-full blur-3xl -top-20 -left-20 pointer-events-none" />
        <div className="absolute w-96 h-96 bg-amber-500/10 rounded-full blur-3xl -bottom-20 -right-20 pointer-events-none" />

        <div className="relative flex flex-col items-center text-center max-w-md z-10">
          {/* Animated Spinner */}
          <div className="relative w-20 h-20 mb-6 flex items-center justify-center">
            <div className="absolute inset-0 border-4 border-slate-700 rounded-full"></div>
            <div className="absolute inset-0 border-4 border-amber-400 border-t-transparent rounded-full animate-spin"></div>
            <span className="text-xl font-black text-amber-400 tracking-tighter">AN</span>
          </div>

          <h1 className="text-2xl font-black tracking-tight text-white">ARCHON NELL</h1>
          <p className="text-xs uppercase tracking-widest text-slate-400 font-semibold mt-1">
            Industrial Solutions & Construction Supplies
          </p>

          <div className="mt-8 flex items-center gap-2.5 bg-slate-800/80 border border-slate-700/60 px-4 py-2 rounded-xl text-xs text-slate-300 backdrop-blur-sm">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-400 animate-ping"></span>
            <span>Connecting to Backend API & Database...</span>
          </div>

          <p className="text-[11px] text-slate-400 mt-4 leading-relaxed">
            Please start the backend server in your terminal:
            <br />
            <code className="inline-block mt-1.5 px-3 py-1 bg-slate-900 border border-slate-700 rounded-md font-mono text-amber-300 text-xs">
              npm run dev
            </code>
          </p>

          <button
            onClick={() => refreshAllData?.()}
            className="mt-6 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold rounded-lg shadow transition-all active:scale-95"
          >
            Check Connection
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-800 font-sans selection:bg-blue-600 selection:text-white">
      {/* Top Contact Strip */}
      <TopStrip />

      {/* Sticky Navy Navbar with Clean Login Button & Dashboard Gateway */}
      <Navbar />

      {/* Backend API Offline Alert Banner */}
      {!isApiConnected && !isApiLoading && (
        <div className="bg-amber-600 text-white px-4 py-2.5 shadow-md border-b border-amber-700 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs z-40 sticky top-0 sm:top-[72px]">
          <div className="flex items-center gap-2 text-center sm:text-left">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-200 animate-ping shrink-0" />
            <span>
              <strong>Backend Disconnected:</strong> Please run the backend server in terminal (<code className="bg-amber-700 px-1.5 py-0.5 rounded font-mono">cd arch_api && npm run dev</code>) for live database synchronization.
            </span>
          </div>
          <button
            onClick={refreshAllData}
            className="px-3 py-1 bg-white hover:bg-amber-50 text-amber-800 font-bold rounded-lg shadow-sm text-xs shrink-0 transition-all active:scale-95"
          >
            Retry Connection
          </button>
        </div>
      )}

      {/* Main View Router */}
      <main className="flex-1">
        {currentView === 'customer-dashboard' ? (
          <CustomerView />
        ) : currentView === 'admin-dashboard' ? (
          <AdminView />
        ) : (
          <>
            <HeroSection />
            <AboutSection />
            <ProductsSection />
            <ProjectsSection />
            <ReviewsSection />
          </>
        )}
      </main>

      {/* Industrial Footer (Rendered on store view) */}
      {currentView === 'store' && <Footer />}

      {/* Cart Drawer */}
      <CartDrawer />

      {/* Interactive Global Modals */}
      <AuthModal />
      <CheckoutModal />
      <OtpModal />
      <OrderTrackingModal />
      <ReviewsModal />
      <RefundModal />
      <CsModal />
      <AccountSettingsModal />
      <RateOrderModal />

      {/* In-browser notifications */}
      <Toast />
    </div>
  );
}

export default function App() {
  return (
    <AppProvider>
      <AppContent />
    </AppProvider>
  );
}

