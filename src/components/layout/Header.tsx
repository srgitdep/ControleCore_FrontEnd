import { useLocation } from 'react-router-dom';
import { Bell } from 'lucide-react';

// Mapeia o path para o título da página
const PAGE_TITLES: Record<string, string> = {
  '/dashboard':     'Dashboard',
  '/produtos':      'Produtos',
  '/fornecedores':  'Fornecedores',
  '/compras':       'Compras',
  '/stock':         'Stock',
  '/vendas':        'Ponto de Venda',
  '/clientes':      'Clientes',
  '/rh':            'Recursos Humanos',
  '/configuracoes': 'Configurações',
};

interface HeaderProps {
  isCollapsed?: boolean;
}

export function Header({ isCollapsed = false }: HeaderProps) {
  const location = useLocation();
  const pageTitle = PAGE_TITLES[location.pathname] ?? 'ControlCore';

  return (
    <header className={`fixed top-0 right-0 z-30 h-16 flex items-center justify-between px-6 bg-white border-b border-slate-200 transition-all duration-300 ${isCollapsed ? 'left-20' : 'left-64'}`}>

      {/* ─── Título da página ──────────────────────────────────────── */}
      <h1 className="text-lg font-semibold text-slate-800">{pageTitle}</h1>

      {/* ─── Acções (Apenas Notificações) ─────────────────────────── */}
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
