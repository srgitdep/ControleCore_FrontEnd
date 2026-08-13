import { api } from '@/shared/config';

export interface Supplier {
  id: string;
  nome: string;
  nuit?: string;
  tipoFornecimento?: string;
  email?: string;
  telefone?: string;
  endereco?: string;
  website?: string;
  isActive: boolean;
}

export type SupplierPayload = Omit<Supplier, 'id' | 'isActive'> & { isActive?: boolean };

// ─── Histórico e desempenho ──────────────────────────────────────────────────

export interface PedidoDoFornecedor {
  pedidoId: string;
  estado: string;
  dataPedido: string;
  dataPrevista: string | null;
  observacoes: string | null;
  linhas: number;
  quantidadePedida: number;
  quantidadeRecebida: number;
  /** O que falta receber — a pergunta de quem abre o histórico. */
  pendente: number;
  valorPedido: number;
  produtos: {
    produtoId: string;
    nome: string;
    quantidadePedida: number;
    quantidadeRecebida: number;
    custoUnitario: number;
  }[];
  rececoes: {
    rececaoId: string;
    data: string;
    documentoRef: string | null;
    armazem: string | null;
    recebidoPor: string | null;
    valor: number;
  }[];
}

export interface HistoricoFornecedor {
  fornecedor: { id: string; nome: string; isActive: boolean; tipoFornecimento: string | null };
  pedidos: PedidoDoFornecedor[];
  /** `true` quando há mais pedidos do que os devolvidos. */
  truncado: boolean;
}

/**
 * Os nulos são significativos e não devem ser tratados como zero.
 *
 * `prazoMedioDias` nulo = nenhuma entrega registada, não "entrega imediata".
 * `pontualidadePercent` nulo = nenhum pedido tinha data combinada, não "0% pontual" —
 * a diferença é entre não saber e acusar.
 */
export interface DesempenhoFornecedor {
  pedidos: number;
  pedidosComEntrega: number;
  valorEncomendado: number;
  valorRecebido: number;
  prazoMedioDias: number | null;
  prazoMinimoDias: number | null;
  prazoMaximoDias: number | null;
  pontualidadePercent: number | null;
  pedidosComDataPrevista: number;
  entregasAtrasadas: number;
  atrasoMedioDias: number | null;
  cumprimentoPercent: number | null;
}

export const suppliersApi = {
  getSuppliers: async () => {
    const { data } = await api.get<Supplier[]>('/fornecedores');
    return data;
  },

  getSupplierById: async (id: string) => {
    const { data } = await api.get<Supplier>(`/fornecedores/${id}`);
    return data;
  },

  createSupplier: async (payload: SupplierPayload) => {
    const { data } = await api.post<Supplier>('/fornecedores', payload);
    return data;
  },

  updateSupplier: async (id: string, payload: Partial<SupplierPayload>) => {
    const { data } = await api.patch<Supplier>(`/fornecedores/${id}`, payload);
    return data;
  },

  // Apaga o registo de facto (não é desactivação lógica). Para suspender um
  // fornecedor sem perder o histórico, use updateSupplier com isActive: false.
  deleteSupplier: async (id: string) => {
    const { data } = await api.delete(`/fornecedores/${id}`);
    return data;
  },

  /** Pedidos feitos ao fornecedor, com o que ficou pendente e as recepções de cada um. */
  getHistorico: async (id: string) => {
    const { data } = await api.get<HistoricoFornecedor>(`/fornecedores/${id}/historico`);
    return data;
  },

  /**
   * Prazo real, pontualidade e cumprimento das quantidades.
   *
   * Recepções anuladas não contam — não houve entrega.
   */
  getDesempenho: async (id: string) => {
    const { data } = await api.get<{
      fornecedor: { id: string; nome: string };
      desempenho: DesempenhoFornecedor;
    }>(`/fornecedores/${id}/desempenho`);
    return data;
  },
};
