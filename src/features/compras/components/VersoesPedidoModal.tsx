import { useQuery } from '@tanstack/react-query';
import { X, History, Loader2, AlertTriangle } from 'lucide-react';
import { purchasesApi } from '../api/purchases.api';
import type { PurchaseOrder } from '../api/purchases.api';

interface Props {
  order: PurchaseOrder;
  onClose: () => void;
}

/**
 * O histórico de versões de uma ordem: o que dizia antes de cada alteração.
 *
 * Só de leitura — a versão em vigor é sempre a mais recente, e a única forma de a mudar é
 * alterar a ordem de novo, com um motivo próprio.
 */
export function VersoesPedidoModal({ order, onClose }: Props) {
  const { data: versoes = [], isLoading } = useQuery({
    queryKey: ['pedido-versoes', order.id],
    queryFn: () => purchasesApi.getVersions(order.id),
  });

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-sm">
      <div className="flex max-h-[85vh] w-full max-w-lg flex-col overflow-hidden rounded-xl bg-white shadow-xl">
        <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-slate-100 p-2">
              <History className="h-5 w-5 text-slate-600" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-slate-900">
                Versões — #{order.id.slice(0, 8)}
              </h2>
              <p className="text-xs text-slate-500">{order.fornecedor?.nome ?? 'fornecedor n/d'}</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1 text-slate-400 hover:text-slate-600">
            <X size={18} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-5">
          {isLoading ? (
            <div className="flex items-center justify-center gap-2 py-10 text-sm text-slate-500">
              <Loader2 className="h-4 w-4 animate-spin" />
              A carregar versões...
            </div>
          ) : versoes.length === 0 ? (
            <p className="py-10 text-center text-sm text-slate-500">
              Esta ordem ainda não foi alterada — só há a versão original.
            </p>
          ) : (
            <ul className="space-y-3">
              {versoes.map((v) => (
                <li key={v.id} className="rounded-lg border border-slate-200 p-3">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <span className="text-sm font-semibold text-slate-900">Versão {v.versao}</span>
                    <span className="text-xs text-slate-500">
                      {new Date(v.criadaEm).toLocaleString('pt-MZ', {
                        day: '2-digit',
                        month: 'short',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </span>
                  </div>

                  {v.alteradaPor?.name && (
                    <p className="mt-1 text-xs text-slate-500">por {v.alteradaPor.name}</p>
                  )}

                  {v.materialidade && (
                    <p className="mt-2 flex items-start gap-1.5 rounded bg-amber-50 px-2 py-1 text-[11px] leading-snug text-amber-800">
                      <AlertTriangle size={11} className="mt-0.5 shrink-0" />
                      Alteração material — anulou a aprovação em vigor nessa altura.
                    </p>
                  )}

                  {v.motivoAlteracao && (
                    <p className="mt-2 text-sm text-slate-700">{v.motivoAlteracao}</p>
                  )}
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="flex justify-end border-t border-slate-100 bg-slate-50 px-5 py-3">
          <button
            onClick={onClose}
            className="rounded-md border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-white"
          >
            Fechar
          </button>
        </div>
      </div>
    </div>
  );
}
