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
  | 'CONFIRMADO'
  | 'EM_PREPARACAO'
  | 'PRONTO'
  // Entrega ao domicílio: a mercadoria já saiu da loja.
  | 'EXPEDIDO'
  | 'EM_ROTA'
  | 'FALHADA'
  | 'CONCLUIDO'
  | 'CANCELADO';

// As etiquetas de estado e de canal viviam aqui como `Record<..., string>` fixo em
// português. Com o multilingue, a tradução é feita por quem renderiza, via
// `t(`estado.${estado}`)` / `t(`canal.${canal}`)` no namespace `lojaGestao` — os
// tipos abaixo continuam a ser a fonte da verdade dos códigos válidos.

export type CanalComunicacao = 'SMS' | 'EMAIL' | 'WHATSAPP' | 'CHAMADA' | 'PUSH';

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

export type TipoEntregaPedidoGestao = 'LEVANTAMENTO' | 'ENTREGA';

/** A morada de um pedido de entrega — `EnderecoCliente` do backend, sem o que o ecrã não usa. */
export interface EnderecoDoPedido {
  rotulo: string | null;
  linha1: string;
  referencia: string | null;
  bairro: string | null;
  cidade: string;
  provincia: string;
  /** Para a ligação ao mapa. */
  latitude?: number;
  longitude?: number;
  contactoNome: string | null;
  contactoTelefone: string | null;
}

/** A conta online do cliente. Nunca traz identificadores: só *se* o e-mail está verificado e se é do Google. */
export interface ContaDoCliente {
  emailVerificado: boolean;
  viaGoogle: boolean;
  ultimoAcessoEm: string | null;
  activa: boolean;
}

/** O cliente **actual** de um pedido (o que o cadastro diz hoje), com as suas compras online. */
export interface ClienteDoPedido {
  id: string;
  nome: string;
  telefone: string | null;
  email: string | null;
  nuit: string | null;
  conta: ContaDoCliente | null;
  comprasOnline: { pedidos: number; total: number; ultimoPedidoEm: string | null };
}

export interface PedidoCommerceGestao {
  id: string;
  numeroPedido: string;
  estado: EstadoPedidoCommerce;
  metodoPagamento: string;
  subtotal: number;
  totalDesconto: number;
  totalFinal: number;
  tipoEntrega: TipoEntregaPedidoGestao;
  taxaEntrega: number;
  /** Só nos pedidos de entrega. */
  endereco: EnderecoDoPedido | null;
  createdAt: string;
  canceladoEm: string | null;
  motivoCancelamento: string | null;
  vendaId: string | null;
  itens: PedidoItemCommerce[];
  cliente: ClienteDoPedido;
  loja: { nome: string };
  /**
   * A cópia do que o cliente deu **neste** pedido (plano §4.13): não muda se ele editar o cadastro depois.
   * Nulos quando não deu (ou não aceitou partilhar) o campo.
   */
  clienteNome: string | null;
  clienteTelefone: string | null;
  clienteEmail: string | null;
  clienteNuit: string | null;
  enderecoSnapshot: EnderecoDoPedido | null;
  /** Pedidos anteriores à cópia: preenchida a partir do cliente de hoje, pelo que não é o registo original. */
  snapshotAproximado: boolean;
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
