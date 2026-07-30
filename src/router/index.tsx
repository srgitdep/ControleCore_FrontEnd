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
import { EmployeeListPage, ShiftManagementPage } from '@/features/hr';
import { useAuth } from '@/features/auth';
import { AcessoPage, SubscricaoPage } from '@/features/plataforma';

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
            element: <ProtectedRoute requiredPermission="administracao.perfil.gerir" />,
            children: [{ index: true, element: <PermissionsPage /> }]
          },
          { path: '/acesso', element: <AcessoPage /> },
          { path: '/subscricao', element: <SubscricaoPage /> },

          {
            element: <ProtectedRoute requiredModule="catalogo" />,
            children: [{ path: '/produtos', element: <ProductListPage /> }],
          },
          {
            element: <ProtectedRoute requiredModule="compras" />,
            children: [
              { path: '/fornecedores', element: <PurchasesPage /> },
              { path: '/compras', element: <PurchasesPage /> },
            ],
          },
          {
            element: <ProtectedRoute requiredModule="armazem" />,
            children: [
              { path: '/stock', element: <StockListPage /> },
              { path: '/stock/:id', element: <StockDetailsPage /> },
            ],
          },
          {
            element: <ProtectedRoute requiredModule="pos" />,
            children: [
              { path: '/vendas', element: <POSPage /> },
              { path: '/sessoes-historico', element: <CaixasHistoricoPage /> },
            ],
          },
          {
            element: <ProtectedRoute requiredModule="loja" />,
            children: [{ path: '/lojas', element: <LojasPage /> }],
          },
          {
            element: <ProtectedRoute requiredModule="clientes" />,
            children: [
              { path: '/crm', element: <ClientesPage /> },
              { path: '/clientes', element: <ClientesPage /> },
            ],
          },
          // Módulo Financeiro
          {
            path: '/financeiro',
            element: (
              <ProtectedRoute
                roles={['SUPER_ADMIN', 'ADMIN', 'MANAGER']}
                requiredModule="financeiro"
              />
            ),
            children: [{ index: true, element: <FinanceiroDashboardPage /> }]
          },
          {
            element: <ProtectedRoute requiredModule="pessoas" />,
            children: [
              { path: '/rh', element: <EmployeeListPage /> },
              { path: '/rh/escalas', element: <ShiftManagementPage /> },
            ],
          },
          { path: '/configuracoes', element: <EmDesenvolvimentoPage /> },
          { path: '/historico',     element: <HistoryPage /> },
        ],
      },
    ],
  },

  // Rota fallback
  { path: '*', element: <Navigate to="/" replace /> },
]);
