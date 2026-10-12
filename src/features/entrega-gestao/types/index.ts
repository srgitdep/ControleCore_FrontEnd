/** Tem de corresponder ao que `GET /entregas/zonas` devolve (`ListarZonasEntregaUseCase`). */
export interface ZonaEntrega {
  id: string;
  lojaId: string;
  nome: string;
  distanciaMinKm: number;
  distanciaMaxKm: number;
  taxa: number;
  prazoMinutos: number | null;
  valorMinimoPedido: number | null;
  activa: boolean;
  loja: { id: string; nome: string };
}

export interface CriarZonaPayload {
  lojaId: string;
  nome: string;
  distanciaMinKm?: number;
  distanciaMaxKm: number;
  taxa: number;
  prazoMinutos?: number;
  valorMinimoPedido?: number;
}

/** `null` limpa o prazo e o valor mínimo — `undefined` deixa-os como estão. */
export interface ActualizarZonaPayload {
  nome?: string;
  distanciaMinKm?: number;
  distanciaMaxKm?: number;
  taxa?: number;
  prazoMinutos?: number | null;
  valorMinimoPedido?: number | null;
  activa?: boolean;
}

export interface LojaDaConfiguracao {
  id: string;
  nome: string;
  temCoordenadas: boolean;
  zonasActivas: number;
}

/** `GET /entregas/configuracao`. */
export interface ConfiguracaoEntrega {
  entregaActiva: boolean;
  tempoPreparacaoMinutos: number;
  raioMaximoKm: number | null;
  permiteAgendamento: boolean;
  /** De onde vêm os estafetas desta empresa (plano §4.9, D4). */
  frotaEntrega: 'PROPRIA' | 'PLATAFORMA';
  /** A frota da plataforma está aberta? Só então o ecrã oferece a opção (o servidor recusa-a na mesma). */
  frotaPlataformaDisponivel: boolean;
  lojas: LojaDaConfiguracao[];
}

export interface ActualizarConfiguracaoPayload {
  entregaActiva?: boolean;
  tempoPreparacaoMinutos?: number;
  raioMaximoKm?: number | null;
  frotaEntrega?: 'PROPRIA' | 'PLATAFORMA';
}
