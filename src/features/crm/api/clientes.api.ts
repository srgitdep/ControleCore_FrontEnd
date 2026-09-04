import { api } from '@/shared/config';

// ──â”€ Types ────────────────────────────────────────────────────────────────────

export interface Cliente {
  id: string;
  empresaId: string;
  nome: string;
  telefone?: string;
  email?: string;
  nuit?: string;
  pontos: number;
  consentimentoMarketing: boolean;
  totalGasto: number;
  dataUltimaCompra?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ClienteDetalhe extends Cliente {
  vendas: VendaResumida[];
}

export interface VendaResumida {
  id: string;
  numeroFatura: string;
  totalFinal: number;
  estado: 'CONCLUIDA' | 'CANCELADA';
  createdAt: string;
  itens: Array<{
    quantidade: number;
    precoUnitario: number;
    subtotal: number;
    produto: { nome: string };
  }>;
  pagamentos: Array<{ metodo: string; valorPago: number }>;
}

export interface PaginatedClientes {
  data: Cliente[];
  total: number;
  page: number;
  lastPage: number;
}

export interface CriarClienteDto {
  nome: string;
  telefone?: string;
  email?: string;
  nuit?: string;
}

// ──â”€ API Functions ────────────────────────────────────────────────────────────

export const listarClientes = async (params: {
  page?: number;
  limit?: number;
  search?: string;
}): Promise<PaginatedClientes> => {
  const { data } = await api.get('/clientes', { params });
  return data;
};

export const obterCliente = async (id: string): Promise<ClienteDetalhe> => {
  const { data } = await api.get(`/clientes/${id}`);
  return data;
};

/**
 * Todas as compras de um cliente.
 *
 * ## Porque não bastava a ficha
 *
 * `GET /clientes/:id` traz o cliente com as **dez** vendas mais recentes — é o que o
 * separador de detalhes mostra. Este endpoint traz o histórico inteiro, e não era chamado
 * por nada: um cliente com trinta compras aparecia com dez, sem nada no ecrã a dizer que
 * havia mais.
 *
 * A diferença importa numa conversa sobre fidelização ou sobre uma devolução antiga, que
 * são as duas razões para se abrir a ficha de um cliente.
 */
export const obterHistoricoCompras = async (id: string): Promise<VendaResumida[]> => {
  const { data } = await api.get<VendaResumida[]>(`/clientes/${id}/historico`);
  return data;
};

export const criarCliente = async (payload: CriarClienteDto): Promise<Cliente> => {
  const { data } = await api.post('/clientes', payload);
  return data;
};

export const atualizarCliente = async (
  id: string,
  payload: Partial<CriarClienteDto>,
): Promise<Cliente> => {
  const { data } = await api.patch(`/clientes/${id}`, payload);
  return data;
};

export const apagarCliente = async (id: string): Promise<void> => {
  await api.delete(`/clientes/${id}`);
};

export const buscarClientesCRM = async (search: string): Promise<Cliente[]> => {
  // Utilizado no POS para identificar cliente rapidamente — retorna até 5 resultados
  const { data } = await api.get('/clientes', { params: { search, limit: 5 } });
  return data.data;
};
