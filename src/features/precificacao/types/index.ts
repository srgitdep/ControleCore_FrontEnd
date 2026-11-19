export type EscopoPoliticaPreco = 'EMPRESA' | 'CATEGORIA' | 'PRODUTO';
export type DecisaoCandidatoPreco = 'AUTO_APPROVED' | 'REVIEW_REQUIRED' | 'BLOCKED';
/** Onde o candidato está no caminho até ao preço publicado (D7-2). */
export type EstadoCandidatoPreco = 'SIMULADO' | 'PENDENTE' | 'PUBLICADO' | 'RECUSADO';
/** Quem pediu o preço: a MAYRA e um preço escrito à mão lêem-se de forma diferente na fila. */
export type OrigemCandidatoPreco = 'SIMULACAO' | 'POLITICA' | 'MANUAL' | 'MAYRA';

export interface PoliticaPreco {
  id: string;
  escopo: EscopoPoliticaPreco;
  categoriaId: string | null;
  produtoId: string | null;
  /** Fracção de 1 (0.20 = 20%) — o backend devolve-a já como número. */
  margemAlvo: number;
  margemPiso: number;
  taxaVariavel: number;
  incrementoArredondamento: number;
  limiteAutoaprovacao: number | null;
  vigenteDe: string;
  vigenteAte: string | null;
  substituiuId: string | null;
  createdAt: string;
  categoria: { id: string; nome: string } | null;
  produto: { id: string; nome: string } | null;
  criadoPor: { id: string; name: string } | null;
}

export interface CriarPoliticaPrecoPayload {
  escopo: EscopoPoliticaPreco;
  categoriaId?: string;
  produtoId?: string;
  margemAlvo: number;
  margemPiso: number;
  taxaVariavel?: number;
  incrementoArredondamento?: number;
  limiteAutoaprovacao?: number;
}

export interface SimularPrecoPayload {
  produtoId: string;
  custoHipotetico?: number;
}

export interface CandidatoPreco {
  id: string;
  produtoId: string;
  politicaId: string | null;
  custoUsado: number;
  preco: number | null;
  /** O preço em vigor no momento do cálculo — para mostrar a variação sem adivinhar. */
  precoActual: number | null;
  margemEfectiva: number | null;
  decisao: DecisaoCandidatoPreco;
  motivos: string[];
  origem: OrigemCandidatoPreco;
  estado: EstadoCandidatoPreco;
  motivoDecisao: string | null;
  createdAt: string;
  decididoEm: string | null;
  produto: { id: string; nome: string } | null;
  politica: { id: string; escopo: EscopoPoliticaPreco } | null;
  pedidoPor: { id: string; name: string } | null;
  decididoPor: { id: string; name: string } | null;
}

/** Uma versão de preço no histórico de um produto, com a decisão que a originou. */
export interface PrecoVersaoHistorico {
  id: string;
  preco: number;
  vigenteDe: string;
  vigenteAte: string | null;
  candidato: Pick<
    CandidatoPreco,
    'origem' | 'margemEfectiva' | 'custoUsado' | 'motivos' | 'politica' | 'pedidoPor' | 'decididoPor'
  >;
}

export interface RecusarPrecoPayload {
  motivo: string;
}

/** «E se a margem desta categoria fosse 30%?» — sem gravar nada (D7-4). */
export interface SimularPoliticaPayload {
  categoriaId?: string;
  margemAlvo: number;
  margemPiso: number;
  taxaVariavel?: number;
  incrementoArredondamento?: number;
}

export interface LinhaDeSimulacaoPolitica {
  produtoId: string;
  nome: string;
  precoActual: number | null;
  decisao: DecisaoCandidatoPreco;
  precoSugerido: number | null;
  margemEfectiva: number | null;
  motivos: string[];
}
