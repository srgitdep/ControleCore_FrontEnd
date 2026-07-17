import { api } from '@/api/axios';
import type { Empresa, OnboardingPayload, UpdateEmpresaPayload, EmpresaDetails } from '@/features/empresas';

export const getEmpresas = async (): Promise<Empresa[]> => {
  const { data } = await api.get<Empresa[]>('/empresas');
  return data;
};

export const getEmpresaDetails = async (id: string): Promise<EmpresaDetails> => {
  const { data } = await api.get<EmpresaDetails>(`/empresas/${id}`);
  return data;
};

// Criar empresa via onboarding completo (empresa + gestor + trial)
export const createEmpresa = async (payload: OnboardingPayload): Promise<{ message: string; empresaId: string }> => {
  const { data } = await api.post('/empresas/onboarding', payload);
  return data;
};

export const updateEmpresa = async (id: string, payload: UpdateEmpresaPayload): Promise<Empresa> => {
  const { data } = await api.patch<Empresa>(`/empresas/${id}`, payload);
  return data;
};

export const deleteEmpresa = async (id: string): Promise<void> => {
  await api.delete(`/empresas/${id}`);
};
