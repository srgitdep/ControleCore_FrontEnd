import { create } from 'zustand';
import { conta, registarQuedaDeSessao } from '../api/conta.api';
import type { ContaCliente } from '../api/conta.api';

/**
 * A sessão do cliente final no Compra Fácil.
 *
 * ## Porque não é o `useAuthStore`
 *
 * `useAuthStore` guarda um utilizador com `role` e `permissions` — lido pelo `Sidebar`,
 * pelo `ProtectedRoute` e pela Mayra do ControlCore. Um cliente final não tem `role` nem
 * `empresaId` do seu lado; tem um `Cliente` de CRM. Reaproveitar o store faria esse
 * código tentar avaliar permissões que não existem. Mesma razão de `usePortalStore`.
 *
 * ## `sessionStorage`, não `localStorage`
 *
 * A identidade guardada é só para o ecrã não piscar — a autenticação real é o cookie
 * `HttpOnly` `tokenCliente`, que o JavaScript não lê. `carregar()` confirma contra o
 * servidor a cada montagem do layout.
 */

const CHAVE = 'compraFacilConta';

interface EstadoConta {
  cliente: ContaCliente | null;
  autenticado: boolean;
  aCarregar: boolean;

  entrar: (lojaId: string, identificador: string, password: string) => Promise<void>;
  entrarComGoogle: (lojaId: string, credential: string) => Promise<void>;
  registar: (dados: {
    lojaId: string;
    nome: string;
    email: string;
    telefone?: string;
    password: string;
  }) => Promise<void>;
  sair: () => Promise<void>;
  carregar: () => Promise<void>;
  limpar: () => void;
}

export const useContaClienteStore = create<EstadoConta>((set, get) => ({
  cliente: null,
  autenticado: false,
  aCarregar: true,

  entrar: async (lojaId, identificador, password) => {
    const { cliente } = await conta.entrar({ lojaId, identificador, password });
    set({ cliente, autenticado: true, aCarregar: false });

    try {
      sessionStorage.setItem(CHAVE, JSON.stringify(cliente));
    } catch {
      /* Sem sessionStorage (privado/bloqueado): a sessão continua a funcionar pelo
         cookie, só o palpite optimista da próxima recarga é que se perde. */
    }
  },

  entrarComGoogle: async (lojaId, credential) => {
    const { cliente } = await conta.entrarComGoogle({ lojaId, credential });
    set({ cliente, autenticado: true, aCarregar: false });

    try {
      sessionStorage.setItem(CHAVE, JSON.stringify(cliente));
    } catch {
      /* ver a nota em `entrar` */
    }
  },

  registar: async (dados) => {
    await conta.registar(dados);
    // O registo não devolve cookie — entra-se logo a seguir, com as credenciais que
    // a pessoa acabou de escolher.
    await get().entrar(dados.lojaId, dados.email, dados.password);
  },

  sair: async () => {
    try {
      await conta.sair();
    } catch {
      // Ignora falhas de rede: o estado local é limpo de qualquer forma.
    } finally {
      get().limpar();
    }
  },

  carregar: async () => {
    try {
      const cliente = await conta.eu();

      try {
        sessionStorage.setItem(CHAVE, JSON.stringify(cliente));
      } catch {
        /* ver a nota em `entrar` */
      }

      set({ cliente, autenticado: true, aCarregar: false });
    } catch {
      // `/eu` falhou: sem cookie válido. Limpar evita que a UI se desenhe como se
      // houvesse sessão e cada acção seguinte falhe com 401.
      get().limpar();
    }
  },

  limpar: () => {
    try {
      sessionStorage.removeItem(CHAVE);
    } catch {
      /* ver a nota em `entrar` */
    }
    set({ cliente: null, autenticado: false, aCarregar: false });
  },
}));

function lerGuardado(): ContaCliente | null {
  try {
    const bruto = sessionStorage.getItem(CHAVE);
    return bruto ? (JSON.parse(bruto) as ContaCliente) : null;
  } catch {
    return null;
  }
}

const guardado = lerGuardado();
useContaClienteStore.setState({
  cliente: guardado,
  autenticado: !!guardado,
  aCarregar: false,
});

registarQuedaDeSessao(() => useContaClienteStore.getState().limpar());

export const useContaCliente = () => useContaClienteStore();
