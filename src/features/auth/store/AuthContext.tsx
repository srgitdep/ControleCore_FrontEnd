import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import type { ReactNode } from 'react';
import toast from 'react-hot-toast';
import { loginApi, logoutApi } from '../api/auth.api';
import { useQueryClient } from '@tanstack/react-query';
import type { AuthContextType, AuthUser, LoginPayload, Role } from '../types';

// â”€â”€â”€ Context â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
const AuthContext = createContext<AuthContextType | null>(null);

// â”€â”€â”€ Provider â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser]           = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const queryClient = useQueryClient();

  // InicializaÃ§Ã£o: sem tokens no localStorage para verificar.
  // A sessÃ£o Ã© vÃ¡lida se o accessToken cookie ainda for vÃ¡lido â€” o backend confirma isso.
  // O user Ã© guardado em sessionStorage (nÃ£o-sensÃ­vel, perdido ao fechar o tab â€” comportamento esperado).
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

  // â”€â”€â”€ Login â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  const login = useCallback(async (payload: LoginPayload) => {
    // O backend define os cookies HttpOnly â€” o frontend apenas recebe os dados do utilizador
    const data = await loginApi(payload);

    // Guarda apenas dados de UI em sessionStorage (nÃ£o-sensÃ­veis, sem tokens)
    sessionStorage.setItem('authUser', JSON.stringify(data.user));
    setUser(data.user);
  }, []);

  // â”€â”€â”€ Logout â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  const logout = useCallback(async () => {
    try {
      // Backend apaga os cookies HttpOnly â€” o frontend nÃ£o tem acesso directo
      await logoutApi();
    } catch {
      // Ignora erros de rede â€” limpa a sessÃ£o local de qualquer forma
    } finally {
      sessionStorage.removeItem('authUser');
      queryClient.clear();
      setUser(null);
    }
  }, [queryClient]);

  // â”€â”€â”€ VerificaÃ§Ã£o de role â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
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

// â”€â”€â”€ Hook â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
export function useAuth(): AuthContextType {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth deve ser usado dentro de <AuthProvider>');
  return ctx;
}

// Re-exporta para uso em guards de permissÃ£o
export { toast };
