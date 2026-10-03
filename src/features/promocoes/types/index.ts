export type TipoPromocao = 'PRODUTO' | 'CATEGORIA';
export type NivelRiscoStockPromocao = 'SEM_DADOS' | 'BAIXO' | 'MEDIO' | 'ALTO';

export interface RiscoStockPromocao {
  procuraEsperada: number;
  stockDisponivel: number;
  coberturaDias: number | null;
  nivel: NivelRiscoStockPromocao;
}

export interface Promocao {
  id: string;
  nome: string;
  tipo: TipoPromocao;
  produtoId: string | null;
  categoriaId: string | null;
  percentualDesconto: number;
  dataInicio: string;
  dataFim: string;
  isActive: boolean;
  createdAt: string;
  produto: { id: string; nome: string } | null;
  categoria: { id: string; nome: string } | null;
  criadoPor: { id: string; name: string } | null;
}

/** Devolvida só pelo `criar` — o risco informativo da promoção recém-criada. */
export interface PromocaoComRisco extends Promocao {
  risco: RiscoStockPromocao;
}

export interface CriarPromocaoPayload {
  nome: string;
  tipo: TipoPromocao;
  produtoId?: string;
  categoriaId?: string;
  percentualDesconto: number;
  dataInicio: string;
  dataFim: string;
}
