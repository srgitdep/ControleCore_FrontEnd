import { useLocation } from 'react-router-dom';
import { Bell, Menu } from 'lucide-react';
import { useUIStore } from '@/store/useUIStore';
import { cn } from '@/lib/utils';

// Mapeia o path para o tÍtulo da página
const PAGE_TITLES: Record<string, string> = {
  '/dashboard':     'Dashboard',
  '/produtos':      'Produtos',
  '/fornecedores':  'Fornecedores',
  '/compras':       'Compras',
  '/stock':         'Stock',
  '/vendas':        'Ponto de Venda',
  '/clientes':      'CRM',
  '/crm':           'CRM',
  '/rh':            'Recursos Humanos',
  '/configuracoes': 'Configurações',
  '/empresas':      'Empresas',
  '/utilizadores':  'Utilizadores',
  '/historico':     'Histórico no Sistema',
};

interface HeaderProps {
  isCollapsed?: boolean;
}

export function Header({ isCollapsed = false }: HeaderProps) {
  const location = useLocation();
  const { toggleMobileMenu } = useUIStore();

  // Resolve o tÍtulo: verifica o pathname exacto ou usa o segmento raiz
  const pageTitle =
    PAGE_TITLES[location.pathname] ??
    PAGE_TITLES[`/${location.pathname.split('/')[1]}`] ??
    'ControlCore';

  return (
    <header
      className={cn(
        'fixed top-0 right-0 z-30 h-16 flex items-center justify-between px-4 sm:px-6',
        'bg-white/95 backdrop-blur-sm border-b border-slate-200 transition-all duration-300',
        // Desktop: desloca à direita do sidebar
        isCollapsed ? 'lg:left-20' : 'lg:left-64',
        // Mobile: ocupa toda a largura
        'left-0',
      )}
    >
      {/* ── Lado esquerdo: hamburger (mobile) + tÍtulo ────────────────────â”€ */}
      <div className="flex items-center gap-3">
        {/* Botão hamburger: só visÍvel em telas < lg */}
        <button
          onClick={toggleMobileMenu}
          className="p-2 rounded-lg text-slate-500 hover:bg-slate-100 hover:text-slate-800 transition-colors lg:hidden"
          aria-label="Abrir menu de navegação"
        >
          <Menu size={22} />
        </button>

        <h1 className="text-base sm:text-lg font-semibold text-slate-800 truncate">
          {pageTitle}
        </h1>
      </div>

      {/* ── Lado direito: Notificações ────────────────────────────────────â”€ */}
      <div className="flex items-center">
        <button
          className="relative p-2 rounded-full text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition-colors"
          title="Notificações"
        >
          <Bell size={20} />
          <span className="absolute top-2 right-2 w-2 h-2 bg-blue-500 rounded-full border-2 border-white" />
        </button>
      </div>
    </header>
  );
}
