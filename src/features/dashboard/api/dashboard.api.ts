import { api } from '@/shared/config';
import type {
  AdminDashboardResponse,
  CriarSuperAdminPayload,
  SuperAdminCriado,
  SuperAdminDashboardResponse,
  SuperAdminResumo,
  SenhaSuperAdminReposta,
} from '@/features/dashboard';

export const getAdminDashboard = async (): Promise<AdminDashboardResponse> => {
  const { data } = await api.get<AdminDashboardResponse>('/relatorios/dashboard/hoje');
  return data;
};

export const getSuperAdminDashboard = async (): Promise<SuperAdminDashboardResponse> => {
  const { data } = await api.get<SuperAdminDashboardResponse>('/relatorios/dashboard/sistema');
  return data;
};

export const getSuperAdmins = async (): Promise<SuperAdminResumo[]> => {
  const { data } = await api.get<SuperAdminResumo[]>('/super-admins');
  return data;
};

export const criarSuperAdmin = async (payload: CriarSuperAdminPayload): Promise<SuperAdminCriado> => {
  const { data } = await api.post<SuperAdminCriado>('/super-admins', payload);
  return data;
};

export const alterarEstadoSuperAdmin = async (id: string, activo: boolean, motivo: string) => {
  const { data } = await api.patch<{ id: string; isActive: boolean }>(`/super-admins/${id}/estado`, {
    activo,
    motivo,
  });
  return data;
};

export const reporSenhaSuperAdmin = async (id: string): Promise<SenhaSuperAdminReposta> => {
  const { data } = await api.post<SenhaSuperAdminReposta>(`/super-admins/${id}/repor-senha`);
  return data;
};

export const reporMfaSuperAdmin = async (id: string) => {
  const { data } = await api.post<{ id: string; mfaActivo: false }>(`/super-admins/${id}/repor-mfa`);
  return data;
};
