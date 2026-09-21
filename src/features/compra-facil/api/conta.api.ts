import axios from 'axios';
import { api } from '@/shared/config';

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

/** Injectado pelo store, para este ficheiro não depender dele (evita ciclo de import). */
let aoPerderSessao: (() => void) | null = null;

export function registarQuedaDeSessao(callback: () => void) {
  aoPerderSessao = callback;
}

contaApi.interceptors.response.use(
  (resposta) => resposta,
  (erro) => {
    const url: string = erro.config?.url ?? '';
    const eEntrada = url.includes('/commerce/conta/entrar') || url.includes('/commerce/conta/registar');

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

  sair: async () => {
    await contaApi.post(`${BASE}/sair`);
  },

  eu: async () => {
    const { data } = await contaApi.get<ContaCliente>(`${BASE}/eu`);
    return data;
  },
};

export { contaApi };
