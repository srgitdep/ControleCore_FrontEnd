import { useAuth, usePermissions } from '@/features/auth';

/**
 * Quem pode alterar existências (ajustes, retificações): os mesmos perfis e a mesma permissão
 * `GERIR_STOCK` que o servidor exige. O servidor é quem decide — isto só evita mostrar um
 * botão que daria 403.
 */
export function usePodeGerirStock(): boolean {
  const { user } = useAuth();
  const { permissions } = usePermissions();
  return (
    user?.role === 'SUPER_ADMIN' ||
    user?.role === 'ADMIN' ||
    user?.role === 'MANAGER' ||
    (Array.isArray(permissions) &&
      permissions.some((p) => p === 'GERIR_STOCK' || p === 'manage:all' || p.includes('GERIR_STOCK')))
  );
}
