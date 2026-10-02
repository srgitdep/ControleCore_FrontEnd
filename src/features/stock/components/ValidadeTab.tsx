import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  useReactTable,
  getCoreRowModel,
  createColumnHelper,
} from '@tanstack/react-table';
import { CalendarX2, CalendarClock, CalendarCheck, Info, Lock } from 'lucide-react';
import { ResponsiveTable, KpiCard } from '@/shared/ui';
import { formatData, formatMoeda } from '@/shared/utils';
import { useSaudeResumo, useValidade } from '../hooks/useSaudeStock';
import {
  ESTADO_VALIDADE_META,
  type DiagnosticoLote,
  type EstadoValidade,
} from '../types/saude.types';

const helper = createColumnHelper<DiagnosticoLote>();

/** Da mais urgente para a menos. `SEM_VALIDADE` fica de fora dos filtros rápidos. */
const ESTADOS_ACCIONAVEIS: EstadoValidade[] = ['EXPIRADO', 'EM_RISCO', 'PROXIMO_DA_VALIDADE'];

/** O filtro por omissão: os três estados que exigem acção. */
const FILTRO_PADRAO = ESTADOS_ACCIONAVEIS.join(',');

/**
 * Validades: o que expira, quando, e quanto dinheiro se perde.
 *
 * ## Porque abre filtrado
 *
 * Por omissão mostra apenas os lotes que exigem acção — expirados, em risco e em aviso.
 * Incluir os normais faria a lista crescer com o catálogo em vez de crescer com os problemas,
 * e o ecrã que serve para agir passaria a ser um inventário de lotes.
 *
 * ## Os dias contam-se por dia de calendário
 *
 * «Expira em 0 dias» significa hoje, e o lote ainda é vendável. Só a partir de menos um está
 * expirado. Isto vem decidido do servidor de propósito: contar no cliente faria o estado
 * mudar a meio do turno conforme a hora do relógio do posto.
 */
export function ValidadeTab() {
  const { t } = useTranslation('stock');
  const [estado, setEstado] = useState<string>(FILTRO_PADRAO);
  const [page, setPage] = useState(1);

  const { data, isFetching } = useValidade({ estado, page, limit: 25 });
  const { data: resumoGeral } = useSaudeResumo();

  const alterarEstado = (novo: string) => {
    setEstado(novo);
    setPage(1);
  };

  const colunas = useMemo(
    () => [
      helper.accessor('produtoNome', {
        header: t('validade.produto'),
        cell: (info) => (
          <div className="min-w-0">
            <p className="truncate font-medium text-slate-800">{info.getValue()}</p>
            <span className="mt-0.5 block text-[11px] text-slate-500">
              {t('validade.lote_armazem', {
                codigo: info.row.original.codigo,
                armazem: info.row.original.armazemNome,
              })}
            </span>
          </div>
        ),
      }),
      helper.accessor('estado', {
        header: t('validade.estado'),
        cell: (info) => (
          <div className="flex flex-wrap items-center gap-1.5">
            <span
              className={`inline-block rounded-md border px-1.5 py-0.5 text-[11px] font-medium ${
                ESTADO_VALIDADE_META[info.getValue()].pastilha
              }`}
            >
              {t(`validade_estado.${info.getValue()}`)}
            </span>
            {info.row.original.bloqueado && (
              <span
                className="inline-flex items-center gap-1 rounded-md border border-slate-200 bg-slate-50 px-1.5 py-0.5 text-[11px] font-medium text-slate-600"
                title={t('validade.bloqueado_titulo')}
              >
                <Lock className="h-3 w-3" />
                {t('validade.bloqueado')}
              </span>
            )}
          </div>
        ),
      }),
      helper.accessor('diasParaValidade', {
        header: t('validade.prazo'),
        cell: (info) => {
          const dias = info.getValue();

          if (dias === null) {
            return <span className="text-slate-400">{t('validade.sem_validade')}</span>;
          }
          if (dias < 0) {
            return (
              <span className="font-medium tabular-nums text-rose-600">
                {t('validade.expirado_ha', { count: Math.abs(dias) })}
              </span>
            );
          }
          if (dias === 0) {
            return <span className="font-medium text-orange-600">{t('validade.expira_hoje')}</span>;
          }
          return (
            <span className={`tabular-nums ${dias <= 15 ? 'font-medium text-orange-600' : 'text-slate-700'}`}>
              {t('validade.dias', { n: dias })}
            </span>
          );
        },
      }),
      helper.accessor('dataValidade', {
        header: t('validade.data_validade'),
        cell: (info) => {
          const iso = info.getValue();
          if (!iso) return <span className="text-slate-400">—</span>;
          return (
            <span className="tabular-nums text-slate-700">
              {formatData(iso)}
            </span>
          );
        },
      }),
      helper.accessor('quantidade', {
        header: t('validade.quantidade'),
        cell: (info) => <span className="tabular-nums">{info.getValue()}</span>,
      }),
      helper.accessor('valorEmRisco', {
        header: t('validade.valor_em_risco'),
        cell: (info) => (
          <span className="font-semibold tabular-nums text-slate-800">
            {formatMoeda(info.getValue())}
          </span>
        ),
      }),
    ],
    [t],
  );

  const table = useReactTable({
    data: data?.lotes ?? [],
    columns: colunas,
    getCoreRowModel: getCoreRowModel(),
  });

  const resumo = data?.resumo;
  const totalPaginas = data ? Math.max(Math.ceil(data.paginacao.total / 25), 1) : 1;

  const semRegisto = resumoGeral?.rastreabilidade.produtosComValidadeExigidaSemLote ?? 0;

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <KpiCard
          title={t('validade.kpi_expirado')}
          value={resumo ? formatMoeda(resumo.valorExpirado) : '—'}
          description={
            resumo
              ? t('validade.lotes_em_stock', { count: resumo.porEstado.EXPIRADO.lotes })
              : undefined
          }
          icon={CalendarX2}
          accent="danger"
          onClick={() => alterarEstado('EXPIRADO')}
        />
        <KpiCard
          title={t('validade.kpi_em_risco')}
          value={resumo ? formatMoeda(resumo.porEstado.EM_RISCO.valor) : '—'}
          description={
            resumo ? t('validade.expira_dentro', { n: resumo.opcoes.diasEmRisco }) : undefined
          }
          icon={CalendarClock}
          accent="warning"
          onClick={() => alterarEstado('EM_RISCO')}
        />
        <KpiCard
          title={t('validade.kpi_proximo')}
          value={resumo ? formatMoeda(resumo.porEstado.PROXIMO_DA_VALIDADE.valor) : '—'}
          description={
            resumo
              ? t('validade.lotes_em_aviso', { count: resumo.porEstado.PROXIMO_DA_VALIDADE.lotes })
              : undefined
          }
          icon={CalendarCheck}
          accent="neutral"
          onClick={() => alterarEstado('PROXIMO_DA_VALIDADE')}
        />
      </div>

      {/* O aviso mais importante deste ecrã: só se vigia o que foi registado. */}
      {semRegisto > 0 && (
        <div className="flex flex-wrap items-start gap-3 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3">
          <Info className="mt-0.5 h-4 w-4 flex-shrink-0 text-amber-600" />
          <div className="min-w-0 text-sm text-amber-900">
            <p className="font-medium">
              {t('validade.sem_registo', { count: semRegisto })}
            </p>
            <p className="mt-0.5 text-amber-800">
              {t('validade.sem_registo_detalhe')}
            </p>
          </div>
        </div>
      )}

      {/* ─── Filtros por estado ───────────────────────────────────────────────── */}
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => alterarEstado(FILTRO_PADRAO)}
          className={`rounded-lg border px-3 py-1.5 text-sm font-medium transition-colors ${
            estado === FILTRO_PADRAO
              ? 'border-slate-800 bg-slate-800 text-white'
              : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
          }`}
        >
          {t('validade.filtro_atencao')}
        </button>
        {ESTADOS_ACCIONAVEIS.map((e) => (
          <button
            key={e}
            type="button"
            onClick={() => alterarEstado(e)}
            className={`rounded-lg border px-3 py-1.5 text-sm font-medium transition-colors ${
              estado === e
                ? 'border-slate-800 bg-slate-800 text-white'
                : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
            }`}
          >
            {t(`validade_estado.${e}`)}
          </button>
        ))}
        <button
          type="button"
          onClick={() => alterarEstado('NORMAL,SEM_VALIDADE,PROXIMO_DA_VALIDADE,EM_RISCO,EXPIRADO')}
          className={`rounded-lg border px-3 py-1.5 text-sm font-medium transition-colors ${
            estado.split(',').length === 5
              ? 'border-slate-800 bg-slate-800 text-white'
              : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
          }`}
        >
          {t('validade.filtro_todos')}
        </button>
      </div>

      <div className="overflow-hidden rounded-xl border border-slate-100 bg-white shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 px-4 py-3">
          <h3 className="text-sm font-semibold text-slate-800">
            {t('validade.lotes')}
            {data && (
              <span className="ml-2 font-normal text-slate-400">
                {t('validade.n_lotes', { count: data.paginacao.total })}
              </span>
            )}
          </h3>
          {resumo && (
            <span className="text-xs text-slate-500">
              {t('validade.criterios', {
                risco: resumo.opcoes.diasEmRisco,
                aviso: resumo.opcoes.diasAvisoOmissao,
              })}
            </span>
          )}
        </div>

        <ResponsiveTable
          table={table}
          isLoading={isFetching && !data}
          emptyMessage={t('validade.vazio')}
          getRowStatus={(row) =>
            row.estado === 'EXPIRADO'
              ? 'critical'
              : row.estado === 'EM_RISCO'
                ? 'warning'
                : 'default'
          }
        />

        {data && data.paginacao.total > 25 && (
          <div className="flex items-center justify-between border-t border-slate-100 px-4 py-3 text-sm">
            <span className="text-slate-500">
              {t('validade.pagina', { pagina: page, total: totalPaginas })}
              {data.paginacao.omitidas > 0 && (
                <span className="ml-2 text-slate-400">
                  {t('validade.por_mostrar', { n: data.paginacao.omitidas })}
                </span>
              )}
            </span>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setPage((p) => Math.max(p - 1, 1))}
                disabled={page <= 1}
                className="rounded-lg border border-slate-200 px-3 py-1.5 text-sm font-medium text-slate-700 disabled:opacity-40"
              >
                {t('validade.anterior')}
              </button>
              <button
                type="button"
                onClick={() => setPage((p) => p + 1)}
                disabled={page >= totalPaginas}
                className="rounded-lg border border-slate-200 px-3 py-1.5 text-sm font-medium text-slate-700 disabled:opacity-40"
              >
                {t('validade.seguinte')}
              </button>
            </div>
          </div>
        )}
      </div>

      <p className="px-1 text-xs leading-relaxed text-slate-500">
        {t('validade.nota')}
      </p>
    </div>
  );
}
