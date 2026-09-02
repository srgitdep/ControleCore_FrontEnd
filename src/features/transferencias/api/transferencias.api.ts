import { api } from '@/shared/config';

/**
 * Transferências com trânsito (§34–36).
 *
 * A transferência instantânea de `/stock/transfer` continua onde estava: serve a mudança entre
 * duas arrecadações da mesma loja, onde a mercadoria muda de sítio em segundos. Isto é para a
 * que atravessa uma estrada — e onde, entre a saída e a chegada, a mercadoria não está em
 * nenhum dos dois armazéns.
 */

export type EstadoTransferencia =
  | 'SOLICITADA'
  | 'APROVADA'
  | 'EM_TRANSITO'
  | 'RECEBIDA'
  | 'CANCELADA';

export interface ItemTransferencia {
  id: string;
  produtoId: string;
  quantidadeSolicitada: number;
  quantidadeExpedida: number;
  quantidadeRecebida: number;
  loteId: string | null;
  produto?: { nome: string; unidadeMedida: string } | null;
  lote?: { codigo: string; dataValidade: string | null } | null;
}

export interface PerdaEmTransito {
  produtoId: string;
  expedida: number;
  recebida: number;
  perdida: number;
}

export interface Transferencia {
  id: string;
  numero: string;
  estado: EstadoTransferencia;
  motivo: string | null;
  observacoes: string | null;
  solicitadaEm: string;
  aprovadaEm: string | null;
  expedidaEm: string | null;
  recebidaEm: string | null;
  origem?: { id: string; nome: string } | null;
  destino?: { id: string; nome: string } | null;
  itens: ItemTransferencia[];
  perdas: PerdaEmTransito[];
}

export interface EmTransito {
  produtoId: string;
  produto: string;
  unidade: string;
  destinoId: string;
  destino: string;
  quantidade: number;
  transferencias: { numero: string; origem: string; expedidaEm: string | null }[];
}

export const transferenciasApi = {
  listar: async (filtros?: {
    estado?: EstadoTransferencia;
    origemId?: string;
    destinoId?: string;
  }) => {
    const { data } = await api.get<any[]>('/transferencias', { params: filtros });
    return data;
  },

  obter: async (id: string) => {
    const { data } = await api.get<Transferencia>(`/transferencias/${id}`);
    return data;
  },

  /** O que está a caminho. Não conta como disponível, mas quem compra tem de saber que existe. */
  emTransito: async (filtros?: { produtoId?: string; destinoId?: string }) => {
    const { data } = await api.get<EmTransito[]>('/transferencias/em-transito', {
      params: filtros,
    });
    return data;
  },

  solicitar: async (payload: {
    origemId: string;
    destinoId: string;
    motivo?: string;
    observacoes?: string;
    itens: { produtoId: string; quantidade: number; loteId?: string }[];
  }) => {
    const { data } = await api.post<Transferencia>('/transferencias', payload);
    return data;
  },

  aprovar: async (id: string) => {
    const { data } = await api.post(`/transferencias/${id}/aprovar`);
    return data;
  },

  expedir: async (id: string, itens: { itemId: string; quantidade: number }[]) => {
    const { data } = await api.post<Transferencia>(`/transferencias/${id}/expedir`, { itens });
    return data;
  },

  receber: async (id: string, itens: { itemId: string; quantidade: number }[]) => {
    const { data } = await api.post<Transferencia>(`/transferencias/${id}/receber`, { itens });
    return data;
  },

  cancelar: async (id: string, motivo: string) => {
    const { data } = await api.post(`/transferencias/${id}/cancelar`, { motivo });
    return data;
  },
};

export const ROTULO_ESTADO_TRANSFERENCIA: Record<EstadoTransferencia, string> = {
  SOLICITADA: 'Solicitada',
  APROVADA: 'Aprovada, por expedir',
  EM_TRANSITO: 'A caminho',
  RECEBIDA: 'Recebida',
  CANCELADA: 'Cancelada',
};

export const COR_ESTADO_TRANSFERENCIA: Record<EstadoTransferencia, string> = {
  SOLICITADA: 'bg-slate-100 text-slate-600',
  APROVADA: 'bg-blue-100 text-blue-700',
  EM_TRANSITO: 'bg-amber-100 text-amber-700',
  RECEBIDA: 'bg-emerald-100 text-emerald-700',
  CANCELADA: 'bg-slate-100 text-slate-400',
};
