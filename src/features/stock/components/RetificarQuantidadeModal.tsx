import { useState } from 'react';
import { createPortal } from 'react-dom';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { History } from 'lucide-react';
import { useStockMutations } from '../hooks/useStock';

interface RetificarQuantidadeModalProps {
  stockId: string;
  /** Onde está esta quantidade (o armazém), para quem corrige saber o que está a mexer. */
  armazemNome: string;
  produtoNome?: string;
  /** O saldo que o ecrã mostra — viaja com o pedido, e o servidor recusa se entretanto mudou. */
  quantidadeAtual: number;
  onClose: () => void;
}

/**
 * Corrigir a quantidade de uma posição de stock (lançamento errado).
 *
 * Quem corrige escreve a quantidade **certa**; o servidor regista a diferença como um ajuste,
 * com autor e motivo — não sobrescreve o saldo, para o histórico continuar a bater com o stock.
 * Reutilizável: não sabe de que ecrã foi aberto.
 */
export function RetificarQuantidadeModal({
  stockId,
  armazemNome,
  produtoNome,
  quantidadeAtual,
  onClose,
}: RetificarQuantidadeModalProps) {
  const { t } = useTranslation('stock');
  const { retificarQuantidade } = useStockMutations();
  const [correta, setCorreta] = useState<string>(String(quantidadeAtual));
  const [motivo, setMotivo] = useState('');

  const valor = Number(correta);
  const valida = correta.trim() !== '' && Number.isFinite(valor) && valor >= 0;
  const diferenca = valida ? valor - quantidadeAtual : 0;
  const podeGuardar = valida && diferenca !== 0 && motivo.trim().length >= 3;

  const guardar = (e: React.FormEvent) => {
    e.preventDefault();
    // Este modal abre-se de dentro de outros formulários (o do produto): sem isto o submit
    // subia pela árvore React e gravava também esse formulário.
    e.stopPropagation();
    if (!podeGuardar) return;
    retificarQuantidade.mutate(
      { stockId, quantidadeAnterior: quantidadeAtual, quantidadeCorreta: valor, motivo: motivo.trim() },
      { onSuccess: onClose },
    );
  };

  return createPortal(
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-sm">
      <div className="w-full max-w-md overflow-hidden rounded-xl bg-white shadow-xl">
        <div className="flex items-center justify-between border-b border-gray-100 bg-gray-50 p-5">
          <div>
            <h2 className="text-lg font-bold text-gray-800">{t('retificar.titulo')}</h2>
            <p className="text-xs text-gray-500">
              {produtoNome ? `${produtoNome} · ` : ''}
              {armazemNome}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-gray-400 hover:text-gray-700"
            aria-label={t('geral.cancelar')}
          >
            ×
          </button>
        </div>

        <form onSubmit={guardar} className="space-y-4 p-5">
          <p className="rounded-lg bg-amber-50 px-3 py-2 text-xs text-amber-800">{t('retificar.aviso')}</p>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <span className="mb-1 block text-sm font-medium text-gray-700">{t('retificar.quantidade_actual')}</span>
              <div className="rounded-lg border border-gray-200 bg-gray-50 p-2 text-sm font-semibold text-gray-700">
                {quantidadeAtual}
              </div>
            </div>
            <div>
              <label htmlFor="quantidade-certa" className="mb-1 block text-sm font-medium text-gray-700">
                {t('retificar.quantidade_certa')}
              </label>
              <input
                id="quantidade-certa"
                type="number"
                min="0"
                step="any"
                required
                autoFocus
                value={correta}
                onChange={(e) => setCorreta(e.target.value)}
                className="w-full rounded-lg border border-gray-300 p-2 outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          {valida && diferenca !== 0 && (
            <p className={`text-sm font-medium ${diferenca > 0 ? 'text-green-700' : 'text-red-700'}`}>
              {t('retificar.diferenca', { n: `${diferenca > 0 ? '+' : ''}${diferenca}` })}
            </p>
          )}

          <div>
            <label htmlFor="motivo-retificacao" className="mb-1 block text-sm font-medium text-gray-700">
              {t('retificar.motivo')}
            </label>
            <textarea
              id="motivo-retificacao"
              required
              minLength={3}
              maxLength={300}
              rows={3}
              value={motivo}
              onChange={(e) => setMotivo(e.target.value)}
              placeholder={t('retificar.motivo_exemplo')}
              className="w-full resize-none rounded-lg border border-gray-300 p-2 outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <Link
            to={`/stock/${stockId}`}
            className="inline-flex items-center gap-1.5 text-xs font-medium text-indigo-600 hover:underline"
          >
            <History className="h-3.5 w-3.5" /> {t('retificar.ver_historico')}
          </Link>

          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg px-4 py-2 font-medium text-gray-600 hover:bg-gray-100"
            >
              {t('geral.cancelar')}
            </button>
            <button
              type="submit"
              disabled={!podeGuardar || retificarQuantidade.isPending}
              className="rounded-lg bg-blue-600 px-4 py-2 font-bold text-white hover:bg-blue-700 disabled:opacity-50"
            >
              {retificarQuantidade.isPending ? t('geral.a_processar') : t('retificar.confirmar')}
            </button>
          </div>
        </form>
      </div>
    </div>,
    document.body,
  );
}
