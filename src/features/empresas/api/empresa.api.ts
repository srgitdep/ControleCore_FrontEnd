import { api } from '@/shared/config';
import type {
  Empresa,
  OnboardingPayload,
  UpdateEmpresaPayload,
  EmpresaDetails,
  BrandingPayload,
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
 * Suspende ou reactiva uma empresa inteira.
 *
 * ## Suspender não é apagar
 *
 * `DELETE /empresas/:id` faz cascade e leva tudo: utilizadores, lojas, stock, vendas,
 * histórico. Suspender fecha o acesso e deixa os dados no lugar — que é o que se quer
 * quando uma assinatura caduca ou há uma disputa por resolver.
 *
 * O ecrã tinha o botão de apagar e não tinha o de suspender, pelo que a única resposta
 * disponível a «esta empresa deixou de pagar» era a irreversível.
 */
export const changeEmpresaStatus = async (
  id: string,
  action: 'ACTIVATE' | 'DEACTIVATE',
  reason?: string,
): Promise<Empresa> => {
  const { data } = await api.patch<Empresa>(`/empresas/${id}/status`, { action, reason });
  return data;
};

/**
 * A identidade visual da empresa: cores, tipografia, logótipos e tema.
 *
 * `EmpresaBranding` e `TemaBranding` estão no schema e o endpoint existe. Nenhum ecrã o
 * chamava — a palavra «branding» não aparecia no frontend —, pelo que a personalização
 * estava construída e inalcançável.
 */
export const updateBranding = async (
  id: string,
  payload: BrandingPayload,
): Promise<unknown> => {
  const { data } = await api.patch(`/empresas/${id}/branding`, payload);
  return data;
};
