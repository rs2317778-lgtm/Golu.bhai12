import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import { ErrorBoundary } from './components/ErrorBoundary.tsx';
import './index.css';

const rootElement = document.getElementById('root');

if (!rootElement) {
  console.error('[Shadow AI] Root DOM element (#root) not found.');
  const fallback = document.createElement('div');
  fallback.id = 'root';
  document.body.appendChild(fallback);
  createRoot(fallback).render(
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  );
} else {
  createRoot(rootElement).render(
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  );
}
