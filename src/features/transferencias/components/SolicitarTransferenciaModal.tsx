import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { ArrowRight, Plus, Trash2, X } from 'lucide-react';
import { api } from '@/shared/config';
import { Button } from '@/shared/ui';
import { useArmazens } from '@/features/lojas';
import { transferenciasApi } from '../api/transferencias.api';

interface ProdutoSimples {
  id: string;
  nome: string;
  unidadeMedida: string;
}

interface LinhaEmEdicao {
  produtoId: string;
  quantidade: string;
}

/**
 * Pedir mercadoria a outro armazém.
 *
 * ## Isto não é a transferência directa
 *
 * A mudança entre duas arrecadações da mesma loja continua no ecrã do stock, onde é uma
 * operação instantânea. Isto é para a mercadoria que atravessa uma estrada: solicita-se,
 * aprova-se, expede-se, e só quando chega é que entra no saldo do destino.
 *
 * O ecrã di-lo, porque escolher o caminho errado tem consequências opostas — um instantâneo
 * entre lojas faz o destino vender o que ainda vem no camião.
 */
export function SolicitarTransferenciaModal({ aoFechar }: { aoFechar: () => void }) {
  const queryClient = useQueryClient();
  const { armazens } = useArmazens();

  const [origemId, setOrigemId] = useState('');
  const [destinoId, setDestinoId] = useState('');
  const [motivo, setMotivo] = useState('');
  const [linhas, setLinhas] = useState<LinhaEmEdicao[]>([{ produtoId: '', quantidade: '' }]);

  const { data: produtos } = useQuery({
    queryKey: ['produtos-para-transferencia'],
    queryFn: async () => {
      const { data } = await api.get<{ data: ProdutoSimples[] }>('/produtos', {
        params: { limit: 500 },
      });
      return Array.isArray(data) ? (data as unknown as ProdutoSimples[]) : (data.data ?? []);
    },
  });

  const solicitar = useMutation({
    mutationFn: transferenciasApi.solicitar,
    onSuccess: (t) => {
      queryClient.invalidateQueries({ queryKey: ['transferencias'] });
      toast.success(`Transferência ${t.numero} solicitada. Falta aprovar.`);
      aoFechar();
    },
    onError: (erro: any) =>
      toast.error(erro?.response?.data?.message || 'Não foi possível solicitar a transferência.'),
  });

  const alterar = (i: number, campo: keyof LinhaEmEdicao, valor: string) =>
    setLinhas((atual) =>
      atual.map((linha, indice) => (indice === i ? { ...linha, [campo]: valor } : linha)),
    );

  const validas = linhas.filter((l) => l.produtoId && Number(l.quantidade) > 0);
  const mesmoArmazem = !!origemId && origemId === destinoId;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="flex max-h-[90vh] w-full max-w-2xl flex-col rounded-lg bg-white shadow-xl">
        <div className="flex items-center justify-between border-b border-slate-100 px-5 py-3">
          <div>
            <h3 className="font-semibold text-slate-900">Solicitar transferência</h3>
            <p className="mt-0.5 text-xs text-slate-500">
              Para mercadoria que atravessa uma estrada. Entre duas arrecadações da mesma loja,
              use a transferência directa no ecrã do stock.
            </p>
          </div>
          <button onClick={aoFechar} className="text-slate-400 hover:text-slate-600">
            <X size={18} />
          </button>
        </div>

        <div className="flex-1 space-y-4 overflow-y-auto p-5">
          <div className="flex items-end gap-3">
            <div className="flex-1">
              <label className="text-sm font-medium text-slate-700">De</label>
              <select
                value={origemId}
                onChange={(e) => setOrigemId(e.target.value)}
                className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-blue-400 focus:outline-none"
              >
                <option value="">Escolher…</option>
                {armazens.map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.etiqueta}
                  </option>
                ))}
              </select>
            </div>

            <ArrowRight className="mb-2.5 shrink-0 text-slate-300" size={18} />

            <div className="flex-1">
              <label className="text-sm font-medium text-slate-700">Para</label>
              <select
                value={destinoId}
                onChange={(e) => setDestinoId(e.target.value)}
                className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-blue-400 focus:outline-none"
              >
                <option value="">Escolher…</option>
                {armazens.map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.etiqueta}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {mesmoArmazem && (
            <p className="rounded-lg bg-amber-50 px-3 py-2 text-xs text-amber-800">
              A origem e o destino são o mesmo armazém. Para mudar mercadoria de prateleira
              dentro do mesmo armazém, use as localizações no ecrã do stock.
            </p>
          )}

          <div>
            <label className="text-sm font-medium text-slate-700">
              Porquê <span className="font-normal text-slate-400">(opcional)</span>
            </label>
            <input
              value={motivo}
              onChange={(e) => setMotivo(e.target.value)}
              placeholder="Ruptura na loja da Matola"
              className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-blue-400 focus:outline-none"
            />
          </div>

          <div>
            <label className="text-sm font-medium text-slate-700">O que transferir</label>

            <div className="mt-2 space-y-2">
              {linhas.map((linha, i) => (
                <div key={i} className="flex items-start gap-2">
                  <select
                    value={linha.produtoId}
                    onChange={(e) => alterar(i, 'produtoId', e.target.value)}
                    className="min-w-0 flex-1 rounded-lg border border-slate-200 px-2.5 py-1.5 text-sm"
                  >
                    <option value="">Escolher produto…</option>
                    {produtos?.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.nome}
                      </option>
                    ))}
                  </select>

                  <input
                    type="number"
                    min="0"
                    step="any"
                    value={linha.quantidade}
                    onChange={(e) => alterar(i, 'quantidade', e.target.value)}
                    placeholder="Qtd"
                    className="w-24 rounded-lg border border-slate-200 px-2.5 py-1.5 text-right text-sm"
                  />

                  <button
                    type="button"
                    onClick={() => setLinhas((atual) => atual.filter((_, j) => j !== i))}
                    disabled={linhas.length === 1}
                    className="p-1.5 text-slate-300 hover:text-red-600 disabled:opacity-0"
                    aria-label="Remover linha"
                  >
                    <Trash2 size={15} />
                  </button>
                </div>
              ))}
            </div>

            <button
              type="button"
              onClick={() => setLinhas((atual) => [...atual, { produtoId: '', quantidade: '' }])}
              className="mt-2 inline-flex items-center gap-1.5 text-xs font-medium text-indigo-600 hover:text-indigo-800"
            >
              <Plus size={13} />
              Acrescentar linha
            </button>

            <p className="mt-2 text-xs text-slate-400">
              A quantidade que sai é confirmada na expedição — pode ser menor, se não houver
              disponível.
            </p>
          </div>
        </div>

        <div className="flex justify-end gap-2 border-t border-slate-100 px-5 py-3">
          <Button variant="ghost" onClick={aoFechar}>
            Cancelar
          </Button>
          <Button
            disabled={!origemId || !destinoId || mesmoArmazem || validas.length === 0 || solicitar.isPending}
            onClick={() =>
              solicitar.mutate({
                origemId,
                destinoId,
                motivo: motivo.trim() || undefined,
                itens: validas.map((l) => ({
                  produtoId: l.produtoId,
                  quantidade: Number(l.quantidade),
                })),
              })
            }
          >
            Solicitar
          </Button>
        </div>
      </div>
    </div>
  );
}
