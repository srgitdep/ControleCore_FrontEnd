import { api } from '@/shared/config';
import type {
  Acerto,
  AcertoPendente,
  ActualizarEstafetaPayload,
  EnvioDeCredenciais,
  CriarEstafetaPayload,
  EntregaPainel,
  EstadoEntrega,
  Estafeta,
  FiltrosEntregas,
  MetodoCobranca,
  MotivoFalha,
  ResultadoAcerto,
  DocumentosDoEstafeta,
  EstafetaDaPlataforma,
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
    const { data } = await api.post<{ estafeta: Estafeta } & EnvioDeCredenciais>(
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
    const { data } = await api.post<EnvioDeCredenciais>(`/entregas/estafetas/${id}/repor-senha`);
    return data;
  },

  // ── A frota própria: convite e documentos (plano §4.9) ──────────────────
  /** O convite para estafetas se registarem na frota própria. `convite` é nulo se ainda não foi criado. */
  obterConvite: async () => (await api.get<{ convite: string | null }>('/entregas/estafetas/convite')).data,

  /** Gera um convite novo e **invalida o anterior**. */
  rodarConvite: async () => (await api.post<{ convite: string }>('/entregas/estafetas/convite/rodar')).data,

  documentosDoEstafeta: async (id: string) =>
    (await api.get<DocumentosDoEstafeta>(`/entregas/estafetas/${id}/documentos`)).data,

  conferirDocumentos: async (id: string) =>
    (await api.patch<{ documentosConferidosEm: string }>(`/entregas/estafetas/${id}/documentos/conferir`)).data,

  // ── Os estafetas da plataforma (só o Super Admin) ───────────────────────
  listarEstafetasDaPlataforma: async (inactivos = false) =>
    (await api.get<EstafetaDaPlataforma[]>('/plataforma/estafetas', { params: inactivos ? { inactivos: true } : undefined })).data,

  documentosDaPlataforma: async (id: string) =>
    (await api.get<DocumentosDoEstafeta>(`/plataforma/estafetas/${id}/documentos`)).data,

  conferirDaPlataforma: async (id: string) =>
    (await api.patch<{ documentosConferidosEm: string }>(`/plataforma/estafetas/${id}/documentos/conferir`)).data,

  actividadeDaPlataforma: async (id: string, isActive: boolean) =>
    (await api.patch<{ isActive: boolean }>(`/plataforma/estafetas/${id}/actividade`, { isActive })).data,

  // ── Entregas ──────────────────────────────────────────────────────────────
  /** O token de 15 min para o canal de entregas em tempo real (`VER_ENTREGAS`). */
  tokenDeSocket: async () => (await api.get<{ token: string }>('/entregas/socket-token')).data.token,

  listarEntregas: async (filtros: FiltrosEntregas = {}) => {
    const { data } = await api.get<{ data: EntregaPainel[]; total: number }>('/entregas', { params: filtros });
    return data;
  },

  /** Lança (ou recomeça) a procura de estafeta da plataforma: o raio volta ao inicial e cresce de 7 em 7 segundos. */
  procurarEstafeta: async (id: string) =>
    (await api.post<{ procuraIniciadaEm: string }>(`/entregas/${id}/procurar-estafeta`)).data,

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
