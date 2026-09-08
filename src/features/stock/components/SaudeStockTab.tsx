import { useMemo, useState } from 'react';
import {
  useReactTable,
  getCoreRowModel,
  createColumnHelper,
} from '@tanstack/react-table';
import {
  Wallet,
  PauseCircle,
  Layers,
  CalendarClock,
  Info,
  SlidersHorizontal,
  RotateCcw,
} from 'lucide-react';
import { ResponsiveTable, KpiCard } from '@/shared/ui';
import { formatMoeda } from '@/shared/utils';
import { useSaudeProdutos, useSaudeResumo } from '../hooks/useSaudeStock';
import { CLASSE_META, type ClasseStock, type DiagnosticoProduto } from '../types/saude.types';

const helper = createColumnHelper<DiagnosticoProduto>();

/** A ordem em que as classes se apresentam: da mais urgente para a mais confortável. */
const ORDEM_CLASSES: ClasseStock[] = [
  'RISCO_VALIDADE',
  'OBSOLETO',
  'PARADO',
  'EXCESSO',
  'BAIXA_ROTACAO',
  'NORMAL',
];

interface Limiares {
  diasSemVendaParado: number;
  diasSemVendaObsoleto: number;
  diasCoberturaMaximo: number;
  janelaDias: number;
}

const LIMIARES_PADRAO: Limiares = {
  diasSemVendaParado: 60,
  diasSemVendaObsoleto: 180,
  diasCoberturaMaximo: 60,
  janelaDias: 90,
};

/**
 * Saúde do stock: onde está o dinheiro e em que estado.
 *
 * Responde às quatro perguntas do §98 — quanto está no stock, quanto parado, quanto em
 * excesso, quanto em risco de perda.
 *
 * ## Três decisões de desenho que valem explicação
 *
 * **Os indicadores são filtros.** Um cartão que anuncia «800.000 MT parados» e não leva a
 * lado nenhum obriga a procurar quais são os produtos. Carregar no cartão filtra a tabela
 * pela classe correspondente.
 *
 * **O critério está sempre à vista.** «800.000 MT parados» não significa nada sem «sem venda
 * há mais de 60 dias». Os limiares aparecem no ecrã e são editáveis: a pergunta «e se
 * contarmos 30 dias?» responde-se aqui, sem mudar código.
 *
 * **A rastreabilidade é anunciada, não escondida.** «Zero em risco de validade» lê-se como
 * boa notícia, mas pode significar que ninguém registou validades. Quando a cobertura por
 * lotes é baixa, o aviso aparece — é a diferença entre não haver problema e não haver
 * informação.
 */
export function SaudeStockTab() {
  const [classe, setClasse] = useState<ClasseStock | null>(null);
  const [page, setPage] = useState(1);
  const [limiares, setLimiares] = useState<Limiares>(LIMIARES_PADRAO);
  const [mostrarLimiares, setMostrarLimiares] = useState(false);

  const { data: resumo, isLoading: aCarregarResumo } = useSaudeResumo(limiares);
  const { data: lista, isFetching } = useSaudeProdutos({
    ...limiares,
    classe: classe ?? undefined,
    page,
    limit: 25,
  });

  const alterarClasse = (nova: ClasseStock | null) => {
    setClasse(nova);
    setPage(1); // Sem isto, filtrar na página 3 mostrava uma tabela vazia.
  };

  const alterarLimiar = (chave: keyof Limiares, valor: string) => {
    const numero = Number(valor);
    setLimiares((anterior) => ({
      ...anterior,
      // Um campo vazio ou não numérico volta à omissão em vez de propagar NaN até à query.
      [chave]: Number.isFinite(numero) && numero > 0 ? numero : LIMIARES_PADRAO[chave],
    }));
    setPage(1);
  };

  const colunas = useMemo(
    () => [
      helper.accessor('nome', {
        header: 'Produto',
        cell: (info) => (
          <div className="min-w-0">
            <p className="truncate font-medium text-slate-800">{info.getValue()}</p>
            <span
              className={`mt-1 inline-block rounded-md border px-1.5 py-0.5 text-[11px] font-medium ${
                CLASSE_META[info.row.original.classe].pastilha
              }`}
            >
              {CLASSE_META[info.row.original.classe].label}
            </span>
          </div>
        ),
      }),
      helper.accessor('capitalImobilizado', {
        header: 'Capital imobilizado',
        cell: (info) => (
          <span className="font-semibold tabular-nums text-slate-800">
            {formatMoeda(info.getValue())}
          </span>
        ),
      }),
      helper.accessor('quantidade', {
        header: 'Stock',
        cell: (info) => <span className="tabular-nums">{info.getValue()}</span>,
      }),
      helper.accessor('diasCobertura', {
        header: 'Cobertura',
        cell: (info) => {
          const dias = info.getValue();
          // `null` não é zero: significa que não houve vendas na janela e portanto não há
          // cobertura a calcular. Mostrar «0 dias» diria que o stock acaba hoje.
          if (dias === null) {
            return <span className="text-slate-400">sem vendas na janela</span>;
          }
          return <span className="tabular-nums">{dias} dias</span>;
        },
      }),
      helper.accessor('diasSemVenda', {
        header: 'Sem venda',
        cell: (info) =>
          info.row.original.nuncaVendeu ? (
            <span className="text-slate-500">
              nunca vendeu
              <span className="block text-[11px] text-slate-400">
                em catálogo há {info.getValue()} dias
              </span>
            </span>
          ) : (
            <span className="tabular-nums">{info.getValue()} dias</span>
          ),
      }),
      helper.accessor('percentagemNaoVendida', {
        header: 'Não vendido',
        cell: (info) => {
          const pct = info.getValue();
          if (pct === null) {
            return <span className="text-slate-400">sem compras</span>;
          }
          return <span className="tabular-nums">{pct}%</span>;
        },
      }),
      helper.accessor('margemUnitaria', {
        header: 'Margem unit.',
        cell: (info) => {
          const margem = info.getValue();
          if (margem === null) return <span className="text-slate-400">sem preço</span>;
          return (
            <span className={`tabular-nums ${margem < 0 ? 'text-rose-600' : 'text-slate-700'}`}>
              {formatMoeda(margem)}
            </span>
          );
        },
      }),
    ],
    [],
  );

  const table = useReactTable({
    data: lista?.produtos ?? [],
    columns: colunas,
    getCoreRowModel: getCoreRowModel(),
  });

  const paradoEObsoleto = resumo
    ? resumo.porClasse.PARADO.valor + resumo.porClasse.OBSOLETO.valor
    : 0;

  const totalPaginas = lista ? Math.max(Math.ceil(lista.paginacao.total / lista.paginacao.limit), 1) : 1;

  const rastreioBaixo =
    resumo !== undefined &&
    (resumo.rastreabilidade.percentagemRastreada < 80 ||
      resumo.rastreabilidade.produtosComValidadeExigidaSemLote > 0);

  return (
    <div className="space-y-5">
      {/* ─── Indicadores, que são também filtros ────────────────────────────── */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <KpiCard
          title="Valor total do stock"
          value={resumo ? formatMoeda(resumo.valorTotal) : '—'}
          description={
            resumo ? `${resumo.produtosComStock} produtos com existências` : undefined
          }
          icon={Wallet}
          accent="primary"
          isLoading={aCarregarResumo}
        />
        <KpiCard
          title="Parado e obsoleto"
          value={resumo ? formatMoeda(paradoEObsoleto) : '—'}
          description={`sem venda há mais de ${limiares.diasSemVendaParado} dias`}
          icon={PauseCircle}
          accent="warning"
          isLoading={aCarregarResumo}
          onClick={() => alterarClasse(classe === 'PARADO' ? null : 'PARADO')}
        />
        <KpiCard
          title="Em excesso"
          value={resumo ? formatMoeda(resumo.porClasse.EXCESSO.valor) : '—'}
          description={`mais de ${limiares.diasCoberturaMaximo} dias de cobertura`}
          icon={Layers}
          accent="warning"
          isLoading={aCarregarResumo}
          onClick={() => alterarClasse(classe === 'EXCESSO' ? null : 'EXCESSO')}
        />
        <KpiCard
          title="Em risco de validade"
          value={resumo ? formatMoeda(resumo.validade.valorEmRisco) : '—'}
          description={
            resumo
              ? `${resumo.validade.porEstado.EXPIRADO.lotes} lotes expirados, ${resumo.validade.porEstado.EM_RISCO.lotes} em risco`
              : undefined
          }
          icon={CalendarClock}
          accent="danger"
          isLoading={aCarregarResumo}
          onClick={() => alterarClasse(classe === 'RISCO_VALIDADE' ? null : 'RISCO_VALIDADE')}
        />
      </div>

      {/* ─── Aviso de rastreabilidade ────────────────────────────────────────── */}
      {rastreioBaixo && resumo && (
        <div className="flex flex-wrap items-start gap-3 rounded-xl border border-sky-200 bg-sky-50 px-4 py-3">
          <Info className="mt-0.5 h-4 w-4 flex-shrink-0 text-sky-600" />
          <div className="min-w-0 text-sm text-sky-900">
            <p className="font-medium">
              O valor em risco de validade é um mínimo, não um total.
            </p>
            <p className="mt-0.5 text-sky-800">
              Apenas {resumo.rastreabilidade.percentagemRastreada}% do stock está coberto por
              lotes com validade registada
              {resumo.rastreabilidade.produtosComValidadeExigidaSemLote > 0 && (
                <>
                  , e {resumo.rastreabilidade.produtosComValidadeExigidaSemLote} produtos
                  exigem validade sem ter nenhum lote registado
                </>
              )}
              . Só se vigia o que é registado na entrada de mercadoria.
            </p>
          </div>
        </div>
      )}

      {/* ─── Peso de cada classe no valor total ──────────────────────────────── */}
      {resumo && resumo.valorTotal > 0 && (
        <div className="rounded-xl border border-slate-100 bg-white p-4 shadow-sm">
          <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
            <h3 className="text-sm font-semibold text-slate-800">Composição do stock</h3>
            {classe && (
              <button
                type="button"
                onClick={() => alterarClasse(null)}
                className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-500 hover:text-slate-800"
              >
                <RotateCcw className="h-3.5 w-3.5" />
                Ver todas as classes
              </button>
            )}
          </div>

          {/* Uma barra empilhada por valor, não por número de produtos: a pergunta é onde
              está o dinheiro. Vinte artigos baratos parados pesam menos do que um caro. */}
          <div className="flex h-3 w-full overflow-hidden rounded-full bg-slate-100">
            {ORDEM_CLASSES.map((c) => {
              const dados = resumo.porClasse[c];
              if (dados.percentagemDoValor <= 0) return null;
              return (
                <button
                  key={c}
                  type="button"
                  onClick={() => alterarClasse(classe === c ? null : c)}
                  style={{ width: `${dados.percentagemDoValor}%` }}
                  className={`${CLASSE_META[c].cor} transition-opacity hover:opacity-80 ${
                    classe && classe !== c ? 'opacity-30' : ''
                  }`}
                  title={`${CLASSE_META[c].label}: ${formatMoeda(dados.valor)} (${dados.percentagemDoValor}%)`}
                  aria-label={`Filtrar por ${CLASSE_META[c].label}`}
                />
              );
            })}
          </div>

          <div className="mt-3 grid grid-cols-2 gap-x-4 gap-y-2 sm:grid-cols-3 lg:grid-cols-6">
            {ORDEM_CLASSES.map((c) => {
              const dados = resumo.porClasse[c];
              return (
                <button
                  key={c}
                  type="button"
                  onClick={() => alterarClasse(classe === c ? null : c)}
                  className={`flex items-start gap-2 rounded-lg px-2 py-1.5 text-left transition-colors hover:bg-slate-50 ${
                    classe === c ? 'bg-slate-50 ring-1 ring-slate-200' : ''
                  }`}
                >
                  <span className={`mt-1 h-2.5 w-2.5 flex-shrink-0 rounded-sm ${CLASSE_META[c].cor}`} />
                  <span className="min-w-0">
                    <span className="block truncate text-xs font-medium text-slate-700">
                      {CLASSE_META[c].label}
                    </span>
                    <span className="block text-xs tabular-nums text-slate-500">
                      {formatMoeda(dados.valor)}
                    </span>
                    <span className="block text-[11px] text-slate-400">
                      {dados.produtos} {dados.produtos === 1 ? 'produto' : 'produtos'}
                    </span>
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* ─── O critério, sempre à vista e editável ───────────────────────────── */}
      <div className="rounded-xl border border-slate-100 bg-white shadow-sm">
        <button
          type="button"
          onClick={() => setMostrarLimiares((v) => !v)}
          className="flex w-full items-center justify-between gap-3 px-4 py-3 text-left"
        >
          <span className="flex items-center gap-2 text-sm text-slate-600">
            <SlidersHorizontal className="h-4 w-4 text-slate-400" />
            Parado a partir de{' '}
            <strong className="text-slate-800">{limiares.diasSemVendaParado} dias</strong> sem
            venda · obsoleto aos{' '}
            <strong className="text-slate-800">{limiares.diasSemVendaObsoleto}</strong> · excesso
            acima de <strong className="text-slate-800">{limiares.diasCoberturaMaximo}</strong>{' '}
            dias de cobertura
          </span>
          <span className="flex-shrink-0 text-xs font-medium text-blue-600">
            {mostrarLimiares ? 'Fechar' : 'Ajustar'}
          </span>
        </button>

        {mostrarLimiares && (
          <div className="grid grid-cols-1 gap-3 border-t border-slate-100 px-4 py-4 sm:grid-cols-2 lg:grid-cols-4">
            {(
              [
                ['diasSemVendaParado', 'Parado (dias sem venda)'],
                ['diasSemVendaObsoleto', 'Obsoleto (dias sem venda)'],
                ['diasCoberturaMaximo', 'Excesso (dias de cobertura)'],
                ['janelaDias', 'Janela de vendas (dias)'],
              ] as [keyof Limiares, string][]
            ).map(([chave, etiqueta]) => (
              <label key={chave} className="block">
                <span className="mb-1 block text-xs font-medium text-slate-600">{etiqueta}</span>
                <input
                  type="number"
                  min={1}
                  value={limiares[chave]}
                  onChange={(e) => alterarLimiar(chave, e.target.value)}
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm tabular-nums focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </label>
            ))}
            <p className="col-span-full text-xs text-slate-500">
              Estes limiares são de negócio e não do código: 60 dias sem venda é normal numa
              loja de electrodomésticos e é alarme numa mercearia. A alteração aplica-se de
              imediato à análise.
            </p>
          </div>
        )}
      </div>

      {/* ─── A lista ──────────────────────────────────────────────────────────── */}
      <div className="overflow-hidden rounded-xl border border-slate-100 bg-white shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 px-4 py-3">
          <h3 className="text-sm font-semibold text-slate-800">
            {classe ? CLASSE_META[classe].label : 'Todos os produtos'}
            {lista && (
              <span className="ml-2 font-normal text-slate-400">
                {lista.paginacao.total} {lista.paginacao.total === 1 ? 'produto' : 'produtos'}
              </span>
            )}
          </h3>
          {classe && (
            <span className="text-xs text-slate-500">{CLASSE_META[classe].descricao}</span>
          )}
        </div>

        <ResponsiveTable
          table={table}
          isLoading={isFetching && !lista}
          emptyMessage={
            classe
              ? `Nenhum produto na classe ${CLASSE_META[classe].label} com os limiares actuais.`
              : 'Nenhum produto com existências.'
          }
          getRowStatus={(row) =>
            row.classe === 'RISCO_VALIDADE' || row.classe === 'OBSOLETO'
              ? 'critical'
              : row.classe === 'PARADO' || row.classe === 'EXCESSO'
                ? 'warning'
                : 'default'
          }
        />

        {lista && lista.paginacao.total > lista.paginacao.limit && (
          <div className="flex items-center justify-between border-t border-slate-100 px-4 py-3 text-sm">
            <span className="text-slate-500">
              Página {lista.paginacao.page} de {totalPaginas}
              {/* Nunca truncar em silêncio. */}
              {lista.paginacao.omitidas > 0 && (
                <span className="ml-2 text-slate-400">
                  ({lista.paginacao.omitidas} linhas por mostrar)
                </span>
              )}
            </span>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setPage((p) => Math.max(p - 1, 1))}
                disabled={lista.paginacao.page <= 1}
                className="rounded-lg border border-slate-200 px-3 py-1.5 text-sm font-medium text-slate-700 disabled:opacity-40"
              >
                Anterior
              </button>
              <button
                type="button"
                onClick={() => setPage((p) => p + 1)}
                disabled={lista.paginacao.page >= totalPaginas}
                className="rounded-lg border border-slate-200 px-3 py-1.5 text-sm font-medium text-slate-700 disabled:opacity-40"
              >
                Seguinte
              </button>
            </div>
          </div>
        )}
      </div>

      {/* O §60 proíbe decisão automática sobre stock parado. O ecrã diz o mesmo a quem o lê,
          porque o número sozinho convida à conclusão errada. */}
      <p className="px-1 text-xs leading-relaxed text-slate-500">
        Um produto parado pode ser sazonal — procura concentrada num período do ano. Antes de
        decidir liquidar, verifique o histórico do mesmo período em anos anteriores. Esta
        análise quantifica o problema; não recomenda a acção.
      </p>
    </div>
  );
}
