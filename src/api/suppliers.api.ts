import { api } from './axios';

export interface Supplier {
  id: string;
  nome: string;
  nuit?: string;
  email?: string;
  telefone?: string;
  isActive: boolean;
}

export const suppliersApi = {
  getSuppliers: async () => {
    const { data } = await api.get<Supplier[]>('/fornecedores');
    return data;
  }
};
