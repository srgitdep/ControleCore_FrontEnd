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
  /** Quando completou o registo (documentos). `null` = em onboarding: ainda não pode receber entregas (plano §4.9). */
  onboardingCompletoEm: string | null;
  /** Alguém da gestão viu os documentos e conferiu-os. Informativo: não bloqueia nada. */
  documentosConferidosEm: string | null;
  /** Quando ficou online. `null` = offline. */
  onlineDesde: string | null;
  ultimoLoginEm: string | null;
  createdAt: string;
  lojas: { id: string; nome: string }[];
  /** As entregas em curso: «em entrega» deriva-se daqui, não do `estado` guardado. */
  _count: { entregas: number };
}

export interface CriarEstafetaPayload {
  nome: string;
  telefone: string;
  /** Obrigatório: é para lá que o servidor envia o código de acesso e a senha. */
  email: string;
  veiculo?: string;
  matricula?: string;
  /** Vazio ou omitido = serve todas as lojas. */
  lojaIds?: string[];
}

export interface ActualizarEstafetaPayload extends Partial<CriarEstafetaPayload> {
  estado?: 'DISPONIVEL' | 'INDISPONIVEL';
  isActive?: boolean;
}

/**
 * O servidor envia o código e a senha por e-mail e **não os devolve**: a senha nunca chega a este
 * browser. `false` = o estafeta ficou criado (ou a senha reposta) mas o e-mail não saiu.
 */
export interface EnvioDeCredenciais {
  emailEnviado: boolean;
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
  /** O que se cobrou de facto; `null` = o previsto (`valorACobrar`). */
  valorCobrado: number | null;
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

// ── Acertos de contas (Fase 3) ──────────────────────────────────────────────

/** Uma entrega que compõe o valor em aberto de um estafeta. */
export interface EntregaPorAcertar {
  id: string;
  numeroPedido: string;
  /** O que vale para o acerto: o cobrado, ou o previsto se ninguém o corrigiu. */
  valor: number;
  valorACobrar: number;
  entregueEm: string | null;
}

/** `GET /entregas/acertos/pendentes` — só numerário, entregue e ainda sem acerto. */
export interface AcertoPendente {
  estafeta: { id: string; nome: string; codigo: string; telefone: string };
  valorEmAberto: number;
  entregasPendentes: number;
  ultimoAcertoEm: string | null;
  entregas: EntregaPorAcertar[];
}

export interface Acerto {
  id: string;
  estado: 'ACERTADO' | 'COM_DIFERENCA';
  totalDevido: number;
  totalEntregue: number;
  /** `totalEntregue − totalDevido`: negativa = o estafeta trouxe menos. */
  diferenca: number;
  notas: string | null;
  createdAt: string;
  estafeta: { id: string; nome: string; codigo: string };
  acertadoPor: { id: string; name: string };
  _count: { entregas: number };
}

export interface ResultadoAcerto {
  entregasAcertadas: number;
  totalDevido: number;
  totalEntregue: number;
  diferenca: number;
}

// ── Documentos dos estafetas (plano §4.9) ────────────────────────────────

/** Os campos de um documento confirmados pelo estafeta (datas em AAAA-MM-DD). */
export type DadosDoDocumento = Record<string, string | number>;

export interface DocumentoParaGestao {
  tipo: 'BI' | 'CARTA_CONDUCAO' | 'DOCUMENTO_VEICULO' | 'FOTO_VEICULO' | 'FOTO_ROSTO';
  /** O que o estafeta confirmou. */
  dados: DadosDoDocumento | null;
  /** O que a IA leu: a diferença para `dados` mostra onde o estafeta a corrigiu. */
  dadosLidos: DadosDoDocumento | null;
  confirmadoEm: string | null;
  /** As fotografias vigentes, com um URL de **5 minutos** (nunca se guarda nem se partilha). */
  imagens: { id: string; lado: 'FRENTE' | 'VERSO' | 'UNICA'; url: string }[];
  /** Quantas fotografias anteriores ficaram guardadas (nada se apaga). */
  imagensSubstituidas: number;
}

/** `GET /entregas/estafetas/:id/documentos` e `GET /plataforma/estafetas/:id/documentos`. */
export interface DocumentosDoEstafeta {
  estafeta: {
    id: string;
    codigo: string;
    nome: string;
    telefone: string;
    email: string | null;
    contactoEmergenciaNome: string | null;
    contactoEmergenciaTelefone: string | null;
    veiculo: string | null;
    matricula: string | null;
    onboardingCompletoEm: string | null;
    documentosConferidosEm: string | null;
  };
  documentos: DocumentoParaGestao[];
}

/** `GET /plataforma/estafetas`: os estafetas que não são de nenhuma empresa. Só o Super Admin os vê. */
export interface EstafetaDaPlataforma {
  id: string;
  codigo: string;
  nome: string;
  telefone: string;
  email: string | null;
  veiculo: string | null;
  matricula: string | null;
  estado: 'DISPONIVEL' | 'EM_ENTREGA' | 'INDISPONIVEL';
  isActive: boolean;
  onboardingCompletoEm: string | null;
  documentosConferidosEm: string | null;
  onlineDesde: string | null;
  createdAt: string;
  _count: { entregas: number };
}
