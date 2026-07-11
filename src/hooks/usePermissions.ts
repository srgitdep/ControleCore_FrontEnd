import { useCallback } from 'react';
import { useAuthStore } from '@/store/useAuthStore';
import { useAuth } from '@/hooks/useAuth';

export function usePermissions() {
  const storePermissions = useAuthStore((state) => state.permissions);
  const { user } = useAuth(); // Integra com a sessão ativa atual

  const hasPermission = useCallback(
    (action: string, resource: string): boolean => {
      // 1. O SUPER_ADMIN tem acesso absoluto a tudo, ignorando a tabela de permissões.
      if (user?.role === 'SUPER_ADMIN') return true;

      // 2. Busca as permissões do utilizador (seja do novo AuthUser.permissions ou da Store)
      const permissions = user?.permissions || storePermissions;

      if (!permissions || permissions.length === 0) return false;

      // 3. Se tiver a permissão global manage:all
      if (permissions.includes('manage:all')) return true;

      // 4. Se tiver a permissão exata para a ação e recurso
      const requiredPermission = `${action}:${resource}`;
      if (permissions.includes(requiredPermission)) return true;

      // 5. Se tiver permissão "manage" no recurso, geralmente implica poder fazer "read", "create", etc.
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
