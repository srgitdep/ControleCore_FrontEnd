export type EscopoPoliticaPreco = 'EMPRESA' | 'CATEGORIA' | 'PRODUTO';
export type DecisaoCandidatoPreco = 'AUTO_APPROVED' | 'REVIEW_REQUIRED' | 'BLOCKED';

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
  margemEfectiva: number | null;
  decisao: DecisaoCandidatoPreco;
  motivos: string[];
  createdAt: string;
  produto: { id: string; nome: string } | null;
  politica: { id: string; escopo: EscopoPoliticaPreco } | null;
  pedidoPor: { id: string; name: string } | null;
}
