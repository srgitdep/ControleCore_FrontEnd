import { api } from '@/shared/config';
import type {
  Acerto,
  AcertoPendente,
  ActualizarEstafetaPayload,
  CredenciaisEstafeta,
  CriarEstafetaPayload,
  EntregaPainel,
  EstadoEntrega,
  Estafeta,
  FiltrosEntregas,
  MetodoCobranca,
  MotivoFalha,
  ResultadoAcerto,
} from '../types/operacao';

type Resultado = { id: string; estado: EstadoEntrega };

/** Estafetas e operação das entregas. A instância `api` do funcionário — nunca `contaApi`. */
export const operacaoApi = {
  // ── Estafetas ─────────────────────────────────────────────────────────────
  listarEstafetas: async (inactivos = false) => {
    const { data } = await api.get<Estafeta[]>('/entregas/estafetas', {
      params: inactivos ? { inactivos: true } : undefined,
    });
    return data;
  },

  criarEstafeta: async (payload: CriarEstafetaPayload) => {
    const { data } = await api.post<{ estafeta: Estafeta; credenciais: CredenciaisEstafeta }>(
      '/entregas/estafetas',
      payload,
    );
    return data;
  },

  actualizarEstafeta: async (id: string, payload: ActualizarEstafetaPayload) => {
    const { data } = await api.patch<Estafeta>(`/entregas/estafetas/${id}`, payload);
    return data;
  },

  reporSenhaEstafeta: async (id: string) => {
    const { data } = await api.post<{ credenciais: CredenciaisEstafeta }>(`/entregas/estafetas/${id}/repor-senha`);
    return data;
  },

  // ── Entregas ──────────────────────────────────────────────────────────────
  listarEntregas: async (filtros: FiltrosEntregas = {}) => {
    const { data } = await api.get<{ data: EntregaPainel[]; total: number }>('/entregas', { params: filtros });
    return data;
  },

  atribuir: async (id: string, estafetaId: string) => {
    const { data } = await api.patch<Resultado>(`/entregas/${id}/atribuir`, { estafetaId });
    return data;
  },

  recolher: async (id: string) => {
    const { data } = await api.patch<Resultado>(`/entregas/${id}/recolher`);
    return data;
  },

  iniciarRota: async (id: string) => {
    const { data } = await api.patch<Resultado>(`/entregas/${id}/iniciar-rota`);
    return data;
  },

  entregar: async (
    id: string,
    corpo: { metodoCobrado: MetodoCobranca; referenciaPagamento?: string; valorCobrado?: number },
  ) => {
    const { data } = await api.patch<Resultado & { valorCobrado: number; diferenca: number }>(
      `/entregas/${id}/entregar`,
      corpo,
    );
    return data;
  },

  falhar: async (id: string, corpo: { motivo: MotivoFalha; nota?: string }) => {
    const { data } = await api.patch<Resultado>(`/entregas/${id}/falhar`, corpo);
    return data;
  },

  devolver: async (id: string, motivo: string) => {
    const { data } = await api.post<{ entregaId: string; estado: EstadoEntrega; vendaAnulada: boolean }>(
      `/entregas/${id}/devolver`,
      { motivo },
    );
    return data;
  },

  // ── Acertos de contas ─────────────────────────────────────────────────────
  listarAcertosPendentes: async () => {
    const { data } = await api.get<AcertoPendente[]>('/entregas/acertos/pendentes');
    return data;
  },

  listarAcertos: async () => {
    const { data } = await api.get<Acerto[]>('/entregas/acertos');
    return data;
  },

  acertar: async (corpo: { estafetaId: string; totalEntregue: number; notas?: string }) => {
    const { data } = await api.post<ResultadoAcerto>('/entregas/acertos', corpo);
    return data;
  },
};
