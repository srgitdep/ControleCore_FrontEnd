import { create } from 'zustand';
import { portal, registarQuedaDeSessao } from '../api/portal.api';
import type { Conformidade, UtilizadorPortal } from '../api/portal.api';

/**
 * A sessão do fornecedor no portal.
 *
 * ## Porque não é o `useAuthStore`
 *
 * `useAuthStore` guarda um `AuthUser` com `role` e `permissions`, e é lido pelo `Sidebar`,
 * pelo `ProtectedRoute`, pelo `usePermissions` e pelo widget da Mayra. Um fornecedor não tem
 * nenhuma das duas coisas: tem uma organização.
 *
 * Reaproveitar o store faria o `Sidebar` do ControlCore tentar desenhar o menu de um
 * utilizador sem `role`, e o `usePermissions` avaliar permissões que não existem. É a mesma
 * razão pela qual o backend não pôs `UtilizadorFornecedor` na tabela `users`.
 *
 * ## `sessionStorage` e não `localStorage`
 *
 * O mesmo que o store do comprador faz, e pela mesma razão: a sessão morre com o separador.
 * O que está guardado aqui é só a identidade para o ecrã desenhar — a autenticação real é o
 * cookie `HttpOnly`, que o JavaScript não lê. Um `sessionStorage` limpo com o cookie válido
 * recupera-se com um `carregar()`; o contrário — identidade guardada sem cookie — é o que
 * `carregar()` detecta e limpa.
 */

const CHAVE = 'portalFornecedor';

interface EstadoPortal {
  fornecedor: UtilizadorPortal | null;
  conformidade: Conformidade | null;
  autenticado: boolean;
  aCarregar: boolean;

  /** `identificador` é o e-mail **ou** o código `F####` — o servidor reconhece qual. */
  entrar: (identificador: string, password: string) => Promise<void>;
  sair: () => Promise<void>;
  /** Relê a sessão e a conformidade do servidor. */
  carregar: () => Promise<void>;
  /** Limpa o estado local sem chamar o servidor. Usado pelo interceptor de 401. */
  limpar: () => void;
}

export const usePortalStore = create<EstadoPortal>((set, get) => ({
  fornecedor: null,
  conformidade: null,
  autenticado: false,
  aCarregar: true,

  entrar: async (identificador, password) => {
    const { utilizador } = await portal.entrar({ identificador, password });

    try {
      sessionStorage.setItem(CHAVE, JSON.stringify(utilizador));
    } catch {
      // Um separador em modo privado pode recusar a escrita. A sessão continua válida —
      // é o cookie que a carrega — e o utilizador apenas terá de esperar por um `carregar()`
      // depois de recarregar a página. Falhar o login por causa disto seria absurdo.
    }

    set({ fornecedor: utilizador, autenticado: true, aCarregar: false });

    // A conformidade é buscada a seguir, e não em paralelo: só faz sentido depois de haver
    // sessão. O `catch` silencioso é deliberado — entrar no portal não deve falhar porque o
    // painel de conformidade não carregou.
    try {
      const { conformidade } = await portal.eu();
      set({ conformidade });
    } catch {
      /* o painel mostra-se vazio e um `carregar()` posterior recupera */
    }
  },

  sair: async () => {
    try {
      await portal.sair();
    } catch {
      // Ignora falhas de rede: o estado local é limpo de qualquer forma, e o cookie expira.
    } finally {
      get().limpar();
    }
  },

  carregar: async () => {
    try {
      const { fornecedor, conformidade } = await portal.eu();

      const utilizador: UtilizadorPortal = {
        id: fornecedor.utilizadorId,
        nome: fornecedor.nome,
        email: fornecedor.email,
        principal: fornecedor.principal,
        organizacaoId: fornecedor.organizacaoId,
      };

      try {
        sessionStorage.setItem(CHAVE, JSON.stringify(utilizador));
      } catch {
        /* ver a nota em `entrar` */
      }

      set({ fornecedor: utilizador, conformidade, autenticado: true, aCarregar: false });
    } catch {
      // O `/eu` falhou: o cookie não existe ou expirou. Limpar é a resposta certa — deixar a
      // identidade guardada faria o ecrã desenhar-se como se houvesse sessão, e cada acção
      // seguinte falharia com 401.
      get().limpar();
    }
  },

  limpar: () => {
    try {
      sessionStorage.removeItem(CHAVE);
    } catch {
      /* ver a nota em `entrar` */
    }
    set({ fornecedor: null, conformidade: null, autenticado: false, aCarregar: false });
  },
}));

/**
 * Lê a identidade guardada, para o ecrã não piscar em cada recarga.
 *
 * É um palpite optimista: a identidade no `sessionStorage` sugere que há cookie, e `carregar()`
 * confirma-o contra o servidor. Se não houver, `limpar()` corrige — e o utilizador vê o ecrã
 * do portal por uma fracção de segundo antes de ir para o login, que é melhor do que ver um
 * ecrã de carregamento em cada navegação.
 */
function lerGuardado(): UtilizadorPortal | null {
  try {
    const bruto = sessionStorage.getItem(CHAVE);
    return bruto ? (JSON.parse(bruto) as UtilizadorPortal) : null;
  } catch {
    return null;
  }
}

const guardado = lerGuardado();
usePortalStore.setState({
  fornecedor: guardado,
  autenticado: !!guardado,
  aCarregar: false,
});

// O interceptor de 401 do portal limpa o estado, sem importar o store — evita o ciclo de
// importação que faria um dos dois módulos ficar `undefined` no arranque.
registarQuedaDeSessao(() => usePortalStore.getState().limpar());

export const usePortal = () => usePortalStore();
