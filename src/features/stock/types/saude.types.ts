/**
 * Saúde do stock e prazos de validade.
 *
 * Os tipos espelham o que o backend calcula em `saude-stock.ts` e `validade-stock.ts`. Nada
 * aqui é recalculado no cliente: a classificação, o capital imobilizado e os estados de
 * validade vêm decididos do servidor, pela mesma razão que `abaixoDoMinimo` já vem — as
 * regras têm subtilezas (`null` significa «sem informação», não zero) que já foram
 * implementadas mal em três sítios ao mesmo tempo.
 */

/** As seis classes do §54. */
export type ClasseStock =
  | 'NORMAL'
  | 'BAIXA_ROTACAO'
  | 'EXCESSO'
  | 'PARADO'
  | 'OBSOLETO'
  | 'RISCO_VALIDADE';

/** Os estados do §73, mais o caso de mercadoria sem validade a controlar. */
export type EstadoValidade =
  | 'SEM_VALIDADE'
  | 'NORMAL'
  | 'PROXIMO_DA_VALIDADE'
  | 'EM_RISCO'
  | 'EXPIRADO';

export interface OpcoesSaude {
  janelaDias: number;
  diasCoberturaMaximo: number;
  diasCoberturaBaixaRotacao: number;
  diasSemVendaParado: number;
  diasSemVendaObsoleto: number;
}

export interface OpcoesValidade {
  diasAvisoOmissao: number;
  diasEmRisco: number;
}

export interface ResumoClasse {
  produtos: number;
  quantidade: number;
  valor: number;
  percentagemDoValor: number;
}

export interface ResumoEstadoValidade {
  lotes: number;
  quantidade: number;
  valor: number;
}

export interface ResumoValidade {
  valorExpirado: number;
  valorEmRisco: number;
  porEstado: Record<EstadoValidade, ResumoEstadoValidade>;
  opcoes: OpcoesValidade;
}

/**
 * Quanto do saldo está coberto por lotes.
 *
 * Existe para o ecrã poder dizer a verdade: «zero em risco de validade» lê-se como boa
 * notícia, mas pode significar apenas que ninguém registou validades na entrada de
 * mercadoria. Esconder este número tornaria o painel confiante e errado.
 */
export interface Rastreabilidade {
  quantidadeTotal: number;
  quantidadeEmLotes: number;
  percentagemRastreada: number;
  produtosComValidadeExigida: number;
  produtosComValidadeExigidaSemLote: number;
}

export interface SaudeStock {
  valorTotal: number;
  produtosComStock: number;
  porClasse: Record<ClasseStock, ResumoClasse>;
  opcoes: OpcoesSaude;
  validade: ResumoValidade;
  rastreabilidade: Rastreabilidade;
}

export interface DiagnosticoProduto {
  produtoId: string;
  nome: string;
  quantidade: number;
  capitalImobilizado: number;
  mediaDiaria: number;
  /** `null` quando não houve vendas na janela: sem consumo não há cobertura a calcular. */
  diasCobertura: number | null;
  classe: ClasseStock;
  diasSemVenda: number;
  nuncaVendeu: boolean;
  diasDesdeUltimaCompra: number | null;
  /** `null` sem registo de compras — o stock entrou por ajuste ou carga inicial. */
  percentagemNaoVendida: number | null;
  /** `null` sem preço de venda definido. */
  margemUnitaria: number | null;
}

export interface ListaSaude {
  produtos: DiagnosticoProduto[];
  paginacao: { page: number; limit: number; total: number; omitidas: number };
  opcoes: OpcoesSaude;
}

export interface DiagnosticoLote {
  loteId: string;
  codigo: string;
  produtoId: string;
  produtoNome: string;
  armazemId: string;
  armazemNome: string;
  quantidade: number;
  dataValidade: string | null;
  /** Negativo se já expirou. `null` se o lote não tem validade. */
  diasParaValidade: number | null;
  estado: EstadoValidade;
  valorEmRisco: number;
  bloqueado: boolean;
}

export interface ListaValidade {
  lotes: DiagnosticoLote[];
  resumo: ResumoValidade;
  paginacao: { total: number; omitidas: number };
}

export interface LinhaFefo {
  loteId: string;
  codigo: string;
  dataValidade: string | null;
  diasParaValidade: number | null;
  estado: EstadoValidade;
  quantidade: number;
}

export interface SugestaoFefo {
  linhas: LinhaFefo[];
  /** Quanto ficou sem lote atribuído. Nunca truncar em silêncio. */
  quantidadeNaoCoberta: number;
  excluidos: { loteId: string; codigo: string; motivo: string }[];
  resumo: ResumoValidade;
}

/**
 * Cores por classe, num só lugar para a tabela e o painel não divergirem.
 *
 * Os rótulos (`label`/`descricao`) não vivem aqui — vêm do catálogo i18n
 * (`classe.<CODIGO>.label` / `.descricao`), para existirem em português e em inglês.
 */
export const CLASSE_META: Record<ClasseStock, { cor: string; pastilha: string }> = {
  NORMAL: {
    cor: 'bg-emerald-500',
    pastilha: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  },
  BAIXA_ROTACAO: {
    cor: 'bg-lime-500',
    pastilha: 'bg-lime-50 text-lime-700 border-lime-200',
  },
  EXCESSO: {
    cor: 'bg-amber-500',
    pastilha: 'bg-amber-50 text-amber-700 border-amber-200',
  },
  PARADO: {
    cor: 'bg-orange-500',
    pastilha: 'bg-orange-50 text-orange-700 border-orange-200',
  },
  OBSOLETO: {
    cor: 'bg-rose-500',
    pastilha: 'bg-rose-50 text-rose-700 border-rose-200',
  },
  RISCO_VALIDADE: {
    cor: 'bg-red-600',
    pastilha: 'bg-red-50 text-red-700 border-red-200',
  },
};

/**
 * Pastilhas de cor por estado de validade. O rótulo vive no catálogo i18n
 * (`validade_estado.<CODIGO>`), pela mesma razão.
 */
export const ESTADO_VALIDADE_META: Record<EstadoValidade, { pastilha: string }> = {
  EXPIRADO: { pastilha: 'bg-red-50 text-red-700 border-red-200' },
  EM_RISCO: { pastilha: 'bg-orange-50 text-orange-700 border-orange-200' },
  PROXIMO_DA_VALIDADE: { pastilha: 'bg-amber-50 text-amber-700 border-amber-200' },
  NORMAL: { pastilha: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
  SEM_VALIDADE: { pastilha: 'bg-slate-50 text-slate-600 border-slate-200' },
};
