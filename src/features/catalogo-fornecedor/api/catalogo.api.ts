import { api } from '@/shared/config';

/**
 * Catálogo do fornecedor: importação, mapeamento e preços com vigência.
 *
 * ## A importação tem duas fases, e é deliberado
 *
 * Ficheiro → linhas em espera → revisão → aplicação. Uma importação de milhares de linhas
 * que aplica directamente é impossível de rever e impossível de desfazer: quando alguém
 * percebe que a coluna do preço estava trocada com a do desconto, o estrago já está no
 * catálogo todo.
 */

export const EstadoImportacao = {
  EM_REVISAO: 'EM_REVISAO',
  APLICADA: 'APLICADA',
  REVERTIDA: 'REVERTIDA',
  CANCELADA: 'CANCELADA',
} as const;
export type EstadoImportacao = (typeof EstadoImportacao)[keyof typeof EstadoImportacao];

export const EstadoLinha = {
  MAPEADA: 'MAPEADA',
  POR_REVER: 'POR_REVER',
  ERRO: 'ERRO',
  APLICADA: 'APLICADA',
  IGNORADA: 'IGNORADA',
} as const;
export type EstadoLinha = (typeof EstadoLinha)[keyof typeof EstadoLinha];

export type MetodoMapeamento =
  | 'MANUAL'
  | 'GTIN'
  | 'REFERENCIA'
  | 'CODIGO_INTERNO'
  | 'DESCRICAO';

export const ROTULO_ESTADO_IMPORTACAO: Record<EstadoImportacao, string> = {
  EM_REVISAO: 'Em revisão',
  APLICADA: 'Aplicada',
  REVERTIDA: 'Revertida',
  CANCELADA: 'Cancelada',
};

export const ROTULO_ESTADO_LINHA: Record<EstadoLinha, string> = {
  MAPEADA: 'Pronta',
  POR_REVER: 'Por rever',
  ERRO: 'Erro',
  APLICADA: 'Aplicada',
  IGNORADA: 'Ignorada',
};

/** Quanta fé merece cada método. `DESCRICAO` nunca entra sozinho. */
export const ROTULO_METODO: Record<MetodoMapeamento, string> = {
  MANUAL: 'escolha humana',
  GTIN: 'código de barras',
  REFERENCIA: 'referência já mapeada',
  CODIGO_INTERNO: 'código interno',
  DESCRICAO: 'semelhança de descrição',
};

export interface LinhaImportacao {
  id: string;
  numeroLinha: number;
  referenciaFornecedor?: string | null;
  descricao?: string | null;
  gtin?: string | null;
  precoUnitario?: number | null;
  unidadeFornecedor?: string | null;
  factorConversao?: number | null;
  moq?: number | null;
  multiplo?: number | null;
  produtoId?: string | null;
  confianca?: number | null;
  metodo?: MetodoMapeamento | null;
  estado: EstadoLinha;
  /** Em português e pronta a mostrar. Diz porque é que a linha está neste estado. */
  mensagem?: string | null;
}

export interface Importacao {
  id: string;
  empresaId: string;
  fornecedorId: string;
  ficheiroNome?: string | null;
  estado: EstadoImportacao;
  totalLinhas: number;
  linhasMapeadas: number;
  linhasPorRever: number;
  linhasComErro: number;
  /** Que coluna do ficheiro foi lida como quê. Sem isto, um preço errado não tem causa. */
  mapaColunas?: Record<string, number> | null;
  criadaEm: string;
  aplicadaEm?: string | null;
  revertidaEm?: string | null;
  motivoReversao?: string | null;
  criadoPor?: { name: string };
  linhas?: LinhaImportacao[];
}

export interface PrecoFornecedor {
  id: string;
  preco: number;
  moeda: string;
  vigenteDe: string;
  vigenteAte?: string | null;
}

export interface Mapeamento {
  id: string;
  produtoId: string;
  referenciaFornecedor?: string | null;
  custoCompra: number;
  unidadeFornecedor?: string | null;
  /** Quantas unidades base entram numa unidade do fornecedor. Uma caixa de 6 tem 6. */
  factorConversao: number;
  gtin?: string | null;
  moq?: number | null;
  multiplo?: number | null;
  estadoMapeamento: string;
  metodoMapeamento: MetodoMapeamento;
  confianca?: number | null;
  produto?: { id: string; nome: string; sku?: string | null };
  precos?: PrecoFornecedor[];
}

export interface ResultadoAplicacao {
  mapeamentosCriados: number;
  mapeamentosActualizados: number;
  precosCriados: number;
  linhasAplicadas: number;
  linhasPorRever: number;
  aviso: string | null;
}

export const catalogoFornecedorApi = {
  /**
   * Lê o ficheiro e propõe as correspondências, sem tocar no catálogo.
   *
   * Código de barras igual e referência já mapeada entram como prontas; semelhança de
   * descrição fica sempre por rever, mesmo quando é forte — «Coca-Cola 2L» e «Coca-Cola
   * 1L» são o mesmo texto com um caracter de diferença e artigos diferentes.
   */
  importar: async (dto: {
    fornecedorId: string;
    conteudo: string;
    ficheiroNome?: string;
    mapaColunas?: Record<string, number>;
  }) => {
    const { data } = await api.post<Importacao>('/b2b/catalogo/importacoes', dto);
    return data;
  },

  listar: async (fornecedorId?: string) => {
    const { data } = await api.get<Importacao[]>('/b2b/catalogo/importacoes', {
      params: fornecedorId ? { fornecedorId } : undefined,
    });
    return data;
  },

  obter: async (id: string) => {
    const { data } = await api.get<Importacao>(`/b2b/catalogo/importacoes/${id}`);
    return data;
  },

  /** Escolhe o produto de uma linha, ou descarta-a. */
  decidirLinha: async (
    importacaoId: string,
    linhaId: string,
    dto: { produtoId?: string; ignorar?: boolean },
  ) => {
    const { data } = await api.patch<{ linhaId: string; estado: EstadoLinha }>(
      `/b2b/catalogo/importacoes/${importacaoId}/linhas/${linhaId}`,
      dto,
    );
    return data;
  },

  /**
   * Publica as linhas prontas.
   *
   * As que ficaram por rever **não** entram — entrar sem decisão é a aprovação silenciosa
   * que o §4.2 proíbe. Com `vigenteDe` no futuro, os preços ficam agendados.
   */
  aplicar: async (id: string, vigenteDe?: string) => {
    const { data } = await api.post<ResultadoAplicacao>(
      `/b2b/catalogo/importacoes/${id}/aplicar`,
      { vigenteDe },
    );
    return data;
  },

  /**
   * Desfaz uma importação aplicada.
   *
   * Apaga os preços que o lote criou e devolve aos que ele fechou a data de fim que
   * tinham. Os mapeamentos voltam ao retrato guardado antes de serem alterados.
   */
  reverter: async (id: string, motivo: string) => {
    const { data } = await api.post<{
      precosApagados: number;
      mapeamentosRestaurados: number;
      mapeamentosApagados: number;
    }>(`/b2b/catalogo/importacoes/${id}/reverter`, { motivo });
    return data;
  },

  mapeamentos: async (fornecedorId: string) => {
    const { data } = await api.get<Mapeamento[]>(
      `/b2b/catalogo/fornecedores/${fornecedorId}/mapeamentos`,
    );
    return data;
  },
};
