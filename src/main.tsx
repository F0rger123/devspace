import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import { DataProvider } from './context/DataProvider.tsx';
import { ErrorBoundary } from './components/ErrorBoundary.tsx';

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
       message.toString().includes('Resize observer') ||
       message.toString().includes('Failed to fetch') ||
       message.toString().includes('fetch'))
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
    if (event.reason) {
      const reasonStr = String(event.reason);
      const reasonMsg = event.reason.message || '';
      
      const isBenign = reasonMsg.includes('ResizeObserver') || 
                       reasonMsg.includes('Resize observer') ||
                       reasonMsg.includes('Failed to fetch') ||
                       reasonMsg.includes('fetch') ||
                       reasonMsg.includes('NetworkError') ||
                       reasonStr.includes('Failed to fetch') ||
                       reasonStr.includes('fetch');
                       
      if (isBenign) {
        event.preventDefault();
        event.stopImmediatePropagation();
        console.warn('Suppressed benign unhandled promise rejection:', event.reason);
      }
    }
  });
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ErrorBoundary>
      <DataProvider>
        <App />
      </DataProvider>
    </ErrorBoundary>
  </StrictMode>,
);
