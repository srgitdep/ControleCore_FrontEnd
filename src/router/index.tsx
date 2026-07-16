import { createBrowserRouter, Navigate } from 'react-router-dom';
import { ProtectedRoute } from './ProtectedRoute';
import { AppLayout } from '@/components/layout/AppLayout';
import { LoginPage } from '@/features/auth';
import { ForgotPasswordPage } from '@/features/auth';
import { ResetPasswordPage } from '@/features/auth';
import { DashboardPage } from '@/pages/dashboard/DashboardPage';
import { EmpresasPage } from '@/pages/empresas/EmpresasPage';
import { UsersPage } from '@/pages/users/UsersPage';
import { HistoryPage } from '@/pages/history/HistoryPage';
import { EmDesenvolvimentoPage } from '@/pages/EmDesenvolvimentoPage';
import { ProductListPage } from '@/pages/produtos/ProductListPage';
import { PermissionsPage } from '@/pages/settings/PermissionsPage';
import { POSPage } from '@/features/pos';
import { CaixasHistoricoPage } from '@/features/finance';
import { LojasPage } from '@/pages/lojas/LojasPage';
import { StockListPage, StockDetailsPage } from '@/features/inventory';
import { ClientesPage } from '@/pages/crm/ClientesPage';
import { FinanceiroDashboardPage } from '@/features/finance';
import { PurchasesPage } from '@/pages/compras/PurchasesPage';
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
          {
            path: '/permissoes',
            element: <ProtectedRoute roles={['SUPER_ADMIN', 'ADMIN']} requiredPermission="manage:users" />,
            children: [{ index: true, element: <PermissionsPage /> }]
          },

          // Módulos — em desenvolvimento
          { path: '/produtos',      element: <ProductListPage /> },
          { path: '/fornecedores',  element: <PurchasesPage /> },
          { path: '/compras',       element: <PurchasesPage /> },
          { path: '/stock',         element: <StockListPage /> },
          { path: '/stock/:id',     element: <StockDetailsPage /> },
          { path: '/vendas',        element: <POSPage /> },
          { path: '/sessoes-historico', element: <CaixasHistoricoPage /> },
          { path: '/lojas',         element: <LojasPage /> },
          { path: '/crm',           element: <ClientesPage /> },
          { path: '/clientes',      element: <ClientesPage /> },
          // Módulo Financeiro
          {
            path: '/financeiro',
            element: <ProtectedRoute roles={['SUPER_ADMIN', 'ADMIN', 'MANAGER']} />,
            children: [{ index: true, element: <FinanceiroDashboardPage /> }]
          },
          { path: '/rh',            element: <EmDesenvolvimentoPage /> },
          { path: '/configuracoes', element: <EmDesenvolvimentoPage /> },
          { path: '/historico',     element: <HistoryPage /> },
        ],
      },
    ],
  },

  // Rota fallback
  { path: '*', element: <Navigate to="/" replace /> },
]);
