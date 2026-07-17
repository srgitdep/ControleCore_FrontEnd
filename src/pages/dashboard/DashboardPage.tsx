import { useAuth } from '@/features/auth';
import { SuperAdminDashboard } from './components/SuperAdminDashboard';
import { AdminDashboard } from './components/AdminDashboard';

export function DashboardPage() {
  const { user } = useAuth();

  // O componente SuperAdminDashboard sÃ³ serÃ¡ mostrado se a role for SUPER_ADMIN
  if (user?.role === 'SUPER_ADMIN') {
    return (
      <div className="max-w-7xl mx-auto space-y-6">
        <SuperAdminDashboard />
      </div>
    );
  }

  // Caso contrÃ¡rio, mostra o AdminDashboard (acessÃ­vel para ADMIN e MANAGER)
  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <AdminDashboard />
    </div>
  );
}
