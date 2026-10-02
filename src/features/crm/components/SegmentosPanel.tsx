import { useState } from 'react';
import {
  AlertTriangle,
  ChevronLeft,
  ChevronRight,
  Clock,
  Layers,
  RefreshCw,
  Store,
  Target,
  UserCheck,
  Users,
  Wallet,
  X,
} from 'lucide-react';
import {
  useSegmentos,
  useMembrosSegmento,
  useRecalcularSegmentos,
  useCriarAudiencia,
  useAudiencias,
} from '../hooks/useClientes';
import type { DimensaoSegmento, Segmento } from '../api/clientes.api';
import { useTranslation } from 'react-i18next';
import { cn, formatData, formatMoeda } from '@/shared/utils';
import { TableScroll } from '@/shared/ui';

const moeda = (v: number) => formatMoeda(Number(v));

const data = (iso?: string | null) => (iso ? formatData(iso) : '—');

// ──── Dimensões ───────────────────────────────────────────────────────────────

const DIMENSOES = {
  RECORRENCIA: {
    rotulo: 'segmentos.dim_recorrencia',
    icone: Clock,
    descricao: 'segmentos.dim_recorrencia_desc',
  },
  VALOR: { rotulo: 'segmentos.dim_valor', icone: Wallet, descricao: 'segmentos.dim_valor_desc' },
  CANAL: { rotulo: 'segmentos.dim_canal', icone: Store, descricao: 'segmentos.dim_canal_desc' },
  PRODUTO: { rotulo: 'segmentos.dim_produto', icone: Layers, descricao: 'segmentos.dim_produto_desc' },
  LOCALIZACAO: {
    rotulo: 'segmentos.dim_localizacao',
    icone: Store,
    descricao: 'segmentos.dim_localizacao_desc',
  },
  MANUAL: { rotulo: 'segmentos.dim_manual', icone: Target, descricao: 'segmentos.dim_manual_desc' },
} as const satisfies Record<
  DimensaoSegmento,
  { rotulo: string; icone: React.ElementType; descricao: string }
>;

/**
 * Cor por estado, e não por dimensão: o que precisa de atenção deve saltar à
 * vista sem ninguém ter de ler o nome do segmento.
 */
function tomDoSegmento(chave?: string | null): string {
  if (!chave) return 'border-slate-200 bg-white';
  if (chave.includes('em_risco')) return 'border-amber-200 bg-amber-50/60';
  if (chave.includes('inactivo')) return 'border-rose-200 bg-rose-50/60';
  if (chave.includes('activo') || chave.includes('alto')) return 'border-emerald-200 bg-emerald-50/60';
  if (chave.includes('novo')) return 'border-blue-200 bg-blue-50/60';
  return 'border-slate-200 bg-white';
}

function corDoNumero(chave?: string | null): string {
  if (!chave) return 'text-slate-900';
  if (chave.includes('em_risco')) return 'text-amber-700';
  if (chave.includes('inactivo')) return 'text-rose-700';
  if (chave.includes('activo') || chave.includes('alto')) return 'text-emerald-700';
  if (chave.includes('novo')) return 'text-blue-700';
  return 'text-slate-900';
}

// ──── Modal de audiência ──────────────────────────────────────────────────────

function AudienciaModal({
  segmento,
  onClose,
  onGuardar,
  aGuardar,
}: {
  segmento: Segmento;
  onClose: () => void;
  onGuardar: (nome: string) => void;
  aGuardar: boolean;
}) {
  const { t } = useTranslation('crm');
  const hoje = formatData(new Date());
  const [nome, setNome] = useState(`${segmento.nome} — ${hoje}`);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
      <div className="w-full max-w-sm overflow-hidden rounded-2xl bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b border-slate-100 p-5">
          <h2 className="text-lg font-bold text-slate-900">{t('segmentos.fixar_audiencia')}</h2>
          <button onClick={onClose} className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100">
            <X size={18} />
          </button>
        </div>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (nome.trim()) onGuardar(nome.trim());
          }}
          className="space-y-4 p-5"
        >
          <div className="rounded-xl border border-slate-200 bg-slate-50 p-3 text-sm">
            <p className="font-semibold text-slate-900">{segmento.nome}</p>
            <p className="mt-0.5 text-slate-500">
              {segmento.total} {t('segmentos.neste_momento', { count: segmento.total })}
            </p>
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">{t('segmentos.nome')}</label>
            <input
              value={nome}
              onChange={(e) => setNome(e.target.value)}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-900"
            />
            <p className="mt-1.5 text-xs text-slate-400">
              {t('segmentos.fixar_explicacao')}
            </p>
          </div>

          <div className="flex gap-3 pt-1">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 rounded-lg border border-slate-200 px-4 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50"
            >
              {t('comum.cancelar')}
            </button>
            <button
              type="submit"
              disabled={aGuardar || !nome.trim()}
              className="flex-1 rounded-lg bg-slate-900 px-4 py-2.5 text-sm font-medium text-white hover:bg-slate-800 disabled:opacity-50"
            >
              {aGuardar ? t('segmentos.a_fixar') : t('segmentos.fixar')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ──── Painel ──────────────────────────────────────────────────────────────────

export function SegmentosPanel({
  onVerCliente,
}: {
  onVerCliente: (clienteId: string) => void;
}) {
  const { t } = useTranslation('crm');
  const [seleccionado, setSeleccionado] = useState<Segmento | null>(null);
  const [page, setPage] = useState(1);
  const [audienciaPara, setAudienciaPara] = useState<Segmento | null>(null);

  const { data: segmentos, isLoading, isError } = useSegmentos();
  const { data: membros, isLoading: aCarregarMembros } = useMembrosSegmento(
    seleccionado?.id ?? null,
    page,
  );
  const { data: audiencias } = useAudiencias();
  const recalcular = useRecalcularSegmentos();
  const novaAudiencia = useCriarAudiencia();

  const escolher = (s: Segmento) => {
    setSeleccionado(s);
    setPage(1);
  };

  if (isLoading) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-slate-900 border-t-transparent" />
      </div>
    );
  }

  if (isError) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-3 text-slate-400">
        <AlertTriangle size={36} strokeWidth={1} />
        <p className="text-sm">{t('segmentos.erro_carregar')}</p>
      </div>
    );
  }

  const lista = segmentos ?? [];

  // Um segmento por cliente em cada dimensão, por isso o total de uma dimensão é
  // o número de clientes classificados nela.
  const porDimensao = lista.reduce<Record<string, Segmento[]>>((acc, s) => {
    (acc[s.dimensao] ??= []).push(s);
    return acc;
  }, {});

  const ultimoCalculo = lista.reduce<string | null>(
    (maior, s) => (s.ultimoCalculo && (!maior || s.ultimoCalculo > maior) ? s.ultimoCalculo : maior),
    null,
  );

  if (lista.length === 0) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-4 p-6 text-center">
        <Users size={40} strokeWidth={1} className="text-slate-300" />
        <div>
          <p className="font-medium text-slate-600">{t('segmentos.vazio_titulo')}</p>
          <p className="mx-auto mt-1 max-w-md text-sm text-slate-400">
            {t('segmentos.vazio_explicacao')}
          </p>
        </div>
        <button
          onClick={() => recalcular.mutate()}
          disabled={recalcular.isPending}
          className="flex items-center gap-2 rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white hover:bg-slate-800 disabled:opacity-50"
        >
          <RefreshCw size={15} className={cn(recalcular.isPending && 'animate-spin')} />
          {recalcular.isPending ? t('segmentos.a_calcular') : t('segmentos.calcular_agora')}
        </button>
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col">
      <div className="custom-scrollbar flex-1 space-y-6 overflow-y-auto p-5">
        {/* Cabeçalho */}
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="text-sm text-slate-500">
              {t('segmentos.classificacao_noites')}
            </p>
            {ultimoCalculo && (
              <p className="mt-0.5 text-xs text-slate-400">{t('segmentos.ultimo_calculo', { data: data(ultimoCalculo) })}</p>
            )}
          </div>
          <button
            onClick={() => recalcular.mutate()}
            disabled={recalcular.isPending}
            className="flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50"
          >
            <RefreshCw size={14} className={cn(recalcular.isPending && 'animate-spin')} />
            {recalcular.isPending ? t('segmentos.a_calcular') : t('segmentos.recalcular')}
          </button>
        </div>

        {/* Segmentos por dimensão */}
        {Object.entries(porDimensao).map(([dimensao, segs]) => {
          const info = DIMENSOES[dimensao as DimensaoSegmento];
          const Icone = info?.icone ?? Layers;

          return (
            <section key={dimensao}>
              <div className="mb-3 flex items-baseline gap-2">
                <Icone size={15} className="translate-y-0.5 text-slate-400" />
                <h3 className="text-sm font-semibold text-slate-700">
                  {info ? t(info.rotulo) : dimensao}
                </h3>
                <span className="text-xs text-slate-400">{info ? t(info.descricao) : null}</span>
              </div>

              <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
                {segs.map((s) => {
                  const activo = seleccionado?.id === s.id;

                  return (
                    <button
                      key={s.id}
                      onClick={() => escolher(s)}
                      className={cn(
                        'rounded-xl border p-4 text-left transition-colors',
                        tomDoSegmento(s.chave),
                        activo ? 'ring-2 ring-slate-900 ring-offset-1' : 'hover:border-slate-300',
                      )}
                    >
                      <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                        {s.nome}
                      </p>
                      <p className={cn('mt-1 text-2xl font-bold tabular-nums', corDoNumero(s.chave))}>
                        {s.total}
                      </p>
                      <p className="text-xs text-slate-400">
                        {t('segmentos.cliente', { count: s.total })}
                      </p>
                    </button>
                  );
                })}
              </div>
            </section>
          );
        })}

        {/* Membros do segmento escolhido */}
        {seleccionado && (
          <section>
            <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
              <h3 className="text-sm font-semibold text-slate-700">
                {seleccionado.nome}
                <span className="ml-2 font-normal text-slate-400">
                  {t('segmentos.n_clientes', { n: membros?.total ?? seleccionado.total })}
                </span>
              </h3>
              <div className="flex gap-2">
                <button
                  onClick={() => setAudienciaPara(seleccionado)}
                  className="flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-50"
                >
                  <Target size={13} /> {t('segmentos.fixar_audiencia')}
                </button>
                <button
                  onClick={() => setSeleccionado(null)}
                  className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100"
                  aria-label={t('segmentos.fechar_lista')}
                >
                  <X size={15} />
                </button>
              </div>
            </div>

            {aCarregarMembros && !membros ? (
              <div className="flex h-24 items-center justify-center">
                <div className="h-6 w-6 animate-spin rounded-full border-2 border-slate-900 border-t-transparent" />
              </div>
            ) : membros && membros.data.length > 0 ? (
              <>
                <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
                  <TableScroll>
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-slate-100 bg-slate-50">
                          {[
                            t('segmentos.col_cliente'),
                            t('segmentos.col_contacto'),
                            t('segmentos.col_total_gasto'),
                            t('segmentos.col_ultima_compra'),
                            t('segmentos.col_desde'),
                          ].map(
                            (h) => (
                              <th
                                key={h}
                                className="px-4 py-2.5 text-left text-[11px] font-semibold uppercase tracking-wider text-slate-500"
                              >
                                {h}
                              </th>
                            ),
                          )}
                        </tr>
                      </thead>
                      <tbody>
                        {membros.data.map((m) => (
                          <tr
                            key={m.id}
                            onClick={() => onVerCliente(m.id)}
                            className="cursor-pointer border-b border-slate-50 transition-colors last:border-0 hover:bg-slate-50"
                          >
                            <td className="px-4 py-2.5 font-semibold text-slate-900">{m.nome}</td>
                            <td className="px-4 py-2.5 text-slate-500">
                              {m.telefone || m.email || '—'}
                            </td>
                            <td className="px-4 py-2.5 font-semibold tabular-nums text-slate-900">
                              {moeda(m.totalGasto)}
                            </td>
                            <td className="px-4 py-2.5 text-xs text-slate-400">
                              {data(m.dataUltimaCompra)}
                            </td>
                            <td className="px-4 py-2.5 text-xs text-slate-400">{data(m.desde)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </TableScroll>
                </div>

                {membros.lastPage > 1 && (
                  <div className="mt-3 flex items-center justify-between">
                    <p className="text-sm text-slate-500">
                      {t('segmentos.pagina', { page: membros.page, lastPage: membros.lastPage })}
                    </p>
                    <div className="flex gap-2">
                      <button
                        onClick={() => setPage((p) => Math.max(1, p - 1))}
                        disabled={page === 1}
                        className="rounded-lg border border-slate-200 p-2 text-slate-600 hover:bg-slate-50 disabled:opacity-40"
                      >
                        <ChevronLeft size={16} />
                      </button>
                      <button
                        onClick={() => setPage((p) => Math.min(membros.lastPage, p + 1))}
                        disabled={page === membros.lastPage}
                        className="rounded-lg border border-slate-200 p-2 text-slate-600 hover:bg-slate-50 disabled:opacity-40"
                      >
                        <ChevronRight size={16} />
                      </button>
                    </div>
                  </div>
                )}
              </>
            ) : (
              <div className="rounded-xl border border-slate-200 bg-slate-50 py-6 text-center text-sm text-slate-400">
                {t('segmentos.sem_clientes')}
              </div>
            )}
          </section>
        )}

        {/* Audiências fixadas */}
        {audiencias && audiencias.length > 0 && (
          <section>
            <div className="mb-3 flex items-baseline gap-2">
              <UserCheck size={15} className="translate-y-0.5 text-slate-400" />
              <h3 className="text-sm font-semibold text-slate-700">{t('segmentos.audiencias_fixadas')}</h3>
              <span className="text-xs text-slate-400">
                {t('segmentos.audiencias_explicacao')}
              </span>
            </div>

            <div className="space-y-2">
              {audiencias.map((a) => (
                <div
                  key={a.id}
                  className="flex items-center justify-between gap-3 rounded-xl border border-slate-200 bg-white px-4 py-3"
                >
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-slate-900">{a.nome}</p>
                    <p className="text-xs text-slate-400">
                      {a.segment?.nome ?? t('segmentos.segmento_removido')} · {t('segmentos.fixada_em', { data: data(a.createdAt) })}
                    </p>
                  </div>
                  <span className="shrink-0 rounded-lg bg-slate-100 px-2.5 py-1 text-sm font-semibold tabular-nums text-slate-700">
                    {a.total}
                  </span>
                </div>
              ))}
            </div>
          </section>
        )}
      </div>

      {audienciaPara && (
        <AudienciaModal
          segmento={audienciaPara}
          aGuardar={novaAudiencia.isPending}
          onClose={() => setAudienciaPara(null)}
          onGuardar={(nome) =>
            novaAudiencia.mutate(
              { segmentId: audienciaPara.id, nome },
              { onSuccess: () => setAudienciaPara(null) },
            )
          }
        />
      )}
    </div>
  );
}
