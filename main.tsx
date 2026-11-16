import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import { initTypography } from './utils/fontManager.ts';

// Initialize and apply typography safely
try {
  initTypography();
} catch (e) {
  console.warn('Typography initialization note:', e);
}

const rootElement = document.getElementById('root');
if (rootElement) {
  createRoot(rootElement).render(
    <StrictMode>
      <App />
    </StrictMode>,
  );
}
