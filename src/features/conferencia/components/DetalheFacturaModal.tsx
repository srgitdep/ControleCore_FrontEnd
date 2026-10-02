import { useQuery } from '@tanstack/react-query';
import { X, FileText, Loader2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { formatData, formatMoeda } from '@/shared/utils';
import { conferenciaApi } from '../api/conferencia.api';

interface Props {
  facturaId: string;
  onClose: () => void;
}

/**
 * As linhas de uma factura — o que a listagem não traz.
 *
 * `listarFacturas` devolve só o resumo (fornecedor e o resultado da conferência); as linhas
 * — descrição, quantidade, preço, IVA — só vêm no detalhe. Sem este ecrã não havia forma de
 * ver o que foi facturado item a item, só o total.
 */
export function DetalheFacturaModal({ facturaId, onClose }: Props) {
  const { t } = useTranslation('conferencia');
  const { data: factura, isLoading } = useQuery({
    queryKey: ['factura', facturaId],
    queryFn: () => conferenciaApi.obterFactura(facturaId),
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4">
      <div className="max-h-[85vh] w-full max-w-2xl overflow-y-auto rounded-xl bg-white shadow-xl">
        <header className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
          <h2 className="flex items-center gap-2 text-base font-semibold text-slate-900">
            <FileText size={16} className="text-slate-400" />
            {factura ? t('comum.factura_numero', { numero: factura.numero }) : t('comum.factura')}
          </h2>
          <button onClick={onClose} className="p-1 text-slate-400 hover:text-slate-600">
            <X size={18} />
          </button>
        </header>

        {isLoading || !factura ? (
          <div className="flex items-center justify-center gap-2 py-16 text-sm text-slate-500">
            <Loader2 className="h-4 w-4 animate-spin" />
            {t('detalhe.a_carregar')}
          </div>
        ) : (
          <div className="space-y-4 px-5 py-4">
            <dl className="grid grid-cols-2 gap-x-4 gap-y-3 rounded-lg bg-slate-50 p-4 text-sm sm:grid-cols-3">
              <div>
                <dt className="text-xs text-slate-500">{t('comum.fornecedor')}</dt>
                <dd className="font-medium text-slate-900">{factura.fornecedor?.nome ?? '—'}</dd>
              </div>
              <div>
                <dt className="text-xs text-slate-500">{t('comum.emissao')}</dt>
                <dd className="text-slate-700">
                  {formatData(factura.dataEmissao)}
                </dd>
              </div>
              {factura.dataVencimento && (
                <div>
                  <dt className="text-xs text-slate-500">{t('detalhe.vencimento')}</dt>
                  <dd className="text-slate-700">
                    {formatData(factura.dataVencimento)}
                  </dd>
                </div>
              )}
            </dl>

            <div>
              <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
                {t('comum.linhas')}
              </h3>
              {!factura.linhas || factura.linhas.length === 0 ? (
                <p className="text-sm text-slate-500">{t('detalhe.sem_linhas')}</p>
              ) : (
                <div className="overflow-hidden rounded-lg border border-slate-200">
                  <table className="w-full text-sm">
                    <thead className="bg-slate-50 text-left text-xs uppercase tracking-wide text-slate-500">
                      <tr>
                        <th className="px-3 py-2 font-medium">{t('detalhe.col_descricao')}</th>
                        <th className="px-3 py-2 text-right font-medium">{t('detalhe.col_qtd')}</th>
                        <th className="px-3 py-2 text-right font-medium">{t('detalhe.col_preco')}</th>
                        <th className="px-3 py-2 text-right font-medium">{t('detalhe.col_iva')}</th>
                        <th className="px-3 py-2 text-right font-medium">{t('detalhe.col_total')}</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {factura.linhas.map((l) => (
                        <tr key={l.id}>
                          <td className="px-3 py-2 text-slate-800">{l.descricao}</td>
                          <td className="px-3 py-2 text-right text-slate-600">{l.quantidade}</td>
                          <td className="px-3 py-2 text-right text-slate-600">
                            {formatMoeda(l.precoUnitario)}
                          </td>
                          <td className="px-3 py-2 text-right text-slate-600">{l.taxaIva}</td>
                          <td className="px-3 py-2 text-right font-medium text-slate-900">
                            {formatMoeda(l.quantidade * l.precoUnitario - l.desconto)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            <dl className="grid grid-cols-3 gap-3 text-sm">
              <div className="rounded-lg border border-slate-200 p-3">
                <dt className="text-xs text-slate-500">{t('comum.imposto')}</dt>
                <dd className="font-medium text-slate-800">{formatMoeda(factura.totalImposto)}</dd>
              </div>
              <div className="rounded-lg border border-slate-200 p-3">
                <dt className="text-xs text-slate-500">{t('comum.frete')}</dt>
                <dd className="font-medium text-slate-800">{formatMoeda(factura.frete)}</dd>
              </div>
              <div className="rounded-lg border border-slate-900 bg-slate-900 p-3">
                <dt className="text-xs text-slate-300">{t('comum.total_declarado')}</dt>
                <dd className="font-medium text-white">{formatMoeda(factura.totalDeclarado)}</dd>
              </div>
            </dl>

            {factura.observacoes && (
              <div>
                <h3 className="mb-1 text-xs font-semibold uppercase tracking-wide text-slate-500">
                  {t('comum.observacoes')}
                </h3>
                <p className="text-sm text-slate-700">{factura.observacoes}</p>
              </div>
            )}
          </div>
        )}

        <div className="flex justify-end border-t border-slate-100 px-5 py-4">
          <button
            onClick={onClose}
            className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-700"
          >
            {t('comum.fechar')}
          </button>
        </div>
      </div>
    </div>
  );
}
