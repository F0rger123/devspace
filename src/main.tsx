import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import { DataProvider } from './context/DataProvider.tsx';
import { DevSpaceInstanceProvider } from './context/DevSpaceInstanceContext.tsx';
import { ErrorBoundary } from './components/ErrorBoundary.tsx';

// Suppress benign ResizeObserver loop limit exceeded errors
if (typeof window !== 'undefined') {
  const isResizeObserverError = (msg: string | undefined | null) => {
    return msg && (
      msg.includes('ResizeObserver loop completed with undelivered notifications') ||
      msg.includes('ResizeObserver loop limit exceeded')
    );
  };

  window.addEventListener('error', (e) => {
    if (isResizeObserverError(e.message)) {
      e.stopImmediatePropagation();
      e.preventDefault();
    }
  }, true);

  window.addEventListener('unhandledrejection', (e) => {
    const reason = e.reason;
    const msg = typeof reason === 'string' ? reason : reason?.message;
    if (isResizeObserverError(msg)) {
      e.stopImmediatePropagation();
      e.preventDefault();
    }
  }, true);

  // Patch ResizeObserver constructor to debounce callbacks with requestAnimationFrame
  if (typeof window.ResizeObserver !== 'undefined') {
    const NativeResizeObserver = window.ResizeObserver;
    window.ResizeObserver = class WrappedResizeObserver extends NativeResizeObserver {
      constructor(callback: ResizeObserverCallback) {
        let frameId: number | null = null;
        super((entries, observer) => {
          if (frameId !== null) {
            cancelAnimationFrame(frameId);
          }
          frameId = requestAnimationFrame(() => {
            frameId = null;
            callback(entries, observer);
          });
        });
      }
    };
  }
}

const rootElement = document.getElementById('root');

if (rootElement) {
  createRoot(rootElement).render(
    <StrictMode>
      <ErrorBoundary>
        <DataProvider>
          <DevSpaceInstanceProvider>
            <App />
          </DevSpaceInstanceProvider>
        </DataProvider>
      </ErrorBoundary>
    </StrictMode>
  );
}




