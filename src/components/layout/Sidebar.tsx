import { NavLink, useLocation } from 'react-router-dom';
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
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuth } from '@/hooks/useAuth';
import type { Role } from '@/types/auth.types';

interface NavItem {
  label: string;
  icon: React.ElementType;
  path: string;
  roles?: Role[]; // se undefined, acessível a todos os roles autenticados
}

const navItems: NavItem[] = [
  { label: 'Dashboard',       icon: LayoutDashboard, path: '/dashboard' },
  { label: 'Produtos',        icon: Package,          path: '/produtos' },
  { label: 'Fornecedores',    icon: Truck,            path: '/fornecedores' },
  { label: 'Compras',         icon: ShoppingCart,     path: '/compras', roles: ['SUPER_ADMIN', 'ADMIN', 'MANAGER'] },
  { label: 'Stock',           icon: BarChart3,        path: '/stock' },
  { label: 'Ponto de Venda',  icon: Store,            path: '/vendas' },
  { label: 'Clientes',        icon: Users,            path: '/clientes' },
  { label: 'Rec. Humanos',    icon: UserSquare,       path: '/rh', roles: ['SUPER_ADMIN', 'ADMIN'] },
  { label: 'Configurações',   icon: Settings,         path: '/configuracoes', roles: ['SUPER_ADMIN', 'ADMIN'] },
];

export function Sidebar() {
  const { user, hasRole } = useAuth();
  const location = useLocation();

  const visibleItems = navItems.filter(
    (item) => !item.roles || hasRole(item.roles),
  );

  return (
    <aside className="fixed inset-y-0 left-0 z-40 w-64 flex flex-col bg-slate-950 border-r border-slate-800">

      {/* ─── Logo / Marca ─────────────────────────────────────────────── */}
      <div className="flex items-center gap-3 px-6 py-5 border-b border-slate-800">
        <div className="w-9 h-9 rounded-lg bg-blue-600 flex items-center justify-center flex-shrink-0">
          <span className="text-white font-bold text-sm">CC</span>
        </div>
        <div>
          <p className="text-white font-semibold text-sm leading-none">ControlCore</p>
          <p className="text-slate-500 text-xs mt-0.5">by SRG</p>
        </div>
      </div>

      {/* ─── Navegação ────────────────────────────────────────────────── */}
      <nav className="flex-1 overflow-y-auto py-4 px-3">
        <ul className="space-y-0.5">
          {visibleItems.map((item) => {
            const isActive = location.pathname.startsWith(item.path);
            const Icon = item.icon;

            return (
              <li key={item.path}>
                <NavLink
                  to={item.path}
                  className={cn(
                    'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150 group',
                    isActive
                      ? 'bg-blue-600 text-white shadow-sm shadow-blue-900'
                      : 'text-slate-400 hover:bg-slate-800 hover:text-slate-100',
                  )}
                >
                  <Icon
                    size={18}
                    className={cn(
                      'flex-shrink-0 transition-colors',
                      isActive ? 'text-white' : 'text-slate-500 group-hover:text-slate-300',
                    )}
                  />
                  <span className="flex-1 truncate">{item.label}</span>
                  {isActive && (
                    <ChevronRight size={14} className="text-blue-200 opacity-70" />
                  )}
                </NavLink>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* ─── Utilizador ───────────────────────────────────────────────── */}
      {user && (
        <div className="px-4 py-4 border-t border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-blue-900 border border-blue-700 flex items-center justify-center flex-shrink-0">
              <span className="text-blue-200 text-xs font-bold">
                {user.name.charAt(0).toUpperCase()}
              </span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-slate-200 text-xs font-medium truncate">{user.name}</p>
              <p className="text-slate-500 text-xs truncate">{user.code}</p>
            </div>
          </div>
        </div>
      )}
    </aside>
  );
}
