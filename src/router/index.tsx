import { createBrowserRouter, Navigate } from 'react-router-dom';
import { ProtectedRoute } from './ProtectedRoute';
import { AppLayout } from '@/components/layout/AppLayout';
import { LoginPage, ForgotPasswordPage, ResetPasswordPage } from '@/features/auth';
import { DashboardPage } from '@/pages/dashboard/DashboardPage';
import { EmpresasPage } from '@/pages/empresas/EmpresasPage';
import { UsersPage } from '@/pages/users/UsersPage';
import { HistoryPage } from '@/pages/history/HistoryPage';
import { EmDesenvolvimentoPage } from '@/pages/EmDesenvolvimentoPage';
import { ProductListPage } from '@/pages/produtos/ProductListPage';
import { PermissionsPage } from '@/pages/settings/PermissionsPage';
import { POSPage } from '@/pages/vendas/POSPage';
import { CaixasHistoricoPage } from '@/pages/vendas/CaixasHistoricoPage';
import { LojasPage } from '@/pages/lojas/LojasPage';
import { StockListPage } from '@/pages/stock/StockListPage';
import { StockDetailsPage } from '@/pages/stock/StockDetailsPage';
import { ClientesPage } from '@/pages/crm/ClientesPage';
import { FinanceiroDashboardPage } from '@/pages/financeiro/FinanceiroDashboardPage';
import { PurchasesPage } from '@/pages/compras/PurchasesPage';
import { useAuth } from '@/features/auth';

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
  // â”€â”€â”€ Rotas PÃºblicas (nÃ£o requerem autenticaÃ§Ã£o) â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  { path: '/login',            element: <LoginPage /> },
  { path: '/recuperar-senha',  element: <ForgotPasswordPage /> },
  { path: '/redefinir-senha',  element: <ResetPasswordPage /> },

  // â”€â”€â”€ Rotas Protegidas (requerem autenticaÃ§Ã£o) â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
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

          // GestÃ£o do Sistema
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

          // MÃ³dulos â€” em desenvolvimento
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
          // MÃ³dulo Financeiro
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
