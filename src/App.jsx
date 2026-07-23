import React, { Suspense, lazy, useEffect, useState } from 'react';
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
const NotFoundPage = lazy(() => import('./pages/NotFoundPage.jsx'));

const BrandIntro = ({ leaving = false, overlay = false }) => (
  <div
    className={`brand-intro ${overlay ? 'fixed inset-0 z-[100]' : 'min-h-screen'} ${leaving ? 'brand-intro--leaving' : ''}`}
    role="status"
    aria-label="Carregando Assembleia de Deus na Lapa"
  >
    <div className="brand-intro__glow" aria-hidden="true" />
    <div className="brand-intro__content">
      <div className="brand-intro__mark">
        <span className="brand-intro__orbit brand-intro__orbit--outer" aria-hidden="true" />
        <span className="brand-intro__orbit brand-intro__orbit--inner" aria-hidden="true" />
        <span className="brand-intro__halo" aria-hidden="true" />
        <div className="brand-intro__logo-wrap">
          <img src="/logo.png" alt="" className="brand-intro__logo" />
        </div>
      </div>

      <div className="brand-intro__copy">
        <span className="brand-intro__eyebrow">Bem-vindo à</span>
        <strong className="brand-intro__name">Assembleia de Deus na Lapa</strong>
        <span className="brand-intro__line" aria-hidden="true" />
        <span className="brand-intro__message">Uma comunidade de fé</span>
      </div>
    </div>
  </div>
);

const PageLoadingFallback = () => <BrandIntro />;

function App() {
  const [introPhase, setIntroPhase] = useState('visible');

  useEffect(() => {
    const leaveTimer = window.setTimeout(() => setIntroPhase('leaving'), 1200);
    const finishTimer = window.setTimeout(() => setIntroPhase('finished'), 1600);

    return () => {
      window.clearTimeout(leaveTimer);
      window.clearTimeout(finishTimer);
    };
  }, []);

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
          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </Suspense>
      {introPhase !== 'finished' && (
        <BrandIntro overlay leaving={introPhase === 'leaving'} />
      )}
    </Router>
  );
}

export default App;
