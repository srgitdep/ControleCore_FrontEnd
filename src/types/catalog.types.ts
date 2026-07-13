export interface Category {
  id: string;
  empresaId: string;
  nome: string;
  imagemUrl?: string; // Usado para os botões do POS
  createdAt: string;
  updatedAt: string;
}

export interface Product {
  id: string;
  empresaId: string;
  categoryId: string;
  nome: string;
  codigoBarras?: string; // Usado pelo event listener
  imagemUrl?: string; // Imagem do produto no POS
  unidadeMedida?: string;
  precoVenda: number;
  createdAt: string;
  updatedAt: string;
  
  // Relacionamento quando incluído
  category?: Category;
}
