import { api } from './axios';
import type {
  DreSummary,
  CashFlowProjection,
  PaginatedRegistros,
  RegistroFinanceiro,
  TipoLancamento,
} from '@/types/finance.types';

// â”€â”€â”€ DRE Summary â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

export const getDreSummary = async (mes: number, ano: number): Promise<DreSummary> => {
  const { data } = await api.get<DreSummary>('/finance/dre-summary', {
    params: { mes, ano },
  });
  return data;
};

// â”€â”€â”€ Cash Flow Projection â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

export const getCashFlowProjection = async (
  dias = 30,
): Promise<CashFlowProjection> => {
  const { data } = await api.get<CashFlowProjection>('/finance/cash-flow-projection', {
    params: { dias },
  });
  return data;
};

// â”€â”€â”€ Contas a Receber â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

export const getContasReceber = async (
  page = 1,
  limit = 20,
): Promise<PaginatedRegistros> => {
  const { data } = await api.get<PaginatedRegistros>('/finance/contas-receber', {
    params: { page, limit },
  });
  return data;
};

// â”€â”€â”€ Contas a Pagar â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

export const getContasPagar = async (
  page = 1,
  limit = 20,
): Promise<PaginatedRegistros> => {
  const { data } = await api.get<PaginatedRegistros>('/finance/contas-pagar', {
    params: { page, limit },
  });
  return data;
};

// â”€â”€â”€ Processar Pagamento â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

export const processarPagamento = async (id: string): Promise<RegistroFinanceiro> => {
  const { data } = await api.patch<RegistroFinanceiro>(`/finance/contas/${id}/pagar`);
  return data;
};

// â”€â”€â”€ Criar Registro Manual â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

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
