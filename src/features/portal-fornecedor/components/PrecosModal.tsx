import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Info, Loader2, Plus, Trash2, X } from 'lucide-react';
import toast from 'react-hot-toast';
import { portal } from '../api/portal.api';
import type { ArtigoVitrine, PrecoArtigo } from '../api/portal.api';
import { cn, mensagemDeErro } from '@/shared/utils';

interface Props {
  artigo: ArtigoVitrine;
  onClose: () => void;
  onSuccess: () => void;
}

const mt = (v: number) =>
  `${v.toLocaleString('pt-PT', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} MT`;

const hoje = () => new Date().toISOString().slice(0, 10);

/**
 * Os preços de um artigo: escalões e vigência.
 *
 * ## Publicar um preço não sobrescreve o anterior
 *
 * Fecha-o. O preço antigo fica com data de fim e nunca é apagado — é ele que responde a
 * «quanto custava quando o cliente comprou», que é a pergunta da conferência de factura.
 *
 * Por isso este ecrã mostra o histórico e não só o preço actual: um fornecedor que veja
 * apenas o preço em vigor não percebe porque é que não pode «corrigir» um preço antigo, e
 * insiste.
 *
 * ## Escalões coexistem
 *
 * 50 a partir de 1 unidade e 46 a partir de 100 valem **ao mesmo tempo**. Publicar o de 100
 * não fecha o de 1 — se o fizesse, as encomendas pequenas ficavam sem preço. O ecrã agrupa
 * por escalão para isso ficar visível.
 */
export function PrecosModal({ artigo, onClose, onSuccess }: Props) {
  const queryClient = useQueryClient();

  const [novo, setNovo] = useState({
    preco: '',
    quantidadeMinima: '1',
    vigenteDe: hoje(),
    vigenteAte: '',
    promocional: false,
  });

  const recarregar = () => {
    queryClient.invalidateQueries({ queryKey: ['portal-artigos'] });
    onSuccess();
  };

  const publicar = useMutation({
    mutationFn: () =>
      portal.publicarPreco(artigo.id, {
        preco: Number(novo.preco),
        quantidadeMinima: Number(novo.quantidadeMinima),
        // Enviado como data-hora: o backend compara com `new Date()`, e uma data sem hora
        // chega como meia-noite UTC — que em Maputo (UTC+2) é ainda o dia anterior às 22h.
        // Um preço «a partir de hoje» não entraria em vigor até às 2h da manhã.
        vigenteDe: new Date(`${novo.vigenteDe}T00:00:00`).toISOString(),
        vigenteAte: novo.vigenteAte
          ? new Date(`${novo.vigenteAte}T23:59:59`).toISOString()
          : undefined,
        promocional: novo.promocional,
      }),
    onSuccess: () => {
      toast.success('Preço publicado. O anterior deste escalão foi fechado, não apagado.');
      setNovo({ ...novo, preco: '' });
      recarregar();
    },
    onError: (e: any) => toast.error(mensagemDeErro(e, 'Erro ao publicar o preço.')),
  });

  const apagar = useMutation({
    mutationFn: (precoId: string) => portal.apagarPreco(precoId),
    onSuccess: () => {
      toast.success('Preço futuro removido.');
      recarregar();
    },
    onError: (e: any) =>
      toast.error(
        mensagemDeErro(e, 'Só preços que ainda não entraram em vigor podem ser removidos.'),
      ),
  });

  const submeter = (e: React.FormEvent) => {
    e.preventDefault();

    const preco = Number(novo.preco);
    if (!Number.isFinite(preco) || preco <= 0) {
      toast.error('O preço tem de ser maior do que zero.');
      return;
    }

    const minima = Number(novo.quantidadeMinima);
    if (!Number.isFinite(minima) || minima <= 0) {
      toast.error('A quantidade mínima tem de ser maior do que zero.');
      return;
    }

    if (novo.vigenteAte && novo.vigenteAte < novo.vigenteDe) {
      toast.error('A data de fim não pode ser anterior à de início.');
      return;
    }

    publicar.mutate();
  };

  const agora = Date.now();
  const escaloes = agruparPorEscalao(artigo.precos);
  const precoNovo = Number(novo.preco);

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-slate-900/50 p-4">
      <div className="my-4 w-full max-w-2xl rounded-xl bg-white shadow-xl">
        <header className="flex items-start justify-between border-b border-slate-100 px-5 py-4">
          <div>
            <h2 className="text-base font-semibold text-slate-900">Preços</h2>
            <p className="mt-0.5 text-xs text-slate-500">
              {artigo.nome} · <span className="font-mono">{artigo.referencia}</span>
              {artigo.factorConversao !== 1 && (
                <>
                  {' '}
                  · 1 {artigo.unidadeVenda ?? 'embalagem'} = {artigo.factorConversao} unidades
                </>
              )}
            </p>
          </div>
          <button onClick={onClose} className="p-1 text-slate-400 hover:text-slate-600">
            <X size={18} />
          </button>
        </header>

        <div className="space-y-5 px-5 py-5">
          {/* ── Publicar ───────────────────────────────────────────── */}
          <form onSubmit={submeter} className="rounded-lg border border-slate-200 p-4">
            <h3 className="text-sm font-medium text-slate-800">Publicar um preço</h3>

            <div className="mt-3 grid gap-3 sm:grid-cols-2">
              <div>
                <label className="block text-xs font-medium text-slate-700">
                  Preço por {artigo.unidadeVenda ?? 'unidade'} <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  step="any"
                  min="0"
                  value={novo.preco}
                  onChange={(e) => setNovo({ ...novo, preco: e.target.value })}
                  required
                  className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
                />
                {/* O comprador compara por unidade base. Mostrar a conversão aqui evita o
                    erro mais comum do formulário: escrever o preço por unidade quando o
                    artigo é vendido à caixa. */}
                {artigo.factorConversao !== 1 && Number.isFinite(precoNovo) && precoNovo > 0 && (
                  <p className="mt-1 text-[11px] text-blue-700">
                    Será comparado como <strong>{mt(precoNovo / artigo.factorConversao)}</strong>{' '}
                    por unidade.
                  </p>
                )}
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700">
                  A partir de que quantidade
                </label>
                <input
                  type="number"
                  step="any"
                  min="1"
                  value={novo.quantidadeMinima}
                  onChange={(e) => setNovo({ ...novo, quantidadeMinima: e.target.value })}
                  className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
                />
                <p className="mt-1 text-[11px] leading-snug text-slate-500">
                  1 é o preço base. Um escalão de 100 aplica-se a encomendas de 100 ou mais, e
                  não substitui o de 1.
                </p>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700">Em vigor a partir de</label>
                <input
                  type="date"
                  value={novo.vigenteDe}
                  onChange={(e) => setNovo({ ...novo, vigenteDe: e.target.value })}
                  required
                  className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
                />
                <p className="mt-1 text-[11px] leading-snug text-slate-500">
                  Pode ser futuro — o preço entra em vigor sozinho nesse dia.
                </p>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700">Até (opcional)</label>
                <input
                  type="date"
                  value={novo.vigenteAte}
                  onChange={(e) => setNovo({ ...novo, vigenteAte: e.target.value })}
                  className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
                />
                <p className="mt-1 text-[11px] leading-snug text-slate-500">
                  Vazio = até nova ordem.
                </p>
              </div>
            </div>

            <label className="mt-3 flex items-center gap-2 text-xs text-slate-700">
              <input
                type="checkbox"
                checked={novo.promocional}
                onChange={(e) => setNovo({ ...novo, promocional: e.target.checked })}
                className="rounded border-slate-300"
              />
              É uma promoção
            </label>

            <div className="mt-3 flex items-start gap-2 rounded bg-slate-50 px-2.5 py-2">
              <Info size={12} className="mt-0.5 shrink-0 text-slate-400" />
              <p className="text-[11px] leading-snug text-slate-600">
                Publicar fecha o preço anterior <strong>do mesmo escalão</strong> — não o
                apaga. O antigo continua a responder a «quanto custava quando o cliente
                comprou», que é a pergunta da conferência de factura.
              </p>
            </div>

            <button
              type="submit"
              disabled={publicar.isPending}
              className="mt-3 inline-flex items-center gap-2 rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
            >
              {publicar.isPending ? (
                <Loader2 size={15} className="animate-spin" />
              ) : (
                <Plus size={15} />
              )}
              Publicar preço
            </button>
          </form>

          {/* ── Histórico ──────────────────────────────────────────── */}
          <section>
            <h3 className="text-sm font-medium text-slate-800">
              Escalões e histórico
              <span className="ml-1.5 text-xs font-normal text-slate-500">
                ({artigo.precos.length} {artigo.precos.length === 1 ? 'registo' : 'registos'})
              </span>
            </h3>

            {artigo.precos.length === 0 ? (
              <p className="mt-2 rounded-lg border border-dashed border-slate-300 py-6 text-center text-sm text-slate-500">
                Ainda não publicou nenhum preço. Sem preço, o artigo não aparece em nenhuma
                comparação.
              </p>
            ) : (
              <div className="mt-2 space-y-3">
                {escaloes.map(({ quantidadeMinima, precos }) => (
                  <div key={quantidadeMinima} className="rounded-lg border border-slate-200">
                    <p className="border-b border-slate-100 bg-slate-50 px-3 py-1.5 text-xs font-medium text-slate-600">
                      A partir de {quantidadeMinima}{' '}
                      {artigo.unidadeVenda ? `${artigo.unidadeVenda}(s)` : 'unidade(s)'}
                    </p>
                    <ul className="divide-y divide-slate-100">
                      {precos.map((p) => {
                        const de = new Date(p.vigenteDe).getTime();
                        const ate = p.vigenteAte ? new Date(p.vigenteAte).getTime() : Infinity;
                        const emVigor = de <= agora && ate > agora;
                        const futuro = de > agora;

                        return (
                          <li key={p.id} className="flex items-center gap-3 px-3 py-2">
                            <span
                              className={cn(
                                'shrink-0 rounded px-1.5 py-0.5 text-[10px] font-medium uppercase',
                                emVigor
                                  ? 'bg-emerald-100 text-emerald-700'
                                  : futuro
                                    ? 'bg-blue-100 text-blue-700'
                                    : 'bg-slate-100 text-slate-500',
                              )}
                            >
                              {emVigor ? 'em vigor' : futuro ? 'agendado' : 'fechado'}
                            </span>

                            <span className="text-sm font-medium text-slate-900">
                              {mt(p.preco)}
                            </span>

                            {p.promocional && (
                              <span className="text-[10px] font-medium text-amber-600">
                                promoção
                              </span>
                            )}

                            <span className="ml-auto text-right text-[11px] leading-tight text-slate-500">
                              {new Date(p.vigenteDe).toLocaleDateString('pt-PT')}
                              {p.vigenteAte
                                ? ` — ${new Date(p.vigenteAte).toLocaleDateString('pt-PT')}`
                                : ' — sem fim'}
                            </span>

                            {/* Só os agendados. Apagar um preço que já valeu destruiria a
                                prova de qual era o preço acordado quando a ordem foi
                                emitida — e o backend recusa, com uma mensagem que este
                                botão evita ter de mostrar. */}
                            {futuro && (
                              <button
                                onClick={() => apagar.mutate(p.id)}
                                disabled={apagar.isPending}
                                className="shrink-0 p-1 text-slate-400 hover:text-red-600 disabled:opacity-50"
                                title="Remover este preço agendado"
                              >
                                <Trash2 size={13} />
                              </button>
                            )}
                          </li>
                        );
                      })}
                    </ul>
                  </div>
                ))}
              </div>
            )}
          </section>
        </div>

        <footer className="flex justify-end rounded-b-xl border-t border-slate-100 bg-slate-50 px-5 py-4">
          <button
            onClick={onClose}
            className="rounded-md border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-white"
          >
            Fechar
          </button>
        </footer>
      </div>
    </div>
  );
}

/**
 * Agrupa por escalão, com o mais recente primeiro dentro de cada.
 *
 * Agrupar é o que torna visível que os escalões coexistem. Uma lista plana ordenada por data
 * daria a impressão de que o último preço publicado substituiu todos os outros — que é
 * precisamente o mal-entendido que faz um fornecedor publicar o preço de grosso e ficar sem
 * preço para encomendas pequenas.
 */
function agruparPorEscalao(precos: PrecoArtigo[]) {
  const grupos = new Map<number, PrecoArtigo[]>();

  for (const preco of precos) {
    const lista = grupos.get(preco.quantidadeMinima) ?? [];
    lista.push(preco);
    grupos.set(preco.quantidadeMinima, lista);
  }

  return [...grupos.entries()]
    .sort(([a], [b]) => a - b)
    .map(([quantidadeMinima, lista]) => ({
      quantidadeMinima,
      precos: [...lista].sort(
        (a, b) => new Date(b.vigenteDe).getTime() - new Date(a.vigenteDe).getTime(),
      ),
    }));
}
