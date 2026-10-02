import { useMemo } from 'react';
import { useReactTable, getCoreRowModel, createColumnHelper } from '@tanstack/react-table';
import { Package, MoreVertical } from 'lucide-react';
import type { TFunction } from 'i18next';
import { useTranslation } from 'react-i18next';
import { ResponsiveTable } from '@/shared/ui';
import { cn, formatData } from '@/shared/utils';
import { localeIntl } from '@/i18n';
import type { LinhaNecessidade, RecomendacaoNecessidade } from '../types/necessidade.types';

const helper = createColumnHelper<LinhaNecessidade>();

const BADGE_RECOMENDACAO: Record<RecomendacaoNecessidade, string> = {
  COMPRAR: 'bg-amber-100 text-amber-800',
  TRANSFERIR: 'bg-blue-100 text-blue-800',
  AGUARDAR: 'bg-slate-100 text-slate-600',
  NAO_COMPRAR: 'bg-slate-100 text-slate-500',
  STOCK_PARADO: 'bg-purple-100 text-purple-700',
  EXCESSO: 'bg-emerald-100 text-emerald-700',
};

/** O rótulo do botão de acção, coerente com o estado — DT01 10, coluna Acção. */
function rotuloAccao(t: TFunction<'necessidades'>, linha: LinhaNecessidade): string {
  if (linha.estado === 'EM_REQUISICAO') return t('tabela.ver_requisicao');
  if (linha.estado === 'EM_TRANSFERENCIA' || linha.estado === 'AGUARDA_RECEPCAO') return t('tabela.ver');

  switch (linha.recomendacao) {
    case 'COMPRAR':
      return t('tabela.criar');
    case 'TRANSFERIR':
      return t('tabela.criar');
    case 'NAO_COMPRAR':
    case 'STOCK_PARADO':
    case 'EXCESSO':
      return '—';
    default:
      return t('tabela.ver');
  }
}

interface TabelaNecessidadesProps {
  linhas: LinhaNecessidade[];
  isLoading: boolean;
  onAbrirDetalhe: (id: string) => void;
  onCriarRequisicao: (linha: LinhaNecessidade) => void;
}

/**
 * A tabela operacional do DT01 10.
 *
 * ## Não abre o cadastro do produto
 *
 * O DT01 11 é explícito: clicar no produto abre o Detalhe da Necessidade, nunca a edição
 * do cadastro. Por isso a célula do produto chama `onAbrirDetalhe` e não uma rota de
 * edição — a diferença entre um caminho de leitura e um de escrita.
 *
 * ## Uma linha por necessidade, um id por necessidade
 *
 * `getRowId` usa o id da necessidade, não do produto: o mesmo produto pode ter
 * necessidades activas em lojas diferentes, e usar `produtoId` como chave colidiria as
 * duas linhas no React.
 */
export function TabelaNecessidades({
  linhas,
  isLoading,
  onAbrirDetalhe,
  onCriarRequisicao,
}: TabelaNecessidadesProps) {
  const { t } = useTranslation('necessidades');
  const colunas = useMemo(
    () => [
      helper.accessor((linha) => linha.produto.nome, {
        id: 'produto',
        header: t('tabela.produto'),
        cell: (info) => {
          const linha = info.row.original;
          return (
            <button
              type="button"
              onClick={() => onAbrirDetalhe(linha.id)}
              className="flex min-w-0 items-center gap-3 text-left"
            >
              <div className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-lg border border-slate-200 bg-slate-50">
                {linha.produto.imagemUrl ? (
                  <img
                    src={linha.produto.imagemUrl}
                    alt=""
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <Package size={18} strokeWidth={1.5} className="text-slate-300" />
                )}
              </div>
              <div className="min-w-0">
                <p className="truncate font-medium text-slate-800 hover:underline">
                  {linha.produto.nome}
                </p>
                <p className="truncate text-xs text-slate-400">
                  {linha.produto.sku ?? linha.produto.codigoBarras ?? '—'}
                </p>
              </div>
            </button>
          );
        },
      }),
      helper.accessor((linha) => linha.categoria?.nome ?? '—', {
        id: 'categoria',
        header: t('tabela.categoria'),
        cell: (info) => <span className="text-slate-600">{info.getValue()}</span>,
      }),
      helper.accessor((linha) => linha.loja.nome, {
        id: 'loja',
        header: t('tabela.loja'),
        cell: (info) => <span className="text-slate-600">{info.getValue()}</span>,
      }),
      helper.accessor('stockDisponivel', {
        header: t('tabela.stock_disp'),
        cell: (info) => <span className="tabular-nums">{info.getValue()}</span>,
      }),
      helper.accessor('mediaDiaria', {
        header: t('tabela.vendas_dia'),
        cell: (info) => <span className="tabular-nums">{info.getValue()}</span>,
      }),
      helper.accessor('diasCobertura', {
        header: t('tabela.cobertura'),
        cell: (info) => {
          const dias = info.getValue();
          // `null` não é zero: sem vendas na janela não há cobertura a calcular. Mostrar
          // «0 dias» diria que o stock acaba hoje.
          if (dias === null) return <span className="text-slate-400">—</span>;
          return (
            <span
              className={cn(
                'tabular-nums',
                dias <= 2 ? 'font-semibold text-rose-600' : 'text-slate-700',
              )}
            >
              {t('tabela.dias', {
                dias: dias.toLocaleString(localeIntl(), {
                  minimumFractionDigits: 1,
                  maximumFractionDigits: 1,
                }),
              })}
            </span>
          );
        },
      }),
      helper.accessor('quantidadeSugerida', {
        header: t('tabela.necessidade'),
        cell: (info) => {
          const linha = info.row.original;
          if (linha.quantidadeSugerida <= 0) return <span className="text-slate-400">—</span>;
          return <span className="tabular-nums">{t('tabela.unidades', { n: linha.quantidadeSugerida })}</span>;
        },
      }),
      helper.accessor('recomendacao', {
        header: t('tabela.recomendacao'),
        cell: (info) => (
          <span
            className={cn(
              'inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold',
              BADGE_RECOMENDACAO[info.getValue()],
            )}
          >
            {t(`recomendacao.${info.getValue()}`)}
          </span>
        ),
      }),
      helper.accessor('dataPrevistaRuptura', {
        header: t('tabela.data_prevista'),
        cell: (info) => {
          const data = info.getValue();
          if (!data) return <span className="text-slate-400">—</span>;
          return (
            <span className="tabular-nums text-slate-600">
              {formatData(data)}
            </span>
          );
        },
      }),
      helper.display({
        id: 'accao',
        header: t('tabela.accao'),
        cell: (info) => {
          const linha = info.row.original;
          const rotulo = rotuloAccao(t, linha);
          const podeAgir = linha.estado === 'ACTIVA' && ['COMPRAR', 'TRANSFERIR'].includes(linha.recomendacao);
          const podeVer = linha.requisicaoId || linha.estado !== 'ACTIVA';

          return (
            <div className="flex items-center gap-1">
              {podeAgir && (
                <button
                  type="button"
                  onClick={() => onCriarRequisicao(linha)}
                  className="rounded-md border border-slate-200 bg-white px-2.5 py-1 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                >
                  {rotulo}
                </button>
              )}
              {!podeAgir && podeVer && (
                <button
                  type="button"
                  onClick={() => onAbrirDetalhe(linha.id)}
                  className="rounded-md border border-slate-200 bg-white px-2.5 py-1 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                >
                  {rotulo}
                </button>
              )}
              <button
                type="button"
                onClick={() => onAbrirDetalhe(linha.id)}
                aria-label={t('tabela.mais_opcoes')}
                className="rounded-md p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
              >
                <MoreVertical size={16} />
              </button>
            </div>
          );
        },
      }),
    ],
    [t, onAbrirDetalhe, onCriarRequisicao],
  );

  const table = useReactTable({
    data: linhas,
    columns: colunas,
    getCoreRowModel: getCoreRowModel(),
    getRowId: (linha) => linha.id,
  });

  return (
    <ResponsiveTable
      table={table}
      isLoading={isLoading}
      emptyMessage={t('tabela.vazio')}
      getRowStatus={(linha) => (linha.urgencia === 'CRITICA' ? 'critical' : linha.urgencia === 'ALTA' ? 'warning' : 'default')}
    />
  );
}
