import { useState } from 'react';
import {
  ComposedChart,
  Bar,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  ReferenceLine,
} from 'recharts';
import {
  TrendingUp,
  TrendingDown,
  ShoppingCart,
  DollarSign,
  AlertTriangle,
  CheckCircle,
  Clock,
  XCircle,
  Building2,
  User,
  ChevronLeft,
  ChevronRight,
  RefreshCw,
  PlusCircle,
} from 'lucide-react';
import {
  useDreSummary,
  useCashFlowProjection,
  useContasReceber,
  useContasPagar,
  useProcessarPagamento,
} from '@/features/financeiro';
import type { EstadoLancamento, RegistroFinanceiro } from '@/features/financeiro';
import { CardCarousel, KpiCard as SharedKpiCard, TableScroll } from '@/shared/ui';
import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';

// ─── Helpers ───

/**
 * Um valor em meticais.
 *
 * ## A escolha de `pt-BR`
 *
 * Parece errado num sistema moçambicano, e é deliberado: `pt-PT` separa os milhares com
 * **espaço** (`4 274,60`), enquanto `pt-BR` usa o ponto (`4.274,60`), que é a convenção
 * usada em Moçambique e a que já estava a aparecer nestes relatórios. A vírgula decimal é
 * igual nos dois. Trocar para `pt-PT` mudaria os milhares para espaço sem ninguém pedir.
 *
 * A unidade é «MT», que é o que aparece nos recibos e no fecho de caixa — «MZN» por
 * extenso era o único sítio do sistema a escrevê-lo assim.
 */
const fmt = (v: number | string) =>
  Number(v).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

/** Um valor com a unidade, para quando aparece sozinho. */
const moeda = (v: number | string) => `${fmt(v)} MT`;

/**
 * Uma linha da demonstração de resultados.
 *
 * Três níveis, distinguidos por peso e por linha divisória — não por cor de fundo:
 *
 * - normal: uma parcela (faturação, custo, despesa)
 * - `subtotal`: fecha um bloco (margem bruta)
 * - `total`: o resultado final (lucro operacional)
 *
 * Os valores negativos mostram-se entre parênteses, como é convenção em contabilidade, em
 * vez de com um sinal antes. Fica alinhado à direita em `tabular-nums`, para as casas
 * decimais coincidirem entre linhas e a coluna se poder ler de cima a baixo.
 */
function LinhaDre({
  rotulo,
  valor,
  detalhe,
  subtotal = false,
  total = false,
}: {
  rotulo: string;
  valor: number;
  detalhe?: string;
  subtotal?: boolean;
  total?: boolean;
}) {
  const negativo = valor < 0;
  const absoluto = Math.abs(valor);

  return (
    <div
      className={[
        'flex items-baseline justify-between gap-4 py-2.5',
        subtotal || total ? 'border-t border-slate-300 mt-1 pt-3' : '',
        total ? 'mt-2 border-t-2 border-slate-900' : '',
      ].join(' ')}
    >
      <dt className="min-w-0">
        <span
          className={
            total
              ? 'font-semibold text-slate-900'
              : subtotal
                ? 'font-medium text-slate-900'
                : 'text-slate-600'
          }
        >
          {rotulo}
        </span>
        {detalhe && <span className="ml-2 text-xs text-slate-400">{detalhe}</span>}
      </dt>

      <dd
        className={[
          'shrink-0 tabular-nums',
          total ? 'text-lg font-bold' : subtotal ? 'text-base font-semibold' : 'text-sm',
          // Vermelho só quando o **resultado** é negativo. Um custo é um custo.
          total && negativo ? 'text-red-600' : 'text-slate-900',
        ].join(' ')}
      >
        {negativo && !total ? `(${fmt(absoluto)})` : fmt(valor)}
        <span className="ml-1 text-xs font-normal text-slate-400">MT</span>
      </dd>
    </div>
  );
}

const fmtDate = (iso: string) => {
  try {
    return format(parseISO(iso), 'dd/MM/yyyy', { locale: ptBR });
  } catch {
    return iso;
  }
};

const MONTH_NAMES = [
  'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro',
];

// ─── Sub-components ───

/**
 * Adaptador para o `KpiCard` partilhado.
 *
 * O cartão local usava gradiente colorido com borda translúcida — um dos oito estilos
 * de cartão que existiam no sistema, e o único com fundo em degradê. Colorir o fundo
 * inteiro baixava o contraste do texto por cima; a cor passa para a barra à esquerda,
 * onde continua a distinguir receita de despesa sem prejudicar a leitura.
 *
 * Fica como adaptador em vez de substituição directa nos sete pontos de uso: as
 * chamadas mantêm-se legíveis com o vocabulário desta página (`label`, `sub`, cores),
 * e o mapeamento de cor→significado está num só lugar.
 */
function KpiCard({
  label,
  value,
  sub,
  icon,
  accent,
}: {
  label: string;
  value: string;
  sub?: string;
  icon: React.ElementType;
  accent: 'green' | 'blue' | 'red' | 'yellow' | 'purple';
  /** Aceito e ignoro: a seta indicava direcção sem dizer de quanto, e o valor da
   *  variação não existe nestes dados. */
  trend?: 'up' | 'down';
}) {
  const paraAcento = {
    green: 'success',
    blue: 'primary',
    red: 'danger',
    yellow: 'warning',
    purple: 'primary',
  } as const;

  return (
    <SharedKpiCard
      title={label}
      value={value}
      description={sub}
      icon={icon}
      accent={paraAcento[accent]}
    />
  );
}

function StatusBadge({ estado }: { estado: EstadoLancamento }) {
  const config: Record<EstadoLancamento, { label: string; cls: string; icon: React.ElementType }> = {
    PENDING:   { label: 'Pendente',   cls: 'bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300',   icon: Clock },
    PAID:      { label: 'Pago',       cls: 'bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-300', icon: CheckCircle },
    OVERDUE:   { label: 'Vencido',    cls: 'bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-300',       icon: AlertTriangle },
    CANCELLED: { label: 'Cancelado',  cls: 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400',  icon: XCircle },
  };
  const { label, cls, icon: Icon } = config[estado];
  return (
    <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold ${cls}`}>
      <Icon className="h-3 w-3" />
      {label}
    </span>
  );
}

function CreditBlockBadge() {
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-red-100 px-2.5 py-0.5 text-xs font-semibold text-red-800 dark:bg-red-900/40 dark:text-red-300">
      <AlertTriangle className="h-3 w-3" />
      Crédito Bloqueado
    </span>
  );
}

// ─── Tooltips personalizados ──────────────────────────────────────────────────

function CustomCashFlowTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-xl border border-slate-300 dark:border-slate-700 bg-white/95 dark:bg-slate-900/95 p-4 shadow-2xl backdrop-blur-md">
      <p className="mb-2 text-xs font-semibold text-slate-700 dark:text-slate-300">{label}</p>
      {payload.map((entry: any) => (
        <div key={entry.dataKey} className="flex items-center justify-between gap-6 text-xs">
          <span style={{ color: entry.color }}>{entry.name}</span>
          <span className="font-mono font-semibold text-slate-900 dark:text-white">{moeda(entry.value)}</span>
        </div>
      ))}
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

type Tab = 'dre' | 'cashflow' | 'receber' | 'pagar';

export function FinanceiroDashboardPage() {
  const now = new Date();
  const [mes, setMes] = useState(now.getMonth() + 1);
  const [ano, setAno] = useState(now.getFullYear());
  const [tab, setTab] = useState<Tab>('dre');
  const [pageReceber, setPageReceber] = useState(1);
  const [pagePagar, setPagePagar] = useState(1);

  const dreQuery = useDreSummary(mes, ano);
  const cashFlowQuery = useCashFlowProjection(30);
  const contasReceberQuery = useContasReceber(pageReceber);
  const contasPagarQuery = useContasPagar(pagePagar);
  const pagarMutation = useProcessarPagamento();

  // Navegação de mês
  const prevMonth = () => {
    if (mes === 1) { setMes(12); setAno(a => a - 1); }
    else setMes(m => m - 1);
  };
  const nextMonth = () => {
    if (mes === 12) { setMes(1); setAno(a => a + 1); }
    else setMes(m => m + 1);
  };

  const dre = dreQuery.data;
  const cf = cashFlowQuery.data;

  const TABS: { id: Tab; label: string }[] = [
    { id: 'dre', label: 'DRE — Resultados' },
    { id: 'cashflow', label: 'Fluxo de Caixa' },
    { id: 'receber', label: 'Contas a Receber' },
    { id: 'pagar', label: 'Contas a Pagar' },
  ];

  return (
    // Sem padding próprio: o `AppLayout` já aplica `p-4 sm:p-6` ao `<main>`. Num
    // telemóvel de 375px, o padding a dobrar comia 64px dos 375 — quase um quinto da
    // largura, antes de a tabela começar.
    <div>
      {/* O nome e a descrição saíram: o cabeçalho da aplicação já diz «Financeiro», e
          os separadores logo abaixo enumeram o mesmo que a descrição enumerava — com
          a vantagem de se poder carregar neles. */}

      {/* Separadores.
          Sublinhado em vez de pastilha preenchida: é o padrão que o Stock e o RH já
          usam, e um bloco de cor sólida a competir com os números do relatório tirava-lhes
          a atenção — num relatório financeiro, o que salta à vista deve ser o valor. */}
      <div className="mb-6 flex gap-1 overflow-x-auto border-b border-slate-200 hide-scrollbar">
        {TABS.map((t) => (
          <button
            key={t.id}
            id={`tab-${t.id}`}
            onClick={() => setTab(t.id)}
            className={`-mb-px flex-shrink-0 whitespace-nowrap border-b-2 px-4 py-2.5 text-sm font-medium transition-colors ${
              tab === t.id
                ? 'border-blue-600 text-blue-700'
                : 'border-transparent text-slate-500 hover:text-slate-900'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* ─── TAB: DRE ─── */}
      {tab === 'dre' && (
        <div className="space-y-6">
          {/* Period selector */}
          <div className="flex items-center gap-3">
            <button
              onClick={prevMonth}
              className="rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 p-2 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <span className="min-w-40 text-center text-base font-semibold text-slate-900 dark:text-white">
              {MONTH_NAMES[mes - 1]} {ano}
            </span>
            <button
              onClick={nextMonth}
              className="rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 p-2 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
            <button
              onClick={() => dreQuery.refetch()}
              className="ml-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-100 dark:bg-slate-800 p-2 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition"
            >
              <RefreshCw className={`h-4 w-4 ${dreQuery.isFetching ? 'animate-spin' : ''}`} />
            </button>
          </div>

          {dreQuery.isLoading && (
            <div className="flex h-40 items-center justify-center">
              <RefreshCw className="h-8 w-8 animate-spin text-blue-600" />
            </div>
          )}

          {dre && (
            <>
              {/* Demonstração de resultados.
                  Lê-se como um relatório, não como um painel: a hierarquia vem do peso da
                  letra e de uma linha divisória antes de cada subtotal, não de faixas de
                  cor. Antes, cada linha tinha o seu fundo colorido (verde, violeta,
                  âmbar) e nenhuma se destacava — competiam todas.

                  A cor fica para o que carrega sinal: vermelho quando o lucro é negativo.
                  Um custo não é «mau», é um custo; pintá-lo de vermelho gasta o único
                  recurso que devia avisar de um prejuízo. */}
              <div className="rounded-xl border border-slate-200 bg-white p-5 sm:p-6">
                <h2 className="mb-5 text-xs font-semibold uppercase tracking-wider text-slate-500">
                  Demonstração de resultados — {MONTH_NAMES[mes - 1]} {ano}
                </h2>

                <dl className="space-y-0">
                  <LinhaDre rotulo="Faturação bruta" valor={dre.faturamentoBruto} />
                  <LinhaDre rotulo="Custo da mercadoria vendida" valor={-dre.cmv} />

                  <LinhaDre
                    rotulo="Margem bruta"
                    detalhe={`${dre.margemBrutaPercentagem.toFixed(1)}% da faturação`}
                    valor={dre.margemBruta}
                    subtotal
                  />

                  <LinhaDre rotulo="Despesas pagas no período" valor={-dre.despesasPagas} />

                  <LinhaDre
                    rotulo="Lucro operacional estimado"
                    valor={dre.lucroOperacionalEstimado}
                    total
                  />
                </dl>
              </div>

              {/* Os indicadores deslizam na horizontal abaixo de `lg`, em vez de
                  empilharem: eram `grid-cols-2` em telemóvel, o que dava dois cartões
                  de largura mínima por linha e texto a partir. */}
              <CardCarousel label="Indicadores do período" colunas={4}>
                <KpiCard
                  label="Vendas Realizadas"
                  value={String(dre.totalVendasRealizadas)}
                  icon={ShoppingCart}
                  accent="blue"
                />
                <KpiCard
                  label="Ticket Médio"
                  value={moeda(dre.ticketMedioVenda)}
                  icon={DollarSign}
                  accent="purple"
                />
                <KpiCard
                  label="Recebíveis Pendentes"
                  value={moeda(dre.receitasReceber)}
                  icon={TrendingUp}
                  accent="green"
                />
                <KpiCard
                  label="Despesas Pendentes"
                  value={moeda(dre.despesasPendentes)}
                  icon={TrendingDown}
                  accent="red"
                />
              </CardCarousel>

              {/* Top Produtos */}
              {dre.topProdutos.length > 0 && (
                <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm p-6 backdrop-blur-sm">
                  <h3 className="mb-4 text-xs font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400">
                    Top 5 Produtos por Receita
                  </h3>
                  <div className="space-y-3">
                    {dre.topProdutos.map((p, i) => {
                      const pct = dre.faturamentoBruto > 0
                        ? (p.receita / dre.faturamentoBruto) * 100
                        : 0;
                      return (
                        <div key={p.produtoId}>
                          <div className="flex items-center justify-between text-sm mb-1">
                            <span className="text-slate-700 dark:text-slate-300">
                              <span className="mr-2 font-bold text-slate-500">#{i + 1}</span>
                              {p.nome}
                            </span>
                            <span className="font-mono text-slate-900 dark:text-white">{moeda(p.receita)}</span>
                          </div>
                          <div className="h-1.5 w-full rounded-full bg-slate-100 dark:bg-slate-800">
                            <div
                              className="h-1.5 rounded-full bg-blue-600"
                              style={{ width: `${pct}%` }}
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      )}

      {/* ─── TAB: CASH FLOW ─── */}
      {tab === 'cashflow' && (
        <div className="space-y-6">
          {cashFlowQuery.isLoading && (
            <div className="flex h-40 items-center justify-center">
              <RefreshCw className="h-8 w-8 animate-spin text-blue-600" />
            </div>
          )}
          {cf && (
            <>
              {/* Três colunas, não quatro: com três indicadores, uma grelha de quatro
                  deixaria uma lacuna à direita. */}
              <CardCarousel label="Fluxo de caixa" colunas={3}>
                <KpiCard
                  label="Saldo Atual (Caixa Real)"
                  value={moeda(cf.saldoAtual)}
                  icon={DollarSign}
                  accent={cf.saldoAtual >= 0 ? 'green' : 'red'}
                />
                <KpiCard
                  label="Recebíveis nos Próx. 30d"
                  value={moeda(cf.serie.reduce((a, p) => a + p.receber, 0))}
                  icon={TrendingUp}
                  accent="blue"
                />
                <KpiCard
                  label="Pagáveis nos Próx. 30d"
                  value={moeda(cf.serie.reduce((a, p) => a + p.pagar, 0))}
                  icon={TrendingDown}
                  accent="red"
                />
              </CardCarousel>

              <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm p-6 backdrop-blur-sm">
                <h2 className="mb-2 text-sm font-bold text-slate-700 dark:text-slate-300">
                  Projeção de Fluxo de Caixa — Próximos 30 dias
                </h2>
                <p className="mb-6 text-xs text-slate-500">
                  Barras: entradas (azul) e saÍdas (vermelho) diárias. Linha: saldo projetado acumulado.
                </p>
                <ResponsiveContainer width="100%" height={340}>
                  <ComposedChart data={cf.serie} margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                    <XAxis
                      dataKey="data"
                      tick={{ fill: '#64748b', fontSize: 10 }}
                      tickFormatter={(v: string) => {
                        try { return format(parseISO(v), 'dd/MM'); } catch { return v; }
                      }}
                      interval="preserveStartEnd"
                    />
                    <YAxis
                      tick={{ fill: '#64748b', fontSize: 10 }}
                      tickFormatter={(v: number) => `${(v / 1000).toFixed(0)}k`}
                      width={48}
                    />
                    <Tooltip content={<CustomCashFlowTooltip />} />
                    <Legend
                      wrapperStyle={{ fontSize: 12, color: '#94a3b8' }}
                      iconType="circle"
                    />
                    <ReferenceLine y={0} stroke="#cbd5e1" strokeDasharray="4 2" />
                    <Bar dataKey="receber" name="A Receber" fill="#3b82f6" fillOpacity={0.75} radius={[3, 3, 0, 0]} />
                    <Bar dataKey="pagar" name="A Pagar" fill="#ef4444" fillOpacity={0.75} radius={[3, 3, 0, 0]} />
                    <Line
                      type="monotone"
                      dataKey="saldoProjetado"
                      name="Saldo Projetado"
                      stroke="#1d4ed8"
                      strokeWidth={2.5}
                      dot={false}
                      activeDot={{ r: 4, fill: '#1d4ed8' }}
                    />
                  </ComposedChart>
                </ResponsiveContainer>
              </div>
            </>
          )}
        </div>
      )}

      {/* ─── TAB: CONTAS A RECEBER ──────────────────────────────────────────── */}
      {tab === 'receber' && (
        <RegistrosTable
          query={contasReceberQuery}
          page={pageReceber}
          onPageChange={setPageReceber}
          tipo="RECEITA"
          onPagar={(id) => pagarMutation.mutate(id)}
          isPayingId={pagarMutation.isPending ? (pagarMutation.variables as string) : null}
        />
      )}

      {/* ─── TAB: CONTAS A PAGAR ────────────────────────────────────────────── */}
      {tab === 'pagar' && (
        <RegistrosTable
          query={contasPagarQuery}
          page={pagePagar}
          onPageChange={setPagePagar}
          tipo="DESPESA"
          onPagar={(id) => pagarMutation.mutate(id)}
          isPayingId={pagarMutation.isPending ? (pagarMutation.variables as string) : null}
        />
      )}
    </div>
  );
}

// ─── Registros Table Component ────────────────────────────────────────────────

function RegistrosTable({
  query,
  page,
  onPageChange,
  tipo,
  onPagar,
  isPayingId,
}: {
  query: ReturnType<typeof useContasReceber>;
  page: number;
  onPageChange: (p: number) => void;
  tipo: 'RECEITA' | 'DESPESA';
  onPagar: (id: string) => void;
  isPayingId: string | null;
}) {
  const { data, isLoading } = query;
  const registros: RegistroFinanceiro[] = data?.data ?? [];
  const lastPage: number = data?.lastPage ?? 1;

  const isVencido = (r: RegistroFinanceiro) =>
    r.estado === 'OVERDUE' || (r.estado === 'PENDING' && new Date(r.dataVencimento) < new Date());

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-base font-bold text-slate-900 dark:text-white">
          {tipo === 'RECEITA' ? 'Contas a Receber' : 'Contas a Pagar'}
        </h2>
        <button
          id={`btn-novo-${tipo.toLowerCase()}`}
          className="flex items-center gap-1.5 rounded-lg bg-blue-600 px-3 py-1.5 text-sm font-semibold text-white hover:bg-blue-700 transition"
        >
          <PlusCircle className="h-4 w-4" />
          Novo
        </button>
      </div>

      {isLoading && (
        <div className="flex h-40 items-center justify-center">
          <RefreshCw className="h-8 w-8 animate-spin text-blue-600" />
        </div>
      )}

      {!isLoading && registros.length === 0 && (
        <div className="flex h-40 flex-col items-center justify-center gap-2 rounded-2xl border border-dashed border-slate-300 dark:border-slate-700 text-slate-500">
          <DollarSign className="h-8 w-8" />
          <p className="text-sm">Nenhum registro encontrado</p>
        </div>
      )}

      {registros.length > 0 && (
        <div className="overflow-hidden rounded-2xl border border-slate-200 dark:border-slate-800">
          {/* Era `overflow-hidden`: as seis colunas eram cortadas num telemóvel, sem
              forma de as alcançar. O `TableScroll` permite deslizar e mostra um degradê
              na margem quando há colunas escondidas — num telemóvel a barra de
              deslocamento não se vê até se tocar, pelo que uma tabela cortada parece
              uma tabela completa.

              Envolve só a tabela, não a paginação: os controlos de página têm de ficar
              parados enquanto se desliza as colunas. */}
          <TableScroll>
          <table className="w-full text-sm">
            <thead className="border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/80">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">Descrição</th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                  {tipo === 'RECEITA' ? 'Cliente' : 'Fornecedor'}
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">Vencimento</th>
                <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">Valor</th>
                <th className="px-4 py-3 text-center text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">Estado</th>
                <th className="px-4 py-3 text-center text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-800/60 bg-white dark:bg-slate-900/40">
              {registros.map((r) => (
                <tr
                  key={r.id}
                  className={`transition hover:bg-slate-50 dark:hover:bg-slate-800/30 ${isVencido(r) ? 'bg-red-50 dark:bg-red-950/10' : ''}`}
                >
                  <td className="px-4 py-3">
                    <div className="flex flex-col gap-0.5">
                      <span className="font-medium text-slate-800 dark:text-slate-200">{r.descricao}</span>
                      {r.createdBySystem && (
                        <span className="text-xs text-slate-500 italic">ðŸ¤– Criado automaticamente</span>
                      )}
                      {r.venda && (
                        <span className="text-xs text-slate-500">Fatura: {r.venda.numeroFatura}</span>
                      )}
                    </div>
                  </td>

                  <td className="px-4 py-3">
                    <div className="flex flex-col gap-1">
                      {tipo === 'RECEITA' && r.cliente && (
                        <div className="flex flex-col gap-1">
                          <div className="flex items-center gap-1 text-slate-700 dark:text-slate-300">
                            <User className="h-3 w-3 text-slate-500" />
                            {r.cliente.nome}
                          </div>
                          {r.cliente.creditoBloqueado && <CreditBlockBadge />}
                        </div>
                      )}
                      {tipo === 'DESPESA' && r.fornecedor && (
                        <div className="flex items-center gap-1 text-slate-700 dark:text-slate-300">
                          <Building2 className="h-3 w-3 text-slate-500" />
                          {r.fornecedor.nome}
                        </div>
                      )}
                      {!r.cliente && !r.fornecedor && (
                        <span className="text-slate-500">—</span>
                      )}
                    </div>
                  </td>

                  <td className="px-4 py-3">
                    <div className="flex flex-col gap-0.5">
                      <span className={`font-medium ${isVencido(r) ? 'text-red-400' : 'text-slate-700 dark:text-slate-300'}`}>
                        {fmtDate(r.dataVencimento)}
                      </span>
                      {r.dataPagamento && (
                        <span className="text-xs text-emerald-500">
                          Pago: {fmtDate(r.dataPagamento)}
                        </span>
                      )}
                    </div>
                  </td>

                  <td className="px-4 py-3 text-right">
                    <span className="font-mono font-semibold text-slate-900 dark:text-white">
                      {moeda(r.valor)}
                    </span>
                  </td>

                  <td className="px-4 py-3 text-center">
                    <StatusBadge estado={r.estado} />
                  </td>

                  <td className="px-4 py-3 text-center">
                    {(r.estado === 'PENDING' || r.estado === 'OVERDUE') && (
                      <button
                        id={`btn-pagar-${r.id}`}
                        onClick={() => onPagar(r.id)}
                        disabled={isPayingId === r.id}
                        className="rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-slate-900 dark:text-white hover:bg-emerald-500 transition disabled:opacity-50"
                      >
                        {isPayingId === r.id ? '...' : 'Marcar Pago'}
                      </button>
                    )}
                    {r.estado === 'PAID' && (
                      <span className="text-xs text-slate-500">Pago</span>
                    )}
                    {r.estado === 'CANCELLED' && (
                      <span className="text-xs text-slate-500">Cancelado</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          </TableScroll>

          {/* Pagination */}
          <div className="flex items-center justify-between border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm px-4 py-3">
            <span className="text-xs text-slate-500">
              Página {page} de {lastPage} · {data?.total ?? 0} registros
            </span>
            <div className="flex gap-2">
              <button
                onClick={() => onPageChange(Math.max(1, page - 1))}
                disabled={page === 1}
                className="rounded p-1 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition disabled:opacity-30"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              <button
                onClick={() => onPageChange(Math.min(lastPage, page + 1))}
                disabled={page === lastPage}
                className="rounded p-1 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition disabled:opacity-30"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
