import { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { AlertTriangle, ArrowRight, Loader2, Package, Search, X } from 'lucide-react';
import { useDebounce } from '@/shared/hooks';
import { cn, mensagemDeErro } from '@/shared/utils';
import { useArmazensEscolhiveis, useDisponivelNoArmazem, useSolicitarEmMassa } from '../hooks/useTransferencias';
import {
  cestoPronto,
  errosDeLinhaDaResposta,
  errosPorProduto,
  itemDe,
  linhasParaEnviar,
  podeEscolher,
  quantidadeValida,
  totaisDoCesto,
  type Cesto,
} from '../domain/cesto';
import type { ArmazemEscolhivel, ErroDeLinha, ProdutoDisponivel } from '../types/transferencia.types';

const LIMITE = 25;

const classeCampo = 'w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm focus:border-slate-400 focus:outline-none';

/** `armazéns agrupados por loja` para os dois seletores. */
function OpcoesDeArmazem({ armazens, excepto }: { armazens: ArmazemEscolhivel[]; excepto?: string }) {
  const porLoja = useMemo(() => {
    const m = new Map<string, ArmazemEscolhivel[]>();
    for (const a of armazens) {
      if (a.id === excepto) continue;
      m.set(a.lojaNome, [...(m.get(a.lojaNome) ?? []), a]);
    }
    return [...m.entries()];
  }, [armazens, excepto]);

  return (
    <>
      {porLoja.map(([loja, lista]) => (
        <optgroup key={loja} label={loja}>
          {lista.map((a) => (
            <option key={a.id} value={a.id}>
              {a.nome} ({a.tipo})
            </option>
          ))}
        </optgroup>
      ))}
    </>
  );
}

/**
 * «Nova transferência» (plano §4.12, D2/D3): vários produtos de um armazém para outro, de uma só vez.
 *
 * Escolhe-se a origem e o destino; a tabela mostra os produtos **com stock na origem** — físico, reservado,
 * **disponível** (o único que se pode transferir), o que a aprovação deixa **ceder** e o que já há no destino — e
 * escolhem-se linhas e quantidades. Procurar outro produto ou mudar de página **não perde** o que já foi escolhido
 * (o cesto vive à parte). O servidor valida tudo-ou-nada e devolve **todas** as linhas que não servem de uma vez, que
 * aqui ficam marcadas nas próprias linhas.
 */
export function NovaTransferenciaEmMassa({ aoFechar }: { aoFechar: () => void }) {
  const { t } = useTranslation('transferencias');
  const armazens = useArmazensEscolhiveis();
  const solicitar = useSolicitarEmMassa();

  const [origem, setOrigem] = useState('');
  const [destino, setDestino] = useState('');
  const [motivo, setMotivo] = useState('');
  const [pesquisa, setPesquisa] = useState('');
  const pesquisaAdiada = useDebounce(pesquisa, 350);
  const [page, setPage] = useState(1);
  const [cesto, setCesto] = useState<Cesto>({});
  const [soSeleccionados, setSoSeleccionados] = useState(false);
  const [errosDoServidor, setErrosDoServidor] = useState<ErroDeLinha[]>([]);

  useEffect(() => setPage(1), [pesquisaAdiada, origem]);

  const disponivel = useDisponivelNoArmazem(origem || null, {
    ...(destino ? { destinoArmazemId: destino } : {}),
    ...(pesquisaAdiada.trim() ? { pesquisa: pesquisaAdiada.trim() } : {}),
    page,
    limit: LIMITE,
  });
  const produtos = disponivel.data?.dados ?? [];
  const totalPaginas = disponivel.data ? Math.max(Math.ceil(disponivel.data.total / disponivel.data.limit), 1) : 1;

  const totais = totaisDoCesto(cesto);
  const erros = errosPorProduto(errosDoServidor);
  const mesmosArmazens = !!origem && origem === destino;
  const pronto = !!origem && !!destino && !mesmosArmazens && cestoPronto(cesto);

  const mudarOrigem = (id: string) => {
    // O que se escolheu é do stock de **outro** armazém: não vale para este.
    setOrigem(id);
    setCesto({});
    setErrosDoServidor([]);
    setSoSeleccionados(false);
    if (id === destino) setDestino('');
  };

  const alternar = (p: ProdutoDisponivel) => {
    setErrosDoServidor([]);
    setCesto((c) => {
      if (c[p.produtoId]) {
        const { [p.produtoId]: _removido, ...resto } = c;
        return resto;
      }
      return { ...c, [p.produtoId]: itemDe(p) };
    });
  };

  const escolhiveisDaPagina = produtos.filter(podeEscolher);
  const todosDaPaginaEscolhidos = escolhiveisDaPagina.length > 0 && escolhiveisDaPagina.every((p) => cesto[p.produtoId]);
  const alternarPagina = () => {
    setErrosDoServidor([]);
    setCesto((c) => {
      if (todosDaPaginaEscolhidos) {
        const resto = { ...c };
        for (const p of escolhiveisDaPagina) delete resto[p.produtoId];
        return resto;
      }
      const novo = { ...c };
      for (const p of escolhiveisDaPagina) if (!novo[p.produtoId]) novo[p.produtoId] = itemDe(p);
      return novo;
    });
  };

  const mudarQuantidade = (produtoId: string, valor: string) =>
    setCesto((c) => (c[produtoId] ? { ...c, [produtoId]: { ...c[produtoId], quantidade: valor === '' ? Number.NaN : Number(valor) } } : c));

  const enviar = () => {
    setErrosDoServidor([]);
    solicitar.mutate(
      { origemArmazemId: origem, destinoArmazemId: destino, ...(motivo.trim() ? { motivo: motivo.trim() } : {}), linhas: linhasParaEnviar(cesto) },
      {
        onSuccess: aoFechar,
        onError: (erro) => {
          const deLinha = errosDeLinhaDaResposta(erro);
          setErrosDoServidor(deLinha);
          // Sem erros de linha (armazém inactivo, rede…), a mensagem do servidor diz o que foi.
          if (deLinha.length === 0) setErroGeral(mensagemDeErro(erro, t('nova.erro_geral')));
        },
      },
    );
  };
  const [erroGeral, setErroGeral] = useState<string | null>(null);
  useEffect(() => setErroGeral(null), [origem, destino, cesto]);

  const linhasAMostrar: Array<{ produtoId: string; nome: string; sku: string | null; unidade: string; p: ProdutoDisponivel | null }> = soSeleccionados
    ? Object.values(cesto).map((i) => ({ produtoId: i.produtoId, nome: i.nome, sku: null, unidade: i.unidade, p: null }))
    : produtos.map((p) => ({ produtoId: p.produtoId, nome: p.nome, sku: p.sku, unidade: p.unidade, p }));

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-white" role="dialog" aria-modal="true" aria-labelledby="nova-transferencia-titulo">
      <header className="flex items-center justify-between gap-3 border-b border-slate-200 px-4 py-3 sm:px-6">
        <h2 id="nova-transferencia-titulo" className="text-lg font-bold text-slate-900">
          {t('nova.titulo')}
        </h2>
        <button type="button" onClick={aoFechar} aria-label={t('nova.fechar')} className="rounded-full p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-700">
          <X size={20} />
        </button>
      </header>

      <div className="space-y-4 border-b border-slate-100 bg-slate-50/60 px-4 py-4 sm:px-6">
        <div className="grid items-end gap-3 sm:grid-cols-[1fr_auto_1fr]">
          <label className="block">
            <span className="mb-1 block text-xs font-medium text-slate-700">{t('nova.origem')}</span>
            <select value={origem} onChange={(e) => mudarOrigem(e.target.value)} className={classeCampo}>
              <option value="">{t('nova.escolher_armazem')}</option>
              <OpcoesDeArmazem armazens={armazens.data ?? []} />
            </select>
          </label>
          <ArrowRight size={18} className="mb-2.5 hidden text-slate-300 sm:block" aria-hidden />
          <label className="block">
            <span className="mb-1 block text-xs font-medium text-slate-700">{t('nova.destino')}</span>
            <select value={destino} onChange={(e) => { setDestino(e.target.value); setErrosDoServidor([]); }} className={classeCampo}>
              <option value="">{t('nova.escolher_armazem')}</option>
              <OpcoesDeArmazem armazens={armazens.data ?? []} excepto={origem} />
            </select>
          </label>
        </div>
        {armazens.isError && <p className="text-xs text-red-700">{t('nova.erro_armazens')}</p>}
        {mesmosArmazens && <p className="text-xs font-medium text-red-700">{t('nova.armazens_iguais')}</p>}
        <p className="text-xs text-slate-500">{t('nova.ajuda')}</p>
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-4 sm:px-6">
        {!origem ? (
          <p className="rounded-xl border border-dashed border-slate-300 p-10 text-center text-sm text-slate-500">{t('nova.escolha_a_origem')}</p>
        ) : (
          <>
            <div className="mb-3 flex flex-wrap items-center gap-3">
              <div className="relative min-w-[220px] flex-1">
                <Search size={15} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  value={pesquisa}
                  onChange={(e) => setPesquisa(e.target.value)}
                  disabled={soSeleccionados}
                  placeholder={t('nova.pesquisar')}
                  className={cn(classeCampo, 'pl-9')}
                />
              </div>
              <button
                type="button"
                onClick={() => setSoSeleccionados((v) => !v)}
                disabled={totais.linhas === 0}
                className="rounded-lg border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-50 disabled:opacity-40"
              >
                {soSeleccionados ? t('nova.ver_todos') : t('nova.ver_seleccionados', { count: totais.linhas })}
              </button>
              {totais.linhas > 0 && (
                <button type="button" onClick={() => { setCesto({}); setSoSeleccionados(false); setErrosDoServidor([]); }} className="text-xs font-medium text-slate-500 underline">
                  {t('nova.limpar')}
                </button>
              )}
            </div>

            {errosDoServidor.length > 0 && (
              <p className="mb-3 flex items-center gap-2 rounded-lg bg-red-50 p-3 text-sm text-red-700" role="alert">
                <AlertTriangle size={15} className="shrink-0" />
                {t('nova.linhas_recusadas', { count: errosDoServidor.length })}
              </p>
            )}

            {disponivel.isLoading && !soSeleccionados ? (
              <div className="space-y-2">
                {[0, 1, 2, 3].map((i) => (
                  <div key={i} className="h-14 animate-pulse rounded-lg bg-slate-100" />
                ))}
              </div>
            ) : disponivel.isError && !soSeleccionados ? (
              <p className="flex flex-wrap items-center gap-2 rounded-lg bg-red-50 p-3 text-sm text-red-700">
                <AlertTriangle size={15} />
                {mensagemDeErro(disponivel.error, t('nova.erro_stock'))}
                <button type="button" onClick={() => void disponivel.refetch()} className="font-semibold underline">
                  {t('nova.tentar_outra_vez')}
                </button>
              </p>
            ) : linhasAMostrar.length === 0 ? (
              <p className="rounded-xl border border-dashed border-slate-300 p-10 text-center text-sm text-slate-500">
                {pesquisaAdiada.trim() ? t('nova.sem_resultados') : t('nova.sem_stock')}
              </p>
            ) : (
              <div className={cn('overflow-x-auto rounded-xl border border-slate-200', disponivel.isFetching && 'opacity-60')}>
                <table className="w-full min-w-[820px] text-left text-sm">
                  <thead className="bg-slate-50 text-xs uppercase text-slate-500">
                    <tr>
                      <th className="w-10 px-3 py-2">
                        {!soSeleccionados && (
                          <input type="checkbox" checked={todosDaPaginaEscolhidos} onChange={alternarPagina} aria-label={t('nova.seleccionar_pagina')} className="h-4 w-4" />
                        )}
                      </th>
                      <th className="px-3 py-2">{t('nova.col.produto')}</th>
                      <th className="px-3 py-2 text-right">{t('nova.col.fisico')}</th>
                      <th className="px-3 py-2 text-right">{t('nova.col.reservado')}</th>
                      <th className="px-3 py-2 text-right">{t('nova.col.disponivel')}</th>
                      <th className="px-3 py-2 text-right">{t('nova.col.cedivel')}</th>
                      <th className="px-3 py-2 text-right">{t('nova.col.destino')}</th>
                      <th className="w-32 px-3 py-2 text-right">{t('nova.col.quantidade')}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {linhasAMostrar.map(({ produtoId, nome, sku, unidade, p }) => {
                      const item = cesto[produtoId];
                      const erro = erros[produtoId];
                      const invalida = !!item && !quantidadeValida(item.quantidade, item.disponivel);
                      const bloqueado = p ? !podeEscolher(p) : false;
                      return (
                        <tr key={produtoId} className={cn(item && 'bg-blue-50/40', erro && 'bg-red-50', bloqueado && 'text-slate-400')}>
                          <td className="px-3 py-2">
                            <input
                              type="checkbox"
                              checked={!!item}
                              disabled={bloqueado}
                              onChange={() => (p ? alternar(p) : setCesto(({ [produtoId]: _r, ...resto }) => resto))}
                              aria-label={t('nova.escolher_produto', { nome })}
                              className="h-4 w-4"
                            />
                          </td>
                          <td className="px-3 py-2">
                            <p className="flex items-center gap-2 font-medium text-slate-800">
                              <Package size={14} className="shrink-0 text-slate-300" aria-hidden />
                              {nome}
                            </p>
                            {sku && <p className="text-xs text-slate-400">{sku}</p>}
                            {erro && (
                              <p className="mt-0.5 text-xs font-medium text-red-700">
                                {t(`nova.erro.${erro.motivo}`, { disponivel: erro.disponivel ?? 0 })}
                              </p>
                            )}
                          </td>
                          {p ? (
                            <>
                              <td className="px-3 py-2 text-right tabular-nums">{p.fisico}</td>
                              <td className="px-3 py-2 text-right tabular-nums">{p.reservado || '—'}</td>
                              <td className="px-3 py-2 text-right font-semibold tabular-nums text-slate-900">{p.disponivel}</td>
                              <td className="px-3 py-2 text-right tabular-nums" title={t('nova.cedivel_ajuda')}>
                                {p.cedivel}
                                {p.disponivel > 0 && p.cedivel === 0 && <span className="block text-[10px] text-amber-600">{t('nova.abaixo_do_minimo')}</span>}
                              </td>
                              <td className="px-3 py-2 text-right tabular-nums">
                                {p.noDestino}
                                {p.emTransitoNoDestino > 0 && <span className="block text-[10px] text-slate-400">{t('nova.em_transito', { n: p.emTransitoNoDestino })}</span>}
                              </td>
                            </>
                          ) : (
                            <td colSpan={5} className="px-3 py-2 text-right text-xs text-slate-400">
                              {t('nova.disponivel_de', { n: item?.disponivel ?? 0 })}
                            </td>
                          )}
                          <td className="px-3 py-2 text-right">
                            {item ? (
                              <div className="flex items-center justify-end gap-1">
                                <input
                                  type="number"
                                  min={0}
                                  max={item.disponivel}
                                  step="any"
                                  value={Number.isNaN(item.quantidade) ? '' : item.quantidade}
                                  onChange={(e) => mudarQuantidade(produtoId, e.target.value)}
                                  aria-label={t('nova.quantidade_de', { nome })}
                                  aria-invalid={invalida}
                                  className={cn('w-20 rounded-md border px-2 py-1 text-right tabular-nums focus:outline-none', invalida ? 'border-red-400 bg-red-50' : 'border-slate-200')}
                                />
                                <span className="text-xs text-slate-400">{unidade}</span>
                              </div>
                            ) : (
                              <span className="text-xs text-slate-300">—</span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}

            {!soSeleccionados && disponivel.data && disponivel.data.total > LIMITE && (
              <div className="mt-3 flex items-center justify-between text-sm text-slate-500">
                <span>{t('nova.pagina', { page, total: totalPaginas, linhas: disponivel.data.total })}</span>
                <div className="flex items-center gap-1">
                  <button disabled={page <= 1} onClick={() => setPage((p) => Math.max(p - 1, 1))} className="rounded-md border border-slate-200 px-3 py-1 disabled:opacity-30">
                    ‹
                  </button>
                  <button disabled={page >= totalPaginas} onClick={() => setPage((p) => Math.min(p + 1, totalPaginas))} className="rounded-md border border-slate-200 px-3 py-1 disabled:opacity-30">
                    ›
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      <footer className="space-y-3 border-t border-slate-200 bg-white px-4 py-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] sm:px-6">
        <label className="block">
          <span className="sr-only">{t('nova.motivo')}</span>
          <input value={motivo} onChange={(e) => setMotivo(e.target.value)} maxLength={200} placeholder={t('nova.motivo')} className={classeCampo} />
        </label>
        {erroGeral && <p className="text-sm text-red-700" role="alert">{erroGeral}</p>}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="text-sm text-slate-600">
            {t('nova.resumo', { linhas: totais.linhas, unidades: totais.unidades })}
            {totais.invalidas > 0 && <span className="ml-2 font-medium text-red-700">{t('nova.invalidas', { count: totais.invalidas })}</span>}
          </p>
          <div className="flex gap-2">
            <button type="button" onClick={aoFechar} className="rounded-lg px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100">
              {t('nova.cancelar')}
            </button>
            <button
              type="button"
              onClick={enviar}
              disabled={!pronto || solicitar.isPending}
              className="inline-flex items-center gap-2 rounded-lg bg-slate-900 px-5 py-2 text-sm font-semibold text-white hover:bg-slate-800 disabled:opacity-40"
            >
              {solicitar.isPending && <Loader2 size={15} className="animate-spin" />}
              {t('nova.solicitar')}
            </button>
          </div>
        </div>
      </footer>
    </div>
  );
}
