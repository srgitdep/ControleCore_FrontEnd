import { api } from '@/shared/config';
import type {
  AdminDashboardResponse,
  CriarSuperAdminPayload,
  SuperAdminCriado,
  SuperAdminDashboardResponse,
  SuperAdminResumo,
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
