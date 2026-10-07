// ── Estafetas e entregas (Fase 2B) ──────────────────────────────────────────

/** Tem de corresponder ao `EstadoEntregaPedido` do backend. */
export type EstadoEntrega =
  | 'AGUARDA_RECOLHA'
  | 'ATRIBUIDA'
  | 'RECOLHIDA'
  | 'EM_ROTA'
  | 'ENTREGUE'
  | 'FALHADA'
  | 'DEVOLVIDA'
  | 'CANCELADA';

export const MOTIVOS_FALHA = ['CLIENTE_AUSENTE', 'MORADA_ERRADA', 'RECUSOU', 'INACESSIVEL', 'OUTRO'] as const;
export type MotivoFalha = (typeof MOTIVOS_FALHA)[number];

export const METODOS_COBRANCA = ['NUMERARIO', 'MPESA', 'EMOLA'] as const;
export type MetodoCobranca = (typeof METODOS_COBRANCA)[number];

/** `GET /entregas/estafetas` — nunca traz o hash da senha. */
export interface Estafeta {
  id: string;
  codigo: string;
  nome: string;
  telefone: string;
  email: string | null;
  veiculo: string | null;
  matricula: string | null;
  estado: 'DISPONIVEL' | 'EM_ENTREGA' | 'INDISPONIVEL';
  isActive: boolean;
  ultimoLoginEm: string | null;
  createdAt: string;
  lojas: { id: string; nome: string }[];
  /** As entregas em curso: «em entrega» deriva-se daqui, não do `estado` guardado. */
  _count: { entregas: number };
}

export interface CriarEstafetaPayload {
  nome: string;
  telefone: string;
  email?: string;
  veiculo?: string;
  matricula?: string;
  /** Vazio ou omitido = serve todas as lojas. */
  lojaIds?: string[];
}

export interface ActualizarEstafetaPayload extends Partial<CriarEstafetaPayload> {
  estado?: 'DISPONIVEL' | 'INDISPONIVEL';
  isActive?: boolean;
}

/** Devolvidas **uma só vez** pelo servidor: a senha não se guarda em claro. */
export interface CredenciaisEstafeta {
  codigo: string;
  senha: string;
}

/** `GET /entregas` — o que o painel mostra de cada entrega. */
export interface EntregaPainel {
  id: string;
  estado: EstadoEntrega;
  lojaId: string;
  estafetaId: string | null;
  destinoMorada: string;
  contactoNome: string | null;
  contactoTelefone: string | null;
  taxa: number;
  valorACobrar: number;
  metodoCobrado: string | null;
  motivoFalha: string | null;
  createdAt: string;
  loja: { id: string; nome: string };
  estafeta: { id: string; nome: string; codigo: string; telefone: string } | null;
  pedido: { id: string; numeroPedido: string; totalFinal: number; estado: string };
}

export interface FiltrosEntregas {
  lojaId?: string;
  estafetaId?: string;
  /** Incluir as já fechadas (entregues e devolvidas). */
  fechadas?: boolean;
}
