// ── Enums (espelha o schema Prisma do backend — sem importação direta) ──────

/** Máquina de estados da sessão (§13 do Documento Técnico de Inventário v1.1). */
export type InventoryCycleStatus =
  | 'RASCUNHO'
  | 'PREPARADO'
  | 'EM_CONTAGEM'
  | 'PAUSADO'
  | 'VALIDACAO_DE_COBERTURA'
  | 'EM_RECONCILIACAO'
  | 'AGUARDA_RECONTAGEM'
  | 'EM_ANALISE_MAYRA'
  | 'AGUARDA_APROVACAO'
  | 'AJUSTE_APROVADO'
  | 'ENCERRADO'
  | 'CANCELADO'
  | 'BLOQUEADO_POR_ERRO';

/** Estado por Produto + Localização (§6). */
export type InventoryItemStatus =
  | 'PENDENTE'
  | 'EM_CONTAGEM'
  | 'CONTADO'
  | 'ZERO_CONFIRMADO'
  | 'FORA_DA_LOCALIZACAO'
  | 'RECONTAGEM_PENDENTE'
  | 'RECONTADO';

export type AcaoGestor = 'APROVAR_AJUSTE' | 'SOLICITAR_RECONTAGEM' | 'INVESTIGAR' | 'REJEITAR_AJUSTE';

// Localizações (prateleiras/zonas) e a atribuição de quantidade por posição
// vivem em `@/features/armazens` (localizacoesApi, árvore com paiId/caminho)
// e `@/features/stock` (distribuicaoApi, StockLocalizacao) — não neste
// arquivo. Ver a nota em `hooks/useInventory.ts`.

// ── Entidades base ───────────────────────────────────────────────────────────

export interface LocalizacaoResumo {
  id: string;
  codigo: string;
  nome: string | null;
  caminho: string;
}

export interface InventoryCount {
  id: string;
  cycleId: string;
  stockId: string;
  status: InventoryItemStatus;

  localizacaoEsperadaId: string | null;
  localizacaoRealId: string | null;
  localizacaoEsperada?: LocalizacaoResumo | null;
  localizacaoReal?: LocalizacaoResumo | null;

  operatorId: string | null;
  terminal?: string | null;
  physicalQuantity: number | null;

  /**
   * Nunca vem preenchido no momento de contar — o backend só os calcula
   * na reconciliação (§9). Um `InventoryCount` devolvido por
   * `registerCount`/`confirmarZero`/`registarForaDaLocalizacao` tem sempre
   * estes dois campos `null`: é a cegueira aplicada na API, não só na tela.
   */
  systemQuantity: number | null;
  difference: number | null;

  countedAt: string | null;
  createdAt: string;
  updatedAt: string;

  stock?: {
    id: string;
    currentQuantity: number;
    product?: {
      id: string;
      nome: string;
      codigoBarras?: string;
      unidadeMedida: string;
      imagemUrl?: string | null;
    };
    armazem?: {
      id: string;
      nome: string;
    };
  };
  operator?: {
    id: string;
    name: string;
  };
}

export interface InventoryCycle {
  id: string;
  empresaId: string;
  name: string;
  status: InventoryCycleStatus;
  motivoCancelamento?: string | null;
  createdById: string;
  createdAt: string;
  updatedAt: string;

  createdBy?: { id: string; name: string };
  _count?: { counts: number };
}

export interface InventoryCycleDetail extends InventoryCycle {
  counts: InventoryCount[];
}

// ── Payloads de mutação ──────────────────────────────────────────────────────

export interface CreateCyclePayload {
  name: string;
  /** Armazém cujo perímetro (produtos × localizações) é carregado como PENDENTE. */
  armazemId: string;
}

export interface RegisterCountPayload {
  inventoryCountId: string;
  physicalQuantity: number;
  terminal?: string;
}

export interface RegisterCountByBarcodePayload {
  codigoBarras: string;
  physicalQuantity: number;
  armazemId?: string;
  terminal?: string;
}

export interface ConfirmarZeroPayload {
  inventoryCountId: string;
  confirmado: true;
  terminal?: string;
}

export interface RegistarForaDaLocalizacaoPayload {
  inventoryCountId: string;
  localizacaoRealId: string;
  physicalQuantity: number;
  terminal?: string;
}

export interface RegistarRecontagemPayload {
  inventoryCountId: string;
  physicalQuantity: number;
  terminal?: string;
}

export interface UpdateCycleStatusPayload {
  status: InventoryCycleStatus;
}

export interface CancelarCicloPayload {
  motivo: string;
}

export interface DecidirExcecaoPayload {
  acao: AcaoGestor;
  motivo?: string;
}

// ── Cobertura obrigatória (§7) ───────────────────────────────────────────────

export interface CoberturaResponse {
  cycleId: string;
  pendentes: number;
  coberturaCompleta: boolean;
}

// ── Recontagem cega (§10) — a view nunca traz teórico/divergência ───────────

export interface RecontagemPendente {
  inventoryCountId: string;
  produto: {
    id: string;
    nome: string;
    codigoBarras?: string;
    imagemUrl?: string | null;
  };
  localizacao: LocalizacaoResumo | null;
}

export interface RegistrarRecontagemResponse {
  inventoryCountId: string;
  status: InventoryItemStatus;
  divergenciaConfirmada: boolean;
}

// ── Fila do Gestor (§12) ─────────────────────────────────────────────────────

export interface InventoryException {
  id: string;
  cycleId: string;
  cycleName: string;
  produto: string;
  codigoBarras?: string | null;
  armazem: string;
  localizacao: string | null;

  teorico: number;
  fisico: number;
  diferenca: number;
  impacto: number | null;

  classificacao: 'CONFORME' | 'ATENCAO' | 'CRITICO' | null;
  causa: 'CAUSA_CONFIRMADA' | 'CAUSA_PROVAVEL' | 'EVIDENCIA_INSUFICIENTE' | null;
  recomendacaoMayra: string | null;

  acao: AcaoGestor | null;
  motivo: string | null;
  aprovador: string | null;
  decididoEm: string | null;

  /** MAYRA ainda não classificou — fallback do §11: não bloquear a fila indefinidamente. */
  aguardaClassificacaoMayra: boolean;
  createdAt: string;
}

export interface DecidirExcecaoResponse {
  excecaoId: string;
  acao: AcaoGestor;
  movimentoId?: string;
  stockAnterior?: number;
  stockPosterior?: number;
}

export interface AnalisarExcecaoMayraResponse {
  excecaoId: string;
  classificacao: NonNullable<InventoryException['classificacao']>;
  causa: NonNullable<InventoryException['causa']>;
  recomendacao: string;
}

// ── Tolerâncias (§10) ─────────────────────────────────────────────────────

export interface ToleranciaInventario {
  id: string;
  productId: string | null;
  categoriaId: string | null;
  toleranciaQtd: number | null;
  toleranciaPct: number | null;
  toleranciaValor: number | null;
  criticidade: string | null;
  isActive: boolean;
  produto: { id: string; nome: string } | null;
  categoria: { id: string; nome: string } | null;
  createdBy: { id: string; name: string };
  createdAt: string;
}

export interface CriarToleranciaPayload {
  productId?: string;
  categoriaId?: string;
  toleranciaQtd?: number;
  toleranciaPct?: number;
  toleranciaValor?: number;
  criticidade?: string;
}

export interface AtualizarToleranciaPayload {
  toleranciaQtd?: number;
  toleranciaPct?: number;
  toleranciaValor?: number;
  criticidade?: string;
}

// ── Histórico de contagem (§5, §13) — trilha append-only ────────────────────

export interface HistoricoContagemEntry {
  id: string;
  valorAnterior: number | null;
  valorNovo: number | null;
  estadoAnterior: InventoryItemStatus;
  estadoNovo: InventoryItemStatus;
  alteradoPor: string;
  em: string;
}

// ── Dashboard agregado (§12) ─────────────────────────────────────────────────

export interface DashboardInventarioResponse {
  ciclosAtivos: number;
  ciclosPorStatus: Array<{ status: InventoryCycleStatus; total: number }>;
  excecoes: {
    pendentes: number;
    decididas: number;
    impactoPendente: number;
    impactoDecidido: number;
  };
  ultimosCiclos: Array<{
    id: string;
    name: string;
    status: InventoryCycleStatus;
    totalItens: number;
    totalExcecoes: number;
    createdBy: string;
    createdAt: string;
  }>;
}

// ── Reconciliação (§9) ───────────────────────────────────────────────────────

export interface ReconciliarResponse {
  cycleId: string;
  totalStocks: number;
  comDivergencia: number;
  recontagensPendentes: number;
}

// ── Fecho legado (ciclos antigos, pré-Fase-1-4) ──────────────────────────────

export interface CloseCycleResponse {
  cycleId: string;
  cycleName: string;
  status: 'ENCERRADO';
  summary: {
    totalCounts: number;
    totalAdjustments: number;
    totalLosses: number;
    lossDetails: Array<{
      stockId: string;
      productName: string;
      difference: number;
      valorPerda: number;
    }>;
  };
}

export interface PrevisaoDeFechoResponse {
  cycleId: string;
  cycleName: string;
  status: InventoryCycleStatus;
  podeFechar: boolean;
  resumo: {
    totalContado: number;
    semDivergencia: number;
    comDivergencia: number;
    faltas: number;
    sobras: number;
    valorFaltas: number;
    valorSobras: number;
  };
  divergencias: Array<{
    stockId: string;
    produtoId: string | null;
    produto: string;
    armazem: string | null;
    sistema: number;
    contado: number;
    diferenca: number;
    valor: number;
    operador: string | null;
    contadoEm: string;
  }>;
}
