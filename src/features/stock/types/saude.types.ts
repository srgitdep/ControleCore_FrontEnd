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

/** Rótulos e cores por classe, num só lugar para a tabela e o painel não divergirem. */
export const CLASSE_META: Record<
  ClasseStock,
  { label: string; descricao: string; cor: string; pastilha: string }
> = {
  NORMAL: {
    label: 'Normal',
    descricao: 'Boa rotação',
    cor: 'bg-emerald-500',
    pastilha: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  },
  BAIXA_ROTACAO: {
    label: 'Baixa rotação',
    descricao: 'Vende lentamente',
    cor: 'bg-lime-500',
    pastilha: 'bg-lime-50 text-lime-700 border-lime-200',
  },
  EXCESSO: {
    label: 'Excesso',
    descricao: 'Vende, mas há stock a mais',
    cor: 'bg-amber-500',
    pastilha: 'bg-amber-50 text-amber-700 border-amber-200',
  },
  PARADO: {
    label: 'Parado',
    descricao: 'Sem movimento relevante',
    cor: 'bg-orange-500',
    pastilha: 'bg-orange-50 text-orange-700 border-orange-200',
  },
  OBSOLETO: {
    label: 'Obsoleto',
    descricao: 'Sem procura há muito tempo',
    cor: 'bg-rose-500',
    pastilha: 'bg-rose-50 text-rose-700 border-rose-200',
  },
  RISCO_VALIDADE: {
    label: 'Risco de validade',
    descricao: 'Tem prazo — agir agora ou perder',
    cor: 'bg-red-600',
    pastilha: 'bg-red-50 text-red-700 border-red-200',
  },
};

export const ESTADO_VALIDADE_META: Record<
  EstadoValidade,
  { label: string; pastilha: string }
> = {
  EXPIRADO: { label: 'Expirado', pastilha: 'bg-red-50 text-red-700 border-red-200' },
  EM_RISCO: { label: 'Em risco', pastilha: 'bg-orange-50 text-orange-700 border-orange-200' },
  PROXIMO_DA_VALIDADE: {
    label: 'Próximo da validade',
    pastilha: 'bg-amber-50 text-amber-700 border-amber-200',
  },
  NORMAL: { label: 'Normal', pastilha: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
  SEM_VALIDADE: { label: 'Sem validade', pastilha: 'bg-slate-50 text-slate-600 border-slate-200' },
};
