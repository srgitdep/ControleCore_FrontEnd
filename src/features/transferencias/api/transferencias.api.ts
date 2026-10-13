import { api } from '@/shared/config';
import type {
  DetalheDoGrupo,
  DetalheTransferencia,
  DisponivelNoArmazem,
  FiltrosTransferencia,
  ListaTransferencias,
  PedidoEmMassa,
  ResultadoDaAccaoDoGrupo,
  ResultadoDoPedido,
} from '../types/transferencia.types';

/**
 * O workflow de transferências entre lojas — DT01 §12 e §15.1.
 *
 * Nenhuma função aqui decide nada: a aprovação revalida no servidor se a origem ainda
 * tem stock cedível, e pode aprovar menos do que o solicitado. O cliente só mostra o
 * que o backend devolveu.
 */
export const transferenciasApi = {
  listar: async (filtros?: FiltrosTransferencia) => {
    const { data } = await api.get<ListaTransferencias>('/transferencias-loja', {
      params: { ...filtros, estado: filtros?.estado?.join(',') },
    });
    return data;
  },

  getDetalhe: async (id: string) => {
    const { data } = await api.get<DetalheTransferencia>(`/transferencias-loja/${id}`);
    return data;
  },

  /**
   * Pede a transferência de **vários produtos** de um armazém para outro (plano §4.12). Tudo ou nada: se alguma linha
   * não serve, o servidor não cria nenhuma e responde 400 com todos os erros em `erros`.
   */
  solicitarEmMassa: async (pedido: PedidoEmMassa) => {
    const { data } = await api.post<ResultadoDoPedido>('/transferencias-loja/em-massa', pedido);
    return data;
  },

  /** Os produtos com stock num armazém (físico, reservado, disponível, cedível e stock no destino), paginados. */
  disponivelNoArmazem: async (
    armazemId: string,
    params: { destinoArmazemId?: string; pesquisa?: string; page?: number; limit?: number },
  ) => {
    const { data } = await api.get<DisponivelNoArmazem>(`/transferencias-loja/armazens/${armazemId}/disponivel`, { params });
    return data;
  },

  getGrupo: async (grupoId: string) => {
    const { data } = await api.get<DetalheDoGrupo>(`/transferencias-loja/grupos/${grupoId}`);
    return data;
  },

  /** Aprovar ou recusar as linhas por decidir do pedido. */
  decidirGrupo: async (grupoId: string, decisao: 'APROVAR' | 'RECUSAR', motivo?: string) => {
    const { data } = await api.post<ResultadoDaAccaoDoGrupo>(`/transferencias-loja/grupos/${grupoId}/decidir`, { decisao, motivo });
    return data;
  },

  expedirGrupo: async (grupoId: string) => {
    const { data } = await api.post<ResultadoDaAccaoDoGrupo>(`/transferencias-loja/grupos/${grupoId}/expedir`);
    return data;
  },

  /** Recebe o que foi expedido; `quantidades` (transferenciaId → recebido) só para as divergências. */
  receberGrupo: async (grupoId: string, quantidades?: Record<string, number>) => {
    const { data } = await api.post<ResultadoDaAccaoDoGrupo>(`/transferencias-loja/grupos/${grupoId}/receber`, { quantidades });
    return data;
  },

  cancelarGrupo: async (grupoId: string, motivo: string) => {
    const { data } = await api.post<ResultadoDaAccaoDoGrupo>(`/transferencias-loja/grupos/${grupoId}/cancelar`, { motivo });
    return data;
  },

  /** Aprovar reserva o stock na origem; recusar não mexe em nada. */
  decidir: async (id: string, decisao: 'APROVAR' | 'RECUSAR', motivo?: string) => {
    const { data } = await api.post(`/transferencias-loja/${id}/decidir`, { decisao, motivo });
    return data;
  },

  /** O físico sai da origem e entra em trânsito no destino. */
  expedir: async (id: string) => {
    const { data } = await api.post(`/transferencias-loja/${id}/expedir`);
    return data;
  },

  /** Confirma o que chegou. Pode ser menor do que foi expedido. */
  receber: async (id: string, quantidadeRecebida: number) => {
    const { data } = await api.post(`/transferencias-loja/${id}/receber`, { quantidadeRecebida });
    return data;
  },

  /** Só possível antes de expedir. */
  cancelar: async (id: string, motivo: string) => {
    const { data } = await api.post(`/transferencias-loja/${id}/cancelar`, { motivo });
    return data;
  },
};
