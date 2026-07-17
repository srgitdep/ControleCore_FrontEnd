import { api } from './axios';

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
  const { data } = await api.put(`/lojas/${id}`, loja);
  return data;
};

export const deleteLoja = async (id: string) => {
  const { data } = await api.delete(`/lojas/${id}`);
  return data;
};

// ArmazÃ©ns (associados Ã  Loja)
export const getArmazensByLoja = async (lojaId: string) => {
  const { data } = await api.get(`/lojas/${lojaId}/armazens`);
  return data;
};

export const createArmazem = async (armazem: { lojaId: string; nome: string; tipo: string }) => {
  const { data } = await api.post('/armazens', armazem);
  return data;
};

export const deleteArmazem = async (id: string) => {
  const { data } = await api.delete(`/armazens/${id}`);
  return data;
};
