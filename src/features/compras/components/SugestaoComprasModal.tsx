import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { X, Loader2, AlertTriangle, Sparkles, ShoppingBag, Info } from 'lucide-react';
import { purchasesApi } from '../api/purchases.api';
import type { SugestaoCompra, MotivoSugestao, UrgenciaSugestao } from '../api/purchases.api';
import { cn } from '@/shared/utils';

const moeda = (valor: number) =>
  valor.toLocaleString('pt-MZ', { style: 'currency', currency: 'MZN' });

const MOTIVOS: Record<MotivoSugestao, { rotulo: string; explicacao: string }> = {
  RUPTURA: { rotulo: 'Em ruptura', explicacao: 'Sem existências — está a perder venda agora.' },
  ABAIXO_MINIMO: {
    rotulo: 'Abaixo do mínimo',
    explicacao: 'Abaixo do ponto de reposição definido para o armazém.',
  },
  VELOCIDADE: {
    rotulo: 'A esgotar',
    explicacao: 'Ao ritmo de venda actual, o stock não chega ao fim do prazo de cobertura.',
  },
};

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
export function SugestaoComprasModal({
  onClose,
  onCriarPedido,
}: {
  onClose: () => void;
  /** Recebe as linhas escolhidas, agrupadas para um pedido. */
  onCriarPedido: (linhas: SugestaoCompra[]) => void;
}) {
  const [janelaDias, setJanelaDias] = useState(30);
  const [diasCobertura, setDiasCobertura] = useState(14);
  const [escolhidas, setEscolhidas] = useState<Set<string>>(new Set());

  const { data, isLoading, error } = useQuery({
    queryKey: ['compras-sugestoes', janelaDias, diasCobertura],
    queryFn: () => purchasesApi.getSugestoes({ janelaDias, diasCobertura }),
  });

  // `?? []` criaria um array novo a cada render e tornaria o `useMemo` abaixo inútil;
  // com `useMemo` sobre `data`, a lista só muda quando os dados mudam.
  const sugestoes = useMemo(() => data?.sugestoes ?? [], [data]);

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

  const todasEscolhidas = sugestoes.length > 0 && escolhidas.size === sugestoes.length;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-sm">
      <div className="flex max-h-[90vh] w-full max-w-5xl flex-col overflow-hidden rounded-xl bg-white shadow-xl">
        {/* ── Cabeçalho ──────────────────────────────────────────────────── */}
        <div className="flex items-start justify-between gap-4 border-b border-slate-100 px-6 py-4">
          <div className="flex items-start gap-3">
            <div className="rounded-lg bg-indigo-100 p-2">
              <Sparkles className="h-5 w-5 text-indigo-600" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-800">Sugestão de compras</h2>
              <p className="text-sm text-slate-500">
                Cruza o ponto de reposição de cada armazém com a velocidade de venda.
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600"
            aria-label="Fechar"
          >
            <X size={20} />
          </button>
        </div>

        {/* ── Parâmetros ─────────────────────────────────────────────────── */}
        <div className="flex flex-wrap items-end gap-4 border-b border-slate-100 bg-slate-50/60 px-6 py-3">
          <label className="text-xs text-slate-600">
            <span className="mb-1 block font-medium">Janela de vendas</span>
            <select
              value={janelaDias}
              onChange={(e) => setJanelaDias(Number(e.target.value))}
              className="rounded-md border border-slate-200 bg-white px-2 py-1.5 text-sm"
            >
              <option value={7}>Últimos 7 dias</option>
              <option value={30}>Últimos 30 dias</option>
              <option value={90}>Últimos 90 dias</option>
            </select>
          </label>

          <label className="text-xs text-slate-600">
            <span className="mb-1 block font-medium">Cobrir</span>
            <select
              value={diasCobertura}
              onChange={(e) => setDiasCobertura(Number(e.target.value))}
              className="rounded-md border border-slate-200 bg-white px-2 py-1.5 text-sm"
            >
              <option value={7}>7 dias de venda</option>
              <option value={14}>14 dias de venda</option>
              <option value={30}>30 dias de venda</option>
              <option value={60}>60 dias de venda</option>
            </select>
          </label>

          {data && (
            <div className="ml-auto flex flex-wrap gap-4 text-xs">
              <span className="text-slate-500">
                <strong className="text-rose-600">{data.resumo.emRuptura}</strong> em ruptura
              </span>
              <span className="text-slate-500">
                <strong className="text-amber-600">{data.resumo.abaixoDoMinimo}</strong> abaixo do
                mínimo
              </span>
              <span className="text-slate-500">
                <strong className="text-slate-700">{data.resumo.total}</strong> a repor
              </span>
            </div>
          )}
        </div>

        {/* ── Lista ──────────────────────────────────────────────────────── */}
        <div className="flex-1 overflow-y-auto">
          {isLoading ? (
            <div className="flex items-center justify-center gap-2 py-16 text-slate-500">
              <Loader2 className="h-4 w-4 animate-spin" />
              A analisar vendas e existências...
            </div>
          ) : error ? (
            <div className="flex flex-col items-center gap-2 px-6 py-16 text-center">
              <AlertTriangle className="h-6 w-6 text-amber-500" />
              <p className="text-sm text-slate-600">Não foi possível gerar as sugestões.</p>
            </div>
          ) : sugestoes.length === 0 ? (
            <div className="px-6 py-16 text-center">
              <p className="text-sm font-medium text-slate-700">Nada a repor.</p>
              <p className="mt-1 text-sm text-slate-500">
                Nenhum produto está em ruptura, abaixo do mínimo, ou a esgotar dentro dos{' '}
                {diasCobertura} dias de cobertura.
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
                      aria-label="Escolher todas"
                    />
                  </th>
                  <th className="px-3 py-2.5 font-medium">Produto</th>
                  <th className="px-3 py-2.5 font-medium">Motivo</th>
                  <th className="hidden px-3 py-2.5 text-right font-medium sm:table-cell">Stock</th>
                  <th className="hidden px-3 py-2.5 text-right font-medium md:table-cell">
                    Venda/dia
                  </th>
                  <th className="hidden px-3 py-2.5 text-right font-medium md:table-cell">Dura</th>
                  <th className="px-3 py-2.5 text-right font-medium">Comprar</th>
                  <th className="hidden px-3 py-2.5 font-medium lg:table-cell">Fornecedor</th>
                  <th className="px-4 py-2.5 text-right font-medium">Valor</th>
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
                        aria-label={`Escolher ${s.nome}`}
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
                      {s.diasRestantes === null ? '—' : `${s.diasRestantes} d`}
                    </td>
                    <td className="px-3 py-3 text-right font-semibold text-slate-900">
                      {s.quantidadeSugerida}
                    </td>
                    <td className="hidden px-3 py-3 text-xs lg:table-cell">
                      {s.fornecedorSugerido ? (
                        <span className="text-slate-600">{s.fornecedorSugerido.nome}</span>
                      ) : (
                        <span className="text-amber-600" title="Associe um fornecedor a este produto">
                          sem fornecedor
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-right text-slate-700">{moeda(s.valorEstimado)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* ── Rodapé ─────────────────────────────────────────────────────── */}
        <div className="space-y-2 border-t border-slate-100 bg-slate-50 px-6 py-3">
          {/* Nunca truncar em silêncio. */}
          {data && data.resumo.omitidas > 0 && (
            <p className="flex items-center gap-1.5 text-xs text-slate-500">
              <Info size={13} />
              A mostrar {sugestoes.length} das {data.resumo.total} linhas a repor.
            </p>
          )}

          {fornecedoresEnvolvidos.size > 1 && (
            <p className="flex items-center gap-1.5 text-xs text-amber-700">
              <AlertTriangle size={13} />
              As linhas escolhidas são de fornecedores diferentes. Um pedido de compra é a um
              fornecedor só — escolha as de um deles, ou ajuste o fornecedor no pedido.
            </p>
          )}

          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className="text-sm text-slate-600">
              {seleccionadas.length === 0 ? (
                'Escolha as linhas a encomendar.'
              ) : (
                <>
                  <strong>{seleccionadas.length}</strong>{' '}
                  {seleccionadas.length === 1 ? 'linha' : 'linhas'} ·{' '}
                  <strong>{moeda(totalEscolhido)}</strong>
                </>
              )}
            </p>

            <div className="flex gap-2">
              <button
                onClick={onClose}
                className="rounded-lg px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100"
              >
                Fechar
              </button>
              <button
                onClick={() => onCriarPedido(seleccionadas)}
                disabled={seleccionadas.length === 0}
                className="flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-50"
              >
                <ShoppingBag size={16} />
                Criar pedido
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
