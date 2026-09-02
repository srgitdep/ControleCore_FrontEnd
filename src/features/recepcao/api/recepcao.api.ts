import { api } from '@/shared/config';

/**
 * A descarga de mercadoria como processo (§18–31).
 *
 * A entrada simples — a guia de três linhas que chega ao balcão — continua onde estava, em
 * Compras. Isto é para a descarga que justifica contagem, conferência e aprovação.
 */

export type EstadoRecepcao =
  | 'ABERTA'
  | 'EM_CONFERENCIA'
  | 'CONFERIDA'
  | 'AGUARDA_APROVACAO'
  | 'APROVADA'
  | 'REJEITADA'
  | 'STOCK_LANCADO'
  | 'CANCELADA';

export type TipoDivergencia =
  | 'FACTURADO_ACIMA_DO_PEDIDO'
  | 'DESCARREGADO_ABAIXO_DO_FACTURADO'
  | 'DESCARREGADO_ACIMA_DO_FACTURADO'
  | 'MERCADORIA_DANIFICADA'
  | 'DESCARREGADO_ACIMA_DO_PEDIDO';

export interface Divergencia {
  tipo: TipoDivergencia;
  diferenca: number;
  percentagem: number;
  exigeAprovacao: boolean;
  descricao: string;
}

export interface LinhaRecepcao {
  id: string;
  produtoId: string;
  produto?: { nome: string; codigoBarras: string | null; unidadeMedida: string } | null;
  unidade?: { codigo: string } | null;
  factorConversao: number | null;
  quantidadePedida: number;
  quantidadeFacturada: number;
  quantidadeDescarregada: number;
  quantidadeAceite: number;
  quantidadeDanificada: number;
  quantidadeBonificada: number;
  custoUnitario: number;
  lote: string | null;
  dataValidade: string | null;
  dataProducao: string | null;
  contadoPorId: string | null;
  contadoEm: string | null;
  contadoPor?: { name: string } | null;
  observacoes: string | null;
  comparacao: { divergencias: Divergencia[]; exigeAprovacao: boolean };
}

export interface SessaoRecepcao {
  id: string;
  numero: string;
  estado: EstadoRecepcao;
  pedidoId: string;
  armazemId: string;
  documentoRef: string | null;
  observacoes: string | null;
  abertaEm: string;
  conferidaEm: string | null;
  aprovadaEm: string | null;
  motivoRejeicao: string | null;
  rececaoId: string | null;
  armazem?: { nome: string } | null;
  fornecedor?: { nome: string } | null;
  abertaPor?: { name: string } | null;
  linhas: LinhaRecepcao[];
  tolerancia: number;
  exigeAprovacao: boolean;
}

export interface SessaoNaLista {
  id: string;
  numero: string;
  estado: EstadoRecepcao;
  documentoRef: string | null;
  abertaEm: string;
  armazem?: { nome: string } | null;
  fornecedor?: { nome: string } | null;
  abertaPor?: { name: string } | null;
  _count: { linhas: number };
}

/**
 * A vista de quem conta.
 *
 * Sem custos **e sem a quantidade facturada**: quem confere com o valor à frente conta contra
 * o número esperado em vez de contra a prateleira, e uma diferença que custa dinheiro tende a
 * ser arredondada para o número que fecha.
 */
export interface LinhaParaConferente {
  id: string;
  produtoId: string;
  produto?: string;
  codigoBarras?: string | null;
  unidade: string | null;
  quantidadeDescarregada: number;
  quantidadeAceite: number;
  quantidadeDanificada: number;
  contadoPor: string | null;
  contadoEm: string | null;
  observacoes: string | null;
  exigeLote: boolean;
  exigeValidade: boolean;
}

export interface VistaDoConferente {
  id: string;
  numero: string;
  estado: EstadoRecepcao;
  armazem?: string;
  fornecedor?: string;
  abertaEm: string;
  linhas: LinhaParaConferente[];
}

export const recepcaoApi = {
  listar: async (filtros?: { estado?: EstadoRecepcao; pedidoId?: string }) => {
    const { data } = await api.get<SessaoNaLista[]>('/recepcoes', { params: filtros });
    return data;
  },

  obter: async (id: string) => {
    const { data } = await api.get<SessaoRecepcao>(`/recepcoes/${id}`);
    return data;
  },

  conferencia: async (id: string) => {
    const { data } = await api.get<VistaDoConferente>(`/recepcoes/${id}/conferencia`);
    return data;
  },

  abrir: async (payload: {
    pedidoId: string;
    armazemId: string;
    documentoRef?: string;
    observacoes?: string;
  }) => {
    const { data } = await api.post<SessaoRecepcao>('/recepcoes', payload);
    return data;
  },

  contar: async (
    id: string,
    linhaId: string,
    payload: {
      quantidadeDescarregada: number;
      quantidadeAceite: number;
      quantidadeDanificada?: number;
      observacoes?: string;
    },
  ) => {
    const { data } = await api.patch(`/recepcoes/${id}/linhas/${linhaId}/contagem`, payload);
    return data;
  },

  actualizarLinha: async (
    id: string,
    linhaId: string,
    payload: {
      quantidadeFacturada?: number;
      quantidadeBonificada?: number;
      custoUnitario?: number;
      lote?: string;
      dataValidade?: string;
      dataProducao?: string;
    },
  ) => {
    const { data } = await api.patch(`/recepcoes/${id}/linhas/${linhaId}`, payload);
    return data;
  },

  conferir: async (id: string) => {
    const { data } = await api.post(`/recepcoes/${id}/conferir`);
    return data;
  },

  aprovar: async (id: string) => {
    const { data } = await api.post(`/recepcoes/${id}/aprovar`);
    return data;
  },

  rejeitar: async (id: string, motivo: string) => {
    const { data } = await api.post(`/recepcoes/${id}/rejeitar`, { motivo });
    return data;
  },

  reabrir: async (id: string) => {
    const { data } = await api.post(`/recepcoes/${id}/reabrir`);
    return data;
  },

  cancelar: async (id: string, motivo: string) => {
    const { data } = await api.post(`/recepcoes/${id}/cancelar`, { motivo });
    return data;
  },

  lancar: async (id: string, prazoPagamentoDias?: number) => {
    const { data } = await api.post(`/recepcoes/${id}/lancar`, { prazoPagamentoDias });
    return data;
  },
};

export const ROTULO_ESTADO: Record<EstadoRecepcao, string> = {
  ABERTA: 'Aberta',
  EM_CONFERENCIA: 'Em conferência',
  CONFERIDA: 'Conferida',
  AGUARDA_APROVACAO: 'Aguarda aprovação',
  APROVADA: 'Aprovada',
  REJEITADA: 'Rejeitada',
  STOCK_LANCADO: 'Stock lançado',
  CANCELADA: 'Cancelada',
};

export const COR_ESTADO: Record<EstadoRecepcao, string> = {
  ABERTA: 'bg-slate-100 text-slate-700',
  EM_CONFERENCIA: 'bg-blue-100 text-blue-700',
  CONFERIDA: 'bg-emerald-100 text-emerald-700',
  AGUARDA_APROVACAO: 'bg-amber-100 text-amber-700',
  APROVADA: 'bg-emerald-100 text-emerald-700',
  REJEITADA: 'bg-red-100 text-red-700',
  STOCK_LANCADO: 'bg-slate-800 text-white',
  CANCELADA: 'bg-slate-100 text-slate-400',
};
