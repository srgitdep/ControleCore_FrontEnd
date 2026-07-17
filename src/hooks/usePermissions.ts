import { useCallback } from 'react';
import { useAuthStore } from '@/features/auth';
import { useAuth } from '@/features/auth';

export function usePermissions() {
  const storePermissions = useAuthStore((state) => state.permissions);
  const { user } = useAuth(); // Integra com a sessÃ£o ativa atual

  const hasPermission = useCallback(
    (action: string, resource: string): boolean => {
      // 1. O SUPER_ADMIN tem acesso absoluto a tudo, ignorando a tabela de permissÃµes.
      if (user?.role === 'SUPER_ADMIN') return true;

      // 2. Busca as permissÃµes do utilizador (seja do novo AuthUser.permissions ou da Store)
      const permissions = user?.permissions || storePermissions;

      if (!permissions || permissions.length === 0) return false;

      // 3. Se tiver a permissÃ£o global manage:all
      if (permissions.includes('manage:all')) return true;

      // 4. Se tiver a permissÃ£o exata para a aÃ§Ã£o e recurso
      const requiredPermission = `${action}:${resource}`;
      if (permissions.includes(requiredPermission)) return true;

      // 5. Se tiver permissÃ£o "manage" no recurso, geralmente implica poder fazer "read", "create", etc.
      const manageResourcePermission = `manage:${resource}`;
      if (action !== 'manage' && permissions.includes(manageResourcePermission)) {
        return true; 
      }

      return false;
    },
    [user, storePermissions]
  );

  return { hasPermission, permissions: user?.permissions || storePermissions };
}
