import type { ReactNode } from 'react';
import { usePermissions } from '@/hooks/usePermissions';

interface CanProps {
  action: string;
  resource: string;
  children: ReactNode;
  fallback?: ReactNode;
}

export function Can({ action, resource, children, fallback = null }: CanProps) {
  const { hasPermission } = usePermissions();

  if (hasPermission(action, resource)) {
    return <>{children}</>;
  }

  return <>{fallback}</>;
}
