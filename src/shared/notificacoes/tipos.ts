/** O contrato das notificações dentro da aplicação (plano §4.7). Espelha o backend (`notificacao-tipos.ts`). */

export type DestinatarioNotificacao = 'FUNCIONARIO' | 'ESTAFETA' | 'CLIENTE';

export interface ParametrosDaNotificacao {
  numeroPedido?: string;
  /** O primeiro nome do estafeta — o cliente nunca vê mais do que isso. */
  estafeta?: string;
  motivo?: string;
  morada?: string;
  valorACobrar?: number;
  paraEntrega?: boolean;
  comAjustes?: boolean;
  /** A loja de uma oferta de entrega e a que distância fica do estafeta (plano §4.9). */
  loja?: string;
  distanciaMetros?: number;
  /** Há quantos minutos a entrega espera por um estafeta. */
  minutos?: number;
}

export interface Notificacao {
  id: string;
  destinatarioTipo: DestinatarioNotificacao;
  /** `pedido.confirmado`, `entrega.chegou`… — a chave da frase, por destinatário, em `notificacoes.json`. */
  tipo: string;
  parametros: ParametrosDaNotificacao;
  pedidoId: string | null;
  entregaId: string | null;
  lojaId: string | null;
  lidaEm: string | null;
  createdAt: string;
}

export interface PaginaDeNotificacoes {
  data: Notificacao[];
  total: number;
  naoLidas: number;
  pagina: number;
  limite: number;
}

/** O que cada tipo de utilizador sabe fazer com as suas notificações — a API é a mesma, os caminhos mudam. */
export interface ApiDeNotificacoes {
  listar: (pagina: number) => Promise<PaginaDeNotificacoes>;
  contagem: () => Promise<number>;
  marcarLida: (id: string) => Promise<unknown>;
  marcarTodasLidas: () => Promise<unknown>;
}

/** De onde vem uma lista de notificações: a API de quem lê, o canal em tempo real e para onde cada uma leva. */
export interface FonteDeNotificacoes {
  /** A raiz da chave da cache: separa o sino do cliente, do estafeta e da gestão. */
  chave: string;
  api: ApiDeNotificacoes;
  /** Falso = sem sessão (não se consulta nem se liga ao canal). */
  activo: boolean;
  obterToken: () => Promise<string>;
}
