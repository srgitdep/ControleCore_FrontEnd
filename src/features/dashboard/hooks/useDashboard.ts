import { useQuery } from '@tanstack/react-query';
import { getAdminDashboard, getSuperAdminDashboard } from '../api/dashboard.api';

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
