import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Plus, Trash2, X } from 'lucide-react';
import { api } from '@/shared/config';
import { Button } from '@/shared/ui';
import { useArmazens } from '@/features/lojas';
import type { PrioridadeRequisicao } from '../api/requisicoes.api';
import { useRequisicaoMutations } from '../hooks/useRequisicoes';

interface ProdutoSimples {
  id: string;
  nome: string;
  precoCusto: number;
  unidadeMedida: string;
}

interface LinhaEmEdicao {
  produtoId: string;
  quantidade: string;
  custoEstimado: string;
}

const PRIORIDADES: { valor: PrioridadeRequisicao; rotulo: string; ajuda?: string }[] = [
  { valor: 'BAIXA', rotulo: 'Baixa' },
  { valor: 'NORMAL', rotulo: 'Normal' },
  { valor: 'ALTA', rotulo: 'Alta' },
  { valor: 'URGENTE', rotulo: 'Urgente', ajuda: 'Já falta na prateleira' },
];

/**
 * Criar uma requisição.
 *
 * ## Nasce em rascunho, e é submetida à parte
 *
 * Criar e submeter são dois passos porque são duas decisões: escrever o que faz falta, e
 * assumi-lo perante quem aprova. O motivo é exigido na submissão e não aqui — um rascunho
 * ainda está a ser pensado.
 *
 * ## O custo estimado não é preço acordado
 *
 * Vem do último custo conhecido do produto e serve para somar o valor e escolher o escalão de
 * aprovação. Deixá-lo a zero faria a requisição cair sempre no escalão mais baixo, e uma
 * compra grande seria aprovada por quem não tem alçada para ela.
 */
export function CriarRequisicaoModal({ aoFechar }: { aoFechar: () => void }) {
  const { criar } = useRequisicaoMutations();
  const { armazens } = useArmazens();

  const [departamento, setDepartamento] = useState('');
  const [armazemId, setArmazemId] = useState('');
  const [prioridade, setPrioridade] = useState<PrioridadeRequisicao>('NORMAL');
  const [motivo, setMotivo] = useState('');
  const [linhas, setLinhas] = useState<LinhaEmEdicao[]>([
    { produtoId: '', quantidade: '', custoEstimado: '' },
  ]);

  const { data: produtos } = useQuery({
    queryKey: ['produtos-para-requisicao'],
    queryFn: async () => {
      const { data } = await api.get<{ data: ProdutoSimples[] }>('/produtos', {
        params: { limit: 500 },
      });
      return Array.isArray(data) ? (data as unknown as ProdutoSimples[]) : (data.data ?? []);
    },
  });

  const porId = new Map((produtos ?? []).map((p) => [p.id, p]));

  const alterar = (i: number, campo: keyof LinhaEmEdicao, valor: string) =>
    setLinhas((atual) =>
      atual.map((linha, indice) => {
        if (indice !== i) return linha;

        // Escolher o produto preenche a estimativa com o último custo conhecido. Quem sabe
        // outro corrige; quem não sabe fica com um número melhor do que zero.
        if (campo === 'produtoId' && !linha.custoEstimado) {
          const custo = porId.get(valor)?.precoCusto;
          return { ...linha, produtoId: valor, custoEstimado: custo ? String(custo) : '' };
        }

        return { ...linha, [campo]: valor };
      }),
    );

  const validas = linhas.filter((l) => l.produtoId && Number(l.quantidade) > 0);

  const total = validas.reduce(
    (soma, l) => soma + Number(l.quantidade) * Number(l.custoEstimado || 0),
    0,
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="flex max-h-[90vh] w-full max-w-2xl flex-col rounded-lg bg-white shadow-xl">
        <div className="flex items-center justify-between border-b border-slate-100 px-5 py-3">
          <div>
            <h3 className="font-semibold text-slate-900">Nova requisição</h3>
            <p className="mt-0.5 text-xs text-slate-500">
              Nasce em rascunho. Submeter é um passo à parte.
            </p>
          </div>
          <button onClick={aoFechar} className="text-slate-400 hover:text-slate-600">
            <X size={18} />
          </button>
        </div>

        <div className="flex-1 space-y-4 overflow-y-auto p-5">
          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <label className="text-sm font-medium text-slate-700">
                Departamento <span className="font-normal text-slate-400">(opcional)</span>
              </label>
              <input
                value={departamento}
                onChange={(e) => setDepartamento(e.target.value)}
                placeholder="Talho, Padaria, Limpeza…"
                className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-blue-400 focus:outline-none"
              />
            </div>

            <div>
              <label className="text-sm font-medium text-slate-700">
                Onde faz falta <span className="font-normal text-slate-400">(opcional)</span>
              </label>
              <select
                value={armazemId}
                onChange={(e) => setArmazemId(e.target.value)}
                className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-blue-400 focus:outline-none"
              >
                <option value="">—</option>
                {armazens.map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.etiqueta}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="text-sm font-medium text-slate-700">Prioridade</label>
            <div className="mt-1 flex flex-wrap gap-2">
              {PRIORIDADES.map((p) => (
                <button
                  key={p.valor}
                  type="button"
                  onClick={() => setPrioridade(p.valor)}
                  title={p.ajuda}
                  className={`rounded-full border px-3 py-1.5 text-sm transition-colors ${
                    prioridade === p.valor
                      ? 'border-slate-900 bg-slate-900 text-white'
                      : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  {p.rotulo}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="text-sm font-medium text-slate-700">
              Motivo <span className="font-normal text-slate-400">(exigido ao submeter)</span>
            </label>
            <textarea
              value={motivo}
              onChange={(e) => setMotivo(e.target.value)}
              rows={2}
              placeholder="Ruptura no fim-de-semana; a promoção começa dia 12…"
              className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-blue-400 focus:outline-none"
            />
            <p className="mt-1 text-xs text-slate-400">
              Quem aprova decide sobre uma necessidade. Sem motivo, pede-se-lhe que assine no
              escuro.
            </p>
          </div>

          <div>
            <div className="mb-2 flex items-center justify-between">
              <label className="text-sm font-medium text-slate-700">O que faz falta</label>
              {total > 0 && (
                <span className="text-xs text-slate-500">
                  Estimativa: <span className="font-semibold">{total.toFixed(2)} MT</span>
                </span>
              )}
            </div>

            <div className="space-y-2">
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
                    className="w-20 rounded-lg border border-slate-200 px-2.5 py-1.5 text-right text-sm"
                  />

                  <input
                    type="number"
                    min="0"
                    step="any"
                    value={linha.custoEstimado}
                    onChange={(e) => alterar(i, 'custoEstimado', e.target.value)}
                    placeholder="Custo"
                    title="Estimativa por unidade. Serve para escolher o escalão de aprovação, não é preço acordado."
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
              onClick={() =>
                setLinhas((atual) => [...atual, { produtoId: '', quantidade: '', custoEstimado: '' }])
              }
              className="mt-2 inline-flex items-center gap-1.5 text-xs font-medium text-indigo-600 hover:text-indigo-800"
            >
              <Plus size={13} />
              Acrescentar linha
            </button>
          </div>
        </div>

        <div className="flex justify-end gap-2 border-t border-slate-100 px-5 py-3">
          <Button variant="ghost" onClick={aoFechar}>
            Cancelar
          </Button>
          <Button
            disabled={validas.length === 0 || criar.isPending}
            onClick={() =>
              criar.mutate(
                {
                  departamento: departamento.trim() || undefined,
                  armazemId: armazemId || undefined,
                  prioridade,
                  motivo: motivo.trim() || undefined,
                  itens: validas.map((l) => ({
                    produtoId: l.produtoId,
                    quantidade: Number(l.quantidade),
                    custoEstimado: l.custoEstimado ? Number(l.custoEstimado) : undefined,
                  })),
                },
                { onSuccess: aoFechar },
              )
            }
          >
            Criar rascunho
          </Button>
        </div>
      </div>
    </div>
  );
}
