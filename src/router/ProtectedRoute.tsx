import { Navigate, Outlet } from 'react-router-dom';
import toast from 'react-hot-toast';
import { useAuth } from '@/features/auth';
import { usePermissions } from '@/hooks/usePermissions';
import type { Role } from '@/features/auth';

interface ProtectedRouteProps {
  roles?: Role[]; // Se definido, sÃ³ estas roles podem aceder
  requiredPermission?: string; // Se definido, sÃ³ utilizadores com a permissÃ£o (action:resource) podem aceder
}

export function ProtectedRoute({ roles, requiredPermission }: ProtectedRouteProps) {
  const { isAuthenticated, isLoading, hasRole } = useAuth();
  const { hasPermission } = usePermissions();

  const isAuthInitialized = !isLoading;

  // Enquanto o estado carrega do localStorage ou da API, mostra loading silencioso
  if (!isAuthInitialized) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-950">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
          <p className="text-slate-400 text-sm">A carregar...</p>
        </div>
      </div>
    );
  }

  // NÃ£o autenticado â†’ redireciona para login
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  // Autenticado mas sem a role necessÃ¡ria â†’ toast + redireciona para dashboard
  if (roles && !hasRole(roles)) {
    toast.error('Sem permissÃ£o para aceder a esta pÃ¡gina.', {
      id: 'sem-permissao-role',
      duration: 4000,
    });
    return <Navigate to="/" replace />;
  }

  // ValidaÃ§Ã£o de PermissÃ£o estrita (RBAC - action:resource)
  if (requiredPermission) {
    const [action, resource] = requiredPermission.split(':');
    if (action && resource && !hasPermission(action, resource)) {
      toast.error('NÃ£o tem permissÃ£o para essa aÃ§Ã£o.', {
        id: 'sem-permissao-action',
        duration: 4000,
      });
      return <Navigate to="/" replace />;
    }
  }

  return <Outlet />;
}

