import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  criarSuperAdmin,
  getAdminDashboard,
  getSuperAdminDashboard,
  getSuperAdmins,
} from '../api/dashboard.api';

export function useAdminDashboard() {
  return useQuery({
    queryKey: ['dashboard', 'admin'],
    queryFn: getAdminDashboard,
    refetchInterval: 60000, // Refresh every minute
  });
}

export function useSuperAdminDashboard() {
  return useQuery({
    queryKey: ['dashboard', 'superadmin'],
    queryFn: getSuperAdminDashboard,
    refetchInterval: 120000, // Refresh every 2 minutes
  });
}

export function useSuperAdmins() {
  return useQuery({
    queryKey: ['super-admins'],
    queryFn: getSuperAdmins,
  });
}

export function useCriarSuperAdmin() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: criarSuperAdmin,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['super-admins'] });
      // O KPI de utilizadores do painel conta esta conta nova.
      queryClient.invalidateQueries({ queryKey: ['dashboard', 'superadmin'] });
    },
  });
}
