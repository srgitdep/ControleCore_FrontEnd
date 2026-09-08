import { api } from '@/shared/config';

/**
 * Avisos Antecipados de Expedição — o que o fornecedor **declara** ter expedido.
 *
 * ## Quatro coisas diferentes
 *
 * Aviso, expedição, prova de entrega e recepção. A maioria dos sistemas colapsa-as numa
 * só e depois nunca consegue responder à pergunta que interessa quando falta mercadoria:
 * o fornecedor mentiu, o transportador perdeu, ou o armazém contou mal?
 *
 * **Nada disto mexe em stock.** Nem o aviso, nem a prova de entrega. Um aviso submetido é
 * uma promessa, e promessas não entram em armazém.
 */

export const EstadoAviso = {
  RASCUNHO: 'RASCUNHO',
  SUBMETIDO: 'SUBMETIDO',
  EM_TRANSITO: 'EM_TRANSITO',
  CHEGADO: 'CHEGADO',
  RECEPCIONADO: 'RECEPCIONADO',
  CANCELADO: 'CANCELADO',
} as const;
export type EstadoAviso = (typeof EstadoAviso)[keyof typeof EstadoAviso];

export const ROTULO_ESTADO_AVISO: Record<EstadoAviso, string> = {
  RASCUNHO: 'Rascunho',
  SUBMETIDO: 'Declarado',
  EM_TRANSITO: 'A caminho',
  CHEGADO: 'Chegou',
  RECEPCIONADO: 'Recepcionado',
  CANCELADO: 'Cancelado',
};

/**
 * As transições possíveis, espelhando o backend.
 *
 * `RECEPCIONADO` não está em lado nenhum de propósito: só a recepção o marca. Deixá-lo
 * aqui permitiria declarar recepcionada mercadoria que nunca foi conferida.
 *
 * De `CHEGADO` não se volta a `EM_TRANSITO`: a carga chegou, e desdizê-lo apagaria a hora
 * de chegada, que é metade da prova de entrega. Um engano corrige-se cancelando.
 */
export const TRANSICOES_AVISO: Record<EstadoAviso, EstadoAviso[]> = {
  RASCUNHO: ['SUBMETIDO', 'CANCELADO'],
  SUBMETIDO: ['EM_TRANSITO', 'CANCELADO'],
  EM_TRANSITO: ['CHEGADO', 'CANCELADO'],
  CHEGADO: ['CANCELADO'],
  RECEPCIONADO: [],
  CANCELADO: [],
};

export interface LinhaAviso {
  id: string;
  itemId: string;
  produtoId: string;
  quantidade: number;
  /** Declarados pelo fornecedor. Quem decide o lote que entra em stock é a recepção. */
  lote?: string | null;
  validade?: string | null;
}

export interface AvisoExpedicao {
  id: string;
  pedidoId: string;
  fornecedorId: string;
  numeroFornecedor?: string | null;
  estado: EstadoAviso;
  dataExpedicao?: string | null;
  dataPrevistaChegada?: string | null;
  dataChegada?: string | null;
  origem?: string | null;
  destinoArmazemId?: string | null;
  transportador?: string | null;
  matricula?: string | null;
  motorista?: string | null;
  contactoMotorista?: string | null;
  entregueEm?: string | null;
  recebidoPorNome?: string | null;
  provaUrl?: string | null;
  observacoesEntrega?: string | null;
  observacoes?: string | null;
  motivoCancelamento?: string | null;
  createdAt: string;
  fornecedor?: { nome: string };
  linhas?: LinhaAviso[];
  _count?: { linhas: number };
}

export interface SaldoPorAvisar {
  itemId: string;
  produtoId: string;
  quantidade: number;
}

export interface CriarAvisoDto {
  pedidoId: string;
  linhas: {
    itemId: string;
    quantidade: number;
    lote?: string;
    validade?: string;
  }[];
  numeroFornecedor?: string;
  dataExpedicao?: string;
  dataPrevistaChegada?: string;
  origem?: string;
  destinoArmazemId?: string;
  transportador?: string;
  matricula?: string;
  motorista?: string;
  contactoMotorista?: string;
  observacoes?: string;
}

export const avisosApi = {
  listar: async (params?: { pedidoId?: string; estado?: EstadoAviso }) => {
    const { data } = await api.get<AvisoExpedicao[]>('/b2b/avisos-expedicao', { params });
    return data;
  },

  obter: async (id: string) => {
    const { data } = await api.get<AvisoExpedicao>(`/b2b/avisos-expedicao/${id}`);
    return data;
  },

  /**
   * Regista o que o fornecedor declara ter expedido.
   *
   * Valida contra o saldo da ordem, contando os avisos anteriores não cancelados: uma
   * ordem pode originar vários avisos, e sem contar os anteriores o fornecedor podia
   * declarar a ordem inteira cinco vezes.
   */
  criar: async (dto: CriarAvisoDto) => {
    const { data } = await api.post<{
      aviso: AvisoExpedicao;
      saldoRestante: SaldoPorAvisar[];
    }>('/b2b/avisos-expedicao', dto);
    return data;
  },

  mudarEstado: async (
    id: string,
    dto: { estado: EstadoAviso; dataChegada?: string; motivo?: string },
  ) => {
    const { data } = await api.patch<AvisoExpedicao>(`/b2b/avisos-expedicao/${id}/estado`, dto);
    return data;
  },

  /**
   * Prova de entrega.
   *
   * **Não actualiza stock e não fecha o aviso.** Quem assina à porta não conferiu nada:
   * assinou que um camião encostou. É o que permite distinguir «chegou e faltava» de
   * «nunca chegou».
   */
  registarEntrega: async (
    id: string,
    dto: { recebidoPorNome: string; entregueEm?: string; provaUrl?: string; observacoes?: string },
  ) => {
    const { data } = await api.post<AvisoExpedicao>(`/b2b/avisos-expedicao/${id}/entrega`, dto);
    return data;
  },
};
