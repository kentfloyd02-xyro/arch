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

