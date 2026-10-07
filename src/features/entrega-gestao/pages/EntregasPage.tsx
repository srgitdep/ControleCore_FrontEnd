import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { AlertTriangle, Loader2, PackageOpen, RefreshCw, Truck } from 'lucide-react';
import { cn } from '@/shared/utils';
import { useConfiguracaoEntrega } from '../hooks/useEntregaGestao';
import {
  useAtribuirEntrega,
  useDevolverEntrega,
  useEntregarEntrega,
  useEntregas,
  useEstafetas,
  useFalharEntrega,
  useIniciarRotaEntrega,
  useRecolherEntrega,
} from '../hooks/useOperacao';
import { AtribuirDialog, DevolverDialog, EntregarDialog, FalharDialog } from '../components/DialogosEntrega';
import { CartaoEntrega } from '../components/CartaoEntrega';
import type { AccaoEntrega } from '../components/CartaoEntrega';
import type { EntregaPainel, EstadoEntrega } from '../types/operacao';

/** As colunas do painel, por ordem do percurso. As entregues e devolvidas só entram com «fechadas». */
const COLUNAS: EstadoEntrega[] = ['AGUARDA_RECOLHA', 'ATRIBUIDA', 'RECOLHIDA', 'EM_ROTA', 'FALHADA'];
const COLUNAS_FECHADAS: EstadoEntrega[] = ['ENTREGUE', 'DEVOLVIDA'];

const COR_COLUNA: Partial<Record<EstadoEntrega, string>> = {
  AGUARDA_RECOLHA: 'border-t-amber-400',
  ATRIBUIDA: 'border-t-blue-400',
  RECOLHIDA: 'border-t-indigo-400',
  EM_ROTA: 'border-t-sky-500',
  FALHADA: 'border-t-rose-500',
  ENTREGUE: 'border-t-emerald-500',
  DEVOLVIDA: 'border-t-slate-400',
};

/**
 * O painel de entregas (US-07): o que está na rua e em que fase, com as acções de cada fase.
 *
 * Opera-se à mão — o gestor marca a recolha, a rota, a entrega ou a falha. A aplicação do
 * estafeta (Fase 4) fará as mesmas transições pelo servidor; o painel limita-se a mostrá-las.
 */
export function EntregasPage() {
  const { t } = useTranslation('entrega');
  const [lojaId, setLojaId] = useState('');
  const [estafetaId, setEstafetaId] = useState('');
  const [fechadas, setFechadas] = useState(false);

  const configuracao = useConfiguracaoEntrega();
  const estafetas = useEstafetas();
  const entregas = useEntregas({
    ...(lojaId ? { lojaId } : {}),
    ...(estafetaId ? { estafetaId } : {}),
    ...(fechadas ? { fechadas: true } : {}),
  });

  const atribuir = useAtribuirEntrega();
  const recolher = useRecolherEntrega();
  const iniciarRota = useIniciarRotaEntrega();
  const entregar = useEntregarEntrega();
  const falhar = useFalharEntrega();
  const devolver = useDevolverEntrega();

  // O diálogo aberto: qual a acção e sobre que entrega.
  const [dialogo, setDialogo] = useState<{ accao: AccaoEntrega; entrega: EntregaPainel } | null>(null);
  const fechar = () => setDialogo(null);

  const escolher = (accao: AccaoEntrega, entrega: EntregaPainel) => {
    // Recolher e iniciar rota não precisam de dados: fazem-se logo, sem diálogo.
    if (accao === 'recolher') return recolher.mutate(entrega.id);
    if (accao === 'iniciar_rota') return iniciarRota.mutate(entrega.id);
    setDialogo({ accao, entrega });
  };

  const colunas = fechadas ? [...COLUNAS, ...COLUNAS_FECHADAS] : COLUNAS;
  const lista = entregas.data?.data ?? [];
  const porEstado = (estado: EstadoEntrega) => lista.filter((e) => e.estado === estado);
  const lojas = configuracao.data?.lojas ?? [];
  const nadaEmCurso = !entregas.isLoading && !entregas.isError && lista.length === 0;

  return (
    <div className="mx-auto max-w-[1400px] space-y-5 p-4 sm:p-6">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-600 text-white">
            <Truck size={20} />
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-900">{t('painel.titulo')}</h1>
            <p className="text-sm text-slate-500">{t('painel.subtitulo')}</p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <select
            value={lojaId}
            onChange={(e) => setLojaId(e.target.value)}
            aria-label={t('painel.filtro_loja')}
            className="rounded-lg border border-slate-300 px-3 py-2 text-sm"
          >
            <option value="">{t('painel.todas_lojas')}</option>
            {lojas.map((l) => (
              <option key={l.id} value={l.id}>
                {l.nome}
              </option>
            ))}
          </select>
          <select
            value={estafetaId}
            onChange={(e) => setEstafetaId(e.target.value)}
            aria-label={t('painel.filtro_estafeta')}
            className="rounded-lg border border-slate-300 px-3 py-2 text-sm"
          >
            <option value="">{t('painel.todos_estafetas')}</option>
            {(estafetas.data ?? []).map((e) => (
              <option key={e.id} value={e.id}>
                {e.nome}
              </option>
            ))}
          </select>
          <label className="inline-flex items-center gap-2 text-sm text-slate-600">
            <input type="checkbox" checked={fechadas} onChange={(e) => setFechadas(e.target.checked)} className="h-4 w-4 rounded border-slate-300" />
            {t('painel.mostrar_fechadas')}
          </label>
          <button
            type="button"
            onClick={() => void entregas.refetch()}
            disabled={entregas.isFetching}
            aria-label={t('painel.actualizar')}
            className="rounded-lg border border-slate-300 p-2 text-slate-600 hover:bg-slate-50 disabled:opacity-50"
          >
            <RefreshCw size={16} className={cn(entregas.isFetching && 'animate-spin')} />
          </button>
        </div>
      </header>

      {entregas.isLoading ? (
        <div className="flex min-h-[30vh] items-center justify-center">
          <Loader2 size={22} className="animate-spin text-slate-400" />
        </div>
      ) : entregas.isError ? (
        <div className="flex flex-wrap items-center gap-3 rounded-xl bg-red-50 p-4 text-sm text-red-700">
          <AlertTriangle size={16} />
          {t('painel.erro')}
          <button type="button" onClick={() => void entregas.refetch()} className="font-semibold underline">
            {t('painel.repetir')}
          </button>
        </div>
      ) : nadaEmCurso ? (
        <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-10 text-center">
          <PackageOpen size={32} className="mx-auto text-slate-300" />
          <p className="mt-3 text-sm text-slate-500">{t('painel.vazio')}</p>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
          {colunas.map((estado) => {
            const cartoes = porEstado(estado);
            return (
              <section key={estado} className={cn('rounded-xl border border-slate-200 border-t-4 bg-slate-50 p-3', COR_COLUNA[estado])}>
                <h2 className="mb-3 flex items-center justify-between text-xs font-bold uppercase tracking-wide text-slate-500">
                  {t(`estado_entrega.${estado}`)}
                  <span className="rounded-full bg-white px-2 py-0.5 text-slate-600">{cartoes.length}</span>
                </h2>
                {cartoes.length === 0 ? (
                  <p className="py-4 text-center text-xs text-slate-300">{t('painel.coluna_vazia')}</p>
                ) : (
                  <ul className="space-y-2.5">
                    {cartoes.map((entrega) => (
                      <CartaoEntrega key={entrega.id} entrega={entrega} aoEscolher={escolher} />
                    ))}
                  </ul>
                )}
              </section>
            );
          })}
        </div>
      )}

      {dialogo?.accao === 'atribuir' && (
        <AtribuirDialog
          entrega={dialogo.entrega}
          estafetas={estafetas.data ?? []}
          aProcessar={atribuir.isPending}
          aoFechar={fechar}
          aoConfirmar={(estafetaId) => atribuir.mutate({ id: dialogo.entrega.id, estafetaId }, { onSuccess: fechar })}
        />
      )}
      {dialogo?.accao === 'entregar' && (
        <EntregarDialog
          entrega={dialogo.entrega}
          aProcessar={entregar.isPending}
          aoFechar={fechar}
          aoConfirmar={(corpo) => entregar.mutate({ id: dialogo.entrega.id, ...corpo }, { onSuccess: fechar })}
        />
      )}
      {dialogo?.accao === 'falhar' && (
        <FalharDialog
          entrega={dialogo.entrega}
          aProcessar={falhar.isPending}
          aoFechar={fechar}
          aoConfirmar={(corpo) => falhar.mutate({ id: dialogo.entrega.id, ...corpo }, { onSuccess: fechar })}
        />
      )}
      {dialogo?.accao === 'devolver' && (
        <DevolverDialog
          entrega={dialogo.entrega}
          aProcessar={devolver.isPending}
          aoFechar={fechar}
          aoConfirmar={(motivo) => devolver.mutate({ id: dialogo.entrega.id, motivo }, { onSuccess: fechar })}
        />
      )}
    </div>
  );
}
