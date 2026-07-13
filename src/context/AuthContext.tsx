import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import type { ReactNode } from 'react';
import toast from 'react-hot-toast';
import { loginApi, logoutApi } from '@/api/auth.api';
import { useQueryClient } from '@tanstack/react-query';
import type { AuthContextType, AuthUser, LoginPayload, Role } from '@/types/auth.types';

// ─── Context ──────────────────────────────────────────────────────────────────
const AuthContext = createContext<AuthContextType | null>(null);

// ─── Provider ─────────────────────────────────────────────────────────────────
export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser]           = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const queryClient = useQueryClient();

  // Inicialização: sem tokens no localStorage para verificar.
  // A sessão é válida se o accessToken cookie ainda for válido — o backend confirma isso.
  // O user é guardado em sessionStorage (não-sensível, perdido ao fechar o tab — comportamento esperado).
  useEffect(() => {
    try {
      const raw = sessionStorage.getItem('authUser');
      if (raw) setUser(JSON.parse(raw) as AuthUser);
    } catch {
      sessionStorage.removeItem('authUser');
    } finally {
      setIsLoading(false);
    }
  }, []);

  // ─── Login ────────────────────────────────────────────────────────────────
  const login = useCallback(async (payload: LoginPayload) => {
    // O backend define os cookies HttpOnly — o frontend apenas recebe os dados do utilizador
    const data = await loginApi(payload);

    // Guarda apenas dados de UI em sessionStorage (não-sensíveis, sem tokens)
    sessionStorage.setItem('authUser', JSON.stringify(data.user));
    setUser(data.user);
  }, []);

  // ─── Logout ───────────────────────────────────────────────────────────────
  const logout = useCallback(async () => {
    try {
      // Backend apaga os cookies HttpOnly — o frontend não tem acesso directo
      await logoutApi();
    } catch {
      // Ignora erros de rede — limpa a sessão local de qualquer forma
    } finally {
      sessionStorage.removeItem('authUser');
      queryClient.clear();
      setUser(null);
    }
  }, [queryClient]);

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
