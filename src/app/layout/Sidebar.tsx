import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  Package,
  ShoppingCart,
  Scale,
  BarChart2,
  Box,
  Store,
  Users,
  UserSquare,
  Settings,
  ChevronRight,
  ChevronLeft,
  Building2,
  LogOut,
  MoreVertical,
  History,
  X,
  Sparkles,
  ClipboardList,
  Inbox,
  Blocks,
} from 'lucide-react';
import { useState } from 'react';
import toast from 'react-hot-toast';
import { cn } from '@/shared/utils';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/features/auth';
import { adesoes } from '@/features/adesao';
import { useUIStore } from '@/shared/hooks';
import { useCopilotStore } from '@/features/ai-copilot';
import type { Role } from '@/features/auth';

interface NavItem {
  label: string;
  icon: React.ElementType;
  path: string;
  roles?: Role[];
  badge?: string;
}

interface NavGroup {
  title: string;
  items: NavItem[];
}

/**
 * O menu.
 *
 * Tinha quinze entradas, três delas duplicadas ou vazias: **Fornecedores** aparecia
 * aqui e como separador das Compras, **Histórico de Sessões** aqui e como separador do
 * POS (nos dois casos era o mesmo componente montado em dois sítios), e
 * **Configurações** apontava para um placeholder que nunca foi construído. **Produtos**
 * e **Stock** eram a mesma matéria vista de dois ângulos, e **Salários** vivia fora do
 * RH quando é RH.
 *
 * Ficam onze, sem duplicados. O que saiu continua alcançável: as rotas antigas
 * redireccionam para o separador respectivo.
 */
const navGroups: NavGroup[] = [
  {
    title: 'Gestão',
    items: [
      { label: 'Dashboard', icon: LayoutDashboard, path: '/dashboard', roles: ['SUPER_ADMIN', 'ADMIN', 'MANAGER'] },
      { label: 'Empresas', icon: Building2, path: '/empresas', roles: ['SUPER_ADMIN'] },
      // Ao lado de Empresas porque é a origem delas: um pedido aprovado é uma empresa nova.
      { label: 'Adesões', icon: Inbox, path: '/adesoes', roles: ['SUPER_ADMIN'] },
      // O catálogo global do que uma empresa pode contratar — plataforma, não operação.
      { label: 'Módulos', icon: Blocks, path: '/modulos', roles: ['SUPER_ADMIN'] },
      { label: 'Utilizadores', icon: Users, path: '/utilizadores', roles: ['SUPER_ADMIN', 'ADMIN'] },
      { label: 'Permissões', icon: Settings, path: '/permissoes', roles: ['SUPER_ADMIN', 'ADMIN', 'MANAGER'] },
    ]
  },
  {
    title: 'Operação',
    items: [
      { label: 'Ponto de Venda', icon: Store, path: '/vendas', roles: ['SUPER_ADMIN', 'ADMIN', 'MANAGER', 'CASHIER'] },
      { label: 'CRM', icon: UserSquare, path: '/crm', roles: ['SUPER_ADMIN', 'ADMIN', 'MANAGER'] },
      { label: 'Financeiro', icon: BarChart2, path: '/financeiro', roles: ['SUPER_ADMIN', 'ADMIN', 'MANAGER'] },
      // Produtos e Stock numa entrada: o catálogo é o primeiro separador.
      { label: 'Produtos & Stock', icon: Package, path: '/stock', roles: ['SUPER_ADMIN', 'ADMIN', 'MANAGER', 'STOCK_KEEPER', 'USER'] },
      { label: 'Armazéns', icon: Box, path: '/armazens', roles: ['SUPER_ADMIN', 'ADMIN', 'MANAGER', 'STOCK_KEEPER'] },
      // Requisições **antes** de Compras, e é a ordem do processo: primeiro decide-se a
      // quem comprar, depois emite-se a ordem. A ordem inversa no menu sugeriria que a
      // requisição é um detalhe da ordem, quando é o contrário.
      { label: 'Requisições', icon: ClipboardList, path: '/requisicoes', roles: ['SUPER_ADMIN', 'ADMIN', 'MANAGER', 'STOCK_KEEPER'] },
      // Compras leva Fornecedores como separador.
      { label: 'Compras', icon: ShoppingCart, path: '/compras', roles: ['SUPER_ADMIN', 'ADMIN', 'MANAGER', 'STOCK_KEEPER'] },
      // Sem STOCK_KEEPER: quem recebe mercadoria não deve libertar o pagamento dela.
      { label: 'Conferência', icon: Scale, path: '/conferencia', roles: ['SUPER_ADMIN', 'ADMIN', 'MANAGER'] },
      { label: 'Lojas & Caixas', icon: Store, path: '/lojas', roles: ['SUPER_ADMIN', 'ADMIN'] },
    ]
  },
  {
    title: 'Empresa',
    items: [
      // `MANAGER` entrou porque tinha acesso a Salários (que era entrada própria) e não
      // a RH. Dentro da secção, o separador de colaboradores é condicionado.
      { label: 'Recursos Humanos', icon: UserSquare, path: '/rh', roles: ['SUPER_ADMIN', 'ADMIN', 'MANAGER'] },
      { label: 'Histórico no Sistema', icon: History, path: '/historico' },
    ]
  }
];

interface SidebarProps {
  isCollapsed: boolean;
  /** Quando true, o Sidebar está a ser renderizado como drawer mobile (sem botão collapse) */
  isMobileDrawer?: boolean;
}

export function Sidebar({ isCollapsed, isMobileDrawer = false }: SidebarProps) {
  const { user, hasRole, logout } = useAuth();

  /**
   * Os pedidos de adesão à espera, no selo da entrada de menu.
   *
   * Rota própria e não a listagem: quem mostra o selo quer o número, e trazer os pedidos
   * todos a cada carregamento de página para contar o comprimento da lista seria puxar os
   * dados de todos os requerentes para pintar um selo.
   *
   * `enabled` só para o SUPER_ADMIN: para qualquer outro role a rota responde 403, e uma
   * chamada que falha sempre acende o interceptor de erro em cada navegação.
   */
  const { data: adesoesPendentes } = useQuery({
    queryKey: ['adesoes-pendentes'],
    queryFn: adesoes.contarPendentes,
    enabled: user?.role === 'SUPER_ADMIN',
    // Um pedido novo não é urgente ao minuto, e um intervalo curto punha uma chamada por
    // minuto por cada separador aberto. Cinco minutos, e a mutação de decidir invalida
    // esta chave — o que faz o número acertar no instante em que alguém decide.
    staleTime: 5 * 60 * 1000,
  });
  const { toggleSidebarCollapse, closeMobileMenu } = useUIStore();
  const { toggleOpen: toggleCopilot } = useCopilotStore();
  const location = useLocation();
  const navigate = useNavigate();
  const [showProfileMenu, setShowProfileMenu] = useState(false);

  const handleLogout = async () => {
    const toastId = toast.loading('A terminar sessão...');
    try {
      await logout();
      toast.success('Sessão encerrada.', { id: toastId });
      navigate('/login', { replace: true });
    } catch {
      toast.error('Erro ao terminar sessão.', { id: toastId });
    }
  };

  return (
    <aside
      className={cn(
        'fixed inset-y-0 left-0 z-40 flex flex-col bg-white border-r border-slate-200 transition-all duration-300',
        // Em drawer mobile, sempre expanded (width fixa)
        isMobileDrawer ? 'w-72' : isCollapsed ? 'w-20' : 'w-64',
      )}
    >
      {/* Logo / Marca ────────────────────────────────────────────── */}
      <div
        className={cn(
          'flex items-center pt-6 pb-4',
          isCollapsed && !isMobileDrawer ? 'justify-center px-0' : 'justify-between px-6',
        )}
      >
        <div
          className={cn(
            'flex items-center gap-3',
            isCollapsed && !isMobileDrawer ? 'hidden' : 'flex',
          )}
        >
          <div className="w-8 h-8 rounded-lg bg-slate-900 flex items-center justify-center flex-shrink-0">
            <span className="text-white font-bold text-sm">CC</span>
          </div>
          <div>
            <h2 className="text-slate-900 font-bold text-base leading-none">ControlCore</h2>
          </div>
        </div>

        {/* Desktop: botão de colapso. Mobile drawer: botão de fechar */}
        {isMobileDrawer ? (
          <button
            onClick={closeMobileMenu}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
            aria-label="Fechar menu"
          >
            <X size={20} />
          </button>
        ) : (
          <button
            onClick={toggleSidebarCollapse}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
            aria-label={isCollapsed ? 'Expandir sidebar' : 'Colapsar sidebar'}
          >
            {isCollapsed ? <ChevronRight size={20} /> : <ChevronLeft size={20} />}
          </button>
        )}
      </div>

      {/* Navegação ────────────────────────────────────────────────── */}
      <nav className="flex-1 overflow-y-auto px-3 pb-6 custom-scrollbar">
        {navGroups.map((group, idx) => {
          const visibleItems = group.items.filter(
            (item) => !item.roles || hasRole(item.roles),
          );

          if (visibleItems.length === 0) return null;

          // Em modo colapsado (desktop), mostramos apenas o Ícone sem label de grupo
          const showLabel = !isCollapsed || isMobileDrawer;

          return (
            <div key={idx} className="mb-6">
              {showLabel ? (
                <h3 className="px-3 mb-2 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  {group.title}
                </h3>
              ) : (
                <div className="h-4" />
              )}
              <ul className="space-y-1">
                {visibleItems.map((item) => {
                  const isActive = location.pathname.startsWith(item.path);
                  const Icon = item.icon;
                  const collapsed = isCollapsed && !isMobileDrawer;

                  return (
                    <li key={item.path}>
                      <NavLink
                         to={item.path}
                         title={collapsed ? item.label : undefined}
                         className={cn(
                           'flex items-center rounded-lg text-sm font-medium transition-all duration-150 group',
                           collapsed ? 'justify-center py-3' : 'justify-between px-3 py-2',
                           isActive
                             ? 'bg-slate-100 text-slate-900'
                             : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900',
                         )}
                      >
                        <div className={cn('flex items-center', collapsed ? 'gap-0' : 'gap-3')}>
                          <Icon
                            size={collapsed ? 20 : 18}
                            className={cn(
                              'flex-shrink-0 transition-colors',
                              isActive ? 'text-slate-900' : 'text-slate-400 group-hover:text-slate-600',
                            )}
                          />
                          {!collapsed && <span className="truncate">{item.label}</span>}
                        </div>

                        {/* O selo das adesões é âmbar e não verde: é trabalho à espera, não
                            uma novidade a celebrar. Zero não mostra selo nenhum — um «0»
                            permanente treina quem o vê a ignorar o sítio onde o número
                            aparece. */}
                        {!collapsed && item.path === '/adesoes' && adesoesPendentes ? (
                          <span className="px-1.5 py-0.5 rounded text-[10px] font-semibold bg-amber-50 text-amber-700 border border-amber-200">
                            {adesoesPendentes}
                          </span>
                        ) : !collapsed && item.badge ? (
                          <span className="px-1.5 py-0.5 rounded text-[10px] font-semibold bg-emerald-50 text-emerald-600 border border-emerald-200">
                            {item.badge}
                          </span>
                        ) : null}
                      </NavLink>
                    </li>
                  );
                })}
              </ul>
            </div>
          );
        })}
        
        {/* Assistente IA ──────────────────────────────────────────────── */}
        <div className="mt-4 pt-4 border-t border-slate-100 mb-2">
          <button
            onClick={toggleCopilot}
            className={cn(
              'w-full flex items-center rounded-lg text-sm font-medium transition-all duration-150 group',
              (isCollapsed && !isMobileDrawer) ? 'justify-center py-3' : 'justify-between px-3 py-2',
              'text-indigo-600 bg-indigo-50 hover:bg-indigo-100 border border-indigo-100 shadow-sm'
            )}
            title={(isCollapsed && !isMobileDrawer) ? 'Assistente Mayra' : undefined}
          >
            <div className={cn('flex items-center', (isCollapsed && !isMobileDrawer) ? 'gap-0' : 'gap-3')}>
              <Sparkles
                size={(isCollapsed && !isMobileDrawer) ? 20 : 18}
                className="flex-shrink-0 text-indigo-600 group-hover:scale-110 transition-transform"
              />
              {(!isCollapsed || isMobileDrawer) && <span className="truncate font-semibold">Assistente Mayra</span>}
            </div>
          </button>
        </div>
      </nav>

      {/* Utilizador (Rodapé) ──────────────────────────────────────── */}
      {user && (
        <div className="relative p-4 border-t border-slate-200 bg-white">

          {/* Menu Dropdown de Perfil */}
          {showProfileMenu && (
            <div className="absolute bottom-full left-4 right-4 mb-2 bg-white border border-slate-200 shadow-lg rounded-xl overflow-hidden animate-in slide-in-from-bottom-2">
              <button
                onClick={handleLogout}
                className="w-full flex items-center gap-2 px-4 py-3 text-sm text-rose-600 hover:bg-rose-50 transition-colors text-left"
              >
                <LogOut size={16} /> Terminar Sessão
              </button>
            </div>
          )}

          <div
            className={cn(
              'flex items-center cursor-pointer p-2 rounded-lg hover:bg-slate-50 transition-colors',
              isCollapsed && !isMobileDrawer ? 'justify-center' : 'justify-between',
            )}
            onClick={() => setShowProfileMenu(!showProfileMenu)}
            title={isCollapsed && !isMobileDrawer ? 'Perfil' : undefined}
          >
            <div
              className={cn(
                'flex items-center gap-3',
                isCollapsed && !isMobileDrawer && 'justify-center w-full',
              )}
            >
              <div className="w-9 h-9 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center flex-shrink-0">
                <span className="text-slate-700 text-sm font-bold">
                  {user.name.charAt(0).toUpperCase()}
                </span>
              </div>
              {(!isCollapsed || isMobileDrawer) && (
                <div className="flex-1 min-w-0">
                  <p className="text-slate-900 text-sm font-semibold truncate leading-none">{user.name}</p>
                  <p className="text-slate-500 text-xs truncate mt-1">{user.code}</p>
                </div>
              )}
            </div>
            {(!isCollapsed || isMobileDrawer) && <MoreVertical size={16} className="text-slate-400" />}
          </div>
        </div>
      )}
    </aside>
  );
}
