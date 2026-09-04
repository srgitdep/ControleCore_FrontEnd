import { useLocation } from 'react-router-dom';
import { Menu } from 'lucide-react';
import { SinoDeAlertas } from '@/features/alertas';
import { useUIStore } from '@/shared/hooks';
import { cn } from '@/shared/utils';
import { useCopilotStore } from '@/features/ai-copilot/store/copilotStore';
import { classeMargemDaMayra } from '@/features/ai-copilot/utils/margem-layout';

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
  '/modulos':       'Catálogo de Módulos',
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

  // O cabeçalho é `fixed`, pelo que não herda a margem do contentor de conteúdo. Sem
  // isto passava por baixo do painel da Mayra, e o sino de notificações ficava
  // inalcançável.
  const margemDaMayra = classeMargemDaMayra(useCopilotStore());

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
        // Encolhe à direita com a Mayra aberta. O cabeçalho é `fixed`, pelo que não
        // herda a margem do contentor de conteúdo — sem isto passava por baixo do
        // painel, e o sino de notificações ficava inalcançável.
        margemDaMayra,
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

      {/* ── Lado direito: Alertas ───────────────────────────────────────── */}
      {/*
        Havia aqui um sino com um ponto azul fixo: sempre aceso, sem abrir nada e sem
        corresponder a coisa nenhuma. É pior do que não existir — ensina as pessoas a
        ignorá-lo, e quando passa a ter significado já ninguém olha.
      */}
      <div className="flex items-center">
        <SinoDeAlertas />
      </div>
    </header>
  );
}
