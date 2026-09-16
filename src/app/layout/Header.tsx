import { useEffect, useRef, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { AlertTriangle, Bell, Menu } from 'lucide-react';
import { useUIStore } from '@/shared/hooks';
import { cn } from '@/shared/utils';
import { useCopilotStore } from '@/features/ai-copilot/store/copilotStore';
import { classeMargemDaMayra } from '@/features/ai-copilot/utils/margem-layout';
import { PesquisaGlobal } from '@/features/pesquisa';
import { useAlertas, TIPO_ALERTA_LABEL } from '@/features/necessidades';

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
  '/requisicoes':   'Requisições de Compra',
  '/conferencia':   'Conferência',
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
  const navigate = useNavigate();
  const { toggleMobileMenu } = useUIStore();
  const [alertasAbertos, setAlertasAbertos] = useState(false);
  const alertasRef = useRef<HTMLDivElement>(null);

  // DT01 §15.4: "na página principal mostrar apenas contador e Ver todos". O sino é
  // essa síntese em qualquer página, não só no painel de necessidades.
  const { data: alertas } = useAlertas();

  useEffect(() => {
    if (!alertasAbertos) return;
    const fechar = (e: MouseEvent) => {
      if (alertasRef.current && !alertasRef.current.contains(e.target as Node)) {
        setAlertasAbertos(false);
      }
    };
    document.addEventListener('mousedown', fechar);
    return () => document.removeEventListener('mousedown', fechar);
  }, [alertasAbertos]);

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

        <h1 className="hidden text-base font-semibold text-slate-800 truncate sm:block sm:text-lg">
          {pageTitle}
        </h1>
      </div>

      {/* ── Centro: pesquisa global (DT01 §7.1) ──────────────────────────── */}
      <div className="mx-4 hidden flex-1 justify-center md:flex">
        <PesquisaGlobal />
      </div>

      {/* ── Lado direito: Centro de Alertas (DT01 §15.4) ─────────────────── */}
      <div ref={alertasRef} className="relative flex items-center">
        <button
          onClick={() => setAlertasAbertos((a) => !a)}
          className="relative p-2 rounded-full text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition-colors"
          title="Alertas"
        >
          <Bell size={20} />
          {!!alertas?.total && (
            <span className="absolute top-1 right-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-rose-500 px-1 text-[10px] font-semibold text-white">
              {alertas.total > 9 ? '9+' : alertas.total}
            </span>
          )}
        </button>

        {alertasAbertos && (
          <div className="absolute right-0 top-full z-50 mt-2 w-80 max-h-96 overflow-y-auto rounded-lg border border-slate-200 bg-white shadow-lg">
            <div className="flex items-center justify-between border-b border-slate-100 px-4 py-2.5">
              <p className="text-sm font-semibold text-slate-800">Alertas</p>
              <span className="text-xs text-slate-400">{alertas?.total ?? 0}</span>
            </div>

            {!alertas?.total ? (
              <p className="px-4 py-6 text-center text-sm text-slate-400">Sem alertas activos.</p>
            ) : (
              alertas.dados.slice(0, 8).map((alerta) => (
                <div key={`${alerta.tipo}-${alerta.entidadeId}`} className="flex items-start gap-2.5 border-b border-slate-50 px-4 py-2.5 last:border-0">
                  <AlertTriangle size={15} className="mt-0.5 shrink-0 text-amber-500" />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-slate-800">{alerta.titulo}</p>
                    <p className="truncate text-xs text-slate-400">
                      {TIPO_ALERTA_LABEL[alerta.tipo]} · há {alerta.diasEmAberto}{' '}
                      {alerta.diasEmAberto === 1 ? 'dia' : 'dias'}
                    </p>
                  </div>
                </div>
              ))
            )}

            <button
              onClick={() => {
                setAlertasAbertos(false);
                navigate('/compras/necessidades/alertas');
              }}
              className="w-full border-t border-slate-100 py-2.5 text-center text-sm font-medium text-blue-600 hover:bg-slate-50"
            >
              Ver todos
            </button>
          </div>
        )}
      </div>
    </header>
  );
}
