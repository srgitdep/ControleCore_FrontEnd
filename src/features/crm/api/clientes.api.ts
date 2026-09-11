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

// ──── Segmentação ─────────────────────────────────────────────────────────────

export type DimensaoSegmento =
  | 'RECORRENCIA'
  | 'VALOR'
  | 'CANAL'
  | 'PRODUTO'
  | 'LOCALIZACAO'
  | 'MANUAL';

export interface Segmento {
  id: string;
  nome: string;
  descricao?: string | null;
  dimensao: DimensaoSegmento;
  tipo: 'AUTOMATICO' | 'MANUAL';
  chave?: string | null;
  total: number;
  ultimoCalculo?: string | null;
}

export interface SegmentoDoCliente {
  segmentId: string;
  nome: string;
  dimensao: DimensaoSegmento;
  chave?: string | null;
  desde: string;
  justificacao?: Record<string, unknown> | null;
}

export interface MembroSegmento {
  id: string;
  nome: string;
  telefone?: string | null;
  email?: string | null;
  totalGasto: number;
  dataUltimaCompra?: string | null;
  desde: string;
  justificacao?: Record<string, unknown> | null;
}

export interface MembrosSegmento {
  segmento: { id: string; nome: string; dimensao: DimensaoSegmento };
  data: MembroSegmento[];
  total: number;
  page: number;
  lastPage: number;
}

export interface Audiencia {
  id: string;
  nome: string;
  total: number;
  createdAt: string;
  segment?: { nome: string; dimensao: DimensaoSegmento } | null;
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
  segmentos: SegmentoDoCliente[];
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

/**
 * Regista o cliente com identidades e consentimentos numa só chamada.
 *
 * Usado no balcão: em três chamadas separadas, uma falha a meio deixaria o
 * cliente sem consentimento e ninguém a saber.
 */
export const registarClienteNoBalcao = async (payload: {
  nome: string;
  telefone?: string;
  email?: string;
  nuit?: string;
  canaisConsentidos?: CanalComunicacao[];
}): Promise<Cliente> => {
  const { data } = await api.post('/crm/identidade/clientes', payload);
  return data;
};

// ──── Segmentação ─────────────────────────────────────────────────────────────

export const listarSegmentos = async (dimensao?: DimensaoSegmento): Promise<Segmento[]> => {
  const { data } = await api.get('/crm/segmentos', { params: dimensao ? { dimensao } : {} });
  return data;
};

export const listarMembrosSegmento = async (
  segmentId: string,
  params: { page?: number; limit?: number } = {},
): Promise<MembrosSegmento> => {
  const { data } = await api.get(`/crm/segmentos/${segmentId}/membros`, { params });
  return data;
};

export const recalcularSegmentos = async (): Promise<{
  clientes: number;
  entradas: number;
  saidas: number;
  segmentos: number;
}> => {
  const { data } = await api.post('/crm/segmentos/recalcular');
  return data;
};

export const listarAudiencias = async (): Promise<Audiencia[]> => {
  const { data } = await api.get('/crm/segmentos/audiencias');
  return data;
};

export const criarAudiencia = async (payload: {
  segmentId: string;
  nome: string;
}): Promise<Audiencia> => {
  const { data } = await api.post('/crm/segmentos/audiencias', payload);
  return data;
};
