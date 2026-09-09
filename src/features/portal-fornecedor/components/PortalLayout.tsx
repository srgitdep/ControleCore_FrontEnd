import { useEffect } from 'react';
import { Navigate, NavLink, Outlet, useLocation } from 'react-router-dom';
import {
  AlertTriangle,
  CheckCircle2,
  FileText,
  Loader2,
  LogOut,
  MapPin,
  Package,
  Store,
} from 'lucide-react';
import { usePortalStore } from '../store/usePortalStore';
import { cn } from '@/shared/utils';

/**
 * O layout do portal do fornecedor.
 *
 * ## Porque não é o `AppLayout`
 *
 * `AppLayout` monta o `Sidebar`, o `Header` e o widget da Mayra. Os três leem
 * `useAuthStore` — o `Sidebar` desenha o menu a partir do `role`, o `Header` traduz o
 * caminho em títulos do ControlCore, e a Mayra abre uma sessão de copiloto ligada a uma
 * empresa.
 *
 * Um fornecedor não tem `role` nem empresa. Reutilizar o layout daria um menu vazio, um
 * título errado e um copiloto sem contexto — três sintomas do mesmo erro de raiz, que é
 * tratar um fornecedor como um utilizador do ControlCore.
 *
 * ## Três entradas e não mais
 *
 * Vitrine, documentos, zonas. É tudo o que o fornecedor pode fazer hoje, e a barra reflecte
 * isso em vez de prometer separadores que não existem.
 */
export function PortalLayout() {
  const { fornecedor, autenticado, aCarregar, carregar, sair, conformidade } = usePortalStore();
  const localizacao = useLocation();

  // Confirma a sessão contra o servidor a cada montagem do layout.
  //
  // O estado inicial vem do `sessionStorage` e é um palpite optimista — ver a nota do store.
  // Sem esta confirmação, um cookie expirado deixaria o portal a desenhar-se normalmente e
  // cada acção falharia com 401, uma a uma.
  useEffect(() => {
    if (autenticado) void carregar();
    // Só à montagem: `carregar` em cada navegação seria um pedido por clique no menu.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (aCarregar) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50">
        <Loader2 size={22} className="animate-spin text-slate-400" />
      </div>
    );
  }

  if (!autenticado || !fornecedor) {
    // `state` leva o destino, para o login poder devolver o utilizador ao sítio onde ia em
    // vez de o largar sempre na vitrine.
    return <Navigate to="/fornecedor/entrar" state={{ de: localizacao.pathname }} replace />;
  }

  const ABAS = [
    { para: '/fornecedor', etiqueta: 'Vitrine', icone: Package, fim: true },
    { para: '/fornecedor/documentos', etiqueta: 'Documentos', icone: FileText },
    { para: '/fornecedor/zonas', etiqueta: 'Zonas de entrega', icone: MapPin },
  ];

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3 px-4 py-3">
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-600">
              <Store size={16} className="text-white" />
            </div>
            <div>
              <p className="text-sm font-semibold leading-tight text-slate-900">
                Portal do Fornecedor
              </p>
              <p className="text-xs leading-tight text-slate-500">{fornecedor.nome}</p>
            </div>
          </div>

          <button
            onClick={() => void sair()}
            className="inline-flex items-center gap-1.5 rounded-md border border-slate-300 px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50"
          >
            <LogOut size={13} />
            Sair
          </button>
        </div>

        <nav className="mx-auto flex max-w-6xl gap-1 overflow-x-auto px-4">
          {ABAS.map((aba) => (
            <NavLink
              key={aba.para}
              to={aba.para}
              end={aba.fim}
              className={({ isActive }) =>
                cn(
                  'flex shrink-0 items-center gap-1.5 border-b-2 px-3 py-2.5 text-sm font-medium transition-colors',
                  isActive
                    ? 'border-blue-600 text-blue-700'
                    : 'border-transparent text-slate-500 hover:text-slate-700',
                )
              }
            >
              <aba.icone size={14} />
              {aba.etiqueta}
            </NavLink>
          ))}
        </nav>
      </header>

      <main className="mx-auto max-w-6xl px-4 py-5">
        {conformidade && <PainelConformidade conformidade={conformidade} />}
        <Outlet />
      </main>
    </div>
  );
}

/**
 * O que falta ao fornecedor para poder receber ordens.
 *
 * ## Está no topo de todas as páginas, e é deliberado
 *
 * Um fornecedor que publique a vitrine e fique à espera sem saber que o alvará não foi
 * entregue é um fornecedor perdido entre o registo e a primeira venda. O painel é a única
 * coisa do portal que aparece em todos os ecrãs.
 *
 * ## Bloqueantes e recomendáveis, separados
 *
 * Alvará, quitação fiscal e conta bancária **excluem** das comparações. INSS e seguro apenas
 * descontam na pontuação. Mostrar as cinco faltas com o mesmo peso faria o fornecedor tratar
 * as urgentes como as opcionais — e a diferença entre as duas é estar ou não no mercado.
 */
function PainelConformidade({
  conformidade,
}: {
  conformidade: NonNullable<ReturnType<typeof usePortalStore.getState>['conformidade']>;
}) {
  const bloqueantes = conformidade.faltas.filter((f) => f.bloqueante);
  const recomendaveis = conformidade.faltas.filter((f) => !f.bloqueante);

  if (conformidade.conforme && recomendaveis.length === 0) {
    return (
      <div className="mb-5 flex items-center gap-2 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3">
        <CheckCircle2 size={16} className="shrink-0 text-emerald-600" />
        <p className="text-sm text-emerald-900">
          Documentação completa. A sua vitrine entra em todas as comparações.
        </p>
      </div>
    );
  }

  return (
    <div
      className={cn(
        'mb-5 rounded-lg border px-4 py-3',
        bloqueantes.length > 0
          ? 'border-amber-300 bg-amber-50'
          : 'border-slate-200 bg-slate-50',
      )}
    >
      <div className="flex items-start gap-2">
        {bloqueantes.length > 0 ? (
          <AlertTriangle size={16} className="mt-0.5 shrink-0 text-amber-600" />
        ) : (
          <CheckCircle2 size={16} className="mt-0.5 shrink-0 text-emerald-600" />
        )}

        <div className="min-w-0 flex-1">
          <p
            className={cn(
              'text-sm font-medium',
              bloqueantes.length > 0 ? 'text-amber-900' : 'text-slate-800',
            )}
          >
            {bloqueantes.length > 0
              ? 'A sua vitrine ainda não entra nas comparações'
              : 'Habilitado a receber ordens de compra'}
          </p>

          {bloqueantes.length > 0 && (
            <ul className="mt-1.5 space-y-1">
              {bloqueantes.map((falta, i) => (
                <li key={i} className="flex gap-1.5 text-xs leading-snug text-amber-800">
                  <span className="select-none">•</span>
                  {falta.mensagem}
                </li>
              ))}
            </ul>
          )}

          {recomendaveis.length > 0 && (
            <p className="mt-1.5 text-xs leading-snug text-slate-500">
              {bloqueantes.length > 0 ? 'Também em falta, ' : 'Em falta, '}
              sem impedir a compra — melhoram a sua pontuação:{' '}
              {recomendaveis.map((f) => f.mensagem.replace(/ não foi entregue\.$/, '')).join(', ')}.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
