import { api } from '@/shared/config';

/**
 * Requisições de compra e escalões de aprovação (§43–45, §86–87).
 *
 * O ciclo de compras começava na ordem ao fornecedor. Quem precisava de mercadoria ou tinha
 * acesso para criar a ordem — e decidia sozinho o que a empresa compra — ou pedia por WhatsApp,
 * e a decisão ficava sem rasto.
 */

export type EstadoRequisicao =
  | 'RASCUNHO'
  | 'SUBMETIDA'
  | 'APROVADA'
  | 'REJEITADA'
  | 'CONVERTIDA'
  | 'CANCELADA';

export type PrioridadeRequisicao = 'BAIXA' | 'NORMAL' | 'ALTA' | 'URGENTE';

export interface ItemRequisicao {
  id: string;
  produtoId: string;
  quantidade: number;
  custoEstimado: number;
  observacoes: string | null;
  produto?: { nome: string; unidadeMedida: string } | null;
  unidade?: { codigo: string } | null;
}

export interface Escalao {
  id: string;
  nome: string;
  valorMinimo: number;
  valorMaximo: number | null;
  perfilId: string;
  isActive?: boolean;
  perfil?: { id: string; nome: string };
}

export interface Requisicao {
  id: string;
  numero: string;
  estado: EstadoRequisicao;
  prioridade: PrioridadeRequisicao;
  departamento: string | null;
  motivo: string | null;
  valorEstimado: number;
  submetidaEm: string | null;
  aprovadaEm: string | null;
  motivoDecisao: string | null;
  pedidoCompraId: string | null;
  createdAt: string;
  solicitante?: { id: string; name: string } | null;
  aprovadaPor?: { id: string; name: string } | null;
  armazem?: { id: string; nome: string } | null;

  /**
   * As linhas **só vêm no detalhe**.
   *
   * A listagem devolve `_count` em vez delas: mandar as linhas de todas as requisições para
   * mostrar um número seria carregar o ecrã inteiro para o descartar. O tipo diz isso, para
   * o compilador recusar quem as ler na lista — que foi como este defeito passou.
   */
  itens?: ItemRequisicao[];
  _count?: { itens: number };

  /**
   * A quem esta requisição vai, pelo valor. Nulo quando não há escalões configurados.
   *
   * Calculado no detalhe. Ausente na listagem.
   */
  escalaoAplicavel?: Escalao | null;
}

/**
 * Quantas linhas tem, venha ela da listagem ou do detalhe.
 *
 * As duas respostas dizem a mesma coisa de maneiras diferentes, e cada ecrã que resolvesse
 * isso à sua maneira acabaria por escolher a errada uma vez.
 */
export function numeroDeLinhas(r: Requisicao): number {
  return r._count?.itens ?? r.itens?.length ?? 0;
}

export interface TabelaDeEscaloes {
  escaloes: Escalao[];
  /** Buracos e sobreposições. Vazio é uma tabela coerente. */
  problemas: string[];
}

export const requisicoesApi = {
  listar: async (filtros?: { estado?: EstadoRequisicao; solicitanteId?: string }) => {
    const { data } = await api.get<Requisicao[]>('/requisicoes', { params: filtros });
    return data;
  },

  obter: async (id: string) => {
    const { data } = await api.get<Requisicao>(`/requisicoes/${id}`);
    return data;
  },

  criar: async (payload: {
    departamento?: string;
    armazemId?: string;
    prioridade?: PrioridadeRequisicao;
    motivo?: string;
    itens: { produtoId: string; quantidade: number; custoEstimado?: number }[];
  }) => {
    const { data } = await api.post<Requisicao>('/requisicoes', payload);
    return data;
  },

  submeter: async (id: string) => {
    const { data } = await api.post(`/requisicoes/${id}/submeter`);
    return data;
  },

  aprovar: async (id: string) => {
    const { data } = await api.post(`/requisicoes/${id}/aprovar`);
    return data;
  },

  rejeitar: async (id: string, motivo: string) => {
    const { data } = await api.post(`/requisicoes/${id}/rejeitar`, { motivo });
    return data;
  },

  cancelar: async (id: string, motivo: string) => {
    const { data } = await api.post(`/requisicoes/${id}/cancelar`, { motivo });
    return data;
  },

  converter: async (id: string, fornecedorId: string, dataPrevista?: string) => {
    const { data } = await api.post(`/requisicoes/${id}/converter`, {
      fornecedorId,
      dataPrevista,
    });
    return data;
  },

  escaloes: async () => {
    const { data } = await api.get<TabelaDeEscaloes>('/requisicoes/escaloes');
    return data;
  },

  definirEscaloes: async (escaloes: Omit<Escalao, 'id' | 'perfil'>[]) => {
    const { data } = await api.put<TabelaDeEscaloes>('/requisicoes/escaloes', escaloes);
    return data;
  },
};

export const ROTULO_ESTADO_REQUISICAO: Record<EstadoRequisicao, string> = {
  RASCUNHO: 'Rascunho',
  SUBMETIDA: 'À espera de decisão',
  APROVADA: 'Aprovada',
  REJEITADA: 'Rejeitada',
  CONVERTIDA: 'Convertida em ordem',
  CANCELADA: 'Cancelada',
};

export const COR_ESTADO_REQUISICAO: Record<EstadoRequisicao, string> = {
  RASCUNHO: 'bg-slate-100 text-slate-600',
  SUBMETIDA: 'bg-amber-100 text-amber-700',
  APROVADA: 'bg-emerald-100 text-emerald-700',
  REJEITADA: 'bg-red-100 text-red-700',
  CONVERTIDA: 'bg-slate-800 text-white',
  CANCELADA: 'bg-slate-100 text-slate-400',
};

export const COR_PRIORIDADE: Record<PrioridadeRequisicao, string> = {
  BAIXA: 'text-slate-400',
  NORMAL: 'text-slate-500',
  ALTA: 'text-amber-600',
  URGENTE: 'text-red-600 font-semibold',
};
