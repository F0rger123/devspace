import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import { DataProvider } from './context/DataProvider.tsx';
import { ErrorBoundary } from './components/ErrorBoundary.tsx';

// Log startup confirmation
if (typeof window !== 'undefined') {
  console.log('[DevSpace] Mounting React application root...');
}

const rootElement = document.getElementById('root');
if (rootElement) {
  createRoot(rootElement).render(
    <StrictMode>
      <ErrorBoundary>
        <DataProvider>
          <App />
        </DataProvider>
      </ErrorBoundary>
    </StrictMode>,
  );
} else {
  console.error('[DevSpace] Root element #root not found in document!');
}

