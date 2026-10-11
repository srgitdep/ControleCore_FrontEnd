// ── Webhooks da entrega (Fase 6) ────────────────────────────────────────────

/** Os eventos a que uma subscrição se pode ligar. Espelha `EVENTOS_WEBHOOK` do backend. */
export const EVENTOS_WEBHOOK = [
  'pedido.criado',
  'pedido.expedido',
  'entrega.atribuida',
  'entrega.recolhida',
  'entrega.em_rota',
  'entrega.entregue',
  'entrega.falhada',
  'entrega.devolvida',
] as const;
export type EventoWebhook = (typeof EVENTOS_WEBHOOK)[number];

/** `GET /webhooks/subscricoes` — o segredo vem sempre mascarado. */
export interface SubscricaoWebhook {
  id: string;
  descricao: string;
  url: string;
  eventos: string[];
  isActive: boolean;
  segredoMascarado: string;
  createdAt: string;
  updatedAt: string;
}

/** Ao criar, o segredo completo vem **uma só vez**. */
export interface SubscricaoCriada extends SubscricaoWebhook {
  segredo: string;
}

export interface CriarSubscricaoPayload {
  descricao: string;
  url: string;
  eventos: string[];
}

export interface ActualizarSubscricaoPayload extends Partial<CriarSubscricaoPayload> {
  isActive?: boolean;
}

export type EstadoEnvio = 'PENDENTE' | 'ENVIADO' | 'FALHADO' | 'DESISTIDO';

export interface EnvioWebhook {
  id: string;
  evento: string;
  estado: EstadoEnvio;
  tentativas: number;
  ultimoErro: string | null;
  proximaTentativaEm: string | null;
  enviadoEm: string | null;
  createdAt: string;
}

export interface PaginaDeEnvios {
  data: EnvioWebhook[];
  total: number;
  pagina: number;
  limite: number;
}

export interface ResultadoDoTeste {
  id: string;
  estado: EstadoEnvio;
  tentativas: number;
  ultimoErro: string | null;
  sucesso: boolean;
}

/** `GET /entregas/operadores` — o que quem delega vê: só o nome, nunca o URL nem o segredo. */
export interface OperadorExterno {
  id: string;
  descricao: string;
}
