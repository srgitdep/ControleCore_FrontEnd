import { Navigate, Outlet } from 'react-router-dom';
import toast from 'react-hot-toast';
import { useAuth } from '@/hooks/useAuth';
import type { Role } from '@/types/auth.types';

interface ProtectedRouteProps {
  roles?: Role[]; // Se definido, só estas roles podem aceder
}

export function ProtectedRoute({ roles }: ProtectedRouteProps) {
  const { isAuthenticated, isLoading, hasRole } = useAuth();

  // Enquanto o estado carrega do localStorage, mostra loading silencioso
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-950">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
          <p className="text-slate-400 text-sm">A carregar...</p>
        </div>
      </div>
    );
  }

  // Não autenticado → redireciona para login
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  // Autenticado mas sem a role necessária → toast + redireciona para dashboard
  if (roles && !hasRole(roles)) {
    toast.error('Sem permissão para aceder a esta página.', {
      id: 'sem-permissao',
      duration: 4000,
    });
    return <Navigate to="/" replace />;
  }

  return <Outlet />;
}
