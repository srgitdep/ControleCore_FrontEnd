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
import type {
  ContactoDeEmergencia,
  DadosDoDocumento,
  DadosDoRegisto,
  EstadoDoOnboarding,
  LadoDaImagem,
  LeituraDeDocumento,
  OfertaDeEntrega,
  PosicaoParaOnline,
  RespostaDoRegisto,
  TipoDeDocumento,
} from '../types/onboarding';

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

  // ── O registo (público) e o assistente de documentos (plano §4.9) ──
  /** Público. Com `convite` regista na frota própria da empresa; sem ele, na da plataforma. Abre a sessão. */
  registar: async (dados: DadosDoRegisto) =>
    (await estafetaApiInstancia.post<RespostaDoRegisto>(`${BASE}/registo`, dados)).data,

  /** Público. O nome da empresa a que o convite pertence, ou 404 se não existir ou tiver sido substituído. */
  verificarConvite: async (codigo: string) =>
    (await estafetaApiInstancia.get<{ empresaNome: string }>(`${BASE}/registo/convite`, { params: { codigo } })).data,

  estadoDoOnboarding: async () =>
    (await estafetaApiInstancia.get<EstadoDoOnboarding>(`${BASE}/onboarding/estado`)).data,

  contactoDeEmergencia: async (contacto: ContactoDeEmergencia) =>
    (await estafetaApiInstancia.put<{ ok: true }>(`${BASE}/onboarding/contacto-emergencia`, contacto)).data,

  /** Envia **uma** fotografia (já comprimida). Substituir não apaga a anterior; reenviar invalida os dados confirmados. */
  enviarImagem: async (tipo: TipoDeDocumento, lado: LadoDaImagem, imagem: File) => {
    const corpo = new FormData();
    corpo.append('lado', lado);
    corpo.append('imagem', imagem);
    // Sem `Content-Type` à mão: o navegador acrescenta o limite (`boundary`) do multipart.
    return (
      await estafetaApiInstancia.post<{ id: string; lado: LadoDaImagem; url: string }>(
        `${BASE}/onboarding/documentos/${tipo}/imagens`,
        corpo,
        { headers: { 'Content-Type': undefined } },
      )
    ).data;
  },

  /** Lê o documento a partir das fotografias já enviadas. Uma **sugestão**: não grava nada. */
  lerDocumento: async (tipo: TipoDeDocumento) =>
    (await estafetaApiInstancia.post<LeituraDeDocumento>(`${BASE}/onboarding/documentos/${tipo}/ler`)).data,

  confirmarDocumento: async (tipo: TipoDeDocumento, dados: DadosDoDocumento) =>
    (await estafetaApiInstancia.put<{ tipo: TipoDeDocumento; dados: DadosDoDocumento }>(`${BASE}/onboarding/documentos/${tipo}`, dados)).data,

  concluirOnboarding: async () =>
    (await estafetaApiInstancia.post<{ completo: true; onboardingCompletoEm: string }>(`${BASE}/onboarding/concluir`)).data,

  // ── Online/offline e ofertas (plano §4.9) ──
  /** A posição é obrigatória para o estafeta da plataforma. */
  ficarOnline: async (posicao?: PosicaoParaOnline) =>
    (await estafetaApiInstancia.post<{ estado: 'DISPONIVEL'; online: true }>(`${BASE}/online`, posicao ?? {})).data,

  ficarOffline: async () =>
    (await estafetaApiInstancia.post<{ estado: 'INDISPONIVEL'; online: false }>(`${BASE}/offline`)).data,

  ofertaActual: async () =>
    (await estafetaApiInstancia.get<{ oferta: OfertaDeEntrega | null }>(`${BASE}/ofertas/actual`)).data.oferta,

  /** Devolve o id da entrega: a morada e o contacto do cliente lêem-se agora, com `entrega(id)`. */
  aceitarOferta: async (id: string) =>
    (await estafetaApiInstancia.post<{ entregaId: string }>(`${BASE}/ofertas/${id}/aceitar`)).data,

  recusarOferta: async (id: string) =>
    (await estafetaApiInstancia.post<{ recusada: true }>(`${BASE}/ofertas/${id}/recusar`)).data,

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
