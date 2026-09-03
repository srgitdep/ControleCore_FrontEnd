import { createBrowserRouter, Navigate } from 'react-router-dom';
import { ProtectedRoute } from './ProtectedRoute';
import { AppLayout } from '@/app/layout/AppLayout';
import { ErroDaAplicacao } from '@/app/ErroDaAplicacao';
import { LoginPage, ForgotPasswordPage, ResetPasswordPage } from '@/features/auth';
import { LandingPage } from '@/pages/LandingPage';
import { DashboardPage } from '@/features/dashboard';
import { EmpresasPage } from '@/features/empresas';
import { UsersPage } from '@/features/users';
import { HistoryPage } from '@/features/history';
import { ProductListPage } from '@/features/produtos';
import { PermissionsPage } from '@/pages/settings/PermissionsPage';
import { POSPage } from '@/features/vendas';
import { LojasPage } from '@/features/lojas';
import { StockListPage } from '@/features/stock';
import { StockDetailsPage } from '@/features/stock';
import { ClientesPage } from '@/features/crm';
import { FinanceiroDashboardPage } from '@/features/financeiro';
import { PurchasesPage } from '@/features/compras';
import { RecepcoesPage, RecepcaoDetalhePage } from '@/features/recepcao';
import { RequisicoesPage } from '@/features/requisicoes';
import { TransferenciasPage } from '@/features/transferencias';
import { ConfiguracaoPage } from '@/features/configuracao';
import { ArmazensPage } from '@/features/armazens';
import { RecursosHumanosPage } from '@/features/hr';
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
        // Dentro do layout de proposito: um ecra que rebenta mantem o menu e o cabecalho, e
        // da para ir a outro sitio sem recarregar a aplicacao inteira.
        errorElement: <ErroDaAplicacao />,
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
          // ─── Produtos e Stock ───────────────────────────────────────────
          // O catálogo passou a separador da secção Stock. `/produtos` redirecciona:
          // `RootRedirectOrLanding` envia STOCK_KEEPER e USER para lá depois do login,
          // e há ligações gravadas (favoritos, respostas antigas da Mayra) que apontam
          // para aqui.
          { path: '/produtos',      element: <ProductListPage /> },
          { path: '/stock',         element: <StockListPage /> },
          { path: '/stock/:id',     element: <StockDetailsPage /> },
          { path: '/armazens',      element: <ArmazensPage /> },

          // ─── Compras ────────────────────────────────────────────────────
          // Fornecedores estava em dois lugares: uma entrada de menu com CRUD completo
          // e um separador aqui que era uma tabela só de leitura. Fica só no separador,
          // agora completo.
          { path: '/compras',       element: <PurchasesPage /> },

          // ─── Recepção de mercadoria ─────────────────────────────────────
          // A entrada simples continua em Compras: uma guia de três linhas que chega ao
          // balcão não precisa de sessão, contagem e aprovação, e obrigar a isso faria as
          // pessoas deixarem de registar. Estas rotas são para a descarga que o justifica.
          { path: '/recepcoes',     element: <RecepcoesPage /> },
          { path: '/recepcoes/:id', element: <RecepcaoDetalhePage /> },
          { path: '/requisicoes',   element: <RequisicoesPage /> },
          { path: '/transferencias', element: <TransferenciasPage /> },
          { path: '/fornecedores',  element: <Navigate to="/compras?tab=fornecedores" replace /> },

          // ─── Vendas ─────────────────────────────────────────────────────
          // `/sessoes-historico` era o mesmo componente que o POS já monta no seu
          // separador «Histórico», e só era alcançável pelo menu.
          { path: '/vendas',        element: <POSPage /> },
          { path: '/sessoes-historico', element: <Navigate to="/vendas" replace /> },

          { path: '/lojas',         element: <LojasPage /> },
          { path: '/crm',           element: <ClientesPage /> },
          { path: '/clientes',      element: <ClientesPage /> },
          // Módulo Financeiro
          {
            path: '/financeiro',
            element: <ProtectedRoute roles={['SUPER_ADMIN', 'ADMIN', 'MANAGER']} />,
            children: [{ index: true, element: <FinanceiroDashboardPage /> }]
          },
          // ─── Recursos Humanos ───────────────────────────────────────────
          // Eram três rotas planas, e `/rh/escalas` era inalcançável pela interface:
          // sem entrada no menu e sem nenhuma página a apontar-lhe. As três passam a
          // separadores; as rotas antigas redireccionam para o separador respectivo.
          //
          // A permissão fica a `MANAGER` (era `/rh/salarios` que a tinha) e o separador
          // de colaboradores é que se condiciona — de outro modo um gestor perdia o
          // acesso a Salários que já tinha.
          {
            path: '/rh',
            element: <ProtectedRoute roles={['SUPER_ADMIN', 'ADMIN', 'MANAGER']} />,
            children: [{ index: true, element: <RecursosHumanosPage /> }],
          },
          { path: '/rh/escalas',    element: <Navigate to="/rh?tab=escalas" replace /> },
          { path: '/rh/salarios',   element: <Navigate to="/rh?tab=salarios" replace /> },

          // `/configuracoes` apontava para um placeholder de treze linhas que nunca foi
          // construído. A rota redirecciona para o painel; `/permissoes`, que está em
          // `pages/settings/`, é independente e não foi afectada.
          { path: '/configuracoes', element: <ProtectedRoute roles={['SUPER_ADMIN', 'ADMIN', 'MANAGER']} />, children: [{ index: true, element: <ConfiguracaoPage /> }] },
          { path: '/historico',     element: <HistoryPage /> },
        ],
      },
    ],
  },

  // Rota fallback
  // Fora do layout — login, landing — nao ha menu que manter, mas continua a valer a pena
  // mostrar o erro em vez do ecra de omissao do Router, que esta em ingles e mostra a pilha
  // do sintoma em vez da causa.
  { path: '*', element: <Navigate to="/" replace />, errorElement: <ErroDaAplicacao /> },
]);
