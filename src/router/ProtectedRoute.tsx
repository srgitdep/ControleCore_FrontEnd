import { Navigate, Outlet } from 'react-router-dom';
import toast from 'react-hot-toast';
import { useAuth, usePermissions } from '@/features/auth';
import type { Role } from '@/features/auth';
import { useEstadoSubscricao } from '@/features/plataforma';
import type { CodigoModulo } from '@/features/plataforma';

interface ProtectedRouteProps {
  roles?: Role[]; // Se definido, só estas roles podem aceder
  requiredPermission?: string;
  requiredModule?: CodigoModulo;
}

export function ProtectedRoute({
  roles,
  requiredPermission,
  requiredModule,
}: ProtectedRouteProps) {
  const { isAuthenticated, isLoading, hasRole } = useAuth();
  const permissions = usePermissions();
  const subscricao = useEstadoSubscricao(isAuthenticated && Boolean(requiredModule));

  const isAuthInitialized = !isLoading;

  // Enquanto o estado carrega do localStorage ou da API, mostra loading silencioso
  if (
    !isAuthInitialized ||
    (requiredPermission && permissions.isLoading) ||
    (requiredModule && subscricao.isLoading)
  ) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-950">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
          <p className="text-slate-400 text-sm">A carregar...</p>
        </div>
      </div>
    );
  }

  // Não autenticado â†’ redireciona para login
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  // Autenticado mas sem a role necessária â†’ toast + redireciona para dashboard
  if (roles && !hasRole(roles)) {
    toast.error('Sem permissão para aceder a esta página.', {
      id: 'sem-permissao-role',
      duration: 4000,
    });
    return <Navigate to="/" replace />;
  }

  if (requiredModule && !subscricao.data?.modulos.includes(requiredModule)) {
    toast.error('Este módulo não está incluído na subscrição.', {
      id: 'modulo-nao-contratado',
      duration: 4000,
    });
    return <Navigate to="/subscricao" replace />;
  }

  if (requiredPermission && !permissions.hasPermission(requiredPermission)) {
    toast.error('Não tem permissão para essa acção.', {
      id: 'sem-permissao-action',
      duration: 4000,
    });
    return <Navigate to="/" replace />;
  }

  return <Outlet />;
}

