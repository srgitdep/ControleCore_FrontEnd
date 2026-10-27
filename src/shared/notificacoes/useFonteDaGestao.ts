import { api } from '@/shared/config';
import { useAuthStore, papelEfectivo } from '@/features/auth/store/useAuthStore';
import type { FonteDeNotificacoes, PaginaDeNotificacoes } from './tipos';

/** As notificações de um funcionário do ERP (gestão, caixa, stock…): as dele, pelo token. */
const gestaoApi = {
  listar: async (pagina: number) =>
    (await api.get<PaginaDeNotificacoes>('/notificacoes', { params: { pagina, limite: 20 } })).data,
  contagem: async () => (await api.get<{ naoLidas: number }>('/notificacoes/contagem')).data.naoLidas,
  marcarLida: async (id: string) => (await api.patch(`/notificacoes/${id}/lida`)).data,
  marcarTodasLidas: async () => (await api.patch('/notificacoes/lidas')).data,
};

/**
 * Sem sessão, e para o SUPER_ADMIN (que administra a plataforma e não pertence a uma empresa), não há
 * notificações: o sino não se mostra. O token do canal é o **pessoal** — serve só para as suas notificações e
 * não dá acesso às posições nem aos estados das entregas (esse é o de `VER_ENTREGAS`).
 */
export function useFonteDaGestao(): FonteDeNotificacoes {
  const autenticado = useAuthStore((s) => s.isAuthenticated);
  // O papel efectivo: em modo suporte, as notificações são as do ADMIN da empresa.
  const papel = useAuthStore((s) => papelEfectivo(s.user, s.suporte));

  return {
    chave: 'notificacoes-gestao',
    api: gestaoApi,
    activo: autenticado && papel !== undefined && papel !== 'SUPER_ADMIN',
    obterToken: async () => (await api.get<{ token: string }>('/notificacoes/socket-token')).data.token,
  };
}
