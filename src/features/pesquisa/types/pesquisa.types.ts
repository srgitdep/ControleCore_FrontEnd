/** A pesquisa global do cabeçalho — DT01 §7.1. */

export type TipoResultadoPesquisa = 'PRODUTO' | 'FORNECEDOR' | 'REQUISICAO' | 'SOURCING' | 'ORDEM_COMPRA';

export interface ResultadoPesquisa {
  tipo: TipoResultadoPesquisa;
  id: string;
  titulo: string;
  subtitulo: string | null;
}

export interface ResultadosPesquisaGlobal {
  produtos: ResultadoPesquisa[];
  fornecedores: ResultadoPesquisa[];
  requisicoes: ResultadoPesquisa[];
  sourcing: ResultadoPesquisa[];
  ordensCompra: ResultadoPesquisa[];
  total: number;
}

/**
 * Para onde cada tipo de resultado navega ao ser seleccionado.
 *
 * Só a rota da secção — nenhuma das páginas de destino lê um parâmetro de id na URL
 * para abrir automaticamente um item específico (confirmado em `StockListPage` e
 * `PurchasesPage`, que só leem `tab`). Prometer que abre o registo exacto seria
 * enganoso; abre-se a secção certa, e a pesquisa local de cada ecrã faz o resto.
 */
export const ROTA_POR_TIPO: Record<TipoResultadoPesquisa, string> = {
  PRODUTO: '/stock',
  FORNECEDOR: '/compras?tab=fornecedores',
  REQUISICAO: '/requisicoes',
  SOURCING: '/requisicoes',
  ORDEM_COMPRA: '/compras',
};

export const LABEL_POR_TIPO: Record<TipoResultadoPesquisa, string> = {
  PRODUTO: 'Produto',
  FORNECEDOR: 'Fornecedor',
  REQUISICAO: 'Requisição',
  SOURCING: 'RFQ',
  ORDEM_COMPRA: 'Ordem de Compra',
};
