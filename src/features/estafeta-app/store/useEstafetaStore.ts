import { create } from 'zustand';
import { aplicarIdiomaGuardado } from '@/i18n';
import { estafetaApi, registarQuedaDeSessaoDoEstafeta } from '../api/estafeta.api';
import type { UtilizadorEstafeta } from '../types/estafeta';

/**
 * A sessão do estafeta na sua aplicação.
 *
 * ## Porque não é o `useAuthStore`
 *
 * `useAuthStore` guarda um utilizador com `role` e `permissions`, lidos pelo `Sidebar`, pelo
 * `ProtectedRoute` e pela Mayra. Um estafeta não tem nenhum dos dois: é uma identidade própria da entrega
 * ao domicílio. Reaproveitar o store faria esse código avaliar permissões que não existem (mesma razão de
 * `useContaClienteStore` e `usePortalStore`).
 *
 * ## `sessionStorage`, não `localStorage`
 *
 * O que fica guardado é só a identidade, para o ecrã não piscar — a autenticação real é o cookie
 * `HttpOnly` `tokenEstafeta`, que o JavaScript não lê. `carregar()` confirma contra o servidor a cada
 * montagem do layout, e é isso que apanha um estafeta que entretanto foi desactivado.
 */

const CHAVE = 'estafetaApp';

interface EstadoEstafeta {
  utilizador: UtilizadorEstafeta | null;
  autenticado: boolean;
  aCarregar: boolean;

  /** Regista a sessão que o ecrã de entrada único (`POST /auth/entrar`) já abriu — o cookie veio nessa resposta. */
  entrarComSessao: (utilizador: UtilizadorEstafeta) => void;
  /** Confirma a sessão no servidor. Limpa se já não vale (cookie expirado, conta desactivada). */
  carregar: () => Promise<void>;
  sair: () => Promise<void>;
  /** Limpa o estado local sem chamar o servidor. Usado pelo interceptor de 401. */
  limpar: () => void;
}

function guardar(utilizador: UtilizadorEstafeta | null) {
  try {
    if (utilizador) sessionStorage.setItem(CHAVE, JSON.stringify(utilizador));
    else sessionStorage.removeItem(CHAVE);
  } catch {
    /* Sem sessionStorage (modo privado): a sessão continua pelo cookie; só o palpite da próxima recarga se perde. */
  }
}

function lerGuardado(): UtilizadorEstafeta | null {
  try {
    const bruto = sessionStorage.getItem(CHAVE);
    return bruto ? (JSON.parse(bruto) as UtilizadorEstafeta) : null;
  } catch {
    return null;
  }
}

export const useEstafetaStore = create<EstadoEstafeta>((set) => ({
  utilizador: null,
  autenticado: false,
  aCarregar: true,

  entrarComSessao: (utilizador) => {
    aplicarIdiomaGuardado(utilizador.idioma);
    guardar(utilizador);
    set({ utilizador, autenticado: true, aCarregar: false });
  },

  carregar: async () => {
    try {
      const perfil = await estafetaApi.eu();
      const utilizador: UtilizadorEstafeta = {
        estafetaId: lerGuardado()?.estafetaId ?? '',
        nome: perfil.nome,
        codigo: perfil.codigo,
        idioma: perfil.idioma,
      };
      aplicarIdiomaGuardado(perfil.idioma);
      guardar(utilizador);
      set({ utilizador, autenticado: true, aCarregar: false });
    } catch (erro) {
      // Sem ligação não é «sessão caída»: mantém o que está guardado em vez de deitar fora uma sessão
      // boa por o estafeta estar num túnel. Só um 401 (ou outra resposta do servidor) limpa.
      const semResposta = !(erro as { response?: unknown })?.response;
      const guardado = lerGuardado();
      if (semResposta && guardado) {
        set({ utilizador: guardado, autenticado: true, aCarregar: false });
        return;
      }
      guardar(null);
      set({ utilizador: null, autenticado: false, aCarregar: false });
    }
  },

  sair: async () => {
    try {
      await estafetaApi.sair();
    } catch {
      // Ignora falhas de rede: o estado local é limpo de qualquer forma.
    } finally {
      guardar(null);
      set({ utilizador: null, autenticado: false, aCarregar: false });
    }
  },

  limpar: () => {
    guardar(null);
    set({ utilizador: null, autenticado: false, aCarregar: false });
  },
}));

// A identidade guardada antes de o primeiro `carregar()` — só para o ecrã não piscar.
const guardado = lerGuardado();
useEstafetaStore.setState({ utilizador: guardado, autenticado: !!guardado, aCarregar: true });

registarQuedaDeSessaoDoEstafeta(() => useEstafetaStore.getState().limpar());
