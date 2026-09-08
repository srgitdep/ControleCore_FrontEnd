import { useState } from 'react';
import { AlertTriangle, ArrowRight, MapPin, Warehouse } from 'lucide-react';
import { Button } from '@/shared/ui';
import { useLocalizacoes } from '@/features/armazens';
import { useDistribuicao, useDistribuicaoMutations, useOndeEsta } from '../hooks/useDistribuicao';
import type { NoLocalizacao } from '@/features/armazens';

interface LocalizacaoStockModalProps {
  stockId: string | null;
  produtoId: string | null;
  armazemId: string | null;
  onClose: () => void;
  produtoNome?: string | null;
  armazemNome?: string | null;
  unidade?: string;
}

/** Achata a árvore para um selector: cada opção é o caminho completo, que é o endereço. */
function achatar(nos: NoLocalizacao[]): NoLocalizacao[] {
  return nos.flatMap((no) => [no, ...achatar(no.filhos)]);
}

/**
 * Onde está a mercadoria — dentro deste armazém, e em todos.
 *
 * ## Dois separadores porque são duas escalas da mesma pergunta
 *
 * «Em que prateleira está aqui» é operacional e editável: quem conta o armazém corrige o que
 * encontrou. «Em que armazéns está» é uma consulta — não se muda a distribuição entre
 * armazéns por aqui, isso é uma transferência, que gera movimento.
 *
 * Juntá-los num só modal evita duas entradas no menu da linha, que já é longo, e junta o que
 * quem procura mercadoria pergunta ao mesmo tempo.
 */
export function LocalizacaoStockModal({
  stockId,
  produtoId,
  armazemId,
  onClose,
  produtoNome,
  armazemNome,
  unidade = 'UN',
}: LocalizacaoStockModalProps) {
  const [separador, setSeparador] = useState<'aqui' | 'todos'>('aqui');
  const [novaLocalizacao, setNovaLocalizacao] = useState('');
  const [novaQuantidade, setNovaQuantidade] = useState<number | ''>('');

  const { data: distribuicao, isLoading } = useDistribuicao(stockId ?? undefined);
  const { data: arvore } = useLocalizacoes(armazemId ?? undefined);
  const { data: ondeEsta } = useOndeEsta(separador === 'todos' ? (produtoId ?? undefined) : undefined);
  const mutacoes = useDistribuicaoMutations(stockId ?? undefined);

  if (!stockId) return null;

  const posicoes = distribuicao?.posicoes ?? [];
  const resumo = distribuicao?.resumo;

  const todasAsLocalizacoes = achatar(arvore?.arvore ?? []);
  // As que ainda não têm mercadoria deste produto — as outras editam-se na lista de cima.
  const porAtribuir = todasAsLocalizacoes.filter(
    (l) => l.isActive && !posicoes.some((p) => p.localizacaoId === l.id),
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="flex max-h-[90vh] w-full max-w-2xl flex-col overflow-hidden rounded-xl bg-white shadow-2xl">
        <div className="flex items-start justify-between gap-3 border-b border-slate-100 bg-slate-50 p-5">
          <div className="flex items-start gap-3">
            <MapPin className="mt-0.5 h-5 w-5 flex-shrink-0 text-slate-500" />
            <div>
              <h2 className="font-bold text-slate-800">Onde está a mercadoria</h2>
              <p className="text-sm text-slate-500">{produtoNome}</p>
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

        <div className="flex gap-1 border-b border-slate-100 px-5 pt-3">
          {(
            [
              ['aqui', armazemNome ?? 'Neste armazém'],
              ['todos', 'Em todos os armazéns'],
            ] as const
          ).map(([id, rotulo]) => (
            <button
              key={id}
              type="button"
              onClick={() => setSeparador(id)}
              className={`rounded-t-lg px-4 py-2 text-sm font-medium transition-colors ${
                separador === id
                  ? 'border-b-2 border-blue-600 text-blue-700'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              {rotulo}
            </button>
          ))}
        </div>

        <div className="flex-1 space-y-4 overflow-y-auto p-5">
          {separador === 'aqui' ? (
            <>
              {resumo && (
                <div className="grid grid-cols-3 gap-2 text-sm">
                  <div className="rounded-lg border border-slate-200 px-3 py-2">
                    <span className="block text-[11px] uppercase tracking-wide text-slate-400">
                      Em armazém
                    </span>
                    <span className="font-semibold tabular-nums text-slate-800">
                      {resumo.saldoFisico} {unidade}
                    </span>
                  </div>
                  <div className="rounded-lg border border-slate-200 px-3 py-2">
                    <span className="block text-[11px] uppercase tracking-wide text-slate-400">
                      Localizado
                    </span>
                    <span className="font-semibold tabular-nums text-slate-800">
                      {resumo.localizado} ({resumo.percentagemLocalizada}%)
                    </span>
                  </div>
                  <div className="rounded-lg border border-slate-200 px-3 py-2">
                    <span className="block text-[11px] uppercase tracking-wide text-slate-400">
                      Por localizar
                    </span>
                    <span
                      className={`font-semibold tabular-nums ${
                        resumo.porLocalizar > 0 ? 'text-amber-700' : 'text-slate-800'
                      }`}
                    >
                      {resumo.porLocalizar} {unidade}
                    </span>
                  </div>
                </div>
              )}

              {/* Não devia acontecer: as operações recusam-no. Pode resultar de uma saída que
                  não passou por nenhuma posição, e é mostrado em vez de escondido. */}
              {resumo?.excedeSaldo && (
                <p className="flex items-start gap-2 rounded-lg bg-amber-50 px-3 py-2 text-sm text-amber-900">
                  <AlertTriangle className="mt-0.5 h-4 w-4 flex-shrink-0" />
                  As posições somam mais do que o saldo em armazém. Alguma saída de mercadoria
                  não passou pelas prateleiras — recontar e corrigir.
                </p>
              )}

              {isLoading ? (
                <p className="py-6 text-center text-sm text-slate-400">A carregar...</p>
              ) : todasAsLocalizacoes.length === 0 ? (
                <div className="rounded-xl border border-dashed border-slate-200 px-4 py-6 text-center">
                  <p className="text-sm text-slate-600">
                    Este armazém não tem posições definidas.
                  </p>
                  <p className="mt-1 text-xs text-slate-400">
                    Crie-as no separador «Posições» do armazém, em Lojas → Armazéns.
                  </p>
                </div>
              ) : (
                <>
                  <div className="space-y-2">
                    {posicoes.length === 0 && (
                      <p className="text-sm text-slate-500">
                        Nenhuma posição atribuída — sabe-se que está neste armazém, mas não em
                        que prateleira.
                      </p>
                    )}

                    {posicoes.map((p) => (
                      <LinhaDePosicao
                        key={p.localizacaoId}
                        caminho={p.caminho}
                        activa={p.activa}
                        quantidade={p.quantidade}
                        unidade={unidade}
                        aDecorrer={mutacoes.aDecorrer}
                        onGravar={(quantidade) =>
                          mutacoes.atribuir.mutate({ localizacaoId: p.localizacaoId, quantidade })
                        }
                      />
                    ))}
                  </div>

                  {porAtribuir.length > 0 && (
                    <form
                      onSubmit={(e) => {
                        e.preventDefault();
                        const q = Number(novaQuantidade);
                        if (!novaLocalizacao || !(q > 0)) return;
                        mutacoes.atribuir.mutate(
                          { localizacaoId: novaLocalizacao, quantidade: q },
                          {
                            onSuccess: () => {
                              setNovaLocalizacao('');
                              setNovaQuantidade('');
                            },
                          },
                        );
                      }}
                      className="flex flex-wrap items-end gap-2 rounded-xl border border-slate-200 bg-slate-50/60 p-3"
                    >
                      <label className="min-w-[12rem] flex-1">
                        <span className="mb-1 block text-xs font-medium text-slate-600">
                          Pôr numa posição
                        </span>
                        <select
                          value={novaLocalizacao}
                          onChange={(e) => setNovaLocalizacao(e.target.value)}
                          className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
                        >
                          <option value="">Escolher...</option>
                          {porAtribuir.map((l) => (
                            <option key={l.id} value={l.id}>
                              {l.caminho}
                              {l.nome ? ` — ${l.nome}` : ''}
                            </option>
                          ))}
                        </select>
                      </label>

                      <label className="w-28">
                        <span className="mb-1 block text-xs font-medium text-slate-600">
                          Quantidade
                        </span>
                        <input
                          type="number"
                          min="0"
                          step="any"
                          value={novaQuantidade}
                          onChange={(e) =>
                            setNovaQuantidade(e.target.value === '' ? '' : Number(e.target.value))
                          }
                          className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
                        />
                      </label>

                      <Button
                        type="submit"
                        size="sm"
                        disabled={!novaLocalizacao || !(Number(novaQuantidade) > 0) || mutacoes.aDecorrer}
                      >
                        Atribuir
                      </Button>
                    </form>
                  )}

                  <p className="text-xs leading-relaxed text-slate-500">
                    A quantidade é o que está <strong>nessa</strong> posição, e substitui o que
                    lá estava registado — escreva o que contou, não a diferença. Pôr a zero
                    retira a atribuição. Isto não gera movimento de stock: a mercadoria não sai
                    do armazém.
                  </p>
                </>
              )}
            </>
          ) : (
            <>
              {!ondeEsta ? (
                <p className="py-6 text-center text-sm text-slate-400">A carregar...</p>
              ) : ondeEsta.armazens.length === 0 ? (
                <p className="py-6 text-center text-sm text-slate-500">
                  Este produto não tem existências em nenhum armazém.
                </p>
              ) : (
                <>
                  <p className="text-sm text-slate-600">
                    <strong className="tabular-nums">{ondeEsta.total}</strong> {unidade} no
                    total, em {ondeEsta.armazens.length}{' '}
                    {ondeEsta.armazens.length === 1 ? 'armazém' : 'armazéns'}.
                  </p>

                  {ondeEsta.armazens.map((a) => (
                    <div key={a.armazemId} className="rounded-xl border border-slate-200 p-3">
                      <div className="mb-2 flex items-center justify-between gap-2">
                        <span className="flex items-center gap-2 font-medium text-slate-800">
                          <Warehouse className="h-4 w-4 text-slate-400" />
                          {a.armazem}
                          {a.loja && <span className="text-xs text-slate-400">· {a.loja}</span>}
                        </span>
                        <span className="font-semibold tabular-nums text-slate-800">
                          {a.quantidade} {unidade}
                        </span>
                      </div>

                      {a.localizacoes.length > 0 ? (
                        <ul className="space-y-0.5 text-sm">
                          {a.localizacoes.map((l) => (
                            <li
                              key={l.localizacaoId}
                              className="flex justify-between gap-2 text-slate-600"
                            >
                              <span>{l.caminho}{l.nome ? ` — ${l.nome}` : ''}</span>
                              <span className="tabular-nums">{l.quantidade}</span>
                            </li>
                          ))}
                        </ul>
                      ) : (
                        <p className="text-xs text-slate-400">Sem posições atribuídas.</p>
                      )}

                      {/* Dizê-lo é a diferença entre «está tudo localizado» e «localizámos
                          parte» — sem isso alguém procura no sítio errado. */}
                      {a.porLocalizar > 0 && (
                        <p className="mt-1 text-xs text-amber-700">
                          {a.porLocalizar} {unidade} sem posição atribuída neste armazém.
                        </p>
                      )}

                      {a.lotes.length > 0 && (
                        <div className="mt-2 border-t border-slate-100 pt-2">
                          <p className="mb-1 text-[11px] uppercase tracking-wide text-slate-400">
                            Lotes
                          </p>
                          <ul className="space-y-0.5 text-xs text-slate-600">
                            {a.lotes.map((l) => (
                              <li key={l.loteId} className="flex flex-wrap gap-x-2">
                                <span className="font-medium">{l.codigo}</span>
                                <span className="tabular-nums">{l.quantidade} {unidade}</span>
                                {l.dataValidade && (
                                  <span>
                                    · válido até{' '}
                                    {new Date(l.dataValidade).toLocaleDateString('pt-PT')}
                                  </span>
                                )}
                                {l.caminho && (
                                  <span className="flex items-center gap-1 text-slate-500">
                                    <ArrowRight className="h-3 w-3" />
                                    {l.caminho}
                                  </span>
                                )}
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  ))}

                  <p className="text-xs leading-relaxed text-slate-500">
                    Para mover mercadoria entre armazéns use uma transferência de stock — isso
                    é uma saída e uma entrada, e gera movimento. Aqui só se vê.
                  </p>
                </>
              )}
            </>
          )}
        </div>

        <div className="flex justify-end border-t border-slate-100 px-5 py-3">
          <Button type="button" variant="ghost" onClick={onClose}>
            Fechar
          </Button>
        </div>
      </div>
    </div>
  );
}

// ── Uma posição, editável ────────────────────────────────────────────────────

function LinhaDePosicao({
  caminho,
  activa,
  quantidade,
  unidade,
  aDecorrer,
  onGravar,
}: {
  caminho: string;
  activa: boolean;
  quantidade: number;
  unidade: string;
  aDecorrer: boolean;
  onGravar: (quantidade: number) => void;
}) {
  const [valor, setValor] = useState<number | ''>(quantidade);
  const mudou = Number(valor) !== quantidade;

  return (
    <div className="flex flex-wrap items-center gap-2 rounded-lg border border-slate-200 px-3 py-2">
      <span className="min-w-0 flex-1">
        <span className="font-medium text-slate-800">{caminho}</span>
        {!activa && (
          <span className="ml-2 text-[11px] font-medium text-amber-700">
            posição desactivada
          </span>
        )}
      </span>

      <input
        type="number"
        min="0"
        step="any"
        value={valor}
        onChange={(e) => setValor(e.target.value === '' ? '' : Number(e.target.value))}
        className="w-24 rounded-lg border border-slate-200 px-2 py-1.5 text-sm tabular-nums"
      />
      <span className="text-xs text-slate-400">{unidade}</span>

      {/* Só aparece quando há algo para gravar: um botão sempre activo convida a carregar
          sem ter mudado nada, e cada carregamento é uma escrita. */}
      {mudou && (
        <Button
          size="sm"
          variant="ghost"
          disabled={aDecorrer}
          onClick={() => onGravar(Number(valor))}
        >
          Gravar
        </Button>
      )}
    </div>
  );
}
