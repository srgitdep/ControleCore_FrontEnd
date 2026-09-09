import axios from 'axios';
import { api } from '@/shared/config';

/**
 * O mercado público: busca de fornecedores sem autenticação.
 *
 * ## Instância própria, e sem interceptores
 *
 * A instância `api` partilhada tenta renovar a sessão em cada 401 e, ao falhar, atira o
 * visitante para `/login`. Aqui não há sessão nenhuma para renovar — é o ponto de estas
 * rotas serem públicas — e mandar um visitante anónimo para um formulário de login por causa
 * de um erro de rede seria o pior fim possível para a única página que existe para o atrair.
 *
 * `withCredentials` fica **falso**: o mercado não usa cookies, e enviá-los faria os pedidos
 * anónimos carregarem a sessão de quem tem o ControlCore aberto no mesmo browser — sem
 * necessidade, e a expor a sessão a uma rota que não precisa dela.
 */
const mercadoApi = axios.create({
  baseURL: api.defaults.baseURL,
  withCredentials: false,
  headers: { 'Content-Type': 'application/json' },
});

export interface ArtigoAmostra {
  id: string;
  nome: string;
  referencia: string;
  categoria?: string | null;
  unidadeVenda?: string | null;
  /** Nulo quando o fornecedor não publica preço para este artigo. */
  precoBase: number | null;
  moeda: string;
}

export interface FornecedorNoMercado {
  organizacaoId: string;
  razaoSocial: string;
  nomeComercial?: string | null;
  provinciasServidas: string[];
  artigosPublicados: number;
  amostra: ArtigoAmostra[];
}

export interface FichaPublica {
  organizacaoId: string;
  razaoSocial: string;
  nomeComercial?: string | null;
  sede?: string | null;
  website?: string | null;
  categorias: string[];
  provinciasServidas: string[];
  artigosPublicados: number;
  /**
   * Quantas empresas compradoras lhe compram.
   *
   * **Nulo abaixo de cinco**, e não zero. O backend aplica um limiar de anonimato: «este
   * fornecedor tem um cliente» mais o contexto de quem lê chega para identificar quem é — e
   * esta ficha é pública, o que significa que qualquer concorrente a pode abrir.
   *
   * O ecrã tem de distinguir «não revelamos» de «nenhum», e não mostrar «0».
   */
  compradoresActivos: number | null;
  documentosValidos: string[];
}

export const mercado = {
  procurar: async (parametros: {
    termo?: string;
    categoria?: string;
    provincia?: string;
    limite?: number;
  }) => {
    const { data } = await mercadoApi.get<FornecedorNoMercado[]>('/mercado/fornecedores', {
      params: parametros,
    });
    return data;
  },

  ficha: async (organizacaoId: string) => {
    const { data } = await mercadoApi.get<FichaPublica>(
      `/mercado/fornecedores/${organizacaoId}`,
    );
    return data;
  },
};

/**
 * Os documentos, traduzidos para a ficha pública.
 *
 * Repetido de `portal.api.ts` de propósito: o mercado é público e não deve importar nada do
 * portal — que é código autenticado, com uma instância de axios que envia cookies. A
 * duplicação de sete etiquetas é mais barata do que a dependência.
 */
export const ETIQUETA_DOCUMENTO_PUBLICO: Record<string, string> = {
  ALVARA: 'Alvará',
  CERTIDAO_QUITACAO_FISCAL: 'Quitação fiscal',
  INSCRICAO_INSS: 'INSS',
  LICENCA_SANITARIA: 'Licença sanitária',
  SEGURO_RESPONSABILIDADE: 'Seguro de responsabilidade',
  CERTIFICADO_QUALIDADE: 'Certificado de qualidade',
  OUTRO: 'Outro documento',
};

export const PROVINCIAS_MERCADO = [
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
