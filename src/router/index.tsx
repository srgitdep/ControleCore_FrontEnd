import { createBrowserRouter, Navigate } from 'react-router-dom';
import { ProtectedRoute } from './ProtectedRoute';
import { AppLayout } from '@/components/layout/AppLayout';
import { LoginPage, ForgotPasswordPage, ResetPasswordPage } from '@/features/auth';
import { DashboardPage } from '@/features/dashboard';
import { EmpresasPage } from '@/features/empresas';
import { UsersPage } from '@/features/users';
import { HistoryPage } from '@/features/history';
import { EmDesenvolvimentoPage } from '@/pages/EmDesenvolvimentoPage';
import { ProductListPage } from '@/features/produtos';
import { PermissionsPage } from '@/pages/settings/PermissionsPage';
import { POSPage } from '@/features/vendas';
import { CaixasHistoricoPage } from '@/features/vendas';
import { LojasPage } from '@/features/lojas';
import { StockListPage } from '@/features/stock';
import { StockDetailsPage } from '@/features/stock';
import { ClientesPage } from '@/features/crm';
import { FinanceiroDashboardPage } from '@/features/financeiro';
import { PurchasesPage } from '@/features/compras';
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
  // ââ€€ââ€€ââ€€ Rotas Públicas (não requerem autenticação) ââ€€ââ€€ââ€€ââ€€ââ€€ââ€€ââ€€ââ€€ââ€€ââ€€ââ€€ââ€€ââ€€ââ€€ââ€€ââ€€ââ€€ââ€€ââ€€ââ€€ââ€€ââ€€ââ€€ââ€€ââ€€ââ€€ââ€€
  { path: '/login',            element: <LoginPage /> },
  { path: '/recuperar-senha',  element: <ForgotPasswordPage /> },
  { path: '/redefinir-senha',  element: <ResetPasswordPage /> },

  // ââ€€ââ€€ââ€€ Rotas Protegidas (requerem autenticação) ââ€€ââ€€ââ€€ââ€€ââ€€ââ€€ââ€€ââ€€ââ€€ââ€€ââ€€ââ€€ââ€€ââ€€ââ€€ââ€€ââ€€ââ€€ââ€€ââ€€ââ€€ââ€€ââ€€ââ€€ââ€€ââ€€ââ€€ââ€€ââ€€
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

          // Módulos â€â€ em desenvolvimento
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
