import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { AuthGate } from './features/auth/AuthGate';
import { ThemeProvider } from './theme/ThemeProvider';
import './index.css';

const rootElement = document.getElementById('root');
if (!rootElement) throw new Error('Root element #root not found');

createRoot(rootElement).render(
  <StrictMode>
    <ThemeProvider>
      <AuthGate />
    </ThemeProvider>
  </StrictMode>,
);
