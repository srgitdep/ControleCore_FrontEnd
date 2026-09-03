import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { Boxes, Plus, Trash2 } from 'lucide-react';
import { api } from '@/shared/config';

interface UnidadeMedida {
  id: string;
  codigo: string;
  nome: string;
  isActive: boolean;
}

interface Conversao {
  unidadeId: string;
  codigo: string;
  nome: string;
  factor: number;
}

interface ConversoesDoProduto {
  produtoId: string;
  unidadeBase: UnidadeMedida | null;
  unidadeCompra: UnidadeMedida | null;
  unidadeVenda: UnidadeMedida | null;
  conversoes: Conversao[];
}

/**
 * As unidades e conversões de um produto.
 *
 * ## Porque isto vive na ficha do produto
 *
 * Uma caixa de arroz tem 10 sacos e uma de sabão tem 24 barras. «Caixa» não tem um conteúdo
 * próprio — tem o conteúdo que aquele produto lhe dá. O factor é do produto, e é aqui que se
 * declara.
 *
 * Sem este painel, a única via para o declarar era o Swagger. Comprar à caixa ficava a
 * funcionar no servidor e inacessível a quem trabalha na loja.
 *
 * ## O factor é sempre contra a base
 *
 * «Quantas unidades base contém uma unidade desta.» A base vale 1 por definição e não precisa
 * de linha. Assim não há inverso guardado à parte que possa divergir do directo.
 */
export function ConversoesDoProduto({ produtoId }: { produtoId: string }) {
  const queryClient = useQueryClient();
  const [aAcrescentar, setAAcrescentar] = useState(false);
  const [unidadeNova, setUnidadeNova] = useState('');
  const [factorNovo, setFactorNovo] = useState('');

  const { data, isLoading } = useQuery({
    queryKey: ['conversoes', produtoId],
    queryFn: async () => {
      const { data } = await api.get<ConversoesDoProduto>(`/produtos/${produtoId}/conversoes`);
      return data;
    },
  });

  const { data: unidades } = useQuery({
    queryKey: ['unidades', false],
    queryFn: async () => {
      const { data } = await api.get<UnidadeMedida[]>('/unidades');
      return data;
    },
  });

  const invalidar = () => queryClient.invalidateQueries({ queryKey: ['conversoes', produtoId] });

  // A mensagem do servidor diz o que está errado: que a base não está definida, que o factor
  // é nulo, ou que se está a declarar a própria base. Trocá-la apagaria o que resolve.
  const aoFalhar = (erro: any) =>
    toast.error(erro?.response?.data?.message || 'Não foi possível concluir a operação.');

  const definirUnidades = useMutation({
    mutationFn: (payload: {
      unidadeBaseId?: string | null;
      unidadeCompraId?: string | null;
      unidadeVendaId?: string | null;
    }) => api.patch(`/produtos/${produtoId}/unidades`, payload),
    onSuccess: () => {
      invalidar();
      queryClient.invalidateQueries({ queryKey: ['products'] });
      toast.success('Unidades do produto actualizadas.');
    },
    onError: aoFalhar,
  });

  const definirConversao = useMutation({
    mutationFn: ({ unidadeId, factor }: { unidadeId: string; factor: number }) =>
      api.put(`/produtos/${produtoId}/conversoes/${unidadeId}`, { factor }),
    onSuccess: () => {
      invalidar();
      setAAcrescentar(false);
      setUnidadeNova('');
      setFactorNovo('');
      toast.success('Conversão declarada.');
    },
    onError: aoFalhar,
  });

  const removerConversao = useMutation({
    mutationFn: (unidadeId: string) =>
      api.delete(`/produtos/${produtoId}/conversoes/${unidadeId}`),
    onSuccess: () => {
      invalidar();
      toast.success('Conversão removida.');
    },
    onError: aoFalhar,
  });

  if (isLoading) return null;

  const base = data?.unidadeBase;
  const jaDeclaradas = new Set([
    ...(data?.conversoes.map((c) => c.unidadeId) ?? []),
    ...(base ? [base.id] : []),
  ]);
  const disponiveis = (unidades ?? []).filter((u) => !jaDeclaradas.has(u.id));

  return (
    <div className="mt-6 border-t border-slate-100 pt-5">
      <div className="flex items-center gap-2">
        <Boxes className="h-4 w-4 text-slate-400" />
        <h3 className="text-sm font-semibold text-slate-700">Unidades e conversões</h3>
      </div>

      <p className="mt-1 text-xs text-slate-400">
        A unidade base é aquela em que o stock é contado. As de compra e de venda são como as
        pessoas escrevem e lêem — compra-se a caixa, vende-se a unidade, e o sistema converte.
      </p>

      <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-3">
        <SelectorDeUnidade
          rotulo="Base"
          valor={base?.id ?? ''}
          unidades={unidades ?? []}
          aoMudar={(v) => definirUnidades.mutate({ unidadeBaseId: v || null })}
          ajuda="Muda-la com existências é recusado: o saldo passaria a ler-se noutra escala."
        />
        <SelectorDeUnidade
          rotulo="Compra"
          valor={data?.unidadeCompra?.id ?? ''}
          unidades={unidades ?? []}
          aoMudar={(v) => definirUnidades.mutate({ unidadeCompraId: v || null })}
        />
        <SelectorDeUnidade
          rotulo="Venda"
          valor={data?.unidadeVenda?.id ?? ''}
          unidades={unidades ?? []}
          aoMudar={(v) => definirUnidades.mutate({ unidadeVendaId: v || null })}
        />
      </div>

      {!base && (
        <p className="mt-3 rounded-lg bg-amber-50 px-3 py-2 text-xs text-amber-800">
          Sem unidade base não se podem declarar conversões: um factor sem base é um número sem
          referência.
        </p>
      )}

      {base && (
        <div className="mt-4">
          <div className="overflow-hidden rounded-lg border border-slate-200">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 text-xs text-slate-500">
                <tr>
                  <th className="px-3 py-2 text-left font-medium">Unidade</th>
                  <th className="px-3 py-2 text-right font-medium">Contém</th>
                  <th className="w-10" />
                </tr>
              </thead>

              <tbody className="divide-y divide-slate-100">
                {/* A base entra na lista com factor 1 mas não tem linha em base de dados: é o
                    ponto de referência de todas as outras, e omiti-la deixaria quem configura
                    sem saber contra o quê está a declarar. */}
                <tr className="bg-slate-50/50">
                  <td className="px-3 py-2">
                    <span className="font-semibold text-slate-800">{base.codigo}</span>
                    <span className="ml-2 text-xs text-slate-400">base</span>
                  </td>
                  <td className="px-3 py-2 text-right text-slate-500">1</td>
                  <td />
                </tr>

                {data?.conversoes.map((c) => (
                  <tr key={c.unidadeId}>
                    <td className="px-3 py-2">
                      <span className="font-medium text-slate-800">{c.codigo}</span>
                      <span className="ml-2 text-xs text-slate-400">{c.nome}</span>
                    </td>
                    <td className="px-3 py-2 text-right">
                      <span className="font-semibold text-slate-900">{c.factor}</span>
                      <span className="ml-1 text-xs text-slate-400">{base.codigo}</span>
                    </td>
                    <td className="px-2 py-2">
                      <button
                        type="button"
                        onClick={() => removerConversao.mutate(c.unidadeId)}
                        className="text-slate-300 hover:text-red-600"
                        aria-label={`Remover conversão para ${c.codigo}`}
                      >
                        <Trash2 size={14} />
                      </button>
                    </td>
                  </tr>
                ))}

                {aAcrescentar && (
                  <tr className="bg-blue-50/40">
                    <td className="px-3 py-2">
                      <select
                        value={unidadeNova}
                        onChange={(e) => setUnidadeNova(e.target.value)}
                        className="w-full rounded border border-slate-200 px-2 py-1 text-sm"
                      >
                        <option value="">Escolher unidade…</option>
                        {disponiveis.map((u) => (
                          <option key={u.id} value={u.id}>
                            {u.codigo} — {u.nome}
                          </option>
                        ))}
                      </select>
                    </td>
                    <td className="px-3 py-2">
                      <div className="flex items-center justify-end gap-1.5">
                        <input
                          type="number"
                          step="any"
                          min="0"
                          value={factorNovo}
                          onChange={(e) => setFactorNovo(e.target.value)}
                          placeholder="24"
                          className="w-20 rounded border border-slate-200 px-2 py-1 text-right text-sm"
                        />
                        <span className="text-xs text-slate-400">{base.codigo}</span>
                        <button
                          type="button"
                          disabled={
                            !unidadeNova || !factorNovo || Number(factorNovo) <= 0 || definirConversao.isPending
                          }
                          onClick={() =>
                            definirConversao.mutate({
                              unidadeId: unidadeNova,
                              factor: Number(factorNovo),
                            })
                          }
                          className="rounded bg-indigo-600 px-2 py-1 text-xs font-medium text-white hover:bg-indigo-700 disabled:opacity-40"
                        >
                          Gravar
                        </button>
                      </div>
                    </td>
                    <td className="px-2 py-2">
                      <button
                        type="button"
                        onClick={() => setAAcrescentar(false)}
                        className="text-xs text-slate-400 hover:text-slate-600"
                      >
                        ✕
                      </button>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {!aAcrescentar && disponiveis.length > 0 && (
            <button
              type="button"
              onClick={() => setAAcrescentar(true)}
              className="mt-2 inline-flex items-center gap-1.5 text-xs font-medium text-indigo-600 hover:text-indigo-800"
            >
              <Plus size={13} />
              Declarar conversão
            </button>
          )}

          <p className="mt-2 text-xs text-slate-400">
            «Contém» é quantas unidades base cabem numa. Uma caixa de 24 tem 24. Com isto
            declarado, a recepção aceita a mercadoria em {base.codigo} e converte sozinha —
            quantidade e custo.
          </p>
        </div>
      )}
    </div>
  );
}

function SelectorDeUnidade({
  rotulo,
  valor,
  unidades,
  aoMudar,
  ajuda,
}: {
  rotulo: string;
  valor: string;
  unidades: UnidadeMedida[];
  aoMudar: (valor: string) => void;
  ajuda?: string;
}) {
  return (
    <div>
      <label className="block text-xs font-medium text-slate-600">{rotulo}</label>
      <select
        value={valor}
        onChange={(e) => aoMudar(e.target.value)}
        className="mt-1 w-full rounded-lg border border-slate-200 px-2.5 py-1.5 text-sm focus:border-blue-400 focus:outline-none"
      >
        <option value="">—</option>
        {unidades.map((u) => (
          <option key={u.id} value={u.id}>
            {u.codigo}
          </option>
        ))}
      </select>
      {ajuda && <p className="mt-1 text-[11px] text-slate-400">{ajuda}</p>}
    </div>
  );
}
