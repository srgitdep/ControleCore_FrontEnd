import axios from 'axios';
import { api } from '@/shared/config';

/**
 * Os pedidos de adesão: a porta pela qual um comprador se torna cliente.
 *
 * ## Duas instâncias, porque são dois tipos de chamada
 *
 * A submissão é **pública** — quem a faz não tem conta, e é o ponto. Usa uma instância sem
 * interceptores, pela razão que `mercado.api.ts` explica: a `api` partilhada tenta renovar a
 * sessão em cada 401 e atira para `/login` ao falhar, e mandar um visitante anónimo para um
 * formulário de login por causa de um erro de rede é o pior fim possível para a página que
 * existe para o atrair.
 *
 * A fila e as decisões são de um SUPER_ADMIN autenticado, e usam a `api` normal — com
 * cookies, renovação de sessão, e o redireccionamento para `/login` que nesse contexto é
 * exactamente o comportamento certo.
 */
const publicoApi = axios.create({
  baseURL: api.defaults.baseURL,
  withCredentials: false,
  headers: { 'Content-Type': 'application/json' },
});

export const EstadoPedidoAdesao = {
  PENDENTE: 'PENDENTE',
  APROVADO: 'APROVADO',
  RECUSADO: 'RECUSADO',
} as const;

export type EstadoPedidoAdesao =
  (typeof EstadoPedidoAdesao)[keyof typeof EstadoPedidoAdesao];

export interface SubmeterAdesao {
  empresaNome: string;
  empresaNuit: string;
  empresaEmail: string;
  empresaTelefone?: string;
  cidade?: string;
  gestorNome: string;
  gestorEmail: string;
  gestorTelefone?: string;
  gestorCargo?: string;
  observacoes?: string;
}

export interface AdesaoSubmetida {
  /** Os primeiros oito caracteres do id, em maiúsculas. O que o requerente pode citar. */
  referencia: string;
  proximosPassos: string[];
}

export interface PedidoAdesao {
  id: string;
  estado: EstadoPedidoAdesao;
  empresaNome: string;
  empresaNuit: string;
  empresaEmail: string;
  empresaTelefone: string | null;
  cidade: string | null;
  gestorNome: string;
  gestorEmail: string;
  gestorTelefone: string | null;
  gestorCargo: string | null;
  observacoes: string | null;
  motivoDecisao: string | null;
  decididoEm: string | null;
  createdAt: string;
  decididoPor: { id: string; name: string } | null;
  /** Preenchido só depois da aprovação: a empresa que a aprovação criou. */
  empresa: { id: string; nome: string } | null;
}

export const adesoes = {
  /** Público. Cria o pedido pendente e envia a confirmação por e-mail. */
  submeter: async (payload: SubmeterAdesao) => {
    const { data } = await publicoApi.post<AdesaoSubmetida>('/adesoes', payload);
    return data;
  },

  listar: async (estado?: EstadoPedidoAdesao) => {
    const { data } = await api.get<PedidoAdesao[]>('/adesoes', {
      params: estado ? { estado } : undefined,
    });
    return data;
  },

  contarPendentes: async () => {
    const { data } = await api.get<{ pendentes: number }>('/adesoes/pendentes/contagem');
    return data.pendentes;
  },

  /**
   * Aprovar ou recusar.
   *
   * Aprovar cria a Empresa, o utilizador ADMIN e a assinatura, e envia o código de acesso
   * com a senha por e-mail. Recusar envia o motivo. **Nenhuma das duas se desfaz** — e é por
   * isso que o ecrã pede confirmação antes de chamar.
   */
  decidir: async (
    id: string,
    payload: { decisao: 'APROVAR' | 'RECUSAR'; motivo?: string; modulos?: string[] },
  ) => {
    const { data } = await api.patch<{
      empresaId: string | null;
      mensagem: string;
      pedido: PedidoAdesao;
    }>(`/adesoes/${id}/decidir`, payload);
    return data;
  },
};
