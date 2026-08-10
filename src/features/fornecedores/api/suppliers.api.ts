import { api } from '@/shared/config';

export interface Supplier {
  id: string;
  nome: string;
  nuit?: string;
  tipoFornecimento?: string;
  email?: string;
  telefone?: string;
  endereco?: string;
  website?: string;
  isActive: boolean;
}

export type SupplierPayload = Omit<Supplier, 'id' | 'isActive'> & { isActive?: boolean };

export const suppliersApi = {
  getSuppliers: async () => {
    const { data } = await api.get<Supplier[]>('/fornecedores');
    return data;
  },

  getSupplierById: async (id: string) => {
    const { data } = await api.get<Supplier>(`/fornecedores/${id}`);
    return data;
  },

  createSupplier: async (payload: SupplierPayload) => {
    const { data } = await api.post<Supplier>('/fornecedores', payload);
    return data;
  },

  updateSupplier: async (id: string, payload: Partial<SupplierPayload>) => {
    const { data } = await api.patch<Supplier>(`/fornecedores/${id}`, payload);
    return data;
  },

  // Apaga o registo de facto (não é desactivação lógica). Para suspender um
  // fornecedor sem perder o histórico, use updateSupplier com isActive: false.
  deleteSupplier: async (id: string) => {
    const { data } = await api.delete(`/fornecedores/${id}`);
    return data;
  },
};
