import axios from 'axios';
import { api, enviarLinguaActiva } from '@/shared/config';

/**
 * A conta de cliente do Compra Fácil: instância própria, com cookie próprio.
 *
 * ═══════════════════════════════════════════════════════════════════════════════
 * NÃO USAR A INSTÂNCIA `api` PARTILHADA NAS ROTAS DA CONTA DE CLIENTE.
 * ═══════════════════════════════════════════════════════════════════════════════
 *
 * A instância `api` tenta renovar a sessão do ControlCore em cada 401 e, ao falhar,
 * atira para `/login` — o formulário de código de funcionário. Um cliente final não
 * tem código nenhum e nunca vai ter; acabaria diante de um ecrã onde não consegue
 * entrar, sem nada que lho explique. Mesma separação que `portal.api.ts` faz para o
 * fornecedor: cookie próprio (`tokenCliente`), segredo próprio no backend, instância
 * própria aqui.
 */
const contaApi = axios.create({
  baseURL: api.defaults.baseURL,
  withCredentials: true,
  headers: { 'Content-Type': 'application/json' },
});
enviarLinguaActiva(contaApi);

/** Injectado pelo store, para este ficheiro não depender dele (evita ciclo de import). */
let aoPerderSessao: (() => void) | null = null;

export function registarQuedaDeSessao(callback: () => void) {
  aoPerderSessao = callback;
}

contaApi.interceptors.response.use(
  (resposta) => resposta,
  (erro) => {
    const url: string = erro.config?.url ?? '';
    const eEntrada =
      url.includes('/commerce/conta/entrar') ||
      url.includes('/commerce/conta/registar') ||
      url.includes('/commerce/conta/google');

    if (erro.response?.status === 401 && !eEntrada) {
      aoPerderSessao?.();
    }

    return Promise.reject(erro);
  },
);

export interface ContaCliente {
  contaClienteId: string;
  clienteId: string;
  nome: string;
  email: string;
  telefone?: string | null;
  pontos?: number;
  /** NULL = nunca escolheu: a loja fica com a língua do browser. */
  idioma?: string | null;
}

const BASE = '/commerce/conta';

export const conta = {
  registar: async (payload: {
    lojaId: string;
    nome: string;
    email: string;
    telefone?: string;
    password: string;
  }) => {
    const { data } = await contaApi.post<{ contaClienteId: string; clienteId: string }>(
      `${BASE}/registar`,
      payload,
    );
    return data;
  },

  entrar: async (payload: { lojaId: string; identificador: string; password: string }) => {
    const { data } = await contaApi.post<{ cliente: ContaCliente }>(`${BASE}/entrar`, payload);
    return data;
  },

  entrarComGoogle: async (payload: { lojaId: string; credential: string }) => {
    const { data } = await contaApi.post<{ cliente: ContaCliente }>(`${BASE}/google`, payload);
    return data;
  },

  sair: async () => {
    await contaApi.post(`${BASE}/sair`);
  },

  eu: async () => {
    const { data } = await contaApi.get<ContaCliente>(`${BASE}/eu`);
    return data;
  },

  /**
   * A primeira compra nesta loja exige aceitar a partilha de dados? A conta é da pessoa e vale em
   * qualquer loja; a empresa de cada loja só fica a conhecê-la quando ela compra lá pela primeira vez.
   */
  partilha: async (lojaId: string) => {
    const { data } = await contaApi.get<{ necessaria: boolean; empresaNome: string }>(
      `${BASE}/partilha/${lojaId}`,
    );
    return data;
  },

  /** Grava a língua da loja e dos e-mails de pedido deste cliente. */
  definirIdioma: async (idioma: string) => {
    const { data } = await contaApi.patch<{ idioma: string }>(`${BASE}/eu/idioma`, { idioma });
    return data;
  },

  /** As lojas onde esta conta já comprou, de todas as empresas. */
  lojasCompradas: async () => {
    const { data } = await contaApi.get<{ lojaId: string; lojaNome: string }[]>(
      `${BASE}/lojas-compradas`,
    );
    return data;
  },
};

export { contaApi };
