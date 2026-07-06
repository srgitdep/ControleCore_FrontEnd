import { createBrowserRouter, Navigate } from 'react-router-dom';
import { ProtectedRoute } from './ProtectedRoute';
import { AppLayout } from '@/components/layout/AppLayout';
import { LoginPage } from '@/pages/auth/LoginPage';
import { ForgotPasswordPage } from '@/pages/auth/ForgotPasswordPage';
import { ResetPasswordPage } from '@/pages/auth/ResetPasswordPage';
import { DashboardPage } from '@/pages/dashboard/DashboardPage';

export const router = createBrowserRouter([
  // ─── Rotas Públicas (não requerem autenticação) ───────────────────────────
  { path: '/login',            element: <LoginPage /> },
  { path: '/recuperar-senha',  element: <ForgotPasswordPage /> },
  { path: '/redefinir-senha',  element: <ResetPasswordPage /> },

  // ─── Rotas Protegidas (requerem autenticação) ─────────────────────────────
  {
    element: <ProtectedRoute />,
    children: [
      {
        element: <AppLayout />,
        children: [
          // Redireciona raiz para dashboard
          { path: '/', element: <Navigate to="/dashboard" replace /> },

          // Dashboard
          { path: '/dashboard', element: <DashboardPage /> },

          // Módulos — serão adicionados nas fases seguintes
          // { path: '/produtos',      element: <ProdutosPage /> },
          // { path: '/fornecedores',  element: <FornecedoresPage /> },
          // { path: '/compras',       element: <ComprasPage /> },
          // { path: '/stock',         element: <StockPage /> },
          // { path: '/vendas',        element: <VendasPage /> },
          // { path: '/clientes',      element: <ClientesPage /> },
          // { path: '/rh',            element: <RhPage /> },
          // { path: '/configuracoes', element: <ConfiguracoesPage /> },
        ],
      },
    ],
  },

  // Rota fallback
  { path: '*', element: <Navigate to="/dashboard" replace /> },
]);
