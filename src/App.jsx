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
  <div className="flex min-h-screen items-center justify-center bg-[#071526] px-6 text-white">
    <div className="flex flex-col items-center text-center">
      <div className="relative mb-6">
        <span className="absolute inset-0 rounded-full border-2 border-primary/20" />
        <span className="absolute inset-[-8px] rounded-full border border-primary/20" />
        <span className="absolute inset-[-8px] rounded-full border-t-primary animate-spin border border-transparent" />
        <div className="relative flex h-20 w-20 items-center justify-center overflow-hidden rounded-full bg-white p-1.5 shadow-2xl shadow-primary/20">
          <img
            src="https://i.imgur.com/SA53Yxc.png"
            alt="Assembleia de Deus na Lapa"
            className="h-full w-full rounded-full object-cover"
          />
        </div>
      </div>

      <p className="text-xs font-bold uppercase tracking-[0.24em] text-primary">
        Assembleia de Deus na Lapa
      </p>
      <p className="mt-3 text-lg font-bold text-white">
        Preparando a página
      </p>
      <p className="mt-2 text-sm font-medium text-white/60">
        Carregando sua experiência...
      </p>
    </div>
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
