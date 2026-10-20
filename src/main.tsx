import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from 'react-hot-toast';

import './app/index.css';
// Antes da aplicação: o primeiro render já sai na língua certa, e o `lang` da página
// fica certo antes de qualquer leitor de ecrã o ler.
import { carregarIdiomaActivo } from './i18n';
import App from './App';

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      staleTime: 1000 * 60 * 5, // 5 minutos
    },
  },
});

// Quem tem o browser em chinês espera pelo catálogo `zh` (um só chunk) antes do primeiro
// render, para não ver um relâmpago de português. Em `pt` e `en` resolve na hora, e uma
// falha de rede não impede a aplicação de arrancar.
void carregarIdiomaActivo().then(() => createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>

        {/* Toaster global para notificaçíµes react-hot-toast */}
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

    </QueryClientProvider>
  </StrictMode>,
));
