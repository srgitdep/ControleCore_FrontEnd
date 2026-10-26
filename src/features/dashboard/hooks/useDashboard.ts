import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  criarSuperAdmin,
  getAdminDashboard,
  getSuperAdminDashboard,
  getSuperAdmins,
  alterarEstadoSuperAdmin,
  reporMfaSuperAdmin,
  reporSenhaSuperAdmin,
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

/**
 * As três acções sobre a conta de outro Super Admin. Todas refrescam a lista: o estado e o
 * MFA de cada linha vêm dela.
 */
export function useGerirSuperAdmin() {
  const queryClient = useQueryClient();
  const refrescar = () => queryClient.invalidateQueries({ queryKey: ['super-admins'] });
  return {
    alterarEstado: useMutation({
      mutationFn: (v: { id: string; activo: boolean; motivo: string }) =>
        alterarEstadoSuperAdmin(v.id, v.activo, v.motivo),
      onSuccess: refrescar,
    }),
    reporSenha: useMutation({ mutationFn: reporSenhaSuperAdmin, onSuccess: refrescar }),
    reporMfa: useMutation({ mutationFn: reporMfaSuperAdmin, onSuccess: refrescar }),
  };
}
