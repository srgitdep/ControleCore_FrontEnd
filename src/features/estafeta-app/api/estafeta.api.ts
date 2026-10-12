import axios from 'axios';
import { api, enviarLinguaActiva } from '@/shared/config';
import type { PaginaDeNotificacoes } from '@/shared/notificacoes/tipos';
import type {
  DadosDeEntrega,
  DadosDeFalha,
  EntregaEstafeta,
  EstadoEscolhido,
  PerfilEstafeta,
} from '../types/estafeta';

/**
 * A aplicação do estafeta: instância própria, com cookie próprio (`tokenEstafeta`).
 *
 * ═══════════════════════════════════════════════════════════════════════════════
 * NÃO USAR A INSTÂNCIA `api` PARTILHADA NAS ROTAS DO ESTAFETA.
 * ═══════════════════════════════════════════════════════════════════════════════
 *
 * A instância `api` tenta renovar a sessão do ControlCore em cada 401 e, ao falhar, atira para `/login`.
 * Aqui um 401 quer dizer «a sessão do estafeta acabou» e tem o seu próprio tratamento (limpar e voltar
 * à entrada). Mesma separação de `contaApi` (cliente) e `portalApi` (fornecedor).
 */
const estafetaApiInstancia = axios.create({
  baseURL: api.defaults.baseURL,
  withCredentials: true,
  headers: { 'Content-Type': 'application/json' },
});
enviarLinguaActiva(estafetaApiInstancia);

/** Injectado pelo store, para este ficheiro não depender dele (evita um ciclo de imports). */
let aoPerderSessao: (() => void) | null = null;

export function registarQuedaDeSessaoDoEstafeta(callback: () => void) {
  aoPerderSessao = callback;
}

estafetaApiInstancia.interceptors.response.use(
  (resposta) => resposta,
  (erro) => {
    if (erro.response?.status === 401) aoPerderSessao?.();
    return Promise.reject(erro);
  },
);

const BASE = '/estafeta';

export const estafetaApi = {
  eu: async () => (await estafetaApiInstancia.get<PerfilEstafeta>(`${BASE}/eu`)).data,

  mudarEstado: async (estado: EstadoEscolhido) =>
    (await estafetaApiInstancia.patch<{ estado: EstadoEscolhido }>(`${BASE}/eu/estado`, { estado })).data,

  // ── As minhas notificações. O estafeta do cookie, nunca um parâmetro. ──
  notificacoes: async (pagina: number) =>
    (await estafetaApiInstancia.get<PaginaDeNotificacoes>(`${BASE}/notificacoes`, { params: { pagina, limite: 20 } })).data,
  contagemDeNotificacoes: async () =>
    (await estafetaApiInstancia.get<{ naoLidas: number }>(`${BASE}/notificacoes/contagem`)).data.naoLidas,
  marcarNotificacaoLida: async (id: string) => (await estafetaApiInstancia.patch(`${BASE}/notificacoes/${id}/lida`)).data,
  marcarNotificacoesLidas: async () => (await estafetaApiInstancia.patch(`${BASE}/notificacoes/lidas`)).data,

  /** «Cheguei»: avisa o cliente e a gestão. Não muda o estado (continua a caminho até «entreguei»). */
  cheguei: async (id: string) =>
    (await estafetaApiInstancia.patch<{ id: string; chegouEm: string; repetido: boolean }>(`${BASE}/entregas/${id}/cheguei`)).data,

  tokenDeSocket: async () => (await estafetaApiInstancia.get<{ token: string }>(`${BASE}/socket-token`)).data.token,

  sair: async () => {
    await estafetaApiInstancia.post(`${BASE}/sair`);
  },

  entregas: async (historico = false) =>
    (
      await estafetaApiInstancia.get<EntregaEstafeta[]>(`${BASE}/entregas`, {
        params: historico ? { historico: true } : undefined,
      })
    ).data,

  entrega: async (id: string) => (await estafetaApiInstancia.get<EntregaEstafeta>(`${BASE}/entregas/${id}`)).data,

  recolher: async (id: string) => (await estafetaApiInstancia.patch(`${BASE}/entregas/${id}/recolher`)).data,

  iniciarRota: async (id: string) => (await estafetaApiInstancia.patch(`${BASE}/entregas/${id}/iniciar-rota`)).data,

  entregar: async (id: string, dados: DadosDeEntrega) =>
    (await estafetaApiInstancia.patch(`${BASE}/entregas/${id}/entregar`, dados)).data,

  falhar: async (id: string, dados: DadosDeFalha) =>
    (await estafetaApiInstancia.patch(`${BASE}/entregas/${id}/falhar`, dados)).data,
};
