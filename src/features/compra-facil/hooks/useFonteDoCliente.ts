import type { FonteDeNotificacoes, PaginaDeNotificacoes } from '@/shared/notificacoes/tipos';
import { contaApi } from '../api/conta.api';
import { useContaClienteStore } from '../store/useContaClienteStore';

/** As notificações da conta do cliente (de todas as lojas): a conta do token, nunca um parâmetro. */
const clienteApi = {
  listar: async (pagina: number) =>
    (await contaApi.get<PaginaDeNotificacoes>('/commerce/conta/notificacoes', { params: { pagina, limite: 20 } })).data,
  contagem: async () => (await contaApi.get<{ naoLidas: number }>('/commerce/conta/notificacoes/contagem')).data.naoLidas,
  marcarLida: async (id: string) => (await contaApi.patch(`/commerce/conta/notificacoes/${id}/lida`)).data,
  marcarTodasLidas: async () => (await contaApi.patch('/commerce/conta/notificacoes/lidas')).data,
};

export function useFonteDoCliente(): FonteDeNotificacoes {
  const autenticado = useContaClienteStore((s) => s.autenticado);

  return {
    chave: 'notificacoes-cliente',
    api: clienteApi,
    activo: autenticado,
    obterToken: async () => (await contaApi.get<{ token: string }>('/commerce/conta/socket-token')).data.token,
  };
}
