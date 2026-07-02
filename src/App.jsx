import React, { Suspense, lazy, useEffect } from 'react';
import { Route, Routes, BrowserRouter as Router } from 'react-router-dom';
import ScrollToTop from './components/ScrollToTop.jsx';
import NotificationToaster from "./components/NotificationToaster.jsx";

const HomePage = lazy(() => import('./pages/HomePage.jsx'));
const AddressesPage = lazy(() => import('./pages/AddressesPage.jsx'));
const SobrePage = lazy(() => import('./pages/SobrePage.jsx'));
const CalendarPage = lazy(() => import('./pages/CalendarPage.jsx'));
const AdminLoginPage = lazy(() => import('./pages/AdminLoginPage.jsx'));
const ResetPasswordPage = lazy(() => import('./pages/ResetPasswordPage.jsx'));
const WatchPage = lazy(() => import('./pages/WatchPage.jsx'));
const NewHerePage = lazy(() => import('./pages/NewHerePage.jsx'));

const PageLoadingFallback = () => (
  <div className="flex min-h-screen items-center justify-center bg-background text-sm font-semibold text-muted-foreground">
    Carregando...
  </div>
);

function App() {
  useEffect(() => {
    if (typeof window === 'undefined' || typeof navigator === 'undefined') return undefined;
    if (!('vibrate' in navigator)) return undefined;

    const touchDeviceQuery = window.matchMedia('(pointer: coarse)');
    if (!touchDeviceQuery.matches) return undefined;

    const handleActionClick = (event) => {
      const actionElement = event.target.closest(
        'button, a[href], [role="button"], input[type="button"], input[type="submit"]',
      );

      if (!actionElement || actionElement.disabled || actionElement.getAttribute('aria-disabled') === 'true') {
        return;
      }

      navigator.vibrate(10);
    };

    document.addEventListener('click', handleActionClick, true);
    return () => document.removeEventListener('click', handleActionClick, true);
  }, []);

  return (
    <Router>
      <ScrollToTop />
      <NotificationToaster />
      <Suspense fallback={<PageLoadingFallback />}>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/enderecos" element={<AddressesPage />} />
          <Route path="/sobre" element={<SobrePage />} />
          <Route path="/assistir" element={<WatchPage />} />
          <Route path="/sou-novo" element={<NewHerePage />} />
          <Route path="/calendario" element={<CalendarPage />} />
          <Route path="/administracao" element={<AdminLoginPage />} />
          <Route path="/redefinir-senha" element={<ResetPasswordPage />} />
        </Routes>
      </Suspense>
    </Router>
  );
}

export default App;
