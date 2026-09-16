/**
 * Necessidades de Compra — DT01.
 *
 * Os tipos espelham o que o backend calcula em `motor-necessidade.ts` e
 * `hierarquia-decisao.ts`. Nada aqui é recalculado no cliente: a classificação, a
 * urgência e a recomendação vêm decididas do servidor — o DT01 6 é explícito em que
 * regras críticas não correm no browser.
 */

export type EstadoNecessidade =
  | 'ACTIVA'
  | 'EM_REQUISICAO'
  | 'EM_TRANSFERENCIA'
  | 'AGUARDA_RECEPCAO'
  | 'RESOLVIDA'
  | 'IGNORADA';

export type RecomendacaoNecessidade =
  | 'COMPRAR'
  | 'TRANSFERIR'
  | 'AGUARDAR'
  | 'NAO_COMPRAR'
  | 'STOCK_PARADO'
  | 'EXCESSO';

export type UrgenciaNecessidade = 'CRITICA' | 'ALTA' | 'MEDIA';

export interface LinhaNecessidade {
  id: string;
  produto: {
    id: string;
    nome: string;
    sku: string | null;
    codigoBarras: string | null;
    imagemUrl: string | null;
  };
  categoria: { id: string; nome: string } | null;
  loja: { id: string; nome: string };
  stockDisponivel: number;
  stockMinimo: number;
  mediaDiaria: number;
  diasCobertura: number | null;
  quantidadeSugerida: number;
  valorEstimado: number;
  recomendacao: RecomendacaoNecessidade;
  urgencia: UrgenciaNecessidade;
  estado: EstadoNecessidade;
  dataPrevistaRuptura: string | null;
  requisicaoId: string | null;
  avaliadaEm: string;
}

export interface ListaNecessidades {
  dados: LinhaNecessidade[];
  total: number;
  page: number;
  limit: number;
  contagemPorRecomendacao: Record<RecomendacaoNecessidade, number>;
}

export interface KpisNecessidades {
  emRiscoRuptura: number;
  necessidadesIdentificadas: number;
  porRecomendacao: Record<RecomendacaoNecessidade, number>;
  requisicoesEmAprovacao: number;
  ordensCompraEmitidas: number;
  valorOrdensCompra: number;
}

export interface OportunidadeTransferencia {
  origemLojaId: string;
  origemLojaNome: string;
  origemArmazemId: string;
  quantidadeDisponivel: number;
  coberturaOrigemDepois: number | null;
}

export interface DetalheNecessidade {
  id: string;
  estado: EstadoNecessidade;
  recomendacao: RecomendacaoNecessidade;
  urgencia: UrgenciaNecessidade;
  avaliadaEm: string;

  produto: {
    id: string;
    nome: string;
    sku: string | null;
    codigoBarras: string | null;
    imagemUrl: string | null;
    categoria: string | null;
  };

  loja: { id: string; nome: string };

  situacao: {
    stockFisico: number;
    stockDisponivel: number;
    stockMinimo: number;
    porArmazem: { armazemId: string; armazemNome: string; quantidade: number; minimo: number }[];
  };

  procura: {
    mediaDiaria: number;
    janelaDias: number;
    vendidoNaJanela: number;
    diasDesdeUltimaVenda: number | null;
  };

  abastecimento: {
    quantidadeSugerida: number;
    valorEstimado: number;
    diasCobertura: number | null;
    diasPretendidos: number;
    dataPrevistaRuptura: string | null;
  };

  rede: {
    stockNoutrasLojas: { lojaId: string; lojaNome: string; quantidade: number }[];
    oportunidades: OportunidadeTransferencia[];
  };

  compras: {
    requisicoes: {
      id: string;
      numero: string;
      estado: string;
      quantidade: number;
      criadaEm: string;
      /** A corrida de sourcing/RFQ adjudicada desta requisição, quando existe (DT01 §17). */
      sourcing: { id: string; estado: string; candidatosAvaliados: number } | null;
    }[];
    ordensCompra: {
      id: string;
      fornecedor: string;
      quantidadePedida: number;
      quantidadeRecebida: number;
      dataPrevista: string | null;
    }[];
  };

  fornecedor: { id: string; nome: string; custoCompra: number } | null;

  historico: {
    accao: string;
    estadoNovo: string;
    recomendacaoNova: string | null;
    observacoes: string | null;
    origem: string | null;
    utilizador: string | null;
    createdAt: string;
  }[];
}

export interface FiltrosNecessidade {
  lojaId?: string;
  recomendacao?: RecomendacaoNecessidade[];
  urgencia?: UrgenciaNecessidade[];
  categoriaId?: string;
  pesquisa?: string;
  incluirInactivas?: boolean;
  page?: number;
  limit?: number;
}

export interface ResultadoCriacaoRequisicao {
  requisicaoId: string;
  numero: string;
  jaExistia: boolean;
}

/** Rótulos para os chips de filtro e a coluna de recomendação (DT01 5 e 10). */
export const RECOMENDACAO_LABEL: Record<RecomendacaoNecessidade, string> = {
  COMPRAR: 'Comprar',
  TRANSFERIR: 'Transferir',
  AGUARDAR: 'Aguardar',
  NAO_COMPRAR: 'Não comprar',
  STOCK_PARADO: 'Stock parado',
  EXCESSO: 'Excesso',
};

export const URGENCIA_LABEL: Record<UrgenciaNecessidade, string> = {
  CRITICA: 'Crítica',
  ALTA: 'Alta',
  MEDIA: 'Média',
};

/** A recomendação principal da MAYRA sobre a fila (DT01 §14). */
export interface AnaliseMayra {
  recomendacaoPrincipal: string;
  /** 0 a 1 — quão bem sustentada a recomendação está pelos dados recebidos. */
  confianca: number;
  geradaEm: string;
}

/** Uma linha do Histórico de Necessidades — DT01 §15.3. */
export interface LinhaHistoricoNecessidade {
  id: string;
  accao: string;
  estadoAnterior: EstadoNecessidade | null;
  estadoNovo: EstadoNecessidade;
  recomendacaoAnterior: RecomendacaoNecessidade | null;
  recomendacaoNova: RecomendacaoNecessidade | null;
  stockDisponivel: number | null;
  quantidadeSugerida: number | null;
  origem: string | null;
  observacoes: string | null;
  utilizador: string | null;
  createdAt: string;
  produto: { id: string; nome: string; sku: string | null };
  loja: { id: string; nome: string };
}

export interface ListaHistoricoNecessidades {
  dados: LinhaHistoricoNecessidade[];
  total: number;
  page: number;
  limit: number;
}

export interface FiltrosHistorico {
  lojaId?: string;
  produtoId?: string;
  desde?: string;
  ate?: string;
  page?: number;
  limit?: number;
}

/** Um alerta do Centro de Alertas — DT01 §15.4. */
export type TipoAlerta = 'RISCO_RUPTURA' | 'OC_ATRASADA' | 'RECEPCAO_PENDENTE';

export interface Alerta {
  tipo: TipoAlerta;
  entidadeId: string;
  titulo: string;
  descricao: string;
  loja: { id: string; nome: string } | null;
  diasEmAberto: number;
  criadoEm: string;
}

export interface CentroDeAlertas {
  dados: Alerta[];
  total: number;
}

export const TIPO_ALERTA_LABEL: Record<TipoAlerta, string> = {
  RISCO_RUPTURA: 'Risco de ruptura',
  OC_ATRASADA: 'OC atrasada',
  RECEPCAO_PENDENTE: 'Recepção pendente',
};
