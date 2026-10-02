import { useState } from 'react';
import { X, Loader2, MessageSquare, AlertTriangle } from 'lucide-react';
import toast from 'react-hot-toast';
import { useTranslation } from 'react-i18next';
import { formatMoeda, mensagemDeErro } from '@/shared/utils';
import { purchasesApi } from '../api/purchases.api';
import type { PurchaseOrder } from '../api/purchases.api';

interface Props {
  order: PurchaseOrder;
  onClose: () => void;
  onSuccess: () => void;
}

/**
 * Registar o que o fornecedor respondeu à ordem.
 *
 * ## Quem regista é o comprador, e é assim de propósito
 *
 * A maioria das respostas não chega por portal nenhum: chega por WhatsApp, por e-mail ou
 * por telefone. Exigir que o fornecedor entre num sistema para confirmar significaria, na
 * prática, não registar confirmação nenhuma — e o saldo por confirmar nunca existiria.
 *
 * Por isso o campo «canal» está aqui: é menos garantia do que uma confirmação assinada, e
 * é muito mais do que não saber de onde veio a informação.
 *
 * ## O que fica a zero conta como não confirmado
 *
 * As quantidades começam pelo que foi pedido, que é o caso mais comum. Pôr uma linha a
 * zero é dizer que o fornecedor não se comprometeu com ela — o silêncio sobre uma linha
 * não é uma promessa de a entregar, e é essa a leitura que evita surpresas na entrega.
 */
export function ConfirmacaoFornecedorModal({ order, onClose, onSuccess }: Props) {
  const { t } = useTranslation('compras');
  const itens = order.itens ?? [];

  const [quantidades, setQuantidades] = useState<Record<string, number>>(
    Object.fromEntries(itens.map((i) => [i.id, i.quantidadePedida])),
  );
  const [precos, setPrecos] = useState<Record<string, string>>({});
  const [dataProposta, setDataProposta] = useState('');
  const [canal, setCanal] = useState('');
  const [observacoes, setObservacoes] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  const totalPedido = itens.reduce((s, i) => s + i.quantidadePedida, 0);
  const totalConfirmado = itens.reduce(
    (s, i) => s + Math.min(quantidades[i.id] ?? 0, i.quantidadePedida),
    0,
  );
  const emFalta = totalPedido - totalConfirmado;

  // O mesmo cálculo que o backend faz, para o ecrã dizer de antemão o que vai acontecer.
  const tipo =
    totalConfirmado === 0
      ? t('conf.tipo_recusa')
      : totalConfirmado < totalPedido
        ? t('conf.tipo_parcial')
        : Object.keys(precos).some((k) => precos[k] !== '') || dataProposta
          ? t('conf.tipo_alteracoes')
          : t('conf.tipo_total');

  const submeter = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);

    try {
      const resultado = await purchasesApi.registerConfirmation(order.id, {
        linhas: itens.map((i) => ({
          itemId: i.id,
          quantidadeConfirmada: quantidades[i.id] ?? 0,
          // Vazio significa «aceita o preço da ordem», e não preço zero. Confundi-los
          // transformaria «aceito o teu preço» numa oferta grátis.
          precoConfirmado: precos[i.id] !== undefined && precos[i.id] !== ''
            ? Number(precos[i.id])
            : undefined,
        })),
        dataPropostaEntrega: dataProposta || undefined,
        canal: canal.trim() || undefined,
        observacoes: observacoes.trim() || undefined,
      });

      const falta = resultado.saldoPorConfirmar.reduce((s, l) => s + l.quantidade, 0);

      toast.success(
        falta > 0
          ? t('conf.toast_com_falta', { count: falta })
          : t('conf.toast_registada'),
      );

      onSuccess();
      onClose();
    } catch (error: any) {
      toast.error(mensagemDeErro(error, t('conf.erro_registar')));
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4">
      <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-xl bg-white shadow-xl">
        <header className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
          <div>
            <h2 className="flex items-center gap-2 text-base font-semibold text-slate-900">
              <MessageSquare size={16} className="text-slate-400" />
              {t('conf.titulo')}
            </h2>
            <p className="mt-0.5 text-xs text-slate-500">
              {order.fornecedor?.nome} · <span className="font-mono">#{order.id.slice(0, 8)}</span>
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-slate-400 hover:text-slate-600"
            aria-label={t('conf.fechar')}
          >
            <X size={18} />
          </button>
        </header>

        <form onSubmit={submeter} className="space-y-5 px-5 py-4">
          <div className="overflow-hidden rounded-lg border border-slate-200">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 text-left text-xs text-slate-500">
                <tr>
                  <th className="px-3 py-2 font-medium">{t('conf.col_produto')}</th>
                  <th className="px-3 py-2 text-right font-medium">{t('conf.col_pedido')}</th>
                  <th className="px-3 py-2 text-right font-medium">{t('conf.col_confirma')}</th>
                  <th className="px-3 py-2 text-right font-medium">
                    {t('conf.col_preco')}{' '}
                    <span className="font-normal text-slate-400">({t('conf.se_diferente')})</span>
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {itens.map((i) => {
                  const confirmado = quantidades[i.id] ?? 0;
                  const falta = i.quantidadePedida - confirmado;

                  return (
                    <tr key={i.id}>
                      <td className="px-3 py-2 text-slate-700">{i.produto?.nome ?? i.produtoId}</td>
                      <td className="px-3 py-2 text-right text-slate-500">{i.quantidadePedida}</td>
                      <td className="px-3 py-2 text-right">
                        <input
                          type="number"
                          min={0}
                          value={confirmado}
                          onChange={(e) =>
                            setQuantidades((q) => ({ ...q, [i.id]: Number(e.target.value) }))
                          }
                          className={`w-24 rounded border px-2 py-1 text-right text-sm focus:outline-none focus:ring-1 ${
                            falta > 0
                              ? 'border-amber-300 bg-amber-50 focus:ring-amber-400'
                              : 'border-slate-200 focus:border-blue-400 focus:ring-blue-400'
                          }`}
                        />
                        {falta > 0 && (
                          <p className="mt-0.5 text-[10px] text-amber-700">{t('conf.faltam', { falta })}</p>
                        )}
                      </td>
                      <td className="px-3 py-2 text-right">
                        <input
                          type="number"
                          step="0.01"
                          min={0}
                          value={precos[i.id] ?? ''}
                          onChange={(e) => setPrecos((p) => ({ ...p, [i.id]: e.target.value }))}
                          placeholder={formatMoeda(i.custoUnitario)}
                          className="w-28 rounded border border-slate-200 px-2 py-1 text-right text-sm placeholder:text-slate-300 focus:border-blue-400 focus:outline-none focus:ring-1 focus:ring-blue-400"
                        />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {emFalta > 0 && (
            <div className="flex gap-2 rounded-lg border border-amber-200 bg-amber-50 p-3 text-xs text-amber-800">
              <AlertTriangle size={16} className="mt-0.5 shrink-0" />
              <p>
                <strong>{t('conf.por_confirmar', { count: emFalta })}</strong>{' '}
                {t('conf.por_confirmar_ajuda')}
              </p>
            </div>
          )}

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1.5 block text-xs font-medium text-slate-600">
                {t('conf.nova_data')}{' '}
                <span className="text-slate-400">({t('conf.se_propos')})</span>
              </label>
              <input
                type="date"
                value={dataProposta}
                onChange={(e) => setDataProposta(e.target.value)}
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-blue-400 focus:outline-none focus:ring-1 focus:ring-blue-400"
              />
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-medium text-slate-600">
                {t('conf.canal')}
              </label>
              <input
                value={canal}
                onChange={(e) => setCanal(e.target.value)}
                placeholder={t('conf.canal_exemplo')}
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm placeholder:text-slate-300 focus:border-blue-400 focus:outline-none focus:ring-1 focus:ring-blue-400"
              />
            </div>
          </div>

          <div>
            <label className="mb-1.5 block text-xs font-medium text-slate-600">
              {t('conf.o_que_disse')}
            </label>
            <textarea
              value={observacoes}
              onChange={(e) => setObservacoes(e.target.value)}
              rows={2}
              placeholder={t('conf.observacoes_exemplo')}
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm placeholder:text-slate-300 focus:border-blue-400 focus:outline-none focus:ring-1 focus:ring-blue-400"
            />
          </div>

          <div className="flex items-center justify-between border-t border-slate-100 pt-4">
            <p className="text-xs text-slate-500">
              {t('conf.vai_ficar_como')}{' '}
              <strong className="text-slate-700">{tipo}</strong>
            </p>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={onClose}
                className="rounded-lg px-4 py-2 text-sm text-slate-600 hover:bg-slate-100"
              >
                {t('conf.cancelar')}
              </button>
              <button
                type="submit"
                disabled={isSaving}
                className="inline-flex items-center gap-2 rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-700 disabled:opacity-50"
              >
                {isSaving && <Loader2 size={14} className="animate-spin" />}
                {t('conf.registar')}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
