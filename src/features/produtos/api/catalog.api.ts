import { api } from '@/shared/config';
import type { Product, Category } from '@/features/produtos';

/**
 * Os campos que se conseguem ler de uma fotografia de produto.
 *
 * Todos opcionais, e é o ponto: o servidor devolve **só** o que passou a validação. Um
 * campo ausente significa que a IA não o leu, ou leu mal — nos dois casos fica em branco
 * para a pessoa preencher, em vez de entrar no catálogo com um valor que ninguém viu.
 *
 * Não há preços aqui de propósito. Uma fotografia não sabe quanto custou o produto.
 */
export interface DadosExtraidosDeFoto {
  nome?: string;
  marca?: string;
  codigoBarras?: string;
  peso?: number;
  unidadeMedida?: string;
  descricao?: string;
  /** Já casada com as categorias da empresa; ausente se nenhuma correspondeu. */
  categoriaId?: string;
  categoriaSugerida?: string;
}

export interface RespostaExtracaoFoto {
  dados: DadosExtraidosDeFoto;
  /** O que a IA leu mas foi recusado, com a razão — para a UI poder explicar. */
  recusados: { campo: string; valor: string; motivo: string }[];
  imagensAnalisadas: number;
  /** `true` quando nenhuma fotografia deu resultado aproveitável. */
  semResultado: boolean;
}

/**
 * O que se envia ao criar um produto.
 *
 * Explícito em vez de `Partial<Product>` porque a criação aceita três campos que o
 * produto não tem: o armazém onde dar entrada e as quantidades iniciais. Vivem no
 * `Stock`, não no `Produto`.
 *
 * O `ValidationPipe` do backend corre com `forbidNonWhitelisted`, pelo que um campo a
 * mais faz o pedido falhar inteiro. Tipar aqui apanha isso na compilação em vez de em
 * produção — o hook usava `data: any` e deixava passar qualquer coisa.
 */
export interface CreateProductPayload extends Partial<Product> {
  /** Armazém onde dar entrada do stock inicial. Exige os dois campos seguintes. */
  armazemId?: string;
  quantidadeInicial?: number;
  /** Ponto de reposição neste armazém. Zero significa «sem mínimo definido». */
  stockMinimo?: number;
}

/**
 * Um fornecedor ligado a um produto: a referência com que ele o chama, e a que preço.
 *
 * ## O que este mapeamento resolve
 *
 * O mesmo arroz é `ARZ-25KG` num fornecedor e `1042` noutro. Sem esta ligação, quem
 * encomenda tem de traduzir de cabeça, e a sugestão de compras não sabe a quem comprar
 * nem a quanto — é daqui que sai o `fornecedorSugerido` de cada linha.
 */
export interface FornecedorDoProduto {
  id: string;
  produtoId: string;
  fornecedorId: string;
  /** O SKU do fornecedor. Nulo quando ninguém o registou. */
  referenciaFornecedor: string | null;
  custoCompra: number;
  createdAt: string;
  updatedAt: string;
  fornecedor?: { nome: string };
  criadoPor?: { name: string } | null;
  atualizadoPor?: { name: string } | null;
}

/** O produto como o detalhe o devolve: com categoria e fornecedores ligados. */
export interface ProductDetail extends Product {
  fornecedores?: FornecedorDoProduto[];
}

export const catalogApi = {
  getCategories: async () => {
    const { data } = await api.get<Category[]>('/categorias');
    return data;
  },

  createCategory: async (payload: { nome: string; descricao?: string; imagemUrl?: string }) => {
    const { data } = await api.post<Category>('/categorias', payload);
    return data;
  },

  updateCategory: async (
    id: string,
    payload: { nome?: string; descricao?: string; imagemUrl?: string; isActive?: boolean },
  ) => {
    const { data } = await api.patch<Category>(`/categorias/${id}`, payload);
    return data;
  },

  deleteCategory: async (id: string) => {
    const { data } = await api.delete(`/categorias/${id}`);
    return data;
  },

  /**
   * Um produto com o que a listagem não traz: a categoria completa e os fornecedores.
   *
   * A listagem devolve os produtos em página, sem os fornecedores — mandá-los para todos
   * carregaria o catálogo inteiro para mostrar uma linha de cada. Quem precisa da ficha
   * pede a ficha.
   */
  getProduct: async (id: string) => {
    const { data } = await api.get<ProductDetail>(`/produtos/${id}`);
    return data;
  },

  // ─── Fornecedores do produto ───────────────────────────────────────────────

  addSupplierToProduct: async (
    produtoId: string,
    payload: { fornecedorId: string; referenciaFornecedor?: string; custoCompra: number },
  ) => {
    const { data } = await api.post(`/produtos/${produtoId}/fornecedores`, payload);
    return data;
  },

  updateSupplierOfProduct: async (
    produtoId: string,
    fornecedorId: string,
    payload: { referenciaFornecedor?: string; custoCompra: number },
  ) => {
    // O backend recebe o DTO completo, `fornecedorId` incluído: é o mesmo DTO da criação.
    const { data } = await api.put(`/produtos/${produtoId}/fornecedores/${fornecedorId}`, {
      fornecedorId,
      ...payload,
    });
    return data;
  },

  removeSupplierFromProduct: async (produtoId: string, fornecedorId: string) => {
    const { data } = await api.delete(`/produtos/${produtoId}/fornecedores/${fornecedorId}`);
    return data;
  },

  getProducts: async (params?: { search?: string; categoryId?: string; page?: number; limit?: number }) => {
    // O backend aceita search=, que mapeia para nome, SKU e código de barras.
    //
    // A resposta vem como `{ data, meta: { total, page, limit, totalPages } }`, mas o
    // tipo declarado aqui dizia `{ data, total }` — pelo que `total` era sempre
    // `undefined` e a paginação da listagem ficava presa em "página 1 de 1", com o
    // botão "Próxima" permanentemente desactivado. Normaliza-se aqui, que é onde o
    // contrato com o backend pertence, em vez de cada ecrã ir buscar a `meta`.
    const { data } = await api.get<{
      data: Product[];
      meta?: { total: number; page: number; limit: number; totalPages: number };
      total?: number;
    }>('/produtos', { params });

    return {
      data: data.data,
      total: data.meta?.total ?? data.total ?? 0,
      totalPages: data.meta?.totalPages ?? 1,
    };
  },

  /**
   * Lê os dados de um produto a partir de fotografias da embalagem.
   *
   * Não grava nada: devolve o que a IA conseguiu ler, já validado no servidor, para
   * preencher o formulário. Aceita várias imagens porque a informação está repartida pela
   * embalagem — o nome na frente, o código de barras na face de trás.
   *
   * `FormData` e não JSON: são ficheiros binários, e convertê-los para base64 no cliente
   * aumentaria o corpo do pedido em cerca de um terço sem ganho nenhum.
   */
  extrairDeFoto: async (imagens: File[]): Promise<RespostaExtracaoFoto> => {
    const form = new FormData();
    for (const img of imagens) form.append('imagens', img);

    const { data } = await api.post<RespostaExtracaoFoto>('/produtos/extrair-de-foto', form, {
      // O `Content-Type` fica ao browser: ele acrescenta o `boundary` que o multipart
      // exige, e defini-lo à mão sem o `boundary` faz o servidor recusar o corpo.
      headers: { 'Content-Type': undefined as unknown as string },
      // A leitura de quatro imagens por um modelo de visão passa dos 10 s por defeito do
      // axios; o pedido era cancelado antes de a resposta chegar.
      timeout: 90_000,
    });

    return data;
  },

  /**
   * Um produto pelo código de barras exacto.
   *
   * ## Porque não procurar na lista já carregada
   *
   * O POS tem uma lista de produtos em memória, mas está filtrada pela pesquisa e
   * limitada a 50 linhas — é a grelha que o operador vê. Procurar aí falha sempre que o
   * produto lido não estiver nessa fatia: com uma pesquisa activa, ou num catálogo com
   * mais de 50 produtos, um código válido dava «produto não encontrado».
   *
   * O `search` do backend compara com nome, SKU **e** código de barras, mas por
   * `contains` — pelo que devolve também produtos cujo código apenas *contém* o lido.
   * A igualdade exacta é verificada aqui, porque um código lido é um código completo, e
   * acrescentar ao carrinho o produto errado é pior do que não encontrar nenhum.
   */
  getProductByBarcode: async (codigo: string): Promise<Product | null> => {
    const { data } = await api.get<{ data: Product[] }>('/produtos', {
      params: { search: codigo, limit: 10 },
    });

    const candidatos = data.data ?? [];
    return (
      candidatos.find((p) => p.codigoBarras === codigo) ??
      candidatos.find((p) => p.sku === codigo) ??
      null
    );
  },

  updateProduct: async (id: string, productData: Partial<Product>) => {
    const { data } = await api.patch<Product>(`/produtos/${id}`, productData);
    return data;
  },

  createProduct: async (productData: CreateProductPayload) => {
    const { data } = await api.post<Product>('/produtos', productData);
    return data;
  },

  deleteProduct: async (id: string) => {
    const { data } = await api.delete(`/produtos/${id}`);
    return data;
  }
};
