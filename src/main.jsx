import React from 'react'
import ReactDOM from 'react-dom/client'
import { HelmetProvider } from 'react-helmet-async'
import App from './App.jsx'
import './index.css'
import { applyTheme, getPreferredTheme } from './lib/theme.js'

// The SPA owns route scroll positions. Disable the browser's delayed history
// restoration before React mounts, otherwise it can move a lazy-loaded page
// back to the previous document position after ScrollToTop has already run.
if ('scrollRestoration' in window.history) {
  window.history.scrollRestoration = 'manual'
}

applyTheme(getPreferredTheme())

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <HelmetProvider>
      <App />
    </HelmetProvider>
  </React.StrictMode>,
)
