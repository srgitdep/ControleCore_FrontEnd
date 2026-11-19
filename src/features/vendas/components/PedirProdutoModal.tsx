import { useState } from 'react';
import { X } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useRegistarPedidoCliente } from '@/features/pedidos-cliente';

/**
 * Regista o produto que o cliente pediu mas a loja não vende — independente
 * do carrinho e da venda: o cliente pode nunca comprar nada e o pedido
 * continua a valer como sinal do que falta no catálogo.
 */
export function PedirProdutoModal({
  sessaoId,
  clienteId,
  onClose,
}: {
  sessaoId: string;
  clienteId?: string;
  onClose: () => void;
}) {
  const { t } = useTranslation('pos');
  const [nomeProduto, setNomeProduto] = useState('');
  const registar = useRegistarPedidoCliente();

  const guardar = (e: React.FormEvent) => {
    e.preventDefault();
    if (!nomeProduto.trim()) return;
    registar.mutate(
      { nomeProduto: nomeProduto.trim(), sessaoId, clienteId },
      { onSuccess: onClose },
    );
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-start justify-center bg-black/60 p-4 pt-[6vh] backdrop-blur-sm">
      <div className="flex w-full max-w-md flex-col overflow-hidden rounded-2xl bg-white shadow-2xl">
        <div className="flex shrink-0 items-center justify-between border-b border-slate-100 p-5">
          <h2 className="text-lg font-bold text-slate-900">{t('pedidoCliente.titulo')}</h2>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100"
            aria-label={t('pedidoCliente.fechar')}
          >
            <X size={18} />
          </button>
        </div>

        <form onSubmit={guardar} className="space-y-4 p-5">
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">
              {t('pedidoCliente.nome_produto')}
            </label>
            <input
              autoFocus
              value={nomeProduto}
              onChange={(e) => setNomeProduto(e.target.value)}
              placeholder={t('pedidoCliente.nome_produto_exemplo')}
              className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-base focus:outline-none focus:ring-2 focus:ring-blue-600"
            />
            <p className="mt-1 text-xs text-slate-400">{t('pedidoCliente.ajuda')}</p>
          </div>

          <button
            type="submit"
            disabled={!nomeProduto.trim() || registar.isPending}
            className="w-full rounded-xl bg-blue-600 py-3 text-sm font-bold text-white transition-colors hover:bg-blue-700 disabled:opacity-50"
          >
            {registar.isPending ? t('pedidoCliente.a_registar') : t('pedidoCliente.registar')}
          </button>
        </form>
      </div>
    </div>
  );
}
