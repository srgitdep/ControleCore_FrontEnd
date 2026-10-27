import { aplicarIdiomaGuardado, adoptarIdiomaSeNuncaEscolhido } from '@/i18n';
import { create } from 'zustand';
import type { AuthUser, LoginPayload, Role } from '../types';
import { logoutApi, loginApi, definirIdiomaApi } from '../api/auth.api';
import { queryClient } from '@/main';
import { useCopilotStore } from '../../ai-copilot/store/copilotStore';
import { papelEfectivo } from '../utils/papelEfectivo';

export { papelEfectivo };

interface AuthState {
  user: AuthUser | null;
  permissions: string[];
  isAuthenticated: boolean;
  isLoading: boolean;

  login: (payload: LoginPayload) => Promise<void>;
  /**
   * Regista uma sessão já obtida pelo ecrã de entrada único (`POST /auth/entrar`), sem
   * repetir o `POST /auth/login` — os cookies já vieram nessa resposta.
   */
  entrarComSessao: (user: AuthUser) => void;
  logout: () => Promise<void>;
  setPermissions: (permissions: string[]) => void;
  hasRole: (roles: Role[]) => boolean;
  initialize: () => void;

  /**
   * A sessão de suporte em que o Super Admin está (plano §4.15, S3), ou `null`. Não se guarda
   * no `sessionStorage`: a fonte é `GET /suporte/actual`, porque a sessão expira ou é fechada
   * no servidor sem o browser saber.
   */
  suporte: SessaoSuporteActiva | null;
  definirSuporte: (sessao: SessaoSuporteActiva | null) => void;
}

/** A empresa em que se está e o modo — o que a faixa do topo mostra. */
export interface SessaoSuporteActiva {
  sessaoId: string;
  empresa: { id: string; nome: string };
  escrita: boolean;
  iniciadaEm: string;
  expiraEm: string;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  permissions: [],
  isAuthenticated: false,
  isLoading: true,

  login: async (payload: LoginPayload) => {
    const data = await loginApi(payload);
    const userPermissions = (data.user as any).permissions ?? [];
    aplicarIdiomaGuardado(data.user.idioma);
    adoptarIdiomaSeNuncaEscolhido(data.user.idioma, definirIdiomaApi);

    sessionStorage.setItem('authUser', JSON.stringify(data.user));

    set({
      user: data.user,
      permissions: userPermissions,
      isAuthenticated: true,
    });
  },

  entrarComSessao: (user: AuthUser) => {
    const userPermissions = (user as any).permissions ?? [];
    aplicarIdiomaGuardado(user.idioma);
    adoptarIdiomaSeNuncaEscolhido(user.idioma, definirIdiomaApi);
    sessionStorage.setItem('authUser', JSON.stringify(user));
    set({ user, permissions: userPermissions, isAuthenticated: true });
  },

  logout: async () => {
    try {
      await logoutApi();
    } catch {
      // Ignora falhas de rede — o utilizador é redirecionado para login de qualquer forma
    } finally {
      sessionStorage.removeItem('authUser');
      queryClient.clear();
      useCopilotStore.getState().clearMessages();
      set({ user: null, permissions: [], isAuthenticated: false, suporte: null });
    }
  },

  setPermissions: (permissions: string[]) => {
    set({ permissions });
  },

  hasRole: (roles: Role[]) => {
    const { user, suporte } = get();
    const papel = papelEfectivo(user, suporte);
    return !!papel && roles.includes(papel);
  },

  suporte: null,
  definirSuporte: (sessao) => set({ suporte: sessao }),

  initialize: () => {
    try {
      const raw = sessionStorage.getItem('authUser');
      if (raw) {
        const parsedUser = JSON.parse(raw) as AuthUser;
        set({ user: parsedUser, isAuthenticated: true, permissions: parsedUser.permissions || [] });
      }
    } catch {
      sessionStorage.removeItem('authUser');
    } finally {
      set({ isLoading: false });
    }
  }
}));

// Initialize store immediately (runs once when module is imported)
useAuthStore.getState().initialize();

