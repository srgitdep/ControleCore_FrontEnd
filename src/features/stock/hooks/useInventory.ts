import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { inventoryApi } from '@/features/stock';
import type {
  CreateCyclePayload,
  RegisterCountPayload,
  RegisterCountByBarcodePayload,
  ConfirmarZeroPayload,
  RegistarForaDaLocalizacaoPayload,
  RegistarRecontagemPayload,
  UpdateCycleStatusPayload,
  CancelarCicloPayload,
  DecidirExcecaoPayload,
  CriarToleranciaPayload,
  AtualizarToleranciaPayload,
} from '@/features/stock';

// ── Query Keys ────────────────────────────────────────────────────────────
export const inventoryKeys = {
  all: ['inventory'] as const,
  cycles: () => [...inventoryKeys.all, 'cycles'] as const,
  cycleDetail: (id: string) => [...inventoryKeys.cycles(), id] as const,
  cobertura: (id: string) => [...inventoryKeys.cycles(), id, 'cobertura'] as const,
  recontagens: (id: string) => [...inventoryKeys.cycles(), id, 'recontagens'] as const,
  excecoes: (cycleId?: string, decididas?: boolean) =>
    [...inventoryKeys.all, 'excecoes', cycleId ?? 'todos', decididas ?? 'todas'] as const,
  localizacoes: (armazemId: string) => [...inventoryKeys.all, 'localizacoes', armazemId] as const,
  historico: (cycleId: string, itemId: string) =>
    [...inventoryKeys.cycleDetail(cycleId), 'counts', itemId, 'historico'] as const,
  dashboard: () => [...inventoryKeys.all, 'dashboard'] as const,
};

// ── Queries: Ciclos ──────────────────────────────────────────────────────

export const useInventoryCycles = () =>
  useQuery({
    queryKey: inventoryKeys.cycles(),
    queryFn: inventoryApi.listCycles,
    staleTime: 30_000,
  });

export const useInventoryCycleDetail = (cycleId: string | null) =>
  useQuery({
    queryKey: inventoryKeys.cycleDetail(cycleId ?? ''),
    queryFn: () => inventoryApi.getCycleDetail(cycleId!),
    enabled: !!cycleId,
    staleTime: 10_000,
  });

/** Cobertura obrigatória (§7): refeita a cada 5s enquanto o ciclo está em contagem. */
export const useCobertura = (cycleId: string | null, opts?: { poll?: boolean }) =>
  useQuery({
    queryKey: inventoryKeys.cobertura(cycleId ?? ''),
    queryFn: () => inventoryApi.validarCobertura(cycleId!),
    enabled: !!cycleId,
    refetchInterval: opts?.poll ? 5_000 : false,
  });

/** Visão agregada da empresa (§12): ciclos por estado, exceções pendentes/decididas e impacto financeiro. */
export const useDashboardInventario = () =>
  useQuery({
    queryKey: inventoryKeys.dashboard(),
    queryFn: inventoryApi.obterDashboard,
    staleTime: 30_000,
  });

// ── Mutations: Ciclos ────────────────────────────────────────────────────

function invalidarCiclo(qc: ReturnType<typeof useQueryClient>, cycleId: string) {
  qc.invalidateQueries({ queryKey: inventoryKeys.cycles() });
  qc.invalidateQueries({ queryKey: inventoryKeys.cycleDetail(cycleId) });
  qc.invalidateQueries({ queryKey: inventoryKeys.cobertura(cycleId) });
}

export const useCreateCycle = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateCyclePayload) => inventoryApi.createCycle(payload),
    onSuccess: () => qc.invalidateQueries({ queryKey: inventoryKeys.cycles() }),
  });
};

export const useUpdateCycleStatus = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ cycleId, payload }: { cycleId: string; payload: UpdateCycleStatusPayload }) =>
      inventoryApi.updateCycleStatus(cycleId, payload),
    onSuccess: (_data, { cycleId }) => invalidarCiclo(qc, cycleId),
  });
};

export const useCancelarCiclo = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ cycleId, payload }: { cycleId: string; payload: CancelarCicloPayload }) =>
      inventoryApi.cancelarCiclo(cycleId, payload),
    onSuccess: (_data, { cycleId }) => invalidarCiclo(qc, cycleId),
  });
};

export const useReconciliar = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (cycleId: string) => inventoryApi.reconciliar(cycleId),
    onSuccess: (_data, cycleId) => {
      invalidarCiclo(qc, cycleId);
      qc.invalidateQueries({ queryKey: inventoryKeys.recontagens(cycleId) });
      qc.invalidateQueries({ queryKey: inventoryKeys.excecoes() });
    },
  });
};

export const useCloseCycle = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (cycleId: string) => inventoryApi.closeCycle(cycleId),
    onSuccess: (_data, cycleId) => invalidarCiclo(qc, cycleId),
  });
};

// ── Mutations: Contagem (§5, §6) ─────────────────────────────────────────

export const useIniciarContagem = (cycleId: string) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (itemId: string) => inventoryApi.iniciarContagem(cycleId, itemId),
    onSuccess: () => qc.invalidateQueries({ queryKey: inventoryKeys.cycleDetail(cycleId) }),
  });
};

function invalidarAposContagem(qc: ReturnType<typeof useQueryClient>, cycleId: string) {
  qc.invalidateQueries({ queryKey: inventoryKeys.cycleDetail(cycleId) });
  qc.invalidateQueries({ queryKey: inventoryKeys.cycles() });
  qc.invalidateQueries({ queryKey: inventoryKeys.cobertura(cycleId) });
}

export const useRegisterCount = (cycleId: string) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: RegisterCountPayload) => inventoryApi.registerCount(cycleId, payload),
    onSuccess: () => invalidarAposContagem(qc, cycleId),
  });
};

export const useRegisterCountByBarcode = (cycleId: string) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: RegisterCountByBarcodePayload) =>
      inventoryApi.registerCountByBarcode(cycleId, payload),
    onSuccess: () => invalidarAposContagem(qc, cycleId),
  });
};

export const useConfirmarZero = (cycleId: string) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: ConfirmarZeroPayload) => inventoryApi.confirmarZero(cycleId, payload),
    onSuccess: () => invalidarAposContagem(qc, cycleId),
  });
};

export const useRegistarForaDaLocalizacao = (cycleId: string) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: RegistarForaDaLocalizacaoPayload) =>
      inventoryApi.registarForaDaLocalizacao(cycleId, payload),
    onSuccess: () => invalidarAposContagem(qc, cycleId),
  });
};

/** Trilha append-only de alterações a uma contagem (§5, §13). Só aberta sob pedido. */
export const useHistoricoContagem = (cycleId: string | null, itemId: string | null, opts?: { enabled?: boolean }) =>
  useQuery({
    queryKey: inventoryKeys.historico(cycleId ?? '', itemId ?? ''),
    queryFn: () => inventoryApi.listarHistoricoContagem(cycleId!, itemId!),
    enabled: !!cycleId && !!itemId && (opts?.enabled ?? true),
  });

// ── Recontagem cega (§10) ────────────────────────────────────────────────

export const useRecontagensPendentes = (cycleId: string | null) =>
  useQuery({
    queryKey: inventoryKeys.recontagens(cycleId ?? ''),
    queryFn: () => inventoryApi.listarRecontagensPendentes(cycleId!),
    enabled: !!cycleId,
  });

export const useAtribuirRecontagem = (cycleId: string) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (itemId: string) => inventoryApi.atribuirRecontagem(cycleId, itemId),
    onSuccess: () => qc.invalidateQueries({ queryKey: inventoryKeys.recontagens(cycleId) }),
  });
};

export const useRegistrarRecontagem = (cycleId: string) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: RegistarRecontagemPayload) =>
      inventoryApi.registrarRecontagem(cycleId, payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: inventoryKeys.recontagens(cycleId) });
      qc.invalidateQueries({ queryKey: inventoryKeys.cycleDetail(cycleId) });
      qc.invalidateQueries({ queryKey: inventoryKeys.excecoes() });
    },
  });
};

// ── Fila do Gestor (§12) ─────────────────────────────────────────────────

export const useExcecoes = (params?: { cycleId?: string; decididas?: boolean }) =>
  useQuery({
    queryKey: inventoryKeys.excecoes(params?.cycleId, params?.decididas),
    queryFn: () => inventoryApi.listarExcecoes(params),
  });

export const useDecidirExcecao = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ excecaoId, payload }: { excecaoId: string; payload: DecidirExcecaoPayload }) =>
      inventoryApi.decidirExcecao(excecaoId, payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [...inventoryKeys.all, 'excecoes'] });
      qc.invalidateQueries({ queryKey: inventoryKeys.cycles() });
    },
  });
};

export const useAnalisarExcecaoMayra = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (excecaoId: string) => inventoryApi.analisarExcecaoMayra(excecaoId),
    onSuccess: () => qc.invalidateQueries({ queryKey: [...inventoryKeys.all, 'excecoes'] }),
  });
};

// A gestão de Localizações (§5, §15-17) vive em `@/features/armazens`
// (useLocalizacoes/useLocalizacaoMutations) e a atribuição de quantidade por
// posição em `@/features/stock` (useDistribuicao/useDistribuicaoMutations) —
// o modelo hierárquico de `feat/estados-de-stock`, trazido para main por já
// ser o que o front-end de armazéns esperava. Não há CRUD próprio aqui.

// ── Tolerâncias (§10) ──────────────────────────────────────────────────────

export const useTolerancias = () =>
  useQuery({
    queryKey: [...inventoryKeys.all, 'tolerancias'],
    queryFn: () => inventoryApi.listarTolerancias(),
  });

export const useCriarTolerancia = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: CriarToleranciaPayload) => inventoryApi.criarTolerancia(payload),
    onSuccess: () => qc.invalidateQueries({ queryKey: [...inventoryKeys.all, 'tolerancias'] }),
  });
};

export const useAtualizarTolerancia = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: AtualizarToleranciaPayload }) =>
      inventoryApi.atualizarTolerancia(id, payload),
    onSuccess: () => qc.invalidateQueries({ queryKey: [...inventoryKeys.all, 'tolerancias'] }),
  });
};

export const useDesativarTolerancia = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => inventoryApi.desativarTolerancia(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: [...inventoryKeys.all, 'tolerancias'] }),
  });
};
