import { useEffect, useState } from 'react';
import { X, Check, Ban, Loader2, AlertTriangle, UserCheck } from 'lucide-react';
import toast from 'react-hot-toast';
import { useTranslation } from 'react-i18next';
import { purchasesApi } from '../api/purchases.api';
import type { PurchaseOrder, PurchaseOrderItem } from '../api/purchases.api';
import { formatData, formatMoeda, mensagemDeErro } from '@/shared/utils';

interface Props {
  order: PurchaseOrder;
  /** O utilizador que está a decidir, para avisar da auto-aprovação antes de acontecer. */
  utilizadorId?: string;
  onClose: () => void;
  onSuccess: () => void;
}

/**
 * Aprovar ou rejeitar uma ordem de compra.
 *
 * ## O que este ecrã existe para fazer
 *
 * Antes da governação, qualquer pessoa com acesso a compras criava uma ordem e recebia
 * mercadoria contra ela no minuto seguinte — não por falha do ecrã, mas porque não havia
 * aprovação nenhuma para pedir. Este é o segundo par de olhos.
 *
 * ## O aviso de segregação de funções aparece **antes** de decidir
 *
 * Quando quem aprova é quem criou, a aprovação passa — há estabelecimentos com uma pessoa
 * só, e bloquear levaria a partilha de credenciais. Mas fica marcada, e quem está prestes
 * a fazê-lo deve saber disso antes de carregar no botão, e não descobrir depois num
 * relatório de auditoria.
 */
export function AprovacaoModal({ order, utilizadorId, onClose, onSuccess }: Props) {
  const { t } = useTranslation('compras');
  const [decisao, setDecisao] = useState<'aprovar' | 'rejeitar' | null>(null);
  const [motivo, setMotivo] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  // A listagem não traz `itens` — sem isto, o ecrã mostrava «Linhas: —, Valor: —» mesmo em
  // pedidos com produtos reais, e uma decisão tomada às cegas é pior do que uma atrasada.
  const [itens, setItens] = useState<PurchaseOrderItem[]>(order.itens ?? []);
  const [isLoadingItens, setIsLoadingItens] = useState(!order.itens?.length);

  useEffect(() => {
    if (order.itens?.length) return;

    let activo = true;
    purchasesApi
      .getOrderById(order.id)
      .then((completo) => {
        if (activo) setItens(completo.itens ?? []);
      })
      .catch(() => {
        if (activo) toast.error(t('aprov.erro_linhas'));
      })
      .finally(() => {
        if (activo) setIsLoadingItens(false);
      });

    return () => {
      activo = false;
    };
  }, [order.id, order.itens, t]);

  const total = itens.reduce(
    (soma, i) => soma + i.quantidadePedida * i.custoUnitario - (i.desconto ?? 0),
    0,
  );

  const vaiAutoAprovar =
    !!utilizadorId && order.criadoPor?.id === utilizadorId && decisao === 'aprovar';

  const submeter = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!decisao) return;

    if (decisao === 'rejeitar' && motivo.trim().length < 5) {
      toast.error(t('aprov.erro_motivo'));
      return;
    }

    setIsSaving(true);
    try {
      await purchasesApi.decideApproval(order.id, {
        aprovar: decisao === 'aprovar',
        motivo: motivo.trim() || undefined,
      });

      toast.success(
        decisao === 'aprovar'
          ? t('aprov.toast_aprovada')
          : t('aprov.toast_rejeitada'),
      );
      onSuccess();
      onClose();
    } catch (error: any) {
      // O 403 da segregação de funções traz a regra na mensagem; vale mais mostrá-la
      // do que um «erro ao aprovar» que não diz o que fazer a seguir.
      toast.error(mensagemDeErro(error, t('aprov.erro_decisao')));
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4">
      <div className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-xl bg-white shadow-xl">
        <header className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
          <div>
            <h2 className="text-base font-semibold text-slate-900">{t('aprov.titulo')}</h2>
            <p className="mt-0.5 font-mono text-xs text-slate-500">#{order.id.slice(0, 8)}</p>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-slate-400 hover:text-slate-600"
            aria-label={t('aprov.fechar')}
          >
            <X size={18} />
          </button>
        </header>

        <form onSubmit={submeter} className="space-y-5 px-5 py-4">
          <dl className="grid grid-cols-2 gap-x-4 gap-y-3 rounded-lg bg-slate-50 p-4 text-sm">
            <div>
              <dt className="text-xs text-slate-500">{t('aprov.fornecedor')}</dt>
              <dd className="font-medium text-slate-900">{order.fornecedor?.nome ?? '—'}</dd>
            </div>
            <div>
              <dt className="text-xs text-slate-500">{t('aprov.valor')}</dt>
              <dd className="font-medium text-slate-900">
                {isLoadingItens ? '…' : formatMoeda(total)}
              </dd>
            </div>
            <div>
              <dt className="text-xs text-slate-500">{t('aprov.linhas')}</dt>
              <dd className="text-slate-700">{isLoadingItens ? '…' : itens.length}</dd>
            </div>
            <div>
              <dt className="text-xs text-slate-500">{t('aprov.criada_por')}</dt>
              <dd className="text-slate-700">{order.criadoPor?.name ?? '—'}</dd>
            </div>
            {order.submetidaPor && (
              <div className="col-span-2">
                <dt className="text-xs text-slate-500">{t('aprov.submetida_por')}</dt>
                <dd className="text-slate-700">
                  {order.submetidaPor.name}
                  {order.submetidaEm &&
                    ` · ${formatData(order.submetidaEm)}`}
                </dd>
              </div>
            )}
          </dl>

          {/* As linhas, para a decisão não ser tomada às cegas. Uma aprovação que não
              mostra o que se está a aprovar é um carimbo. */}
          {isLoadingItens ? (
            <div className="flex items-center justify-center gap-2 py-6 text-sm text-slate-500">
              <Loader2 className="h-4 w-4 animate-spin" />
              {t('aprov.a_carregar_linhas')}
            </div>
          ) : (
            itens.length > 0 && (
              <div className="overflow-hidden rounded-lg border border-slate-200">
                <table className="w-full text-sm">
                  <thead className="bg-slate-50 text-left text-xs text-slate-500">
                    <tr>
                      <th className="px-3 py-2 font-medium">{t('aprov.col_produto')}</th>
                      <th className="px-3 py-2 text-right font-medium">{t('aprov.col_qtd')}</th>
                      <th className="px-3 py-2 text-right font-medium">{t('aprov.col_preco')}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {itens.map((i) => (
                      <tr key={i.id}>
                        <td className="px-3 py-2 text-slate-700">{i.produto?.nome ?? i.produtoId}</td>
                        <td className="px-3 py-2 text-right text-slate-600">{i.quantidadePedida}</td>
                        <td className="px-3 py-2 text-right text-slate-600">{formatMoeda(i.custoUnitario)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )
          )}

          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => setDecisao('aprovar')}
              className={`flex items-center justify-center gap-2 rounded-lg border-2 px-4 py-3 text-sm font-medium transition-colors ${
                decisao === 'aprovar'
                  ? 'border-emerald-500 bg-emerald-50 text-emerald-700'
                  : 'border-slate-200 text-slate-600 hover:border-slate-300'
              }`}
            >
              <Check size={16} /> {t('aprov.aprovar')}
            </button>
            <button
              type="button"
              onClick={() => setDecisao('rejeitar')}
              className={`flex items-center justify-center gap-2 rounded-lg border-2 px-4 py-3 text-sm font-medium transition-colors ${
                decisao === 'rejeitar'
                  ? 'border-rose-500 bg-rose-50 text-rose-700'
                  : 'border-slate-200 text-slate-600 hover:border-slate-300'
              }`}
            >
              <Ban size={16} /> {t('aprov.rejeitar')}
            </button>
          </div>

          {vaiAutoAprovar && (
            <div className="flex gap-2 rounded-lg border border-amber-200 bg-amber-50 p-3 text-xs text-amber-800">
              <UserCheck size={16} className="mt-0.5 shrink-0" />
              <p>
                {t('aprov.aviso_auto')}
              </p>
            </div>
          )}

          <div>
            <label className="mb-1.5 block text-xs font-medium text-slate-600">
              {t('aprov.motivo')} {decisao === 'rejeitar' && <span className="text-rose-500">*</span>}
              {decisao === 'aprovar' && <span className="text-slate-400"> ({t('aprov.opcional')})</span>}
            </label>
            <textarea
              value={motivo}
              onChange={(e) => setMotivo(e.target.value)}
              rows={3}
              placeholder={
                decisao === 'rejeitar'
                  ? t('aprov.motivo_exemplo_rejeitar')
                  : t('aprov.motivo_exemplo_aprovar')
              }
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-blue-400 focus:outline-none focus:ring-1 focus:ring-blue-400"
            />
          </div>

          {decisao === 'aprovar' && (
            <div className="flex gap-2 rounded-lg border border-slate-200 bg-slate-50 p-3 text-xs text-slate-600">
              <AlertTriangle size={16} className="mt-0.5 shrink-0 text-slate-400" />
              <p>
                {t('aprov.aviso_aprovada')}
              </p>
            </div>
          )}

          <div className="flex justify-end gap-2 border-t border-slate-100 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg px-4 py-2 text-sm text-slate-600 hover:bg-slate-100"
            >
              {t('aprov.cancelar')}
            </button>
            <button
              type="submit"
              disabled={!decisao || isSaving}
              className={`inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium text-white transition-colors disabled:opacity-50 ${
                decisao === 'rejeitar'
                  ? 'bg-rose-600 hover:bg-rose-700'
                  : 'bg-emerald-600 hover:bg-emerald-700'
              }`}
            >
              {isSaving && <Loader2 size={14} className="animate-spin" />}
              {decisao === 'rejeitar' ? t('aprov.rejeitar_ordem') : t('aprov.aprovar_ordem')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
