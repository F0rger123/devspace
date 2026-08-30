import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import { DataProvider } from './context/DataProvider.tsx';
import { DevSpaceInstanceProvider } from './context/DevSpaceInstanceContext.tsx';
import { ErrorBoundary } from './components/ErrorBoundary.tsx';

// Suppress benign ResizeObserver and transient background network/fetch rejections
if (typeof window !== 'undefined') {
  const isBenignError = (msg: string | undefined | null) => {
    if (!msg) return false;
    return (
      msg.includes('ResizeObserver loop completed with undelivered notifications') ||
      msg.includes('ResizeObserver loop limit exceeded') ||
      msg.includes('Failed to fetch') ||
      msg.includes('NetworkError') ||
      msg.includes('Load failed') ||
      msg.includes('The user aborted a request') ||
      msg.includes('AbortError') ||
      msg.includes('Network request failed')
    );
  };

  window.addEventListener('error', (e) => {
    if (isBenignError(e.message)) {
      e.stopImmediatePropagation();
      e.preventDefault();
    }
  }, true);

  window.addEventListener('unhandledrejection', (e) => {
    const reason = e.reason;
    const msg = typeof reason === 'string' ? reason : reason?.message || String(reason || '');
    if (isBenignError(msg)) {
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




