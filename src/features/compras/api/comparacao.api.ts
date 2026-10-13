import { api } from '@/shared/config';

/** Os cinco critérios da comparação (plano §4.11). A ordem é a do ecrã. */
export const CRITERIOS = ['preco', 'pontualidade', 'prazo', 'cumprimento', 'credito'] as const;
export type Criterio = (typeof CRITERIOS)[number];

export type PesosComparacao = Record<Criterio, number>;

/** Os mesmos pesos por omissão do servidor (`PESOS_PADRAO`): só servem enquanto os da empresa não chegam. */
export const PESOS_PADRAO: PesosComparacao = { preco: 40, pontualidade: 20, prazo: 15, cumprimento: 15, credito: 10 };

export type MarcaComparacao =
  | 'DADOS_INSUFICIENTES'
  | 'LINHAS_EM_FALTA'
  | 'MOEDA_NAO_COMPARAVEL'
  | 'NAO_COMPRAVEL'
  | 'QUANTIDADE_AJUSTADA'
  | 'PRECO_ANTIGO';

export interface LinhaParaComparar {
  produtoId: string;
  /** Em unidades base (as do stock). */
  quantidade: number;
}

export interface AjusteDeQuantidade {
  produtoId: string;
  de: number;
  para: number;
  motivo: string;
}

export interface ResultadoDoFornecedor {
  fornecedorId: string;
  nome: string;
  preferencial: boolean;
  estadoRelacao: string;
  linhasCobertas: number;
  linhasTotal: number;
  totalPedido: number | null;
  prazoMedioDias: number | null;
  pontualidadePercent: number | null;
  cumprimentoPercent: number | null;
  diasCredito: number;
  pontuacoes: Record<Criterio, number | null>;
  pontuacaoTotal: number | null;
  /** 1 = o melhor; `null` = fora da classificação (ver `marcas`). */
  posicao: number | null;
  marcas: MarcaComparacao[];
  ajustes: AjusteDeQuantidade[];
  diasPrecoMaisAntigo: number | null;
}

export interface ComparacaoDeFornecedores {
  pesos: PesosComparacao;
  classificados: number;
  fornecedores: ResultadoDoFornecedor[];
}

export const comparacaoApi = {
  comparar: async (linhas: LinhaParaComparar[], pesos?: PesosComparacao) =>
    (await api.post<ComparacaoDeFornecedores>('/compras/comparacao-fornecedores', { linhas, ...(pesos ? { pesos } : {}) })).data,

  obterCriterios: async () => (await api.get<PesosComparacao>('/compras/comparacao-fornecedores/criterios')).data,

  guardarCriterios: async (pesos: PesosComparacao) =>
    (await api.put<PesosComparacao>('/compras/comparacao-fornecedores/criterios', pesos)).data,
};
