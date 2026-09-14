import { api } from '@/shared/config';
import type {
  InventoryCycle,
  InventoryCycleDetail,
  CreateCyclePayload,
  RegisterCountPayload,
  RegisterCountByBarcodePayload,
  ConfirmarZeroPayload,
  RegistarForaDaLocalizacaoPayload,
  RegistarProdutoInesperadoPayload,
  RegistarRecontagemPayload,
  UpdateCycleStatusPayload,
  CancelarCicloPayload,
  DecidirExcecaoPayload,
  DecidirExcecaoResponse,
  InventoryCount,
  InventoryException,
  RecontagemPendente,
  RegistrarRecontagemResponse,
  CoberturaResponse,
  ReconciliarResponse,
  CloseCycleResponse,
  PrevisaoDeFechoResponse,
  AnalisarExcecaoMayraResponse,
  ToleranciaInventario,
  CriarToleranciaPayload,
  AtualizarToleranciaPayload,
  HistoricoContagemEntry,
  DashboardInventarioResponse,
} from '@/features/stock';

export const inventoryApi = {
  // ── Ciclos ──────────────────────────────────────────────────────────────

  listCycles: async (): Promise<InventoryCycle[]> => {
    const { data } = await api.get<InventoryCycle[]>('/inventory/cycles');
    return data;
  },

  getCycleDetail: async (cycleId: string): Promise<InventoryCycleDetail> => {
    const { data } = await api.get<InventoryCycleDetail>(`/inventory/cycles/${cycleId}`);
    return data;
  },

  createCycle: async (payload: CreateCyclePayload): Promise<InventoryCycle> => {
    const { data } = await api.post<InventoryCycle>('/inventory/cycles', payload);
    return data;
  },

  updateCycleStatus: async (
    cycleId: string,
    payload: UpdateCycleStatusPayload,
  ): Promise<InventoryCycle> => {
    const { data } = await api.patch<InventoryCycle>(
      `/inventory/cycles/${cycleId}/status`,
      payload,
    );
    return data;
  },

  cancelarCiclo: async (cycleId: string, payload: CancelarCicloPayload): Promise<InventoryCycle> => {
    const { data } = await api.post<InventoryCycle>(`/inventory/cycles/${cycleId}/cancelar`, payload);
    return data;
  },

  /** Cobertura obrigatória (§7): quantos itens do perímetro ainda estão PENDENTE. */
  validarCobertura: async (cycleId: string): Promise<CoberturaResponse> => {
    const { data } = await api.get<CoberturaResponse>(`/inventory/cycles/${cycleId}/cobertura`);
    return data;
  },

  /** Compara físico com teórico (§9) e cria RECONTAGEM_PENDENTE onde a divergência excede a tolerância. */
  reconciliar: async (cycleId: string): Promise<ReconciliarResponse> => {
    const { data } = await api.post<ReconciliarResponse>(`/inventory/cycles/${cycleId}/reconciliar`);
    return data;
  },

  /**
   * O que o fecho vai fazer, sem o fazer.
   *
   * Existe para ciclos legados (fecho directo, pré-Fase-4). No fluxo novo, o caminho
   * é reconciliar -> recontar -> decidir exceções na fila do Gestor.
   */
  preverFecho: async (cycleId: string): Promise<PrevisaoDeFechoResponse> => {
    const { data } = await api.get<PrevisaoDeFechoResponse>(
      `/inventory/cycles/${cycleId}/previsao-fecho`,
    );
    return data;
  },

  closeCycle: async (cycleId: string): Promise<CloseCycleResponse> => {
    const { data } = await api.post<CloseCycleResponse>(
      `/inventory/cycles/${cycleId}/close`,
    );
    return data;
  },

  /** Visão agregada da empresa (§12): ciclos por estado, exceções pendentes/decididas e impacto financeiro. */
  obterDashboard: async (): Promise<DashboardInventarioResponse> => {
    const { data } = await api.get<DashboardInventarioResponse>('/inventory/dashboard');
    return data;
  },

  // ── Contagem (§5, §6) ───────────────────────────────────────────────────

  iniciarContagem: async (cycleId: string, itemId: string): Promise<InventoryCount> => {
    const { data } = await api.post<InventoryCount>(
      `/inventory/cycles/${cycleId}/items/${itemId}/iniciar`,
    );
    return data;
  },

  registerCount: async (
    cycleId: string,
    payload: RegisterCountPayload,
  ): Promise<InventoryCount> => {
    const { data } = await api.post<InventoryCount>(
      `/inventory/cycles/${cycleId}/counts`,
      payload,
    );
    return data;
  },

  registerCountByBarcode: async (
    cycleId: string,
    payload: RegisterCountByBarcodePayload,
  ): Promise<InventoryCount> => {
    const { data } = await api.post<InventoryCount>(
      `/inventory/cycles/${cycleId}/counts/barcode`,
      payload,
    );
    return data;
  },

  /** Quantidade = 0 com confirmação física explícita — nunca confundir com pendente. */
  confirmarZero: async (cycleId: string, payload: ConfirmarZeroPayload): Promise<InventoryCount> => {
    const { data } = await api.post<InventoryCount>(
      `/inventory/cycles/${cycleId}/counts/zero`,
      payload,
    );
    return data;
  },

  /** Produto encontrado noutra localização — LOCATION_EXCEPTION, nunca tratado como perda. */
  registarForaDaLocalizacao: async (
    cycleId: string,
    payload: RegistarForaDaLocalizacaoPayload,
  ): Promise<InventoryCount> => {
    const { data } = await api.post<InventoryCount>(
      `/inventory/cycles/${cycleId}/counts/fora-da-localizacao`,
      payload,
    );
    return data;
  },

  /** Produto encontrado que não fazia parte do perímetro do ciclo (§5 "+ Produto encontrado") — fica rastreado para o Gestor investigar. */
  registarProdutoInesperado: async (
    cycleId: string,
    payload: RegistarProdutoInesperadoPayload,
  ): Promise<InventoryCount> => {
    const { data } = await api.post<InventoryCount>(
      `/inventory/cycles/${cycleId}/counts/inesperado`,
      payload,
    );
    return data;
  },

  /** Trilha append-only de alterações a esta contagem (§5, §13) — nada aqui é apagado. */
  listarHistoricoContagem: async (cycleId: string, itemId: string): Promise<HistoricoContagemEntry[]> => {
    const { data } = await api.get<HistoricoContagemEntry[]>(
      `/inventory/cycles/${cycleId}/counts/${itemId}/historico`,
    );
    return data;
  },

  // ── Recontagem cega (§10) ───────────────────────────────────────────────

  listarRecontagensPendentes: async (cycleId: string): Promise<RecontagemPendente[]> => {
    const { data } = await api.get<RecontagemPendente[]>(`/inventory/cycles/${cycleId}/recontagens`);
    return data;
  },

  atribuirRecontagem: async (cycleId: string, itemId: string): Promise<InventoryCount> => {
    const { data } = await api.post<InventoryCount>(
      `/inventory/cycles/${cycleId}/recontagens/${itemId}/atribuir`,
    );
    return data;
  },

  registrarRecontagem: async (
    cycleId: string,
    payload: RegistarRecontagemPayload,
  ): Promise<RegistrarRecontagemResponse> => {
    const { data } = await api.post<RegistrarRecontagemResponse>(
      `/inventory/cycles/${cycleId}/recontagens`,
      payload,
    );
    return data;
  },

  // ── Fila do Gestor (§12) ────────────────────────────────────────────────

  listarExcecoes: async (params?: { cycleId?: string; decididas?: boolean }): Promise<InventoryException[]> => {
    const { data } = await api.get<InventoryException[]>('/inventory/excecoes', {
      params: {
        cycleId: params?.cycleId,
        decididas: params?.decididas === undefined ? undefined : String(params.decididas),
      },
    });
    return data;
  },

  /** Mesmos dados e filtros de listarExcecoes, num .xlsx para download. */
  exportarExcecoes: async (params?: { cycleId?: string; decididas?: boolean }): Promise<Blob> => {
    const { data } = await api.get('/inventory/excecoes/exportar', {
      params: {
        cycleId: params?.cycleId,
        decididas: params?.decididas === undefined ? undefined : String(params.decididas),
      },
      responseType: 'blob',
    });
    return data;
  },

  decidirExcecao: async (
    excecaoId: string,
    payload: DecidirExcecaoPayload,
  ): Promise<DecidirExcecaoResponse> => {
    const { data } = await api.post<DecidirExcecaoResponse>(
      `/inventory/excecoes/${excecaoId}/decisao`,
      payload,
    );
    return data;
  },

  /** Reúne os factos e pede à MAYRA a classificação (§11) numa única chamada. */
  analisarExcecaoMayra: async (excecaoId: string): Promise<AnalisarExcecaoMayraResponse> => {
    const { data } = await api.post<AnalisarExcecaoMayraResponse>(`/inventory/excecoes/${excecaoId}/analisar-mayra`);
    return data;
  },

  // Localizações e atribuição de quantidade por posição migraram para
  // `@/features/armazens` (localizacoesApi) e `@/features/stock`
  // (distribuicaoApi) — ver a nota em `hooks/useInventory.ts`.

  // ── Tolerâncias (§10) ────────────────────────────────────────────────────

  listarTolerancias: async (): Promise<ToleranciaInventario[]> => {
    const { data } = await api.get<ToleranciaInventario[]>('/inventory/tolerancias');
    return data;
  },

  criarTolerancia: async (payload: CriarToleranciaPayload): Promise<ToleranciaInventario> => {
    const { data } = await api.post<ToleranciaInventario>('/inventory/tolerancias', payload);
    return data;
  },

  atualizarTolerancia: async (id: string, payload: AtualizarToleranciaPayload): Promise<ToleranciaInventario> => {
    const { data } = await api.patch<ToleranciaInventario>(`/inventory/tolerancias/${id}`, payload);
    return data;
  },

  desativarTolerancia: async (id: string): Promise<ToleranciaInventario> => {
    const { data } = await api.delete<ToleranciaInventario>(`/inventory/tolerancias/${id}`);
    return data;
  },
};
