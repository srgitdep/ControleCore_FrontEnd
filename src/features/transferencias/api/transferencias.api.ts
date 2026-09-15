import { api } from '@/shared/config';
import type {
  DetalheTransferencia,
  FiltrosTransferencia,
  ListaTransferencias,
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

  solicitar: async (dados: {
    produtoId: string;
    origemLojaId: string;
    destinoLojaId: string;
    quantidade: number;
    necessidadeId?: string;
    motivo?: string;
  }) => {
    const { data } = await api.post('/transferencias-loja', dados);
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
