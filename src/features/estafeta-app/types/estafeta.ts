/** O contrato de `/estafeta/…` — igual ao do backend (`minhas-entregas.use-cases.ts`). */

export type EstadoEntrega =
  | 'AGUARDA_RECOLHA'
  | 'ATRIBUIDA'
  | 'RECOLHIDA'
  | 'EM_ROTA'
  | 'ENTREGUE'
  | 'FALHADA'
  | 'DEVOLVIDA'
  | 'CANCELADA';

export const METODOS_COBRANCA = ['NUMERARIO', 'MPESA', 'EMOLA'] as const;
export type MetodoCobranca = (typeof METODOS_COBRANCA)[number];

export const MOTIVOS_FALHA = ['CLIENTE_AUSENTE', 'MORADA_ERRADA', 'RECUSOU', 'INACESSIVEL', 'OUTRO'] as const;
export type MotivoFalha = (typeof MOTIVOS_FALHA)[number];

/** O que o estafeta escolhe: `EM_ENTREGA` deriva-se das entregas em curso. */
export type EstadoEscolhido = 'DISPONIVEL' | 'INDISPONIVEL';

/** O que o servidor mostra de uma entrega ao estafeta — só o que precisa para a fazer. */
export interface EntregaEstafeta {
  id: string;
  estado: EstadoEntrega;
  destinoMorada: string;
  destinoLatitude: number;
  destinoLongitude: number;
  contactoNome: string | null;
  /** Para ligar ao cliente à porta. O e-mail e o total do pedido nunca chegam aqui. */
  contactoTelefone: string | null;
  taxa: number;
  /** O que o cliente deve pagar à porta; 0 se já está pago. */
  valorACobrar: number;
  metodoCobrado: string | null;
  valorCobrado: number | null;
  motivoFalha: string | null;
  prazoPrevistoEm: string | null;
  atribuidaEm: string | null;
  recolhidaEm: string | null;
  entregueEm: string | null;
  falhadaEm: string | null;
  /** O estafeta já marcou «cheguei» (a aplicação esconde o botão). */
  chegouEm: string | null;
  createdAt: string;
  loja: { id: string; nome: string };
  pedido: { numeroPedido: string };
}

export interface PerfilEstafeta {
  nome: string;
  codigo: string;
  estado: 'DISPONIVEL' | 'EM_ENTREGA' | 'INDISPONIVEL';
  idioma: string | null;
  lojas: { id: string; nome: string }[];
  entregasEmCurso: number;
}

/** O que `POST /auth/entrar` devolve para um estafeta. */
export interface UtilizadorEstafeta {
  estafetaId: string;
  nome: string;
  codigo: string;
  idioma: string | null;
}

export interface DadosDeEntrega {
  metodoCobrado: MetodoCobranca;
  referenciaPagamento?: string;
  valorCobrado?: number;
}

export interface DadosDeFalha {
  motivo: MotivoFalha;
  nota?: string;
}
