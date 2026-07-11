import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import type { ReactNode } from 'react';
import toast from 'react-hot-toast';
import { loginApi, logoutApi } from '@/api/auth.api';
import { useQueryClient } from '@tanstack/react-query';
import type { AuthContextType, AuthUser, LoginPayload, Role } from '@/types/auth.types';

// ─── Chaves do localStorage ───────────────────────────────────────────────────
const LS_ACCESS  = 'accessToken';
const LS_REFRESH = 'refreshToken';
const LS_USER    = 'authUser';

// ─── Context ──────────────────────────────────────────────────────────────────
const AuthContext = createContext<AuthContextType | null>(null);

// ─── Provider ─────────────────────────────────────────────────────────────────
export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser]       = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const queryClient = useQueryClient();

  // Inicializa o estado a partir do localStorage (persistência entre sessões)
  useEffect(() => {
    try {
      const raw = localStorage.getItem(LS_USER);
      if (raw) setUser(JSON.parse(raw) as AuthUser);
    } catch {
      localStorage.removeItem(LS_USER);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // ─── Login ────────────────────────────────────────────────────────────────
  const login = useCallback(async (payload: LoginPayload) => {
    const data = await loginApi(payload);

    localStorage.setItem(LS_ACCESS,  data.accessToken);
    localStorage.setItem(LS_REFRESH, data.refreshToken);
    localStorage.setItem(LS_USER,    JSON.stringify(data.user));

    setUser(data.user);
  }, []);

  // ─── Logout ───────────────────────────────────────────────────────────────
  const logout = useCallback(async () => {
    try {
      await logoutApi(); // Invalida o token no Redis do backend
    } catch {
      // Ignora erros de rede no logout — limpa a sessão local de qualquer forma
    } finally {
      localStorage.removeItem(LS_ACCESS);
      localStorage.removeItem(LS_REFRESH);
      localStorage.removeItem(LS_USER);
      queryClient.clear();
      setUser(null);
    }
  }, []);

  // ─── Verificação de role ──────────────────────────────────────────────────
  const hasRole = useCallback(
    (roles: Role[]) => !!user && roles.includes(user.role),
    [user],
  );

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        isLoading,
        login,
        logout,
        hasRole,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

// ─── Hook ─────────────────────────────────────────────────────────────────────
export function useAuth(): AuthContextType {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth deve ser usado dentro de <AuthProvider>');
  return ctx;
}

// Re-exporta para uso em guards de permissão
export { toast };
