import { createBrowserRouter, Navigate } from 'react-router-dom';
import { ProtectedRoute } from './ProtectedRoute';
import { AppLayout } from '@/app/layout/AppLayout';
import { LoginPage, ForgotPasswordPage, ResetPasswordPage } from '@/features/auth';
import { LandingPage } from '@/pages/LandingPage';
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
import { FornecedoresPage } from '@/features/fornecedores';
import { ArmazensPage } from '@/features/armazens';
import { EmployeeListPage, ShiftManagementPage } from '@/features/hr';
import { useAuth } from '@/features/auth';

function RootRedirectOrLanding() {
  const { user } = useAuth();
  if (!user) return <LandingPage />;
  
  switch(user.role) {
    case 'CASHIER': return <Navigate to="/vendas" replace />;
    case 'STOCK_KEEPER': return <Navigate to="/produtos" replace />;
    case 'USER': return <Navigate to="/produtos" replace />;
    default: return <Navigate to="/dashboard" replace />;
  }
}

export const router = createBrowserRouter([
  // ──────────────── Rotas Públicas (não requerem autenticação) ───────────────────────────
  { path: '/',                 element: <RootRedirectOrLanding /> },
  { path: '/landing',          element: <LandingPage /> },
  { path: '/login',            element: <LoginPage /> },
  { path: '/recuperar-senha',  element: <ForgotPasswordPage /> },
  { path: '/redefinir-senha',  element: <ResetPasswordPage /> },

  // ──────────────── Rotas Protegidas (requerem autenticação) ─────────────────────────────
  {
    element: <ProtectedRoute />,
    children: [
      {
        element: <AppLayout />,
        children: [

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
            element: <ProtectedRoute roles={['SUPER_ADMIN', 'ADMIN', 'MANAGER']} requiredPermission="manage:users" />,
            children: [{ index: true, element: <PermissionsPage /> }]
          },

          // Módulos â€â€ em desenvolvimento
          { path: '/produtos',      element: <ProductListPage /> },
          { path: '/fornecedores',  element: <FornecedoresPage /> },
          { path: '/compras',       element: <PurchasesPage /> },
          { path: '/stock',         element: <StockListPage /> },
          { path: '/stock/:id',     element: <StockDetailsPage /> },
          { path: '/armazens',      element: <ArmazensPage /> },
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
          { path: '/rh',            element: <EmployeeListPage /> },
          { path: '/rh/escalas',    element: <ShiftManagementPage /> },
          { path: '/configuracoes', element: <EmDesenvolvimentoPage /> },
          { path: '/historico',     element: <HistoryPage /> },
        ],
      },
    ],
  },

  // Rota fallback
  { path: '*', element: <Navigate to="/" replace /> },
]);
