import { api } from '@/shared/config';
import type {
  ActualizarSubscricaoPayload,
  CriarSubscricaoPayload,
  OperadorExterno,
  PaginaDeEnvios,
  ResultadoDoTeste,
  SubscricaoCriada,
  SubscricaoWebhook,
} from '../types/webhook';

/** Os webhooks da entrega. A instância `api` do funcionário (permissão `GERIR_WEBHOOKS`, só ADMIN). */
export const webhookApi = {
  listar: async () => (await api.get<SubscricaoWebhook[]>('/webhooks/subscricoes')).data,

  criar: async (payload: CriarSubscricaoPayload) =>
    (await api.post<SubscricaoCriada>('/webhooks/subscricoes', payload)).data,

  actualizar: async (id: string, payload: ActualizarSubscricaoPayload) =>
    (await api.patch<SubscricaoWebhook>(`/webhooks/subscricoes/${id}`, payload)).data,

  apagar: async (id: string) => {
    await api.delete(`/webhooks/subscricoes/${id}`);
  },

  rodarSegredo: async (id: string) =>
    (await api.post<{ id: string; segredo: string; segredoMascarado: string }>(`/webhooks/subscricoes/${id}/rodar-segredo`))
      .data,

  testar: async (id: string) => (await api.post<ResultadoDoTeste>(`/webhooks/subscricoes/${id}/testar`)).data,

  envios: async (id: string, pagina = 1, estado?: string) =>
    (
      await api.get<PaginaDeEnvios>(`/webhooks/subscricoes/${id}/envios`, {
        params: { pagina, limite: 10, ...(estado ? { estado } : {}) },
      })
    ).data,

  reenviar: async (envioId: string) => (await api.post<{ ok: boolean }>(`/webhooks/envios/${envioId}/reenviar`)).data,

  /** Para delegar: quem delega (`GERIR_ENTREGAS`) não é necessariamente quem gere webhooks. */
  operadores: async () => (await api.get<OperadorExterno[]>('/entregas/operadores')).data,

  delegar: async (entregaId: string, operadorId: string) =>
    (await api.patch<{ id: string; estado: string }>(`/entregas/${entregaId}/delegar`, { operadorId })).data,
};
