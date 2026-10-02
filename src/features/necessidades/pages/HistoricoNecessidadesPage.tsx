import { useState } from 'react';
import { useMemo } from 'react';
import { useReactTable, getCoreRowModel, createColumnHelper } from '@tanstack/react-table';
import { useTranslation } from 'react-i18next';
import { BarraDaPagina, ResponsiveTable } from '@/shared/ui';
import { formatDataHora } from '@/shared/utils';
import { useHistoricoNecessidades } from '../hooks/useNecessidades';
import type { LinhaHistoricoNecessidade } from '../types/necessidade.types';

const helper = createColumnHelper<LinhaHistoricoNecessidade>();

/**
 * O Histórico de Necessidades — DT01 §15.3.
 *
 * "Mostrar quando a necessidade surgiu, recomendações, decisões, quantidades,
 * transferência/compra realizada e resultado." O detalhe de uma necessidade (§11) já
 * mostra isto para uma necessidade específica; esta página atravessa todas —
 * incluindo as já resolvidas ou ignoradas, que a fila operacional não mostra mais.
 */
export function HistoricoNecessidadesPage() {
  const { t } = useTranslation('necessidades');
  const [page, setPage] = useState(1);
  const { data, isLoading } = useHistoricoNecessidades({ page, limit: 20 });

  const colunas = useMemo(
    () => [
      helper.accessor('createdAt', {
        header: t('historico.quando'),
        cell: (info) => (
          <span className="whitespace-nowrap text-sm text-slate-600">
            {formatDataHora(info.getValue())}
          </span>
        ),
      }),
      helper.accessor((l) => l.produto.nome, {
        id: 'produto',
        header: t('historico.produto'),
        cell: (info) => (
          <div>
            <p className="font-medium text-slate-800">{info.getValue()}</p>
            <p className="text-xs text-slate-400">{info.row.original.loja.nome}</p>
          </div>
        ),
      }),
      helper.accessor('accao', {
        header: t('historico.o_que_aconteceu'),
        cell: (info) => {
          const l = info.row.original;
          return (
            <div>
              <p className="text-sm text-slate-700">{info.getValue()}</p>
              {l.observacoes && <p className="text-xs text-slate-400">{l.observacoes}</p>}
            </div>
          );
        },
      }),
      helper.accessor('recomendacaoNova', {
        header: t('historico.recomendacao'),
        cell: (info) => {
          const anterior = info.row.original.recomendacaoAnterior;
          const nova = info.getValue();
          if (!nova) return <span className="text-slate-400">—</span>;
          return (
            <span className="text-sm text-slate-600">
              {anterior && anterior !== nova ? `${anterior} → ${nova}` : nova}
            </span>
          );
        },
      }),
      helper.accessor('quantidadeSugerida', {
        header: t('historico.quantidade'),
        cell: (info) => {
          const v = info.getValue();
          return <span className="tabular-nums text-sm">{v === null ? '—' : v}</span>;
        },
      }),
      helper.accessor('utilizador', {
        header: t('historico.quem'),
        cell: (info) => (
          <span className="text-sm text-slate-600">{info.getValue() ?? t('historico.sistema')}</span>
        ),
      }),
    ],
    [t],
  );

  const table = useReactTable({
    data: data?.dados ?? [],
    columns: colunas,
    getCoreRowModel: getCoreRowModel(),
    getRowId: (l) => l.id,
  });

  const totalPaginas = data ? Math.max(Math.ceil(data.total / data.limit), 1) : 1;

  return (
    <div className="space-y-6 p-4 sm:p-6">
      <BarraDaPagina resumo={data ? t('historico.resumo', { count: data.total }) : undefined} />

      <div className="rounded-xl border border-slate-200 bg-white">
        <ResponsiveTable
          table={table}
          isLoading={isLoading}
          emptyMessage={t('historico.vazio')}
        />

        {data && data.total > 0 && (
          <div className="flex items-center justify-between border-t border-slate-100 px-4 py-3 text-sm text-slate-500">
            <span>{t('comum.a_mostrar', { n: data.dados.length, total: data.total })}</span>
            <div className="flex items-center gap-1">
              <button disabled={page <= 1} onClick={() => setPage((p) => Math.max(p - 1, 1))} className="rounded-md px-2 py-1 disabled:opacity-30">‹</button>
              <span className="tabular-nums">{page} / {totalPaginas}</span>
              <button disabled={page >= totalPaginas} onClick={() => setPage((p) => Math.min(p + 1, totalPaginas))} className="rounded-md px-2 py-1 disabled:opacity-30">›</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
