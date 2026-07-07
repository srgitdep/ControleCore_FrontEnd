import { createBrowserRouter, Navigate } from 'react-router-dom';
import { ProtectedRoute } from './ProtectedRoute';
import { AppLayout } from '@/components/layout/AppLayout';
import { LoginPage } from '@/pages/auth/LoginPage';
import { ForgotPasswordPage } from '@/pages/auth/ForgotPasswordPage';
import { ResetPasswordPage } from '@/pages/auth/ResetPasswordPage';
import { DashboardPage } from '@/pages/dashboard/DashboardPage';
import { EmpresasPage } from '@/pages/empresas/EmpresasPage';
import { UsersPage } from '@/pages/users/UsersPage';
import { EmDesenvolvimentoPage } from '@/pages/EmDesenvolvimentoPage';
import { useAuth } from '@/hooks/useAuth';

function HomeRedirect() {
  const { user } = useAuth();
  if (!user) return <Navigate to="/login" replace />;
  
  switch(user.role) {
    case 'CASHIER': return <Navigate to="/vendas" replace />;
    case 'STOCK_KEEPER': return <Navigate to="/produtos" replace />;
    case 'USER': return <Navigate to="/produtos" replace />;
    default: return <Navigate to="/dashboard" replace />;
  }
}

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
          // Redireciona raiz dinamicamente conforme o papel
          { path: '/', element: <HomeRedirect /> },

          // Dashboard
          { 
            path: '/dashboard', 
            element: <ProtectedRoute roles={['SUPER_ADMIN', 'ADMIN', 'MANAGER']} />,
            children: [{ index: true, element: <DashboardPage /> }]
          },

          // Gestão do Sistema
          { 
            path: '/empresas', 
            element: <ProtectedRoute roles={['SUPER_ADMIN']} />,
            children: [{ index: true, element: <EmpresasPage /> }]
          },
          { 
            path: '/utilizadores', 
            element: <ProtectedRoute roles={['SUPER_ADMIN', 'ADMIN']} />,
            children: [{ index: true, element: <UsersPage /> }]
          },

          // Módulos — em desenvolvimento
          { path: '/produtos',      element: <EmDesenvolvimentoPage /> },
          { path: '/fornecedores',  element: <EmDesenvolvimentoPage /> },
          { path: '/compras',       element: <EmDesenvolvimentoPage /> },
          { path: '/stock',         element: <EmDesenvolvimentoPage /> },
          { path: '/vendas',        element: <EmDesenvolvimentoPage /> },
          { path: '/clientes',      element: <EmDesenvolvimentoPage /> },
          { path: '/rh',            element: <EmDesenvolvimentoPage /> },
          { path: '/configuracoes', element: <EmDesenvolvimentoPage /> },
        ],
      },
    ],
  },

  // Rota fallback
  { path: '*', element: <Navigate to="/" replace /> },
]);
