import { X, History, Clock } from 'lucide-react';
import { useHistoricoContagem } from '@/features/stock';
import type { InventoryItemStatus } from '@/features/stock';

const ESTADO_LABEL: Record<InventoryItemStatus, string> = {
  PENDENTE: 'Pendente',
  EM_CONTAGEM: 'Em contagem',
  CONTADO: 'Contado',
  ZERO_CONFIRMADO: 'Zero confirmado',
  FORA_DA_LOCALIZACAO: 'Fora da localização',
  RECONTAGEM_PENDENTE: 'Recontagem pendente',
  RECONTADO: 'Recontado',
  PRODUTO_INESPERADO: 'Produto inesperado',
};

/**
 * Trilha append-only de alterações a uma contagem (§5, §13): valor anterior,
 * valor novo, estado anterior, estado novo, quem alterou e quando. Nada aqui
 * é apagado — é só leitura.
 */
export function HistoricoContagemModal({
  cycleId,
  itemId,
  produtoNome,
  onClose,
}: {
  cycleId: string;
  itemId: string;
  produtoNome?: string;
  onClose: () => void;
}) {
  const { data: historico = [], isLoading } = useHistoricoContagem(cycleId, itemId);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
      <div className="flex max-h-[85vh] w-full max-w-lg flex-col overflow-hidden rounded-xl bg-white shadow-xl">
        <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-blue-100 p-2">
              <History className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-800">Histórico da contagem</h2>
              {produtoNome && <p className="text-xs text-slate-500">{produtoNome}</p>}
            </div>
          </div>
          <button onClick={onClose} className="rounded-lg p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-600">
            <X size={20} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4">
          {isLoading ? (
            <div className="flex items-center justify-center py-10">
              <div className="h-6 w-6 animate-spin rounded-full border-2 border-blue-600 border-t-transparent" />
            </div>
          ) : historico.length === 0 ? (
            <p className="px-4 py-10 text-center text-sm text-slate-400">
              Ainda não há alterações registadas para este item.
            </p>
          ) : (
            <ol className="space-y-3">
              {historico.map((h) => (
                <li key={h.id} className="rounded-lg border border-slate-100 bg-slate-50/60 px-4 py-3">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-sm font-medium text-slate-800">
                      {ESTADO_LABEL[h.estadoAnterior]} → {ESTADO_LABEL[h.estadoNovo]}
                    </span>
                    <span className="flex items-center gap-1 text-[11px] text-slate-400">
                      <Clock className="h-3 w-3" />
                      {new Date(h.em).toLocaleString('pt-PT')}
                    </span>
                  </div>
                  <p className="mt-1 text-xs text-slate-500">
                    Quantidade: {h.valorAnterior ?? '—'} → <span className="font-semibold text-slate-700">{h.valorNovo ?? '—'}</span>
                  </p>
                  <p className="mt-0.5 text-[11px] text-slate-400">Alterado por {h.alteradoPor}</p>
                </li>
              ))}
            </ol>
          )}
        </div>
      </div>
    </div>
  );
}
