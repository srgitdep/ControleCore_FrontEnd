import { useMemo } from 'react';
import { useReactTable, getCoreRowModel, createColumnHelper } from '@tanstack/react-table';
import { ArrowRight, Package } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { ResponsiveTable } from '@/shared/ui';
import { BadgeEstadoTransferencia } from './BadgeEstadoTransferencia';
import type { LinhaTransferencia } from '../types/transferencia.types';

const helper = createColumnHelper<LinhaTransferencia>();

interface TabelaTransferenciasProps {
  linhas: LinhaTransferencia[];
  isLoading: boolean;
  onAprovar: (linha: LinhaTransferencia) => void;
  onRecusar: (linha: LinhaTransferencia) => void;
  onExpedir: (linha: LinhaTransferencia) => void;
  onReceber: (linha: LinhaTransferencia) => void;
  onCancelar: (linha: LinhaTransferencia) => void;
  onVerDetalhe: (id: string) => void;
}

/**
 * A tabela de transferências — DT01 §15.1.
 *
 * A acção principal muda com o estado: solicitada pede decisão, aprovada pede
 * expedição, expedida pede recepção. Nunca mostra duas acções principais ao mesmo
 * tempo — só a que corresponde ao próximo passo do fluxo.
 */
export function TabelaTransferencias({
  linhas,
  isLoading,
  onAprovar,
  onRecusar,
  onExpedir,
  onReceber,
  onCancelar,
  onVerDetalhe,
}: TabelaTransferenciasProps) {
  const { t } = useTranslation('transferencias');
  const colunas = useMemo(
    () => [
      helper.accessor((l) => l.produto.nome, {
        id: 'produto',
        header: t('tabela.produto'),
        cell: (info) => {
          const linha = info.row.original;
          return (
            <button type="button" onClick={() => onVerDetalhe(linha.id)} className="flex items-center gap-2 text-left">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-lg border border-slate-200 bg-slate-50">
                {linha.produto.imagemUrl ? (
                  <img src={linha.produto.imagemUrl} alt="" className="h-full w-full object-cover" />
                ) : (
                  <Package size={16} strokeWidth={1.5} className="text-slate-300" />
                )}
              </div>
              <div>
                <p className="font-medium text-slate-800 hover:underline">{linha.produto.nome}</p>
                <p className="text-xs text-slate-400">{linha.produto.sku ?? '—'}</p>
              </div>
            </button>
          );
        },
      }),
      helper.display({
        id: 'rota',
        header: t('tabela.rota'),
        cell: (info) => {
          const linha = info.row.original;
          return (
            <div className="flex items-center gap-1.5 text-sm text-slate-600">
              <span>{linha.origemLoja.nome}</span>
              <ArrowRight size={14} className="text-slate-300" />
              <span>{linha.destinoLoja.nome}</span>
            </div>
          );
        },
      }),
      helper.accessor('quantidadeSolicitada', {
        header: t('tabela.quantidade'),
        cell: (info) => {
          const linha = info.row.original;
          return (
            <div className="text-sm tabular-nums">
              <span className="font-medium text-slate-800">{linha.quantidadeSolicitada}</span>
              {linha.quantidadeRecebida !== null && linha.quantidadeRecebida !== linha.quantidadeExpedida && (
                <span className="ml-1 text-xs text-amber-600">{t('tabela.recebido', { n: linha.quantidadeRecebida })}</span>
              )}
            </div>
          );
        },
      }),
      helper.accessor('estado', {
        header: t('tabela.estado'),
        cell: (info) => <BadgeEstadoTransferencia estado={info.getValue()} />,
      }),
      helper.accessor('solicitadaPor.name', {
        header: t('tabela.solicitada_por'),
        cell: (info) => <span className="text-sm text-slate-600">{info.getValue()}</span>,
      }),
      helper.display({
        id: 'accao',
        header: t('tabela.accao'),
        cell: (info) => {
          const linha = info.row.original;

          if (linha.estado === 'SOLICITADA') {
            return (
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => onAprovar(linha)}
                  className="rounded-md border border-blue-200 bg-blue-50 px-2.5 py-1 text-xs font-semibold text-blue-700 hover:bg-blue-100"
                >
                  {t('tabela.aprovar')}
                </button>
                <button
                  type="button"
                  onClick={() => onRecusar(linha)}
                  className="rounded-md border border-slate-200 bg-white px-2.5 py-1 text-xs font-semibold text-slate-600 hover:bg-slate-50"
                >
                  {t('tabela.recusar')}
                </button>
              </div>
            );
          }

          if (linha.estado === 'APROVADA') {
            return (
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => onExpedir(linha)}
                  className="rounded-md border border-purple-200 bg-purple-50 px-2.5 py-1 text-xs font-semibold text-purple-700 hover:bg-purple-100"
                >
                  {t('tabela.expedir')}
                </button>
                <button
                  type="button"
                  onClick={() => onCancelar(linha)}
                  className="rounded-md border border-slate-200 bg-white px-2.5 py-1 text-xs font-semibold text-slate-500 hover:bg-slate-50"
                >
                  {t('tabela.cancelar')}
                </button>
              </div>
            );
          }

          if (linha.estado === 'EXPEDIDA') {
            return (
              <button
                type="button"
                onClick={() => onReceber(linha)}
                className="rounded-md border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700 hover:bg-emerald-100"
              >
                {t('tabela.confirmar_recepcao')}
              </button>
            );
          }

          return (
            <button
              type="button"
              onClick={() => onVerDetalhe(linha.id)}
              className="rounded-md border border-slate-200 bg-white px-2.5 py-1 text-xs font-semibold text-slate-600 hover:bg-slate-50"
            >
              {t('tabela.ver')}
            </button>
          );
        },
      }),
    ],
    [t, onAprovar, onRecusar, onExpedir, onReceber, onCancelar, onVerDetalhe],
  );

  const table = useReactTable({
    data: linhas,
    columns: colunas,
    getCoreRowModel: getCoreRowModel(),
    getRowId: (l) => l.id,
  });

  return (
    <ResponsiveTable
      table={table}
      isLoading={isLoading}
      emptyMessage={t('tabela.vazio')}
    />
  );
}
