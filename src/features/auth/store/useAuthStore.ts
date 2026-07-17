import { create } from 'zustand';
import type { AuthUser, LoginPayload } from '../types';
import { loginApi, logoutApi } from '../api/auth.api';

// Tokens removidos do estado â€” sÃ£o geridos exclusivamente pelo browser via HttpOnly cookies.
// persist removido â€” guardar tokens em localStorage seria a vulnerabilidade que estamos a eliminar.
// Apenas user + permissions ficam em memÃ³ria (dados nÃ£o-sensÃ­veis, necessÃ¡rios para UI/RBAC).
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
      // Backend apaga os cookies HttpOnly â€” o frontend nÃ£o tem acesso para o fazer
      await logoutApi();
    } catch {
      // Ignora falhas de rede â€” o utilizador Ã© redirecionado para login de qualquer forma
    } finally {
      set({ user: null, permissions: [] });
    }
  },

  setPermissions: (permissions: string[]) => {
    set({ permissions });
  },
}));
