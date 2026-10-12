import type { FonteDeNotificacoes } from '@/shared/notificacoes/tipos';
import { estafetaApi } from '../api/estafeta.api';
import { useEstafetaStore } from '../store/useEstafetaStore';

export function useFonteDoEstafeta(): FonteDeNotificacoes {
  const autenticado = useEstafetaStore((s) => s.autenticado);

  return {
    chave: 'notificacoes-estafeta',
    api: {
      listar: (pagina) => estafetaApi.notificacoes(pagina),
      contagem: () => estafetaApi.contagemDeNotificacoes(),
      marcarLida: (id) => estafetaApi.marcarNotificacaoLida(id),
      marcarTodasLidas: () => estafetaApi.marcarNotificacoesLidas(),
    },
    activo: autenticado,
    obterToken: () => estafetaApi.tokenDeSocket(),
  };
}
