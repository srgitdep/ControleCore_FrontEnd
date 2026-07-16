import { create } from 'zustand';
import type { AuthUser, LoginPayload } from '@/types/auth.types';
import { loginApi, logoutApi } from '@/features/auth/api/auth.api';

// Tokens removidos do estado — são geridos exclusivamente pelo browser via HttpOnly cookies.
// persist removido — guardar tokens em localStorage seria a vulnerabilidade que estamos a eliminar.
// Apenas user + permissions ficam em memória (dados não-sensíveis, necessários para UI/RBAC).
interface AuthState {
  user: AuthUser | null;
  permissions: string[];

  login: (payload: LoginPayload) => Promise<void>;
  logout: () => Promise<void>;
  setPermissions: (permissions: string[]) => void;
}

export const useAuthStore = create<AuthState>()((set) => ({
  user: null,
  permissions: [],

  login: async (payload: LoginPayload) => {
    const data = await loginApi(payload);

    const userPermissions = (data.user as any).permissions ?? [];

    set({
      user: data.user,
      permissions: userPermissions,
    });
  },

  logout: async () => {
    try {
      // Backend apaga os cookies HttpOnly — o frontend não tem acesso para o fazer
      await logoutApi();
    } catch {
      // Ignora falhas de rede — o utilizador é redirecionado para login de qualquer forma
    } finally {
      set({ user: null, permissions: [] });
    }
  },

  setPermissions: (permissions: string[]) => {
    set({ permissions });
  },
}));
