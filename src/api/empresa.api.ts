import { api } from './axios';
import type { Empresa, OnboardingPayload, UpdateEmpresaPayload, EmpresaDetails } from '@/types/empresa.types';

export const getEmpresas = async (): Promise<Empresa[]> => {
  const { data } = await api.get<Empresa[]>('/empresa/todas');
  return data;
};

export const getEmpresaDetails = async (id: string): Promise<EmpresaDetails> => {
  const { data } = await api.get<EmpresaDetails>(`/empresa/${id}/detalhes`);
  return data;
};

// Criar empresa via onboarding completo (empresa + gestor + trial)
export const createEmpresa = async (payload: OnboardingPayload): Promise<{ message: string; empresaId: string }> => {
  const { data } = await api.post('/empresa/onboarding', payload);
  return data;
};

export const updateEmpresa = async (id: string, payload: UpdateEmpresaPayload): Promise<Empresa> => {
  const { data } = await api.put<Empresa>(`/empresa/${id}`, payload);
  return data;
};

export const deleteEmpresa = async (id: string): Promise<void> => {
  await api.delete(`/empresa/${id}`);
};
