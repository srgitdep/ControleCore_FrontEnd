import { useState } from 'react';
import { AlertTriangle, Ban, Layers3 } from 'lucide-react';
import { Button } from '@/shared/ui';
import { useFefo } from '../hooks/useSaudeStock';
import { ESTADO_VALIDADE_META } from '../types/saude.types';

interface FefoModalProps {
  produtoId: string | null;
  armazemId: string | null;
  onClose: () => void;
  produtoNome?: string | null;
  armazemNome?: string | null;
  unidade?: string;
}

/**
 * De que lote tirar — FEFO, o §72.
 *
 * ## Abre a partir da linha de stock, e não de um formulário
 *
 * A pergunta precisa de produto, armazém e quantidade. Os dois primeiros a linha já sabe, e
 * um ecrã com selectores de produto e armazém obrigaria a escolher outra vez o que já estava
 * escolhido — além de permitir combinações que não existem.
 *
 * ## Recomenda, não executa
 *
 * Devolve as linhas a separar. Não abate stock nem atribui lotes: a escolha do lote na saída
 * ainda não é feita pelo sistema, e quem separa tem de seguir estas linhas à mão. Está dito no
 * próprio modal para ninguém contar com o que não acontece.
 */
export function FefoModal({
  produtoId,
  armazemId,
  onClose,
  produtoNome,
  armazemNome,
  unidade = 'UN',
}: FefoModalProps) {
  const [quantidade, setQuantidade] = useState<number | ''>('');
  // Só se consulta depois de a pessoa confirmar: um pedido por cada tecla escrita no campo
  // seria uma consulta por dígito.
  const [pedida, setPedida] = useState<number | null>(null);

  const { data, isFetching } = useFefo({
    produtoId: produtoId ?? undefined,
    armazemId: armazemId ?? undefined,
    quantidade: pedida ?? undefined,
  });

  if (!produtoId || !armazemId) return null;

  const q = Number(quantidade);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-lg overflow-hidden rounded-xl bg-white shadow-2xl">
        <div className="flex items-start justify-between gap-3 border-b border-slate-100 bg-slate-50 p-5">
          <div className="flex items-start gap-3">
            <Layers3 className="mt-0.5 h-5 w-5 flex-shrink-0 text-slate-500" />
            <div>
              <h2 className="font-bold text-slate-800">De que lote tirar</h2>
              <p className="text-sm text-slate-500">
                {produtoNome}
                {armazemNome && ` · ${armazemNome}`}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-xl leading-none text-slate-400 hover:text-slate-700"
            aria-label="Fechar"
          >
            ×
          </button>
        </div>

        <div className="space-y-4 p-5">
          <p className="rounded-lg bg-slate-50 px-3 py-2 text-xs leading-relaxed text-slate-600">
            Primeiro o lote que expira mais cedo (FEFO). Lotes expirados e bloqueados nunca
            entram na recomendação — aparecem à parte, com o motivo.
          </p>

          <form
            onSubmit={(e) => {
              e.preventDefault();
              if (q > 0) setPedida(q);
            }}
            className="flex items-end gap-2"
          >
            <label className="flex-1">
              <span className="mb-1 block text-sm font-medium text-slate-700">
                Quantidade a retirar
              </span>
              <input
                type="number"
                min="0"
                step="any"
                value={quantidade}
                onChange={(e) => setQuantidade(e.target.value === '' ? '' : Number(e.target.value))}
                autoFocus
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-base"
              />
            </label>
            <Button type="submit" disabled={!(q > 0) || isFetching}>
              {isFetching ? 'A calcular...' : 'Calcular'}
            </Button>
          </form>

          {data && (
            <div className="space-y-3">
              {data.linhas.length > 0 ? (
                <div className="overflow-hidden rounded-xl border border-slate-200">
                  <table className="w-full text-left text-sm">
                    <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                      <tr>
                        <th className="px-3 py-2 font-medium">Lote</th>
                        <th className="px-3 py-2 font-medium">Validade</th>
                        <th className="px-3 py-2 text-right font-medium">A retirar</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {data.linhas.map((linha) => (
                        <tr key={linha.loteId}>
                          <td className="px-3 py-2">
                            <span className="font-medium text-slate-800">{linha.codigo}</span>
                            <span
                              className={`ml-2 inline-block rounded-md border px-1.5 py-0.5 text-[11px] font-medium ${
                                ESTADO_VALIDADE_META[linha.estado].pastilha
                              }`}
                            >
                              {ESTADO_VALIDADE_META[linha.estado].label}
                            </span>
                          </td>
                          <td className="px-3 py-2 text-slate-600">
                            {linha.diasParaValidade === null
                              ? 'sem validade'
                              : `${linha.diasParaValidade} dias`}
                          </td>
                          <td className="px-3 py-2 text-right font-semibold tabular-nums text-slate-800">
                            {linha.quantidade} {unidade}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <p className="rounded-lg bg-slate-50 px-3 py-3 text-sm text-slate-600">
                  Nenhum lote elegível. Ou não há lotes registados deste produto neste armazém,
                  ou os que existem estão expirados ou bloqueados.
                </p>
              )}

              {/* Nunca omitir em silêncio: uma lista incompleta apresentada como completa
                  mandaria o armazém separar a menos e descobri-lo na conferência. */}
              {data.quantidadeNaoCoberta > 0 && (
                <p className="flex items-start gap-2 rounded-lg bg-amber-50 px-3 py-2 text-sm text-amber-900">
                  <AlertTriangle className="mt-0.5 h-4 w-4 flex-shrink-0" />
                  Faltam <strong>{data.quantidadeNaoCoberta} {unidade}</strong> sem lote
                  disponível. Os lotes elegíveis não cobrem a quantidade pedida.
                </p>
              )}

              {data.excluidos.length > 0 && (
                <div className="rounded-lg border border-slate-200 px-3 py-2">
                  <p className="mb-1 flex items-center gap-1.5 text-xs font-medium text-slate-600">
                    <Ban className="h-3.5 w-3.5" />
                    Lotes excluídos
                  </p>
                  <ul className="space-y-0.5 text-xs text-slate-500">
                    {data.excluidos.map((e) => (
                      <li key={e.loteId}>
                        <span className="font-medium text-slate-700">{e.codigo}</span> —{' '}
                        {e.motivo.toLowerCase()}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}

          <p className="border-t border-slate-100 pt-3 text-xs leading-relaxed text-slate-500">
            Isto é uma recomendação de separação: não abate stock. A escolha do lote na venda e
            no picking ainda não é feita pelo sistema, pelo que quem separa tem de seguir estas
            linhas manualmente.
          </p>

          <div className="flex justify-end">
            <Button type="button" variant="ghost" onClick={onClose}>
              Fechar
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
