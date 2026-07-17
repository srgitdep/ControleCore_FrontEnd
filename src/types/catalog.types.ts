export interface Category {
  id: string;
  empresaId: string;
  nome: string;
  imagemUrl?: string; // Usado para os botÃµes do POS
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
  createdAt: string;
  updatedAt: string;
  
  categoria?: Category;
}
