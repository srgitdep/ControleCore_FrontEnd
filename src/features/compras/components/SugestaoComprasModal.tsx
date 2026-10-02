import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { X, Loader2, AlertTriangle, Sparkles, ShoppingBag, Info } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { purchasesApi } from '../api/purchases.api';
import type { SugestaoCompra, MotivoSugestao, UrgenciaSugestao } from '../api/purchases.api';
import { cn, formatMoeda } from '@/shared/utils';

const URGENCIAS: Record<UrgenciaSugestao, string> = {
  CRITICA: 'bg-rose-100 text-rose-700',
  ALTA: 'bg-amber-100 text-amber-800',
  MEDIA: 'bg-slate-100 text-slate-600',
};

/**
 * Sugestão de compras.
 *
 * ## O que substitui
 *
 * O botão «Sugestão de Compras» chamava uma função que mostrava
 * `toast.success('Sugestão gerada. (Simulação MVP)')` e não fazia nenhuma chamada de
 * rede — os comentários do autor original ainda estavam no código, a explicar que os
 * dados de stock não estavam facilmente disponíveis ali.
 *
 * ## As duas perguntas que a lista responde
 *
 * «O que repor» e «quanto». A segunda é a que faltava em todas as vistas existentes:
 * os alertas de stock mínimo diziam que faltava, mas não se eram 10 ou 200 unidades.
 *
 * A janela e a cobertura são ajustáveis porque a resposta certa depende do fornecedor:
 * quem entrega em 20 dias precisa de mais cobertura do que quem entrega em 2.
 */
export function SugestoesDeCompra({
  onCriarPedido,
  onFechar,
}: {
  /** Recebe as linhas escolhidas, agrupadas para um pedido. */
  onCriarPedido: (linhas: SugestaoCompra[]) => void;
  /** Só existe quando o painel está dentro de um diálogo. */
  onFechar?: () => void;
}) {
  const { t } = useTranslation('compras');

  // Dentro do componente porque os textos dependem da língua activa.
  const MOTIVOS: Record<MotivoSugestao, { rotulo: string; explicacao: string }> = {
    RUPTURA: { rotulo: t('sugestoes.motivo_RUPTURA'), explicacao: t('sugestoes.explicacao_RUPTURA') },
    ABAIXO_MINIMO: {
      rotulo: t('sugestoes.motivo_ABAIXO_MINIMO'),
      explicacao: t('sugestoes.explicacao_ABAIXO_MINIMO'),
    },
    VELOCIDADE: {
      rotulo: t('sugestoes.motivo_VELOCIDADE'),
      explicacao: t('sugestoes.explicacao_VELOCIDADE'),
    },
  };

  const [janelaDias, setJanelaDias] = useState(30);
  const [diasCobertura, setDiasCobertura] = useState(14);
  const [escolhidas, setEscolhidas] = useState<Set<string>>(new Set());

  /**
   * Que motivo mostrar.
   *
   * «O que está sem stock» e «o que está abaixo do mínimo» são duas perguntas
   * diferentes, feitas por razões diferentes: a primeira é venda que se está a perder
   * agora, a segunda é venda que se vai perder. Numa lista única, misturadas e
   * distinguidas só por um distintivo de cor, nenhuma das duas se lê.
   */
  const [motivoVisivel, setMotivoVisivel] = useState<MotivoSugestao | 'TODOS'>('TODOS');

  const { data, isLoading, error } = useQuery({
    queryKey: ['compras-sugestoes', janelaDias, diasCobertura],
    queryFn: () => purchasesApi.getSugestoes({ janelaDias, diasCobertura }),
  });

  // `?? []` criaria um array novo a cada render e tornaria o `useMemo` abaixo inútil;
  // com `useMemo` sobre `data`, a lista só muda quando os dados mudam.
  const todasAsSugestoes = useMemo(() => data?.sugestoes ?? [], [data]);

  const contagens = useMemo(() => {
    const c: Record<string, number> = { TODOS: todasAsSugestoes.length };
    for (const s of todasAsSugestoes) c[s.motivo] = (c[s.motivo] ?? 0) + 1;
    return c;
  }, [todasAsSugestoes]);

  const sugestoes = useMemo(
    () =>
      motivoVisivel === 'TODOS'
        ? todasAsSugestoes
        : todasAsSugestoes.filter((s) => s.motivo === motivoVisivel),
    [todasAsSugestoes, motivoVisivel],
  );

  const seleccionadas = useMemo(
    () => sugestoes.filter((s) => escolhidas.has(s.produtoId)),
    [sugestoes, escolhidas],
  );

  const totalEscolhido = seleccionadas.reduce((soma, s) => soma + s.valorEstimado, 0);

  // Os fornecedores das linhas escolhidas. Um pedido de compra é a um fornecedor só,
  // pelo que misturar dois é um erro que vale a pena avisar antes de continuar.
  const fornecedoresEnvolvidos = new Set(
    seleccionadas.map((s) => s.fornecedorSugerido?.id ?? 'sem-fornecedor'),
  );

  const alternar = (produtoId: string) => {
    setEscolhidas((antes) => {
      const novo = new Set(antes);
      if (novo.has(produtoId)) novo.delete(produtoId);
      else novo.add(produtoId);
      return novo;
    });
  };

  // Sobre o que está à vista, e não sobre tudo: com um filtro activo, «escolher
  // todas» tem de significar as que se estão a ver.
  const todasEscolhidas =
    sugestoes.length > 0 && sugestoes.every((s) => escolhidas.has(s.produtoId));

  return (
    <div className="flex min-h-0 flex-1 flex-col">
        {/* ── Parâmetros ─────────────────────────────────────────────────── */}
        <div className="flex flex-wrap items-end gap-4 border-b border-slate-100 bg-slate-50/60 px-6 py-3">
          <label className="text-xs text-slate-600">
            <span className="mb-1 block font-medium">{t('sugestoes.janela_vendas')}</span>
            <select
              value={janelaDias}
              onChange={(e) => setJanelaDias(Number(e.target.value))}
              className="rounded-md border border-slate-200 bg-white px-2 py-1.5 text-sm"
            >
              <option value={7}>{t('sugestoes.ultimos_dias', { n: 7 })}</option>
              <option value={30}>{t('sugestoes.ultimos_dias', { n: 30 })}</option>
              <option value={90}>{t('sugestoes.ultimos_dias', { n: 90 })}</option>
            </select>
          </label>

          <label className="text-xs text-slate-600">
            <span className="mb-1 block font-medium">{t('sugestoes.cobrir')}</span>
            <select
              value={diasCobertura}
              onChange={(e) => setDiasCobertura(Number(e.target.value))}
              className="rounded-md border border-slate-200 bg-white px-2 py-1.5 text-sm"
            >
              <option value={7}>{t('sugestoes.dias_venda', { n: 7 })}</option>
              <option value={14}>{t('sugestoes.dias_venda', { n: 14 })}</option>
              <option value={30}>{t('sugestoes.dias_venda', { n: 30 })}</option>
              <option value={60}>{t('sugestoes.dias_venda', { n: 60 })}</option>
            </select>
          </label>

          {data && (
            <div className="ml-auto flex flex-wrap gap-4 text-xs">
              <span className="text-slate-500">
                <strong className="text-rose-600">{data.resumo.emRuptura}</strong>{' '}
                {t('sugestoes.resumo_ruptura')}
              </span>
              <span className="text-slate-500">
                <strong className="text-amber-600">{data.resumo.abaixoDoMinimo}</strong>{' '}
                {t('sugestoes.resumo_abaixo')}
              </span>
              <span className="text-slate-500">
                <strong className="text-slate-700">{data.resumo.total}</strong>{' '}
                {t('sugestoes.resumo_repor')}
              </span>
            </div>
          )}
        </div>

        {/* ── Filtro por motivo ──────────────────────────────────────────── */}
        {todasAsSugestoes.length > 0 && (
          <div className="flex flex-wrap gap-2 border-b border-slate-100 px-6 py-3">
            {([['TODOS', t('sugestoes.tudo_a_repor')], ['RUPTURA', MOTIVOS.RUPTURA.rotulo], ['ABAIXO_MINIMO', MOTIVOS.ABAIXO_MINIMO.rotulo], ['VELOCIDADE', MOTIVOS.VELOCIDADE.rotulo]] as const).map(
              ([chave, rotulo]) => {
                const quantos = contagens[chave] ?? 0;
                // Um filtro que não filtra nada só ocupa espaço e faz duvidar da lista.
                if (chave !== 'TODOS' && quantos === 0) return null;

                return (
                  <button
                    key={chave}
                    type="button"
                    onClick={() => setMotivoVisivel(chave)}
                    className={cn(
                      'rounded-full px-3 py-1.5 text-xs font-semibold transition-colors',
                      motivoVisivel === chave
                        ? 'bg-slate-800 text-white'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200',
                    )}
                  >
                    {rotulo} · {quantos}
                  </button>
                );
              },
            )}
          </div>
        )}

        {/* ── Lista ──────────────────────────────────────────────────────── */}
        <div className="flex-1 overflow-y-auto">
          {isLoading ? (
            <div className="flex items-center justify-center gap-2 py-16 text-slate-500">
              <Loader2 className="h-4 w-4 animate-spin" />
              {t('sugestoes.a_analisar')}
            </div>
          ) : error ? (
            <div className="flex flex-col items-center gap-2 px-6 py-16 text-center">
              <AlertTriangle className="h-6 w-6 text-amber-500" />
              <p className="text-sm text-slate-600">{t('sugestoes.erro')}</p>
            </div>
          ) : sugestoes.length === 0 ? (
            <div className="px-6 py-16 text-center">
              <p className="text-sm font-medium text-slate-700">{t('sugestoes.nada_a_repor')}</p>
              <p className="mt-1 text-sm text-slate-500">
                {t('sugestoes.nada_a_repor_ajuda', { dias: diasCobertura })}
              </p>
            </div>
          ) : (
            <table className="w-full text-sm">
              <thead className="sticky top-0 bg-slate-50 text-left text-xs uppercase tracking-wide text-slate-500">
                <tr>
                  <th className="w-10 px-4 py-2.5">
                    <input
                      type="checkbox"
                      checked={todasEscolhidas}
                      onChange={() =>
                        setEscolhidas(
                          todasEscolhidas ? new Set() : new Set(sugestoes.map((s) => s.produtoId)),
                        )
                      }
                      className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                      aria-label={t('sugestoes.escolher_todas')}
                    />
                  </th>
                  <th className="px-3 py-2.5 font-medium">{t('sugestoes.col_produto')}</th>
                  <th className="px-3 py-2.5 font-medium">{t('sugestoes.col_motivo')}</th>
                  <th className="hidden px-3 py-2.5 text-right font-medium sm:table-cell">{t('sugestoes.col_stock')}</th>
                  <th className="hidden px-3 py-2.5 text-right font-medium md:table-cell">
                    {t('sugestoes.col_venda_dia')}
                  </th>
                  <th className="hidden px-3 py-2.5 text-right font-medium md:table-cell">{t('sugestoes.col_dura')}</th>
                  <th className="px-3 py-2.5 text-right font-medium">{t('sugestoes.col_comprar')}</th>
                  <th className="hidden px-3 py-2.5 font-medium lg:table-cell">{t('sugestoes.col_fornecedor')}</th>
                  <th className="px-4 py-2.5 text-right font-medium">{t('sugestoes.col_valor')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {sugestoes.map((s) => (
                  <tr
                    key={s.produtoId}
                    className={cn(
                      'cursor-pointer hover:bg-slate-50/60',
                      escolhidas.has(s.produtoId) && 'bg-blue-50/40',
                    )}
                    onClick={() => alternar(s.produtoId)}
                  >
                    <td className="px-4 py-3">
                      <input
                        type="checkbox"
                        checked={escolhidas.has(s.produtoId)}
                        onChange={() => alternar(s.produtoId)}
                        onClick={(e) => e.stopPropagation()}
                        className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                        aria-label={t('sugestoes.escolher_produto', { nome: s.nome })}
                      />
                    </td>
                    <td className="px-3 py-3 font-medium text-slate-900">{s.nome}</td>
                    <td className="px-3 py-3">
                      <span
                        className={cn(
                          'rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide',
                          URGENCIAS[s.urgencia],
                        )}
                        title={MOTIVOS[s.motivo].explicacao}
                      >
                        {MOTIVOS[s.motivo].rotulo}
                      </span>
                    </td>
                    <td className="hidden px-3 py-3 text-right sm:table-cell">
                      <span className={cn(s.stockActual <= 0 ? 'font-semibold text-rose-600' : 'text-slate-700')}>
                        {s.stockActual}
                      </span>
                      {s.stockMinimo > 0 && (
                        <span className="text-xs text-slate-400"> / {s.stockMinimo}</span>
                      )}
                    </td>
                    <td className="hidden px-3 py-3 text-right text-slate-500 md:table-cell">
                      {s.mediaDiaria > 0 ? s.mediaDiaria.toFixed(1) : '—'}
                    </td>
                    <td className="hidden px-3 py-3 text-right text-slate-500 md:table-cell">
                      {/* Nulo quando não houve venda: sem consumo o stock não acaba, e
                          um número faria parecer que se sabe algo que não se sabe. */}
                      {s.diasRestantes === null ? '—' : t('sugestoes.dias_abrev', { n: s.diasRestantes })}
                    </td>
                    <td className="px-3 py-3 text-right font-semibold text-slate-900">
                      {s.quantidadeSugerida}
                    </td>
                    <td className="hidden px-3 py-3 text-xs lg:table-cell">
                      {s.fornecedorSugerido ? (
                        <span className="text-slate-600">{s.fornecedorSugerido.nome}</span>
                      ) : (
                        <span className="text-amber-600" title={t('sugestoes.associe_fornecedor')}>
                          {t('sugestoes.sem_fornecedor')}
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-right text-slate-700">{formatMoeda(s.valorEstimado)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* ── Rodapé ─────────────────────────────────────────────────────── */}
        {/* Dentro do dialogo o rodape fica preso por o painel ter altura fixa. Numa
            pagina nao ha altura fixa nenhuma, e o botao de criar pedido afundava-se no
            fim de uma lista longa -- justamente quando ha mais para encomendar.
            `sticky` resolve-o sem afectar o dialogo, onde ja nao ha para onde deslizar. */}
        <div className="sticky bottom-0 space-y-2 border-t border-slate-100 bg-slate-50 px-6 py-3">
          {/* Nunca truncar em silêncio. */}
          {/* O que o servidor omitiu, e o que o filtro escondeu, são duas coisas
              diferentes. Somadas numa frase só, davam a entender que faltavam linhas
              por decisão do sistema quando quem as escondeu foi quem carregou no
              filtro. */}
          {data && data.resumo.omitidas > 0 && (
            <p className="flex items-center gap-1.5 text-xs text-slate-500">
              <Info size={13} />
              {t('sugestoes.a_analisar_n', {
                n: todasAsSugestoes.length,
                total: data.resumo.total,
              })}
            </p>
          )}

          {motivoVisivel !== 'TODOS' && (
            <p className="flex items-center gap-1.5 text-xs text-slate-500">
              <Info size={13} />
              {t('sugestoes.mostrar_so', {
                motivo: MOTIVOS[motivoVisivel].rotulo,
                n: sugestoes.length,
                total: todasAsSugestoes.length,
              })}
              <button
                type="button"
                onClick={() => setMotivoVisivel('TODOS')}
                className="font-semibold underline underline-offset-2 hover:text-slate-700"
              >
                {t('sugestoes.ver_tudo')}
              </button>
            </p>
          )}

          {fornecedoresEnvolvidos.size > 1 && (
            <p className="flex items-center gap-1.5 text-xs text-amber-700">
              <AlertTriangle size={13} />
              {t('sugestoes.fornecedores_diferentes')}
            </p>
          )}

          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className="text-sm text-slate-600">
              {seleccionadas.length === 0 ? (
                t('sugestoes.escolha_linhas')
              ) : (
                <>
                  <strong>{seleccionadas.length}</strong>{' '}
                  {t('sugestoes.palavra_linhas', { count: seleccionadas.length })} ·{' '}
                  <strong>{formatMoeda(totalEscolhido)}</strong>
                </>
              )}
            </p>

            <div className="flex gap-2">
              {onFechar && (
                <button
                  onClick={onFechar}
                  className="rounded-lg px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100"
                >
                  {t('sugestoes.fechar')}
                </button>
              )}
              <button
                onClick={() => onCriarPedido(seleccionadas)}
                disabled={seleccionadas.length === 0}
                className="flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-50"
              >
                <ShoppingBag size={16} />
                {t('sugestoes.criar_pedido')}
              </button>
            </div>
          </div>
        </div>
    </div>
  );
}

/**
 * A mesma lista, em diálogo.
 *
 * O painel passou a viver num separador da página de compras — é lá que se decide o
 * que encomendar, e uma lista de rupturas escondida atrás de um botão que é preciso
 * saber carregar não é uma lista que alguém veja. O diálogo fica para quem chega pelo
 * atalho, e é só a moldura: o conteúdo é o mesmo componente.
 */
export function SugestaoComprasModal({
  onClose,
  onCriarPedido,
}: {
  onClose: () => void;
  onCriarPedido: (linhas: SugestaoCompra[]) => void;
}) {
  const { t } = useTranslation('compras');

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-sm">
      <div className="flex max-h-[90vh] w-full max-w-5xl flex-col overflow-hidden rounded-xl bg-white shadow-xl">
        <div className="flex items-start justify-between gap-4 border-b border-slate-100 px-6 py-4">
          <div className="flex items-start gap-3">
            <div className="rounded-lg bg-indigo-100 p-2">
              <Sparkles className="h-5 w-5 text-indigo-600" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-800">{t('sugestoes.titulo')}</h2>
              <p className="text-sm text-slate-500">
                {t('sugestoes.subtitulo')}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600"
            aria-label={t('sugestoes.fechar')}
          >
            <X size={20} />
          </button>
        </div>

        <SugestoesDeCompra onCriarPedido={onCriarPedido} onFechar={onClose} />
      </div>
    </div>
  );
}