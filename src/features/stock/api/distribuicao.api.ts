import { api } from '@/shared/config';

/**
 * Onde está a mercadoria dentro do armazém (§16, §17).
 *
 * Nenhuma destas operações gera movimento de stock: mudar mercadoria de prateleira não é uma
 * entrada nem uma saída, e o saldo do armazém é o mesmo antes e depois.
 */

export interface PosicaoNaLocalizacao {
  id: string;
  localizacaoId: string;
  caminho: string;
  activa: boolean;
  quantidade: number;
}

export interface ResumoDistribuicao {
  saldoFisico: number;
  localizado: number;
  /** Quanto do saldo ainda não tem posição atribuída. */
  porLocalizar: number;
  percentagemLocalizada: number;
  /** A soma das posições excede o saldo — informação errada, não falta de informação. */
  excedeSaldo: boolean;
}

export interface Distribuicao {
  posicoes: PosicaoNaLocalizacao[];
  resumo: ResumoDistribuicao;
}

/** A resposta do §16: onde está o produto, atravessando armazéns. */
export interface OndeEsta {
  produtoId: string;
  total: number;
  armazens: {
    armazemId: string;
    armazem: string;
    loja: string | null;
    stockId: string;
    quantidade: number;
    porLocalizar: number;
    localizacoes: {
      localizacaoId: string;
      caminho: string;
      nome: string | null;
      quantidade: number;
    }[];
    lotes: {
      loteId: string;
      codigo: string;
      quantidade: number;
      dataValidade: string | null;
      caminho: string | null;
    }[];
  }[];
}

export const distribuicaoApi = {
  obter: async (stockId: string) => {
    const { data } = await api.get<Distribuicao>(`/stock/${stockId}/localizacoes`);
    return data;
  },

  /** Absoluta: substitui o que estava. Zero retira a atribuição. */
  atribuir: async (stockId: string, payload: { localizacaoId: string; quantidade: number }) => {
    const { data } = await api.put<Distribuicao>(`/stock/${stockId}/localizacoes`, payload);
    return data;
  },

  mover: async (
    stockId: string,
    payload: {
      deLocalizacaoId: string;
      paraLocalizacaoId: string;
      quantidade: number;
      motivo?: string;
    },
  ) => {
    const { data } = await api.post<Distribuicao>(
      `/stock/${stockId}/localizacoes/mover`,
      payload,
    );
    return data;
  },

  ondeEsta: async (produtoId: string) => {
    const { data } = await api.get<OndeEsta>(`/stock/produto/${produtoId}/onde-esta`);
    return data;
  },
};
