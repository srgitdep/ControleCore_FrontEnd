// Export API
export * from './api/auth.api';

// Export Types
export * from './types';

// Export Store/Context
import { useAuthStore, papelEfectivo } from './store/useAuthStore';
import type { Role } from './types';
import toast from 'react-hot-toast';

export * from './store/useAuthStore';

/**
 * O estado de autenticação, com o `user.role` **efectivo**: em modo suporte, `ADMIN` (ver
 * `papelEfectivo`). Quem precisar do papel verdadeiro — só o próprio modo suporte — lê
 * `useAuthStore` directamente.
 */
export const useAuth = () => {
  const estado = useAuthStore();
  const papel = papelEfectivo(estado.user, estado.suporte);
  if (!estado.user || papel === estado.user.role) return estado;
  return { ...estado, user: { ...estado.user, role: papel as Role } };
};
export { toast };

// Export Pages
export * from './pages/LoginPage';
export * from './pages/ForgotPasswordPage';
export * from './pages/ResetPasswordPage';

// Export Authorization Hook & Component
export * from './hooks/usePermissions';
export * from './components/Can';
