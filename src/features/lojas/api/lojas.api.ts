import { api } from '@/shared/config';

export const getLojas = async () => {
  const { data } = await api.get('/lojas');
  return data;
};

export const getLojaById = async (id: string) => {
  const { data } = await api.get(`/lojas/${id}`);
  return data;
};

export const createLoja = async (loja: { nome: string; endereco?: string; cidade?: string; gestorId?: string }) => {
  const { data } = await api.post('/lojas', loja);
  return data;
};

export const updateLoja = async (id: string, loja: { nome?: string; endereco?: string; cidade?: string; gestorId?: string; isActive?: boolean }) => {
  const { data } = await api.patch(`/lojas/${id}`, loja);
  return data;
};

export const deleteLoja = async (id: string) => {
  const { data } = await api.delete(`/lojas/${id}`);
  return data;
};

// Armazéns (associados à Loja)
export const getArmazensByLoja = async (lojaId: string) => {
  const { data } = await api.get(`/armazens/loja/${lojaId}`);
  return data;
};

/** Uma posição de stock dentro de um armazém. */
export interface PosicaoDeArmazem {
  stockId: string;
  produtoId: string;
  nome: string;
  codigoBarras: string | null;
  sku: string | null;
  unidadeMedida: string;
  imagemUrl: string | null;
  quantidade: number;
  minimo: number;
  custoMedio: number;
  precoVenda: number;
  /** `quantidade × custoMedio` — o capital que este produto tem parado aqui. */
  valorImobilizado: number;
  abaixoDoMinimo: boolean;
}

export interface StockDeArmazem {
  armazem: { id: string; nome: string; tipo: string; isActive: boolean; lojaId: string };
  posicoes: PosicaoDeArmazem[];
  resumo: {
    totalProdutos: number;
    totalUnidades: number;
    valorImobilizado: number;
    abaixoDoMinimo: number;
  };
}

/**
 * O que está dentro de um armazém.
 *
 * `incluirSemSaldo` está desligado por omissão: criar um produto abre uma posição a
 * zero em **todos** os armazéns da empresa, pelo que sem o filtro um armazém de
 * quebras com três artigos apareceria com o catálogo inteiro.
 */
export const getStockDoArmazem = async (armazemId: string, incluirSemSaldo = false) => {
  const { data } = await api.get<StockDeArmazem>(`/armazens/${armazemId}/stock`, {
    params: incluirSemSaldo ? { incluirSemSaldo: 'true' } : undefined,
  });
  return data;
};

/** Tipos de armazém. Só pode existir um do tipo Venda (ponto de venda) por loja. */
export const TIPOS_ARMAZEM = ['Venda', 'Reserva', 'Quebras'] as const;
export type TipoArmazem = (typeof TIPOS_ARMAZEM)[number];

export interface Armazem {
  id: string;
  lojaId: string;
  nome: string;
  tipo: string;
  isActive: boolean;
}

export const createArmazem = async (armazem: {
  lojaId: string;
  nome: string;
  tipo: string;
  isActive?: boolean;
}) => {
  const { data } = await api.post<Armazem>('/armazens', armazem);
  return data;
};

export const updateArmazem = async (
  id: string,
  armazem: { nome?: string; tipo?: string; isActive?: boolean },
) => {
  const { data } = await api.patch<Armazem>(`/armazens/${id}`, armazem);
  return data;
};

// Desactivação lógica: o armazém deixa de aceitar recepções, mas o histórico
// de stock e movimentos subsiste.
export const deleteArmazem = async (id: string) => {
  const { data } = await api.delete(`/armazens/${id}`);
  return data;
};
