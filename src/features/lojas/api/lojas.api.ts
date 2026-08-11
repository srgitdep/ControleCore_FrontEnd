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
