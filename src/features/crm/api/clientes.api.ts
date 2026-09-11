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

// ──── Visão 360° ──────────────────────────────────────────────────────────────

export type EstadoRelacionamento =
  | 'NOVO'
  | 'ACTIVO'
  | 'EM_RISCO'
  | 'INACTIVO'
  | 'SEM_COMPRAS';

export type TipoIdentidade =
  | 'TELEFONE'
  | 'EMAIL'
  | 'NUIT'
  | 'CARTAO_FIDELIZACAO'
  | 'WHATSAPP'
  | 'ECOMMERCE';

export type CanalComunicacao = 'SMS' | 'EMAIL' | 'WHATSAPP' | 'CHAMADA' | 'PUSH';

export type FinalidadeConsentimento =
  | 'MARKETING'
  | 'TRANSACIONAL'
  | 'COBRANCA'
  | 'INQUERITO';

export interface EventoCliente {
  id: string;
  tipo: string;
  canal: string;
  ocorridoEm: string;
  valor?: number | null;
  produtoId?: string | null;
  vendaId?: string | null;
}

export interface Visao360 {
  cliente: {
    id: string;
    nome: string;
    telefone?: string | null;
    email?: string | null;
    nuit?: string | null;
    pontos: number;
    clienteDesde: string;
    creditoBloqueado: boolean;
    creditLimit: number;
    fundidoEmId?: string | null;
  };
  identidades: Array<{
    id: string;
    tipo: TipoIdentidade;
    valor: string;
    principal: boolean;
    verificadoEm?: string | null;
  }>;
  consentimentos: Array<{
    finalidade: FinalidadeConsentimento;
    canal: CanalComunicacao;
    concedidoEm: string;
  }>;
  preferencias: Record<string, string>;
  comportamento: {
    totalCompras: number;
    ticketMedio: number;
    valorTotal: number;
    diasDesdeUltimaCompra: number | null;
    frequenciaMediaDias: number | null;
    primeiraCompra: string | null;
    ultimaCompra: string | null;
    canalPredominante: string | null;
    comprasPorCanal: Record<string, number>;
    lojaPreferida: string | null;
    lojaPreferidaNome: string | null;
    totalDevolucoes: number;
    taxaDevolucao: number;
    estado: EstadoRelacionamento;
  };
  produtosRecorrentes: Array<{ produtoId: string; nome: string; vezes: number }>;
  financeiro: {
    valorEmAberto: number;
    titulosEmAberto: number;
    valorLiquidado: number;
  };
  ultimasVendas: VendaResumida[];
  eventosRecentes: EventoCliente[];
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

export const obterVisao360 = async (id: string): Promise<Visao360> => {
  const { data } = await api.get(`/crm/clientes/${id}/360`);
  return data;
};

export const registarConsentimento = async (
  clienteId: string,
  payload: {
    finalidade: FinalidadeConsentimento;
    canal: CanalComunicacao;
    concedido: boolean;
    origem?: string;
  },
): Promise<void> => {
  await api.post(`/crm/identidade/clientes/${clienteId}/consentimentos`, payload);
};

export const adicionarIdentidade = async (
  clienteId: string,
  payload: { tipo: TipoIdentidade; valor: string; principal?: boolean; origem?: string },
): Promise<void> => {
  await api.post(`/crm/identidade/clientes/${clienteId}/identidades`, payload);
};

export const removerIdentidade = async (identidadeId: string): Promise<void> => {
  await api.delete(`/crm/identidade/identidades/${identidadeId}`);
};
