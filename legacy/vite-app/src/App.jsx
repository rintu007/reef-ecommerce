import { Toaster } from "@/components/ui/toaster"
import { QueryClientProvider } from '@tanstack/react-query'
import { queryClientInstance } from '@/lib/query-client'
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import PageNotFound from './lib/PageNotFound';
import { AuthProvider, useAuth } from '@/lib/AuthContext';
import { CartProvider } from '@/lib/CartContext';
import UserNotRegisteredError from '@/components/UserNotRegisteredError';
import { useEffect, lazy, Suspense } from 'react';

import AppShell from '@/components/layout/AppShell';
import GuestLoginScreen from '@/components/GuestLoginScreen';
import { NavHistoryProvider } from '@/lib/NavHistoryContext';
import { UserPrefsProvider } from '@/lib/UserPrefsContext';
import UserPrefsModal from '@/components/UserPrefsModal';

// Lazy-load child (non-tab) pages for code splitting
const ListingDetail = lazy(() => import('@/pages/ListingDetail'));
const CategoryPage = lazy(() => import('@/pages/CategoryPage'));
const Sell = lazy(() => import('@/pages/Sell'));
const Admin = lazy(() => import('@/pages/Admin'));
const SellerDashboard = lazy(() => import('@/pages/SellerDashboard'));
const HelpFeedback = lazy(() => import('@/pages/HelpFeedback'));
const PrivacyPolicy = lazy(() => import('@/pages/PrivacyPolicy'));
const TermsOfService = lazy(() => import('@/pages/TermsOfService'));
const Support = lazy(() => import('@/pages/Support'));
const Marketing = lazy(() => import('@/pages/Marketing'));
const SearchPage = lazy(() => import('@/pages/SearchPage'));
const DownloadApp = lazy(() => import('@/pages/DownloadApp'));
const FreshwaterLanding = lazy(() => import('@/pages/FreshwaterLanding'));
const SellerStorefront = lazy(() => import('@/pages/SellerStorefront'));
const Services = lazy(() => import('@/pages/Services'));

const AuthenticatedApp = () => {
  const { isLoadingAuth, isLoadingPublicSettings, authError, navigateToLogin, isGuest, continueAsGuest } = useAuth();

  useEffect(() => {
    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    const apply = (e) => document.documentElement.classList.toggle("dark", e.matches);
    apply(mq);
    mq.addEventListener("change", apply);
    return () => mq.removeEventListener("change", apply);
  }, []);

  if (isLoadingPublicSettings || isLoadingAuth) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-4 border-primary/20 border-t-primary rounded-full animate-spin"></div>
          <p className="text-sm text-muted-foreground">Loading Reef Market...</p>
        </div>
      </div>
    );
  }

  if (authError) {
    if (authError.type === 'user_not_registered') {
      return <UserNotRegisteredError />;
    } else if (authError.type === 'auth_required') {
      const path = window.location.pathname;
      if (path === '/support' || path === '/about') {
        // allow public pages through without login
      } else {
        return <GuestLoginScreen onGuest={continueAsGuest} onLogin={navigateToLogin} />;
      }
    }
  }

  return (
    <NavHistoryProvider>
    <Routes>
      <Route element={<AppShell />}>
        {/* Preserved tabs — handled directly inside AppShell */}
        <Route path="/" element={null} />
        <Route path="/browse" element={null} />
        <Route path="/messages" element={null} />
        <Route path="/orders" element={null} />
        <Route path="/learn" element={null} />
        <Route path="/profile" element={null} />
        <Route path="/services" element={null} />
        {/* Child screens — lazy loaded, slide-in animation */}
        <Route path="/category/:type" element={<Suspense fallback={null}><CategoryPage /></Suspense>} />
        <Route path="/listing/:id" element={<Suspense fallback={null}><ListingDetail /></Suspense>} />
        <Route path="/sell" element={<Suspense fallback={null}><Sell /></Suspense>} />
        <Route path="/seller-dashboard" element={<Suspense fallback={null}><SellerDashboard /></Suspense>} />
        <Route path="/admin" element={<Suspense fallback={null}><Admin /></Suspense>} />
        <Route path="/help" element={<Suspense fallback={null}><HelpFeedback /></Suspense>} />
        <Route path="/privacy" element={<Suspense fallback={null}><PrivacyPolicy /></Suspense>} />
        <Route path="/terms" element={<Suspense fallback={null}><TermsOfService /></Suspense>} />
        <Route path="/search" element={<Suspense fallback={null}><SearchPage /></Suspense>} />
        <Route path="/seller/:email" element={<Suspense fallback={<div className="flex items-center justify-center py-20"><div className="w-8 h-8 border-4 border-muted border-t-primary rounded-full animate-spin"/></div>}><SellerStorefront /></Suspense>} />
      </Route>
      <Route path="/download" element={<Suspense fallback={null}><DownloadApp /></Suspense>} />
      <Route path="/freshwater" element={<Suspense fallback={null}><FreshwaterLanding /></Suspense>} />
      <Route path="/support" element={<Suspense fallback={null}><Support /></Suspense>} />
      <Route path="/about" element={<Suspense fallback={null}><Marketing /></Suspense>} />
      <Route path="*" element={<PageNotFound />} />
    </Routes>
    </NavHistoryProvider>
  );
};

function App() {
  return (
    <CartProvider>
      <AuthProvider>
        <UserPrefsProvider>
          <QueryClientProvider client={queryClientInstance}>
            <Router>
              <AuthenticatedApp />
              <UserPrefsModal />
            </Router>
            <Toaster />
          </QueryClientProvider>
        </UserPrefsProvider>
      </AuthProvider>
    </CartProvider>
  )
}

export default App