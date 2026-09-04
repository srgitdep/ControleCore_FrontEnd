import { api } from '@/shared/config';
import type {
  DreSummary,
  CashFlowProjection,
  PaginatedRegistros,
  RegistroFinanceiro,
  RelatorioLucro,
  TipoLancamento,
} from '@/features/financeiro';

// ──â”€ DRE Summary ────────────────────────────────────────────────────────────â”€

/**
 * Lucro do mês, margem, quebras de caixa e os cinco produtos mais vendidos.
 *
 * ## Porque não é o DRE
 *
 * O DRE responde à pergunta contabilística — facturação, CMV, margem, despesas, resultado
 * operacional. Este relatório traz duas coisas que o DRE não tem e que ninguém mais no
 * sistema mostra:
 *
 *  - **Quebras de caixa**: a soma das diferenças entre o saldo calculado e o declarado em
 *    cada sessão fechada no mês. É dinheiro que faltou na gaveta, e é a única leitura
 *    agregada desse número em toda a aplicação.
 *  - **Os cinco produtos com mais unidades vendidas**, com a receita de cada.
 *
 * O endpoint está marcado `[LEGADO]` no servidor — e é por isso que fica num separador
 * próprio em vez de se misturar com o DRE: sinaliza o que é, sem esconder o que só ele diz.
 */
export const getRelatorioLucro = async (
  mes: number,
  ano: number,
): Promise<RelatorioLucro> => {
  const { data } = await api.get<RelatorioLucro>('/finance/lucro', {
    params: { mes, ano },
  });
  return data;
};

export const getDreSummary = async (mes: number, ano: number): Promise<DreSummary> => {
  const { data } = await api.get<DreSummary>('/finance/dre-summary', {
    params: { mes, ano },
  });
  return data;
};

// ──â”€ Cash Flow Projection ────────────────────────────────────────────────────

export const getCashFlowProjection = async (
  dias = 30,
): Promise<CashFlowProjection> => {
  const { data } = await api.get<CashFlowProjection>('/finance/cash-flow-projection', {
    params: { dias },
  });
  return data;
};

// ──â”€ Contas a Receber ────────────────────────────────────────────────────────

export const getContasReceber = async (
  page = 1,
  limit = 20,
): Promise<PaginatedRegistros> => {
  const { data } = await api.get<PaginatedRegistros>('/finance/contas-receber', {
    params: { page, limit },
  });
  return data;
};

// ──â”€ Contas a Pagar ──────────────────────────────────────────────────────────

export const getContasPagar = async (
  page = 1,
  limit = 20,
): Promise<PaginatedRegistros> => {
  const { data } = await api.get<PaginatedRegistros>('/finance/contas-pagar', {
    params: { page, limit },
  });
  return data;
};

// ──â”€ Processar Pagamento ────────────────────────────────────────────────────â”€

export const processarPagamento = async (id: string): Promise<RegistroFinanceiro> => {
  const { data } = await api.patch<RegistroFinanceiro>(`/finance/contas/${id}/pagar`);
  return data;
};

// ──â”€ Criar Registro Manual ──────────────────────────────────────────────────â”€

export interface CriarRegistroDto {
  tipo: TipoLancamento;
  descricao: string;
  valor: number;
  dataVencimento: string; // ISO date string
  fornecedorId?: string;
  clienteId?: string;
  vendaId?: string;
}

export const criarRegistro = async (dto: CriarRegistroDto): Promise<RegistroFinanceiro> => {
  const { data } = await api.post<RegistroFinanceiro>('/finance/registros', dto);
  return data;
};
