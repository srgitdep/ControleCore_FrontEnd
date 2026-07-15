// ─── Enums ────────────────────────────────────────────────────────────────────

export type TipoLancamento = 'RECEITA' | 'DESPESA';

export type EstadoLancamento = 'PENDING' | 'PAID' | 'OVERDUE' | 'CANCELLED';

// ─── DRE ──────────────────────────────────────────────────────────────────────

export interface TopProduto {
  produtoId: string;
  nome: string;
  receita: number;
  quantidade: number;
}

export interface DreSummary {
  periodo: { mes: number; ano: number };
  // Linha DRE
  faturamentoBruto: number;
  cmv: number;
  margemBruta: number;
  margemBrutaPercentagem: number;
  // Despesas
  despesasPagas: number;
  despesasPendentes: number;
  // Recebíveis
  receitasReceber: number;
  // Resultado
  lucroOperacionalEstimado: number;
  // Operacional
  totalVendasRealizadas: number;
  ticketMedioVenda: number;
  topProdutos: TopProduto[];
}

// ─── Fluxo de Caixa ───────────────────────────────────────────────────────────

export interface CashFlowPoint {
  data: string; // ISO date: "2026-07-15"
  receber: number;
  pagar: number;
  saldoProjetado: number;
}

export interface CashFlowProjection {
  saldoAtual: number;
  serie: CashFlowPoint[];
}

// ─── Registros Financeiros ────────────────────────────────────────────────────

export interface FornecedorInfo {
  id: string;
  nome: string;
  telefone?: string | null;
}

export interface ClienteInfo {
  id: string;
  nome: string;
  creditoBloqueado: boolean;
  creditLimit: string; // Decimal comes as string from Prisma
}

export interface VendaInfo {
  id: string;
  numeroFatura: string;
}

export interface RegistroFinanceiro {
  id: string;
  empresaId: string;
  tipo: TipoLancamento;
  estado: EstadoLancamento;
  descricao: string;
  valor: string; // Decimal serialized as string
  dataVencimento: string; // ISO datetime
  dataPagamento: string | null;
  fornecedorId: string | null;
  fornecedor: FornecedorInfo | null;
  vendaId: string | null;
  venda: VendaInfo | null;
  clienteId: string | null;
  cliente: ClienteInfo | null;
  createdBySystem: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface PaginatedRegistros {
  data: RegistroFinanceiro[];
  total: number;
  page: number;
  lastPage: number;
}
