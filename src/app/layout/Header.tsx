import { useLocation } from 'react-router-dom';
import { Bell, Menu } from 'lucide-react';
import { useUIStore } from '@/shared/hooks';
import { cn } from '@/shared/utils';

/**
 * Título por rota. A resolução tenta o caminho exacto e depois o primeiro segmento,
 * pelo que `/stock/:id` herda o de `/stock`.
 *
 * `/configuracoes` e `/fornecedores` saíram — a primeira era um placeholder, a segunda
 * passou a separador das Compras. `/armazens`, `/lojas`, `/financeiro` e `/permissoes`
 * estavam a faltar e mostravam «ControlCore».
 */
const PAGE_TITLES: Record<string, string> = {
  '/dashboard':     'Dashboard',
  '/produtos':      'Produtos & Stock',
  '/stock':         'Produtos & Stock',
  '/armazens':      'Armazéns',
  '/compras':       'Compras',
  '/vendas':        'Ponto de Venda',
  '/lojas':         'Lojas & Caixas',
  '/clientes':      'CRM',
  '/crm':           'CRM',
  '/financeiro':    'Financeiro',
  '/rh':            'Recursos Humanos',
  '/empresas':      'Empresas',
  '/utilizadores':  'Utilizadores',
  '/permissoes':    'Permissões',
  '/historico':     'Histórico no Sistema',
};

interface HeaderProps {
  isCollapsed?: boolean;
}

export function Header({ isCollapsed = false }: HeaderProps) {
  const location = useLocation();
  const { toggleMobileMenu } = useUIStore();

  // Resolve o título: verifica o pathname exacto ou usa o segmento raiz
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
      {/* ── Lado esquerdo: hamburger (mobile) + título ──────────────────── */}
      <div className="flex items-center gap-3">
        {/* Botão hamburger: só visível em telas < lg */}
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

      {/* ── Lado direito: Notificações ──────────────────────────────────── */}
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
