import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  Package,
  Truck,
  ShoppingCart,
  BarChart3,
  Store,
  Users,
  UserSquare,
  Settings,
  ChevronRight,
  ChevronLeft,
  Building2,
  Mail,
  LogOut,
  MoreVertical,
  History
} from 'lucide-react';
import { useState } from 'react';
import toast from 'react-hot-toast';
import { cn } from '@/lib/utils';
import { useAuth } from '@/hooks/useAuth';
import type { Role } from '@/types/auth.types';
import { ROLE_LABELS } from '@/types/auth.types';

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

const navGroups: NavGroup[] = [
  {
    title: 'Dashboards',
    items: [
      { label: 'Dashboard', icon: LayoutDashboard, path: '/dashboard', roles: ['SUPER_ADMIN', 'ADMIN', 'MANAGER'] },
      { label: 'Empresas', icon: Building2, path: '/empresas', roles: ['SUPER_ADMIN'] },
      { label: 'Utilizadores', icon: Users, path: '/utilizadores', roles: ['SUPER_ADMIN', 'ADMIN'] },
    ]
  },
  {
    title: 'Commerce',
    items: [
      { label: 'Ponto de Venda', icon: Store, path: '/vendas', roles: ['SUPER_ADMIN', 'ADMIN', 'MANAGER', 'CASHIER'] },
      { label: 'Clientes', icon: Users, path: '/clientes', roles: ['SUPER_ADMIN', 'ADMIN', 'MANAGER'] },
      { label: 'Produtos', icon: Package, path: '/produtos' }, // Produtos: Acesso total (Caixa, Armazenista, Geral, etc)
      { label: 'Stock', icon: BarChart3, path: '/stock', roles: ['SUPER_ADMIN', 'ADMIN', 'MANAGER', 'STOCK_KEEPER'] },
      { label: 'Compras', icon: ShoppingCart, path: '/compras', roles: ['SUPER_ADMIN', 'ADMIN', 'MANAGER', 'STOCK_KEEPER'] },
      { label: 'Fornecedores', icon: Truck, path: '/fornecedores', roles: ['SUPER_ADMIN', 'ADMIN', 'MANAGER', 'STOCK_KEEPER'] },
    ]
  },
  {
    title: 'Company',
    items: [
      { label: 'Rec. Humanos', icon: UserSquare, path: '/rh', roles: ['SUPER_ADMIN', 'ADMIN'] },
      { label: 'Configurações', icon: Settings, path: '/configuracoes', roles: ['SUPER_ADMIN', 'ADMIN'] },
      { label: 'Histórico no Sistema', icon: History, path: '/historico' },
    ]
  }
];

interface SidebarProps {
  isCollapsed: boolean;
  setIsCollapsed: (val: boolean) => void;
}

export function Sidebar({ isCollapsed, setIsCollapsed }: SidebarProps) {
  const { user, hasRole, logout } = useAuth();
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
    <aside className={`fixed inset-y-0 left-0 z-40 flex flex-col bg-white border-r border-slate-200 transition-all duration-300 ${isCollapsed ? 'w-20' : 'w-64'}`}>

      {/* ─── Logo / Marca ─────────────────────────────────────────────── */}
      <div className={`flex items-center ${isCollapsed ? 'justify-center px-0' : 'justify-between px-6'} pt-6 pb-4`}>
        <div className={`flex items-center gap-3 ${isCollapsed ? 'hidden' : 'flex'}`}>
          <div className="w-8 h-8 rounded-lg bg-slate-900 flex items-center justify-center flex-shrink-0">
            <span className="text-white font-bold text-sm">CC</span>
          </div>
          <div>
            <h2 className="text-slate-900 font-bold text-base leading-none">ControlCore</h2>
          </div>
        </div>
        
        {/* Botão de colapso */}
        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
        >
          {isCollapsed ? <ChevronRight size={20} /> : <ChevronLeft size={20} />}
        </button>
      </div>



      {/* ─── Navegação ────────────────────────────────────────────────── */}
      <nav className="flex-1 overflow-y-auto px-3 pb-6 custom-scrollbar">
        {navGroups.map((group, idx) => {
          // Filtra os items do grupo com base nas roles
          const visibleItems = group.items.filter(item => !item.roles || hasRole(item.roles));
          
          if (visibleItems.length === 0) return null;

          return (
            <div key={idx} className="mb-6">
              {/* Título do grupo (escondido se colapsado, ou substituto) */}
              {!isCollapsed && (
                <h3 className="px-3 mb-2 text-xs font-semibold text-slate-500">{group.title}</h3>
              )}
              {isCollapsed && <div className="h-4" />} {/* Espaçamento para o grupo */}
              <ul className="space-y-1">
                {visibleItems.map((item) => {
                  const isActive = location.pathname.startsWith(item.path);
                  const Icon = item.icon;

                  return (
                    <li key={item.path}>
                      <NavLink
                        to={item.path}
                        title={isCollapsed ? item.label : undefined}
                        className={cn(
                          'flex items-center rounded-lg text-sm font-medium transition-all duration-150 group',
                          isCollapsed ? 'justify-center py-3' : 'justify-between px-3 py-2',
                          isActive
                            ? 'bg-slate-100 text-slate-900'
                            : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900',
                        )}
                      >
                        <div className={cn('flex items-center', isCollapsed ? 'gap-0' : 'gap-3')}>
                          <Icon
                            size={isCollapsed ? 20 : 18}
                            className={cn(
                              'flex-shrink-0 transition-colors',
                              isActive ? 'text-slate-900' : 'text-slate-400 group-hover:text-slate-600',
                            )}
                          />
                          {!isCollapsed && <span className="truncate">{item.label}</span>}
                        </div>
                        
                        {!isCollapsed && item.badge && (
                          <span className="px-1.5 py-0.5 rounded text-[10px] font-semibold bg-emerald-50 text-emerald-600 border border-emerald-200">
                            {item.badge}
                          </span>
                        )}
                      </NavLink>
                    </li>
                  );
                })}
              </ul>
            </div>
          );
        })}


      </nav>

      {/* ─── Utilizador (Rodapé) ──────────────────────────────────────── */}
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
            className={`flex items-center cursor-pointer p-2 rounded-lg hover:bg-slate-50 transition-colors ${isCollapsed ? 'justify-center' : 'justify-between'}`}
            onClick={() => setShowProfileMenu(!showProfileMenu)}
            title={isCollapsed ? 'Perfil' : undefined}
          >
            <div className={`flex items-center gap-3 ${isCollapsed ? 'justify-center w-full' : ''}`}>
              <div className="w-9 h-9 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center flex-shrink-0">
                <span className="text-slate-700 text-sm font-bold">
                  {user.name.charAt(0).toUpperCase()}
                </span>
              </div>
              {!isCollapsed && (
                <div className="flex-1 min-w-0">
                  <p className="text-slate-900 text-sm font-semibold truncate leading-none">{user.name}</p>
                  <p className="text-slate-500 text-xs truncate mt-1">{user.code}</p>
                </div>
              )}
            </div>
            {!isCollapsed && <MoreVertical size={16} className="text-slate-400" />}
          </div>
        </div>
      )}
    </aside>
  );
}
