import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { AuthUser, LoginPayload } from '@/types/auth.types';
import { loginApi, logoutApi } from '@/api/auth.api';

interface AuthState {
  user: AuthUser | null;
  accessToken: string | null;
  refreshToken: string | null;
  permissions: string[];
  
  // Ações
  login: (payload: LoginPayload) => Promise<void>;
  logout: () => Promise<void>;
  setPermissions: (permissions: string[]) => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      accessToken: null,
      refreshToken: null,
      permissions: [],

      login: async (payload: LoginPayload) => {
        const data = await loginApi(payload);
        
        // Assumimos que data.user possa trazer permissions. 
        // Se a API for modificada para devolver 'permissions' no LoginResponse, 
        // ajustamos aqui. Por agora, se vier em user.permissions, guardamos.
        const userPermissions = (data.user as any).permissions || [];

        set({
          user: data.user,
          accessToken: data.accessToken,
          refreshToken: data.refreshToken,
          permissions: userPermissions,
        });
      },

      logout: async () => {
        try {
          await logoutApi();
        } catch {
          // Ignora falhas de rede no logout
        } finally {
          set({
            user: null,
            accessToken: null,
            refreshToken: null,
            permissions: [],
          });
        }
      },

      setPermissions: (permissions: string[]) => {
        set({ permissions });
      },
    }),
    {
      name: 'auth-storage', // chave no localStorage
    }
  )
);
