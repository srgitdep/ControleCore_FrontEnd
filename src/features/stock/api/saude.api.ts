import { api } from '@/shared/config';
import type {
  ListaSaude,
  ListaValidade,
  SaudeStock,
  SugestaoFefo,
} from '../types/saude.types';

/**
 * Os limiares que a análise usa.
 *
 * Vão na query e não fixos: o que é «stock parado» muda com o ramo — 60 dias sem venda é
 * normal numa loja de electrodomésticos e é alarme numa mercearia. O backend tem as
 * omissões e devolve sempre o critério que usou, para o ecrã poder mostrar com que régua os
 * números foram medidos.
 */
export interface FiltrosSaude {
  janelaDias?: number;
  diasCoberturaMaximo?: number;
  diasCoberturaBaixaRotacao?: number;
  diasSemVendaParado?: number;
  diasSemVendaObsoleto?: number;
  diasAvisoOmissao?: number;
  diasEmRisco?: number;
}

export const saudeApi = {
  /** O agregado do §61: valor total, peso de cada classe, validades e rastreabilidade. */
  getResumo: async (params?: FiltrosSaude) => {
    const { data } = await api.get<SaudeStock>('/stock/saude', { params });
    return data;
  },

  /**
   * A lista por trás do resumo, do capital mais preso ao menos.
   *
   * `classe` aceita várias separadas por vírgula. Um valor desconhecido devolve tudo em vez
   * de uma lista vazia — uma lista vazia por erro de escrita é indistinguível de «não há
   * produtos nesta classe».
   */
  getProdutos: async (
    params?: FiltrosSaude & { classe?: string; page?: number; limit?: number },
  ) => {
    const { data } = await api.get<ListaSaude>('/stock/saude/produtos', { params });
    return data;
  },

  /** Lotes e o seu estado de validade. Aqui o filtro por armazém é legítimo. */
  getValidade: async (
    params?: FiltrosSaude & {
      estado?: string;
      produtoId?: string;
      armazemId?: string;
      page?: number;
      limit?: number;
    },
  ) => {
    const { data } = await api.get<ListaValidade>('/stock/validade', { params });
    return data;
  },

  /** FEFO: de que lotes retirar uma quantidade, começando pelo que expira primeiro. */
  getFefo: async (params: {
    produtoId: string;
    armazemId: string;
    quantidade: number;
    diasEmRisco?: number;
  }) => {
    const { data } = await api.get<SugestaoFefo>('/stock/validade/fefo', { params });
    return data;
  },
};
