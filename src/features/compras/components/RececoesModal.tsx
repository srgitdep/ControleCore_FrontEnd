import { useState, useEffect } from 'react';
import { X, PackageCheck, Ban, Loader2, AlertTriangle, Undo2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { useTranslation } from 'react-i18next';
import { formatDataHora, formatMoeda, mensagemDeErro } from '@/shared/utils';
import { purchasesApi } from '../api/purchases.api';
import type { PurchaseOrder, Rececao } from '../api/purchases.api';

interface Props {
  order: PurchaseOrder;
  onClose: () => void;
  onSuccess: () => void;
}

/**
 * Histórico de recepções de um pedido, com anulação.
 *
 * Anular devolve o stock, reverte o custo médio do armazém e cancela a conta a pagar
 * ao fornecedor. A recepção não é apagada — fica marcada, e o pedido reabre para poder
 * ser recebido de novo depois de corrigido o problema.
 */
export function RececoesModal({ order, onClose, onSuccess }: Props) {
  const { t } = useTranslation('compras');
  const [rececoes, setRececoes] = useState<Rececao[]>(order.rececoes ?? []);
  const [isLoading, setIsLoading] = useState(!order.rececoes);
  const [aAnular, setAAnular] = useState<Rececao | null>(null);
  const [motivo, setMotivo] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  // A listagem de pedidos não traz as recepções; só `getOrderById`.
  useEffect(() => {
    if (order.rececoes) return;

    (async () => {
      try {
        const completo = await purchasesApi.getOrderById(order.id);
        setRececoes(completo.rececoes ?? []);
      } catch (error: any) {
        toast.error(mensagemDeErro(error, t('rec.erro_carregar')));
      } finally {
        setIsLoading(false);
      }
    })();
  }, [order.id, order.rececoes, t]);

  const anular = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!aAnular) return;

    setIsSaving(true);
    try {
      const r = await purchasesApi.cancelReceipt(aAnular.id, motivo);
      toast.success(r?.message || t('rec.toast_anulada'));

      const completo = await purchasesApi.getOrderById(order.id);
      setRececoes(completo.rececoes ?? []);
      setAAnular(null);
      setMotivo('');
      onSuccess();
    } catch (error: any) {
      // O backend recusa recepção já anulada e mercadoria que já saiu do armazém,
      // cada uma com mensagem própria.
      toast.error(mensagemDeErro(error, t('rec.erro_anular')));
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[60] bg-slate-900/50 flex items-center justify-center p-4 backdrop-blur-sm">
      <div className="bg-white rounded-2xl w-full max-w-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        <div className="flex items-center justify-between p-6 border-b border-slate-100 bg-slate-50/50">
          <div>
            <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <PackageCheck size={20} className="text-emerald-600" /> {t('rec.titulo')}
            </h2>
            <p className="text-xs text-slate-500">
              {order.id.split('-')[0].toUpperCase()} · {order.fornecedor?.nome ?? t('rec.nd')}
            </p>
          </div>
          <button
            onClick={onClose}
            aria-label={t('rec.fechar')}
            className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg"
          >
            <X size={20} />
          </button>
        </div>

        <div className="p-6 overflow-y-auto space-y-4">
          {isLoading ? (
            <div className="py-10 text-center text-slate-500">
              <Loader2 className="mx-auto h-7 w-7 animate-spin text-blue-600 mb-2" />
              {t('rec.a_carregar')}
            </div>
          ) : rececoes.length === 0 ? (
            <div className="py-10 text-center text-sm text-slate-500">
              <PackageCheck className="mx-auto h-10 w-10 text-slate-300 mb-2" />
              {t('rec.vazio')}
            </div>
          ) : (
            rececoes.map((r) => {
              const total = (r.itens ?? []).reduce(
                (acc, i) => acc + i.quantidade * i.custoUnitario,
                0,
              );

              return (
                <div
                  key={r.id}
                  className={`rounded-xl border p-4 ${
                    r.anulada ? 'border-slate-200 bg-slate-50 opacity-75' : 'border-slate-200'
                  }`}
                >
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <p className="font-medium text-slate-900 flex items-center gap-2">
                        {formatDataHora(r.dataRececao)}
                        {r.anulada && (
                          <span className="rounded bg-rose-100 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-rose-700">
                            {t('rec.anulada')}
                          </span>
                        )}
                      </p>
                      <p className="text-xs text-slate-500 mt-0.5">
                        {r.armazem?.nome ?? t('rec.armazem_nd')}
                        {r.recebidoPor?.name &&
                          ` · ${t('rec.recebido_por', { nome: r.recebidoPor.name })}`}
                        {r.documentoRef && ` · ${t('rec.doc', { ref: r.documentoRef })}`}
                      </p>
                    </div>

                    <div className="flex items-center gap-3">
                      <span className={`font-semibold ${r.anulada ? 'text-slate-400 line-through' : 'text-slate-900'}`}>
                        {formatMoeda(total)}
                      </span>
                      {!r.anulada && (
                        <button
                          onClick={() => setAAnular(r)}
                          className="px-3 py-1.5 text-xs font-medium text-rose-600 border border-rose-200 rounded-lg hover:bg-rose-50 flex items-center gap-1.5"
                        >
                          <Ban size={14} /> {t('rec.anular')}
                        </button>
                      )}
                    </div>
                  </div>

                  {(r.itens ?? []).length > 0 && (
                    <ul className="mt-3 space-y-1 border-t border-slate-100 pt-3">
                      {r.itens!.map((i) => (
                        <li key={i.id} className="flex justify-between text-xs text-slate-600">
                          <span>{i.quantidade} × {i.produto?.nome ?? t('rec.produto_generico')}</span>
                          <span>{t('rec.por_un', { custo: formatMoeda(i.custoUnitario) })}</span>
                        </li>
                      ))}
                    </ul>
                  )}

                  {r.anulada && r.motivoAnulacao && (
                    <p className="mt-3 flex items-start gap-1.5 text-xs text-slate-500 border-t border-slate-100 pt-3">
                      <Undo2 size={13} className="mt-0.5 shrink-0" />
                      {r.motivoAnulacao}
                    </p>
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Confirmação da anulação */}
      {aAnular && (
        <div className="fixed inset-0 z-[70] bg-slate-900/60 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl overflow-hidden">
            <div className="flex items-center justify-between p-6 border-b border-slate-100 bg-rose-50/50">
              <h3 className="text-lg font-bold text-slate-900">{t('rec.anular_titulo')}</h3>
              <button
                onClick={() => { setAAnular(null); setMotivo(''); }}
                aria-label={t('rec.fechar')}
                className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg"
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={anular} className="p-6 space-y-4">
              <div className="flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50 p-3">
                <AlertTriangle size={16} className="mt-0.5 shrink-0 text-amber-600" />
                <p className="text-xs text-amber-800">
                  {t('rec.aviso_anular')}
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  {t('rec.motivo')} <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  value={motivo}
                  onChange={(e) => setMotivo(e.target.value)}
                  placeholder={t('rec.motivo_exemplo')}
                  minLength={5}
                  maxLength={255}
                  autoFocus
                  className="w-full px-4 py-2.5 border rounded-xl focus:ring-2 focus:ring-rose-500"
                />
                <p className="text-xs text-slate-500 mt-1.5">
                  {t('rec.motivo_ajuda')}
                </p>
              </div>

              <div className="flex justify-end gap-3 pt-1">
                <button
                  type="button"
                  onClick={() => { setAAnular(null); setMotivo(''); }}
                  className="px-5 py-2.5 text-slate-600 font-medium rounded-xl hover:bg-slate-100"
                >
                  {t('rec.cancelar')}
                </button>
                <button
                  type="submit"
                  disabled={motivo.trim().length < 5 || isSaving}
                  className="px-5 py-2.5 bg-rose-600 text-white font-medium rounded-xl hover:bg-rose-700 disabled:opacity-50 flex items-center gap-2"
                >
                  {isSaving && <Loader2 size={16} className="animate-spin" />}
                  {t('rec.anular_recepcao')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
