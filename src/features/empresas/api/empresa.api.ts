import { api } from '@/shared/config';
import type {
  Empresa,
  OnboardingPayload,
  UpdateEmpresaPayload,
  EmpresaDetails,
  UpdateBrandingPayload,
} from '@/features/empresas';

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

/**
 * Actualiza a identidade visual da empresa (cores, tipografia, logótipo, tema).
 *
 * O backend faz um `upsert` sobre o registo de branding: a primeira personalização de uma
 * empresa cria o registo com os valores por omissão do schema para os campos não
 * enviados; as seguintes actualizam-no.
 */
export const updateBranding = async (id: string, payload: UpdateBrandingPayload): Promise<Empresa> => {
  const { data } = await api.patch<Empresa>(`/empresas/${id}/branding`, payload);
  return data;
};
