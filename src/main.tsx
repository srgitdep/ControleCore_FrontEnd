import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from 'react-hot-toast';
import { AuthProvider } from './features/auth';
import './index.css';
import App from './App';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      staleTime: 1000 * 60 * 5, // 5 minutos
    },
  },
});

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        {/* Toaster global para notificaÃƒÂ§ÃƒÂµes react-hot-toast */}
        <Toaster
          position="top-center"
          toastOptions={{
            duration: 4000,
            style: {
              fontSize: '14px',
              fontWeight: 500,
              borderRadius: '8px',
              padding: '12px 16px',
            },
            success: {
              style: {
                background: '#16a34a',
                color: '#ffffff',
                border: 'none',
              },
              iconTheme: {
                primary: '#ffffff',
                secondary: '#16a34a',
              },
            },
            error: {
              style: {
                background: '#dc2626',
                color: '#ffffff',
                border: 'none',
              },
              iconTheme: {
                primary: '#ffffff',
                secondary: '#dc2626',
              },
            },
          }}
        />
        <App />
      </AuthProvider>
    </QueryClientProvider>
  </StrictMode>,
);
