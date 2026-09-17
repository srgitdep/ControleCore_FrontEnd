import { createBrowserRouter, Navigate } from 'react-router-dom';
import { ProtectedRoute } from './ProtectedRoute';
import { AppLayout } from '@/app/layout/AppLayout';
import { LoginPage, ForgotPasswordPage, ResetPasswordPage } from '@/features/auth';
import { LandingPage } from '@/pages/LandingPage';
import { PrecosPage } from '@/pages/PrecosPage';
import { DashboardPage } from '@/features/dashboard';
import { EmpresasPage } from '@/features/empresas';
import { ModulosPage } from '@/features/modulos';
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
import { NecessidadesPage, HistoricoNecessidadesPage, AlertasPage } from '@/features/necessidades';
import { TransferenciasPage } from '@/features/transferencias';
import { RequisicoesPage, PesosSourcingPage } from '@/features/b2b';
import {
  PortalLayout,
  RegistarFornecedorPage,
  EntrarPortalPage,
  VitrinePage,
  DocumentosPage,
  ZonasPage,
  PerfilPage,
  ImportarCatalogoPage,
} from '@/features/portal-fornecedor';
import { MercadoPage, FichaFornecedorPage } from '@/features/mercado';
import {
  AdesoesPage,
  EscolherTipoContaPage,
  PedirAdesaoPage,
} from '@/features/adesao';
import { ConferenciaPage } from '@/features/conferencia';
import { FornecedorVitrinePage } from '@/features/fornecedores';
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
  { path: '/precos',           element: <PrecosPage /> },
  { path: '/login',            element: <LoginPage /> },

  // ─── Criar conta ────────────────────────────────────────────────────────────────
  //
  // A bifurcação antes do formulário, porque os dois registos criam coisas diferentes:
  // o do comprador cria um **pedido** que alguém aprova — a aprovação provisiona um
  // tenant com plano facturável — e o do fornecedor cria a conta na hora, porque o que
  // ela dá acesso é a uma vitrine vazia.
  //
  // Alcançável da landing page, que é o que o pedido exigia: sem isto o único caminho
  // para o registo de fornecedor era escrever o URL à mão.
  { path: '/criar-conta',            element: <EscolherTipoContaPage /> },
  { path: '/criar-conta/comprador',  element: <PedirAdesaoPage /> },
  { path: '/recuperar-senha',  element: <ForgotPasswordPage /> },
  { path: '/redefinir-senha',  element: <ResetPasswordPage /> },

  // ── Portal do Fornecedor ──────────────────────────────────────────────────
  //
  // Fora do `ProtectedRoute` de propósito. Esse guarda exige um `User` do lado
  // comprador — com `role` e `empresaId` — e um fornecedor não tem nenhum dos dois.
  //
  // O registo e a entrada são públicos porque um fornecedor que ainda não está na
  // plataforma não tem conta para entrar; se dependesse de um convite, o mercado só
  // cresceria à velocidade a que os compradores se lembrassem de convidar.
  //
  // As rotas de dentro são guardadas pelo `PortalLayout`, que verifica a sessão do
  // portal contra o servidor e redirecciona para `/fornecedor/entrar` — e não para
  // `/login`, que é o formulário do código de funcionário onde um fornecedor nunca
  // conseguiria entrar.
  // ── Mercado público ───────────────────────────────────────────────────────
  //
  // Sem autenticação nenhuma, e é o motor de aquisição: quem entra a comparar
  // fornecedores sai a experimentar o ControlCore. Nada de nenhuma empresa compradora
  // aparece aqui — a fronteira está no backend, e estas páginas só conseguem chamar o
  // repositório partilhado.
  { path: '/mercado',                          element: <MercadoPage /> },
  { path: '/mercado/fornecedores/:organizacaoId', element: <FichaFornecedorPage /> },

  { path: '/fornecedor/registar', element: <RegistarFornecedorPage /> },
  { path: '/fornecedor/entrar',   element: <EntrarPortalPage /> },
  {
    path: '/fornecedor',
    element: <PortalLayout />,
    children: [
      { index: true,            element: <VitrinePage /> },
      { path: 'documentos',     element: <DocumentosPage /> },
      { path: 'zonas',          element: <ZonasPage /> },
      { path: 'perfil',         element: <PerfilPage /> },
      { path: 'importar',       element: <ImportarCatalogoPage /> },
    ],
  },

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
          // O catálogo global de módulos que as empresas contratam — plataforma, não
          // uma empresa, por isso ao lado de Empresas e não dentro do RH/Operação.
          {
            path: '/modulos',
            element: <ProtectedRoute roles={['SUPER_ADMIN']} />,
            children: [{ index: true, element: <ModulosPage /> }]
          },
          // A fila de adesões vive ao lado das empresas porque é a origem delas: um
          // pedido aprovado **é** uma empresa nova. Só SUPER_ADMIN, e não por escolha do
          // frontend — o backend leva o `RolesGuard` porque o `PermissoesGuard` dá bypass
          // a qualquer ADMIN, que passaria a poder criar empresas na plataforma.
          {
            path: '/adesoes',
            element: <ProtectedRoute roles={['SUPER_ADMIN']} />,
            children: [{ index: true, element: <AdesoesPage /> }]
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
          // Necessidades vive antes de Compras: é o painel que detecta o que precisa de
          // decisão e encaminha para a requisição — DT01 1.
          { path: '/compras/necessidades', element: <NecessidadesPage /> },
          // Histórico (DT01 §15.3) e Centro de Alertas (§15.4): ecrãs próprios,
          // atravessando todas as necessidades e todas as lojas, e não um separador
          // do painel operacional — que mostra só a fila activa de uma loja.
          { path: '/compras/necessidades/historico', element: <HistoricoNecessidadesPage /> },
          { path: '/compras/necessidades/alertas', element: <AlertasPage /> },
          { path: '/transferencias', element: <TransferenciasPage /> },
          { path: '/compras',       element: <PurchasesPage /> },
          // As requisições vivem em rota própria e não como separador de Compras.
          //
          // São a fase **anterior** à ordem de compra — o documento que existe antes de haver
          // fornecedor — e enterrá-las num separador de «Compras» faria parecer que são mais
          // uma vista das ordens. A permissão é verificada no backend; aqui basta a rota.
          { path: '/requisicoes',   element: <RequisicoesPage /> },
          { path: '/requisicoes/pesos', element: <PesosSourcingPage /> },
          // Conferência é secção própria e não separador das Compras: quem regista a
          // factura não a pode aprovar, e juntá-las no mesmo ecrã convidaria a que fosse
          // a mesma pessoa a fazer as duas coisas.
          { path: '/conferencia',   element: <ConferenciaPage /> },
          { path: '/fornecedores',  element: <Navigate to="/compras?tab=fornecedores" replace /> },
          // A vitrine de um fornecedor específico — dentro do `AppLayout`, e não junto às
          // rotas públicas do mercado: exige sessão e o módulo B2B, e mostra dados
          // comerciais (e-mail, telefone) que a ficha pública do mercado não expõe.
          { path: '/fornecedores/:organizacaoId/vitrine', element: <FornecedorVitrinePage /> },

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
          { path: '/configuracoes', element: <Navigate to="/dashboard" replace /> },
          { path: '/historico',     element: <HistoryPage /> },
        ],
      },
    ],
  },

  // Rota fallback
  { path: '*', element: <Navigate to="/" replace /> },
]);
