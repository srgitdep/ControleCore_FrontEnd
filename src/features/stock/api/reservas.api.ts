import { api } from '@/shared/config';
import type { EstadoReserva, EstadosDaPosicao, ReservaStock, Stock } from '../types/stock.types';

/**
 * Reservas e retenção de mercadoria.
 *
 * As três operações mexem no que o stock **oferece** sem mexer no que ele **tem**: a
 * existência física não muda em nenhuma delas. É por isso que nenhuma gera movimento de
 * stock, e é por isso que vivem à parte de `stock.api.ts`, que trata de entradas e saídas.
 */

export interface CriarReservaPayload {
  stockId: string;
  quantidade: number;
  /** Horas até caducar. Omitir usa 48. */
  horasAteExpirar?: number;
  /** Reserva que só sai por expedição ou libertação explícita. */
  semPrazo?: boolean;
  /** O pedido ou a ordem que a originou. Sem isto, ninguém sabe explicá-la depois. */
  referencia?: string;
  motivo?: string;
}

export interface ReterPayload {
  quantidade: number;
  /** Obrigatório: mercadoria retida sem motivo não é libertada por ninguém. */
  motivo: string;
}

export interface LibertarPayload {
  quantidade: number;
  motivo?: string;
}

export interface ResultadoExpiracao {
  referencia: string;
  expiradas: number;
  quantidadeLibertada: number;
  reservas: { id: string; stockId: string; quantidade: number; referencia?: string | null }[];
}

/** A posição devolvida pelas operações de retenção, já com os estados recalculados. */
type PosicaoComEstados = Stock & { estados: EstadosDaPosicao };

export const reservasApi = {
  // ─── Reservas ──────────────────────────────────────────────────────────────

  listar: async (params?: { estado?: EstadoReserva; stockId?: string; produtoId?: string }) => {
    const { data } = await api.get<ReservaStock[]>('/stock/reservas', { params });
    return data;
  },

  criar: async (payload: CriarReservaPayload) => {
    const { data } = await api.post<ReservaStock>('/stock/reservas', payload);
    return data;
  },

  libertar: async (reservaId: string, payload: LibertarPayload | { motivo?: string }) => {
    const { data } = await api.patch<ReservaStock>(
      `/stock/reservas/${reservaId}/libertar`,
      payload,
    );
    return data;
  },

  /**
   * Antecipa o varrimento que corre de dez em dez minutos no servidor.
   *
   * Idempotente: uma reserva já resolvida não é tocada.
   */
  expirarAgora: async () => {
    const { data } = await api.post<ResultadoExpiracao>('/stock/reservas/expirar', {});
    return data;
  },

  // ─── Quarentena e bloqueio ─────────────────────────────────────────────────

  reterEmQuarentena: async (stockId: string, payload: ReterPayload) => {
    const { data } = await api.post<PosicaoComEstados>(`/stock/${stockId}/quarentena`, payload);
    return data;
  },

  libertarDaQuarentena: async (stockId: string, payload: LibertarPayload) => {
    const { data } = await api.post<PosicaoComEstados>(
      `/stock/${stockId}/quarentena/libertar`,
      payload,
    );
    return data;
  },

  bloquear: async (stockId: string, payload: ReterPayload) => {
    const { data } = await api.post<PosicaoComEstados>(`/stock/${stockId}/bloqueio`, payload);
    return data;
  },

  desbloquear: async (stockId: string, payload: LibertarPayload) => {
    const { data } = await api.post<PosicaoComEstados>(
      `/stock/${stockId}/bloqueio/libertar`,
      payload,
    );
    return data;
  },
};
