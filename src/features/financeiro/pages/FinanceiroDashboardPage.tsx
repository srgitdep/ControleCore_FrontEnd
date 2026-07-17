import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
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
  getDreSummary,
  getCashFlowProjection,
  getContasReceber,
  getContasPagar,
  processarPagamento,
} from '@/api/finance';
import type { EstadoLancamento, RegistroFinanceiro } from '@/features/financeiro';
import toast from 'react-hot-toast';
import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';

// â”€â”€â”€ Helpers â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

const fmt = (v: number | string) =>
  Number(v).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

const fmtDate = (iso: string) => {
  try {
    return format(parseISO(iso), 'dd/MM/yyyy', { locale: ptBR });
  } catch {
    return iso;
  }
};

const MONTH_NAMES = [
  'Janeiro', 'Fevereiro', 'MarÃ§o', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro',
];

// â”€â”€â”€ Sub-components â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

function KpiCard({
  label,
  value,
  sub,
  icon: Icon,
  accent,
  trend,
}: {
  label: string;
  value: string;
  sub?: string;
  icon: React.ElementType;
  accent: 'green' | 'blue' | 'red' | 'yellow' | 'purple';
  trend?: 'up' | 'down';
}) {
  const accents = {
    green:  'from-emerald-500/20 to-emerald-600/5 border-emerald-500/30 text-emerald-400',
    blue:   'from-blue-500/20 to-blue-600/5 border-blue-500/30 text-blue-400',
    red:    'from-red-500/20 to-red-600/5 border-red-500/30 text-red-400',
    yellow: 'from-amber-500/20 to-amber-600/5 border-amber-500/30 text-amber-400',
    purple: 'from-violet-500/20 to-violet-600/5 border-violet-500/30 text-violet-400',
  };
  return (
    <div
      className={`relative overflow-hidden rounded-2xl border bg-gradient-to-br p-5 backdrop-blur-sm ${accents[accent]}`}
    >
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-widest text-slate-500 dark:text-slate-400">{label}</p>
          <p className="mt-1 text-2xl font-bold text-slate-900 dark:text-white">{value}</p>
          {sub && <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">{sub}</p>}
        </div>
        <div className={`rounded-xl p-2.5 bg-white/5 ${accents[accent].split(' ')[3]}`}>
          <Icon className="h-5 w-5" />
        </div>
      </div>
      {trend && (
        <div className="absolute bottom-3 right-4 flex items-center gap-1 text-xs">
          {trend === 'up'
            ? <TrendingUp className="h-3 w-3 text-emerald-400" />
            : <TrendingDown className="h-3 w-3 text-red-400" />}
        </div>
      )}
    </div>
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
      CrÃ©dito Bloqueado
    </span>
  );
}

// â”€â”€â”€ Tooltips personalizados â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

function CustomCashFlowTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-xl border border-slate-300 dark:border-slate-700 bg-white/95 dark:bg-slate-900/95 p-4 shadow-2xl backdrop-blur-md">
      <p className="mb-2 text-xs font-semibold text-slate-700 dark:text-slate-300">{label}</p>
      {payload.map((entry: any) => (
        <div key={entry.dataKey} className="flex items-center justify-between gap-6 text-xs">
          <span style={{ color: entry.color }}>{entry.name}</span>
          <span className="font-mono font-semibold text-slate-900 dark:text-white">MZN {fmt(entry.value)}</span>
        </div>
      ))}
    </div>
  );
}

// â”€â”€â”€ Main Page â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

type Tab = 'dre' | 'cashflow' | 'receber' | 'pagar';

export function FinanceiroDashboardPage() {
  const now = new Date();
  const [mes, setMes] = useState(now.getMonth() + 1);
  const [ano, setAno] = useState(now.getFullYear());
  const [tab, setTab] = useState<Tab>('dre');
  const [pageReceber, setPageReceber] = useState(1);
  const [pagePagar, setPagePagar] = useState(1);

  const queryClient = useQueryClient();

  const dreQuery = useQuery({
    queryKey: ['finance', 'dre', mes, ano],
    queryFn: () => getDreSummary(mes, ano),
  });

  const cashFlowQuery = useQuery({
    queryKey: ['finance', 'cashflow'],
    queryFn: () => getCashFlowProjection(30),
    staleTime: 5 * 60 * 1000,
  });

  const contasReceberQuery = useQuery({
    queryKey: ['finance', 'contas-receber', pageReceber],
    queryFn: () => getContasReceber(pageReceber),
  });

  const contasPagarQuery = useQuery({
    queryKey: ['finance', 'contas-pagar', pagePagar],
    queryFn: () => getContasPagar(pagePagar),
  });

  const pagarMutation = useMutation({
    mutationFn: processarPagamento,
    onSuccess: () => {
      toast.success('Pagamento registado com sucesso!');
      queryClient.invalidateQueries({ queryKey: ['finance'] });
    },
    onError: () => toast.error('Falha ao processar pagamento.'),
  });

  // NavegaÃ§Ã£o de mÃªs
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
    { id: 'dre', label: 'DRE â€” Resultados' },
    { id: 'cashflow', label: 'Fluxo de Caixa' },
    { id: 'receber', label: 'Contas a Receber' },
    { id: 'pagar', label: 'Contas a Pagar' },
  ];

  return (
    <div className="px-4 py-6 sm:px-6 lg:px-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white">
          Dashboard <span className="text-violet-400">Financeiro</span>
        </h1>
        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
          DRE Â· Fluxo de Caixa Â· Contas a Pagar / Receber
        </p>
      </div>

      {/* Tabs */}
      <div className="mb-6 flex gap-1 overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm p-1 backdrop-blur-sm">
        {TABS.map((t) => (
          <button
            key={t.id}
            id={`tab-${t.id}`}
            onClick={() => setTab(t.id)}
            className={`flex-shrink-0 rounded-lg px-4 py-2 text-sm font-semibold transition-all duration-200 ${
              tab === t.id
                ? 'bg-violet-600 text-white shadow-lg shadow-violet-500/30'
                : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* â”€â”€â”€ TAB: DRE â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
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
              <RefreshCw className="h-8 w-8 animate-spin text-violet-400" />
            </div>
          )}

          {dre && (
            <>
              {/* DRE: Linha Principal */}
              <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm p-6 backdrop-blur-sm">
                <h2 className="mb-4 text-xs font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400">
                  Demonstrativo de Resultados â€” {MONTH_NAMES[mes - 1]} {ano}
                </h2>
                <div className="space-y-3">
                  <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
                    <span className="text-slate-700 dark:text-slate-300">Faturamento Bruto</span>
                    <span className="font-mono text-lg font-bold text-slate-900 dark:text-white">
                      MZN {fmt(dre.faturamentoBruto)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
                    <span className="text-slate-500 dark:text-slate-400">( âˆ’ ) CMV â€” Custo da Mercadoria Vendida</span>
                    <span className="font-mono text-lg font-semibold text-red-400">
                      MZN {fmt(dre.cmv)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between border-b border-emerald-800/40 bg-emerald-950/20 rounded-lg px-3 py-2">
                    <span className="font-semibold text-emerald-300">
                      (=) Margem Bruta ({dre.margemBrutaPercentagem.toFixed(1)}%)
                    </span>
                    <span className="font-mono text-xl font-bold text-emerald-400">
                      MZN {fmt(dre.margemBruta)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
                    <span className="text-slate-500 dark:text-slate-400">( âˆ’ ) Despesas Pagas no PerÃ­odo</span>
                    <span className="font-mono text-lg font-semibold text-amber-400">
                      MZN {fmt(dre.despesasPagas)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between rounded-lg bg-violet-950/20 px-3 py-2 border border-violet-800/30">
                    <span className="font-bold text-violet-300">(=) Lucro Operacional Estimado</span>
                    <span className={`font-mono text-xl font-bold ${dre.lucroOperacionalEstimado >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                      MZN {fmt(dre.lucroOperacionalEstimado)}
                    </span>
                  </div>
                </div>
              </div>

              {/* KPI Grid */}
              <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
                <KpiCard
                  label="Vendas Realizadas"
                  value={String(dre.totalVendasRealizadas)}
                  icon={ShoppingCart}
                  accent="blue"
                />
                <KpiCard
                  label="Ticket MÃ©dio"
                  value={`MZN ${fmt(dre.ticketMedioVenda)}`}
                  icon={DollarSign}
                  accent="purple"
                />
                <KpiCard
                  label="RecebÃ­veis Pendentes"
                  value={`MZN ${fmt(dre.receitasReceber)}`}
                  icon={TrendingUp}
                  accent="green"
                />
                <KpiCard
                  label="Despesas Pendentes"
                  value={`MZN ${fmt(dre.despesasPendentes)}`}
                  icon={TrendingDown}
                  accent="red"
                />
              </div>

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
                            <span className="font-mono text-slate-900 dark:text-white">MZN {fmt(p.receita)}</span>
                          </div>
                          <div className="h-1.5 w-full rounded-full bg-slate-100 dark:bg-slate-800">
                            <div
                              className="h-1.5 rounded-full bg-violet-500"
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

      {/* â”€â”€â”€ TAB: CASH FLOW â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
      {tab === 'cashflow' && (
        <div className="space-y-6">
          {cashFlowQuery.isLoading && (
            <div className="flex h-40 items-center justify-center">
              <RefreshCw className="h-8 w-8 animate-spin text-violet-400" />
            </div>
          )}
          {cf && (
            <>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                <KpiCard
                  label="Saldo Atual (Caixa Real)"
                  value={`MZN ${fmt(cf.saldoAtual)}`}
                  icon={DollarSign}
                  accent={cf.saldoAtual >= 0 ? 'green' : 'red'}
                />
                <KpiCard
                  label="RecebÃ­veis nos PrÃ³x. 30d"
                  value={`MZN ${fmt(cf.serie.reduce((a, p) => a + p.receber, 0))}`}
                  icon={TrendingUp}
                  accent="blue"
                />
                <KpiCard
                  label="PagÃ¡veis nos PrÃ³x. 30d"
                  value={`MZN ${fmt(cf.serie.reduce((a, p) => a + p.pagar, 0))}`}
                  icon={TrendingDown}
                  accent="red"
                />
              </div>

              <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm p-6 backdrop-blur-sm">
                <h2 className="mb-2 text-sm font-bold text-slate-700 dark:text-slate-300">
                  ProjeÃ§Ã£o de Fluxo de Caixa â€” PrÃ³ximos 30 dias
                </h2>
                <p className="mb-6 text-xs text-slate-500">
                  Barras: entradas (azul) e saÃ­das (vermelho) diÃ¡rias. Linha: saldo projetado acumulado.
                </p>
                <ResponsiveContainer width="100%" height={340}>
                  <ComposedChart data={cf.serie} margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
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
                    <ReferenceLine y={0} stroke="#334155" strokeDasharray="4 2" />
                    <Bar dataKey="receber" name="A Receber" fill="#3b82f6" fillOpacity={0.75} radius={[3, 3, 0, 0]} />
                    <Bar dataKey="pagar" name="A Pagar" fill="#ef4444" fillOpacity={0.75} radius={[3, 3, 0, 0]} />
                    <Line
                      type="monotone"
                      dataKey="saldoProjetado"
                      name="Saldo Projetado"
                      stroke="#a78bfa"
                      strokeWidth={2.5}
                      dot={false}
                      activeDot={{ r: 4, fill: '#a78bfa' }}
                    />
                  </ComposedChart>
                </ResponsiveContainer>
              </div>
            </>
          )}
        </div>
      )}

      {/* â”€â”€â”€ TAB: CONTAS A RECEBER â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
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

      {/* â”€â”€â”€ TAB: CONTAS A PAGAR â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
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

// â”€â”€â”€ Registros Table Component â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

function RegistrosTable({
  query,
  page,
  onPageChange,
  tipo,
  onPagar,
  isPayingId,
}: {
  query: ReturnType<typeof useQuery<any>>;
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
          className="flex items-center gap-1.5 rounded-lg bg-violet-600 px-3 py-1.5 text-sm font-semibold text-slate-900 dark:text-white hover:bg-violet-500 transition"
        >
          <PlusCircle className="h-4 w-4" />
          Novo
        </button>
      </div>

      {isLoading && (
        <div className="flex h-40 items-center justify-center">
          <RefreshCw className="h-8 w-8 animate-spin text-violet-400" />
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
          <table className="w-full text-sm">
            <thead className="border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/80">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">DescriÃ§Ã£o</th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                  {tipo === 'RECEITA' ? 'Cliente' : 'Fornecedor'}
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">Vencimento</th>
                <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">Valor</th>
                <th className="px-4 py-3 text-center text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">Estado</th>
                <th className="px-4 py-3 text-center text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">AÃ§Ãµes</th>
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
                        <span className="text-slate-500">â€”</span>
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
                      MZN {fmt(r.valor)}
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

          {/* Pagination */}
          <div className="flex items-center justify-between border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm px-4 py-3">
            <span className="text-xs text-slate-500">
              PÃ¡gina {page} de {lastPage} Â· {data?.total ?? 0} registros
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
