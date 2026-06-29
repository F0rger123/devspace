import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import { DataProvider } from './context/DataProvider.tsx';

// Catch and suppress the benign "ResizeObserver loop" warnings/errors globally
if (typeof window !== 'undefined') {
  const originalError = window.onerror;
  window.onerror = function (message, source, lineno, colno, error) {
    if (message && message.toString() === 'Script error.') {
      console.warn('Suppressed cross-origin Script error from iframe or extension context.');
      return true;
    }
    if (
      message && 
      (message.toString().includes('ResizeObserver') || 
       message.toString().includes('Resize observer'))
    ) {
      // Prevent browser default routing of the non-fatal error
      return true;
    }
    if (originalError) {
      return originalError.apply(this, arguments as any);
    }
    return false;
  };

  window.addEventListener('unhandledrejection', (event) => {
    if (
      event.reason && 
      event.reason.message && 
      (event.reason.message.includes('ResizeObserver') || 
       event.reason.message.includes('Resize observer'))
    ) {
      event.preventDefault();
      event.stopImmediatePropagation();
    }
  });
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <DataProvider>
      <App />
    </DataProvider>
  </StrictMode>,
);
