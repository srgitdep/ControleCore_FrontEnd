/**
 * A gestão de pedidos do Compra Fácil, do lado do funcionário — Fase 12
 * (Docs/plano_feature_compra_facil.md §8.2, backend em
 * `ControleCore_BackEnd/src/modules/commerce/pedido-gestao.controller.ts`).
 *
 * Feature irmã de `compra-facil` (que é o lado do cliente, público, com a sua
 * própria instância axios `contaApi`) — esta usa a instância `api` partilhada,
 * autenticada por cookie de funcionário.
 */

export type EstadoPedidoCommerce =
  | 'CRIADO'
  | 'AGUARDA_CONFIRMACAO'
  | 'CONFIRMADO'
  | 'EM_PREPARACAO'
  | 'PRONTO'
  | 'AGUARDA_LEVANTAMENTO'
  | 'CONCLUIDO'
  | 'CANCELADO';

export const ETIQUETA_ESTADO_PEDIDO_COMMERCE: Record<EstadoPedidoCommerce, string> = {
  CRIADO: 'Novo',
  AGUARDA_CONFIRMACAO: 'A aguardar confirmação',
  CONFIRMADO: 'Confirmado',
  EM_PREPARACAO: 'Em preparação',
  PRONTO: 'Pronto para levantar',
  AGUARDA_LEVANTAMENTO: 'A aguardar levantamento',
  CONCLUIDO: 'Concluído',
  CANCELADO: 'Cancelado',
};

export type CanalComunicacao = 'SMS' | 'EMAIL' | 'WHATSAPP' | 'CHAMADA' | 'PUSH';

export const ETIQUETA_CANAL: Record<CanalComunicacao, string> = {
  SMS: 'SMS',
  EMAIL: 'E-mail',
  WHATSAPP: 'WhatsApp',
  CHAMADA: 'Chamada',
  PUSH: 'Notificação push',
};

export interface SubstituicaoPedidoItem {
  produtoSubstitutoId: string | null;
  quantidadeAceite: number;
  precoUnitarioAceite: number;
  motivo: string;
  canalAutorizacao: CanalComunicacao | null;
  registoAutorizacao: string;
}

export interface PedidoItemCommerce {
  id: string;
  produtoId: string;
  quantidade: number;
  precoUnitario: number;
  subtotal: number;
  quantidadeConferida: number | null;
  produto: { nome: string };
  substituicao: SubstituicaoPedidoItem | null;
}

export interface PedidoCommerceGestao {
  id: string;
  numeroPedido: string;
  estado: EstadoPedidoCommerce;
  metodoPagamento: string;
  subtotal: number;
  totalDesconto: number;
  totalFinal: number;
  createdAt: string;
  canceladoEm: string | null;
  motivoCancelamento: string | null;
  vendaId: string | null;
  itens: PedidoItemCommerce[];
  cliente: { nome: string; telefone: string | null };
  loja: { nome: string };
}

export interface FiltrosPedidoCommerce {
  estado?: EstadoPedidoCommerce;
  lojaId?: string;
}

export interface CancelarPedidoPayload {
  /** Vai no aviso ao cliente e fica gravado no pedido — o backend recusa vazio. */
  motivo: string;
}

export interface ConferirPedidoPayload {
  itens?: { pedidoItemId: string; quantidadeConferida: number }[];
}

export interface SubstituirItemPayload {
  produtoSubstitutoId?: string;
  quantidadeAceite: number;
  motivo: string;
  canalAutorizacao: CanalComunicacao;
  registoAutorizacao: string;
}
