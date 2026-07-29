// Export API
export * from './api/auth.api';

// Export Types
export * from './types';

// Export Store/Context
import { useAuthStore } from './store/useAuthStore';
import toast from 'react-hot-toast';

export * from './store/useAuthStore';
export const useAuth = () => useAuthStore();
export { toast };

// Export Pages
export * from './pages/LoginPage';
export * from './pages/ForgotPasswordPage';
export * from './pages/ResetPasswordPage';

// Export Authorization Hook & Component
export * from './hooks/usePermissions';
export * from './components/Can';
