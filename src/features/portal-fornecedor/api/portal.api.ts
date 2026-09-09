import axios from 'axios';
import { api } from '@/shared/config';

/**
 * O portal do fornecedor: instância de axios própria, e porquê.
 *
 * ═══════════════════════════════════════════════════════════════════════════════
 * NÃO USAR A INSTÂNCIA `api` PARTILHADA NAS ROTAS DO PORTAL.
 * ═══════════════════════════════════════════════════════════════════════════════
 *
 * A instância `api` de `shared/config/axios.ts` tem um interceptor que, ao receber 401,
 * tenta `POST /auth/refresh` e — se esse falhar — faz `window.location.href = '/login'`.
 *
 * Nas rotas do portal isso produziria o pior comportamento possível: uma sessão de
 * fornecedor expirada tentaria renovar o token **do lado comprador** (que não existe), e o
 * fornecedor acabaria despejado no ecrã de login do ControlCore — um formulário que pede um
 * código de funcionário que ele não tem, e onde nunca vai conseguir entrar.
 *
 * A separação é a mesma que o backend faz com o cookie e o segredo: cookie próprio
 * (`tokenFornecedor`), segredo próprio, guarda próprio. Do lado do browser, instância
 * própria.
 *
 * `withCredentials` mantém-se, porque é o cookie `HttpOnly` que carrega a sessão.
 *
 * ## Sem refresh, e é uma decisão
 *
 * O token do portal vale oito horas — cobre um dia de trabalho. Um mecanismo de renovação
 * silenciosa acrescentaria um segundo cookie, uma rota, e um caminho de falha, para poupar
 * um login por dia a quem entra no portal uma ou duas vezes por semana. Quando expira, o
 * interceptor limpa o estado e leva ao login **do portal**.
 */
const portalApi = axios.create({
  baseURL: api.defaults.baseURL,
  withCredentials: true,
  headers: { 'Content-Type': 'application/json' },
});

/**
 * O que fazer quando a sessão do portal cai.
 *
 * Injectado pelo store em vez de importado, para este ficheiro não depender do store — que
 * depende deste. Sem a injecção, os dois importavam-se em ciclo, e o ciclo em Vite resolve
 * com um dos módulos a `undefined` em tempo de arranque.
 */
let aoPerderSessao: (() => void) | null = null;

export function registarQuedaDeSessao(callback: () => void) {
  aoPerderSessao = callback;
}

portalApi.interceptors.response.use(
  (resposta) => resposta,
  (erro) => {
    const url: string = erro.config?.url ?? '';
    const eEntrada = url.includes('/portal-fornecedor/entrar') || url.includes('/portal-fornecedor/registar');

    // O 401 do próprio login não é uma sessão perdida: é uma senha errada, e limpar o
    // estado aí faria o formulário perder o que o utilizador escreveu.
    if (erro.response?.status === 401 && !eEntrada) {
      aoPerderSessao?.();
    }

    return Promise.reject(erro);
  },
);

// ═══════════════════════════════════════════════════════════════════════════════
// Tipos
// ═══════════════════════════════════════════════════════════════════════════════

export const EstadoArtigoVitrine = {
  RASCUNHO: 'RASCUNHO',
  PUBLICADO: 'PUBLICADO',
  ESGOTADO: 'ESGOTADO',
  DESCONTINUADO: 'DESCONTINUADO',
} as const;

export type EstadoArtigoVitrine =
  (typeof EstadoArtigoVitrine)[keyof typeof EstadoArtigoVitrine];

export const TipoDocumento = {
  ALVARA: 'ALVARA',
  CERTIDAO_QUITACAO_FISCAL: 'CERTIDAO_QUITACAO_FISCAL',
  INSCRICAO_INSS: 'INSCRICAO_INSS',
  LICENCA_SANITARIA: 'LICENCA_SANITARIA',
  SEGURO_RESPONSABILIDADE: 'SEGURO_RESPONSABILIDADE',
  CERTIFICADO_QUALIDADE: 'CERTIFICADO_QUALIDADE',
  OUTRO: 'OUTRO',
} as const;

export type TipoDocumento = (typeof TipoDocumento)[keyof typeof TipoDocumento];

export interface UtilizadorPortal {
  id: string;
  nome: string;
  email: string;
  cargo?: string | null;
  principal: boolean;
  organizacaoId: string;
}

export interface PrecoArtigo {
  id: string;
  preco: number;
  moeda: string;
  quantidadeMinima: number;
  vigenteDe: string;
  vigenteAte?: string | null;
  promocional: boolean;
}

export interface ArtigoVitrine {
  id: string;
  organizacaoId: string;
  referencia: string;
  nome: string;
  descricao?: string | null;
  gtin?: string | null;
  categoria?: string | null;
  marca?: string | null;
  unidadeVenda?: string | null;
  factorConversao: number;
  embalagem?: string | null;
  moq?: number | null;
  multiplo?: number | null;
  estado: EstadoArtigoVitrine;
  prazoExpedicaoDias?: number | null;
  quantidadeDisponivel?: number | null;
  imagens: string[];
  fichaTecnicaUrl?: string | null;
  publicadoEm?: string | null;
  precos: PrecoArtigo[];
}

export interface DocumentoFornecedor {
  id: string;
  tipo: TipoDocumento;
  descricao?: string | null;
  numero?: string | null;
  entidadeEmissora?: string | null;
  ficheiroUrl?: string | null;
  emitidoEm?: string | null;
  validoAte?: string | null;
  estado: 'PENDENTE' | 'VALIDO' | 'EXPIRADO' | 'RECUSADO';
  verificadoEm?: string | null;
  motivoDecisao?: string | null;
}

export interface ZonaEntrega {
  id: string;
  provincia: string;
  cidade?: string | null;
  prazoDias?: number | null;
  custoEntrega: number;
  valorMinimoEntrega?: number | null;
  activa: boolean;
}

/**
 * O que falta ao fornecedor para poder receber ordens.
 *
 * `bloqueante` é a distinção que o ecrã tem de mostrar: alvará, quitação fiscal e conta
 * bancária **excluem** das comparações; INSS e seguro apenas descontam na pontuação.
 * Apresentar as cinco faltas com o mesmo peso faria o fornecedor tratar as urgentes como
 * as opcionais.
 */
export interface Conformidade {
  conforme: boolean;
  grau: number;
  faltas: { tipo: string; bloqueante: boolean; mensagem: string }[];
  resumo: string;
}

export interface RegistoResultado {
  organizacaoId: string;
  utilizadorId: string;
  /**
   * O código de acesso gerado pelo servidor, no formato `F####`.
   *
   * Vem na resposta e a senha **não**: o código é um identificador de login, não um
   * segredo, e mostrá-lo no ecrã de confirmação poupa a quem não recebeu o e-mail o ter
   * de repetir o registo. A senha só existe no e-mail.
   */
  codigo: string;
  /** Verdadeiro quando o NUIT já existia no cadastro de um comprador. */
  reivindicacao: boolean;
  proximosPassos: string[];
}

// ═══════════════════════════════════════════════════════════════════════════════
// Chamadas
// ═══════════════════════════════════════════════════════════════════════════════

const BASE = '/portal-fornecedor';

export const portal = {
  // ─── Entrada ──────────────────────────────────────────────────────────────

  registar: async (payload: {
    razaoSocial: string;
    nomeComercial?: string;
    nuit: string;
    sede?: string;
    emailEmpresa?: string;
    telefone?: string;
    website?: string;
    responsavel: {
      nome: string;
      /** É para aqui que vão o código de acesso e a senha inicial. */
      email: string;
      telefone?: string;
      cargo?: string;
    };
  }) => {
    const { data } = await portalApi.post<RegistoResultado>(`${BASE}/registar`, payload);
    return data;
  },

  /** `identificador` é o e-mail **ou** o código `F####`. É o servidor que reconhece qual. */
  entrar: async (payload: { identificador: string; password: string }) => {
    const { data } = await portalApi.post<{ utilizador: UtilizadorPortal; token: string }>(
      `${BASE}/entrar`,
      payload,
    );
    return data;
  },

  sair: async () => {
    await portalApi.post(`${BASE}/sair`);
  },

  eu: async () => {
    const { data } = await portalApi.get<{
      fornecedor: {
        utilizadorId: string;
        organizacaoId: string;
        nome: string;
        email: string;
        principal: boolean;
      };
      conformidade: Conformidade;
    }>(`${BASE}/eu`);
    return data;
  },

  // ─── Vitrine ──────────────────────────────────────────────────────────────

  listarArtigos: async (filtros?: { estado?: EstadoArtigoVitrine; termo?: string }) => {
    const { data } = await portalApi.get<ArtigoVitrine[]>(`${BASE}/artigos`, {
      params: filtros,
    });
    return data;
  },

  criarArtigo: async (payload: Partial<ArtigoVitrine> & { referencia: string; nome: string }) => {
    const { data } = await portalApi.post<ArtigoVitrine>(`${BASE}/artigos`, payload);
    return data;
  },

  actualizarArtigo: async (
    id: string,
    payload: Partial<ArtigoVitrine> & { referencia: string; nome: string },
  ) => {
    const { data } = await portalApi.patch<ArtigoVitrine>(`${BASE}/artigos/${id}`, payload);
    return data;
  },

  mudarEstadoArtigo: async (id: string, estado: EstadoArtigoVitrine) => {
    const { data } = await portalApi.patch<ArtigoVitrine>(`${BASE}/artigos/${id}/estado`, {
      estado,
    });
    return data;
  },

  publicarPreco: async (
    artigoId: string,
    payload: {
      preco: number;
      moeda?: string;
      quantidadeMinima?: number;
      vigenteDe: string;
      vigenteAte?: string;
      promocional?: boolean;
    },
  ) => {
    const { data } = await portalApi.post<PrecoArtigo>(
      `${BASE}/artigos/${artigoId}/precos`,
      payload,
    );
    return data;
  },

  apagarPreco: async (precoId: string) => {
    await portalApi.delete(`${BASE}/precos/${precoId}`);
  },

  // ─── Documentos e zonas ───────────────────────────────────────────────────

  listarDocumentos: async () => {
    const { data } = await portalApi.get<DocumentoFornecedor[]>(`${BASE}/documentos`);
    return data;
  },

  submeterDocumento: async (payload: {
    tipo: TipoDocumento;
    descricao?: string;
    numero?: string;
    entidadeEmissora?: string;
    ficheiroUrl?: string;
    emitidoEm?: string;
    validoAte?: string;
  }) => {
    const { data } = await portalApi.post<DocumentoFornecedor>(`${BASE}/documentos`, payload);
    return data;
  },

  listarZonas: async () => {
    const { data } = await portalApi.get<ZonaEntrega[]>(`${BASE}/zonas`);
    return data;
  },

  definirZona: async (payload: {
    provincia: string;
    cidade?: string;
    prazoDias?: number;
    custoEntrega?: number;
    valorMinimoEntrega?: number;
    activa?: boolean;
  }) => {
    const { data } = await portalApi.post<ZonaEntrega>(`${BASE}/zonas`, payload);
    return data;
  },

  removerZona: async (zonaId: string) => {
    await portalApi.delete(`${BASE}/zonas/${zonaId}`);
  },
};

// ═══════════════════════════════════════════════════════════════════════════════
// Etiquetas
// ═══════════════════════════════════════════════════════════════════════════════

export const ETIQUETA_ESTADO_ARTIGO: Record<EstadoArtigoVitrine, string> = {
  RASCUNHO: 'Rascunho',
  PUBLICADO: 'Publicado',
  ESGOTADO: 'Esgotado',
  DESCONTINUADO: 'Descontinuado',
};

/**
 * O que cada estado do artigo significa para quem compra.
 *
 * `ESGOTADO` é o que mais precisa de explicação: continua visível de propósito, e o
 * fornecedor tem de saber isso — senão descontinua o artigo quando queria só marcar que
 * está sem saldo, e perde-o das comparações para sempre.
 */
export const AJUDA_ESTADO_ARTIGO: Record<EstadoArtigoVitrine, string> = {
  RASCUNHO: 'Só você vê. Nenhum comprador o encontra.',
  PUBLICADO: 'Visível e comprável em todas as comparações.',
  ESGOTADO: 'Continua visível — o comprador vê que existe e vai voltar. Não sai das buscas.',
  DESCONTINUADO: 'Sai das comparações. Fica no histórico das compras antigas.',
};

export const ETIQUETA_DOCUMENTO: Record<TipoDocumento, string> = {
  ALVARA: 'Alvará',
  CERTIDAO_QUITACAO_FISCAL: 'Certidão de quitação fiscal',
  INSCRICAO_INSS: 'Inscrição no INSS',
  LICENCA_SANITARIA: 'Licença sanitária',
  SEGURO_RESPONSABILIDADE: 'Seguro de responsabilidade',
  CERTIFICADO_QUALIDADE: 'Certificado de qualidade',
  OUTRO: 'Outro documento',
};

/** Os que impedem a compra quando faltam. Os outros só descontam na pontuação. */
export const DOCUMENTOS_OBRIGATORIOS: TipoDocumento[] = [
  'ALVARA',
  'CERTIDAO_QUITACAO_FISCAL',
];

export const ETIQUETA_ESTADO_DOCUMENTO: Record<DocumentoFornecedor['estado'], string> = {
  PENDENTE: 'A aguardar verificação',
  VALIDO: 'Válido',
  EXPIRADO: 'Expirado',
  RECUSADO: 'Recusado',
};

/**
 * As províncias de Moçambique, para o selector de zonas.
 *
 * Lista fixa e não texto livre: a zona de entrega é comparada com a cidade da loja do
 * comprador, e «Nampula», «nampula » e «Nampuula» são três zonas diferentes para a base de
 * dados. Um erro de escrita aqui faz o fornecedor desaparecer das comparações daquela
 * província — e a exclusão é invisível, ninguém procura o que não sabe que falta.
 */
export const PROVINCIAS = [
  'Maputo',
  'Maputo Província',
  'Gaza',
  'Inhambane',
  'Sofala',
  'Manica',
  'Tete',
  'Zambézia',
  'Nampula',
  'Niassa',
  'Cabo Delgado',
] as const;
