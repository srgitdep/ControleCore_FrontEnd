import { api } from '@/api/axios';
import type { AdminDashboardResponse, SuperAdminDashboardResponse } from '@/features/dashboard';

export const getAdminDashboard = async (): Promise<AdminDashboardResponse> => {
  const { data } = await api.get<AdminDashboardResponse>('/relatorios/dashboard/hoje');
  return data;
};

export const getSuperAdminDashboard = async (): Promise<SuperAdminDashboardResponse> => {
  const { data } = await api.get<SuperAdminDashboardResponse>('/relatorios/dashboard/sistema');
  return data;
};
