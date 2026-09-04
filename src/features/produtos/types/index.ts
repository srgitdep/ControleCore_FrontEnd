export interface Category {
  id: string;
  empresaId: string;
  nome: string;
  descricao?: string | null;
  imagemUrl?: string; // Usado para os botões do POS
  /**
   * Uma categoria desactivada sai das escolhas novas sem desaparecer dos produtos que já
   * a usam. O campo existia na tabela e faltava aqui, pelo que a listagem não distinguia
   * uma categoria em uso de uma retirada.
   */
  isActive?: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Product {
  id: string;
  empresaId: string;
  categoriaId?: string;
  nome: string;
  descricao?: string;
  codigoBarras?: string;
  sku?: string;
  imagemUrl?: string;
  precoCusto: number;
  precoVenda: number;
  margemLucro: number;
  taxaIva: number;
  unidadeMedida: string;
  peso?: number;
  isWeighable: boolean;
  isActive: boolean;

  /**
   * Controlo de lote e validade.
   *
   * `temValidade` torna a data obrigatória na entrada de mercadoria deste produto — é o que
   * garante que existem dados para vigiar. `diasAvisoValidade` é `null` quando o produto não
   * define nada, e então usa-se a omissão do domínio (45 dias): o prazo útil de um iogurte
   * não é o de uma conserva, por isso é por produto e não uma constante global.
   *
   * Opcionais no tipo porque respostas de endpoints antigos podem não os trazer.
   */
  temValidade?: boolean;
  rastreavelPorLote?: boolean;
  diasAvisoValidade?: number | null;

  createdAt: string;
  updatedAt: string;
  
  categoria?: Category;

  /** Saldos por armazém, devolvidos na listagem para o POS aferir disponibilidade. */
  stocks?: ProductStock[];
}

export interface ProductStock {
  armazemId: string;
  currentQuantity: number;
  armazem?: {
    tipo: string;
    isActive: boolean;
  };
}
