import React from 'react';
import { Route, Routes, BrowserRouter as Router } from 'react-router-dom';
import ScrollToTop from './components/ScrollToTop.jsx';
import HomePage from './pages/HomePage.jsx';
import AddressesPage from './pages/AddressesPage.jsx';
import SobrePage from "./pages/SobrePage.jsx";
import CalendarPage from "./pages/CalendarPage.jsx";
import AdminLoginPage from "./pages/AdminLoginPage.jsx";

function App() {
  return (
    <Router>
      <ScrollToTop />
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/enderecos" element={<AddressesPage />} />
        <Route path="/sobre" element={<SobrePage />} />
        <Route path="/calendario" element={<CalendarPage />} />
        <Route path="/administracao" element={<AdminLoginPage />} />
      </Routes>
    </Router>
  );
}

export default App;
