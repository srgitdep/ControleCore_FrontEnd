import { api } from '@/shared/config';

/**
 * Facturas de fornecedor, conferência tripla, tolerâncias e Centro de Excepções.
 *
 * ## Porque é que a factura vive em Compras e não no Financeiro
 *
 * Uma factura só se torna obrigação de pagamento **depois** de passar a conferência. Antes
 * disso é um documento em análise — pode ser rejeitada, disputada ou devolvida ao
 * fornecedor sem nunca gerar obrigação nenhuma. O Financeiro só a vê quando a conferência
 * a liberta, e nunca vê uma em disputa.
 */

export const EstadoFactura = {
  RECEBIDA: 'RECEBIDA',
  CONFORME: 'CONFORME',
  COM_DIVERGENCIA: 'COM_DIVERGENCIA',
  APROVADA_PARA_PAGAMENTO: 'APROVADA_PARA_PAGAMENTO',
  REJEITADA: 'REJEITADA',
} as const;
export type EstadoFactura = (typeof EstadoFactura)[keyof typeof EstadoFactura];

export const EstadoExcepcao = {
  ABERTA: 'ABERTA',
  ATRIBUIDA: 'ATRIBUIDA',
  EM_ANALISE: 'EM_ANALISE',
  AGUARDA_FORNECEDOR: 'AGUARDA_FORNECEDOR',
  RESOLVIDA: 'RESOLVIDA',
  DISPENSADA: 'DISPENSADA',
  REJEITADA: 'REJEITADA',
  ESCALADA: 'ESCALADA',
  ENCERRADA: 'ENCERRADA',
} as const;
export type EstadoExcepcao = (typeof EstadoExcepcao)[keyof typeof EstadoExcepcao];

export type TipoExcepcao =
  | 'PRECO'
  | 'QUANTIDADE'
  | 'IMPOSTO'
  | 'FRETE'
  | 'RECEPCAO_EM_FALTA'
  | 'FACTURA_DUPLICADA'
  | 'ASN_VERSUS_RECEPCAO'
  | 'TOTAL_INCONSISTENTE'
  | 'PRODUTO_NAO_ENCOMENDADO';

export type EscopoTolerancia = 'EMPRESA' | 'CATEGORIA' | 'FORNECEDOR' | 'PRODUTO';
export type DimensaoTolerancia = 'PRECO' | 'QUANTIDADE' | 'IMPOSTO' | 'FRETE' | 'TOTAL';

export interface LinhaFactura {
  id: string;
  itemId?: string | null;
  produtoId?: string | null;
  descricao: string;
  quantidade: number;
  precoUnitario: number;
  taxaIva: number;
  desconto: number;
}

export interface Conferencia {
  id: string;
  tipo: 'TRIPLA' | 'QUADRUPLA';
  resultado: 'CONFORME' | 'COM_DIVERGENCIA';
  /** Quanto passou e pode seguir para pagamento. */
  valorConforme: number;
  /** Quanto ficou em disputa. Esta parcela **não** gera obrigação financeira. */
  valorEmDisputa: number;
  conferidaEm: string;
}

export interface Factura {
  id: string;
  fornecedorId: string;
  pedidoId?: string | null;
  numero: string;
  dataEmissao: string;
  dataVencimento?: string | null;
  totalDeclarado: number;
  totalImposto: number;
  frete: number;
  moeda: string;
  estado: EstadoFactura;
  observacoes?: string;
  registadaPorId: string;
  registadaEm: string;
  decididaEm?: string;
  motivoDecisao?: string;
  /** A obrigação criada no Financeiro, quando a conferência a libertou. */
  registoFinanceiroId?: string | null;
  fornecedor?: { nome: string };
  linhas?: LinhaFactura[];
  conferencia?: Conferencia | null;
}

export interface Divergencia {
  tipo: TipoExcepcao;
  itemId?: string | null;
  produtoId?: string | null;
  descricao: string;
  valor: number;
  nivelResolvido?: string | null;
  /** Verdadeiro quando a política manda travar a factura inteira. */
  bloqueia: boolean;
}

export interface ResultadoConferencia {
  conforme: boolean;
  casosAbertos: number;
  valorConforme: number;
  valorEmDisputa: number;
  bloqueada: boolean;
  divergencias: Divergencia[];
  aviso: string | null;
}

export interface CasoExcepcao {
  id: string;
  numero: number;
  tipo: TipoExcepcao;
  gravidade: 'BAIXA' | 'MEDIA' | 'ALTA';
  estado: EstadoExcepcao;
  descricao: string;
  valor?: number | null;
  facturaId?: string | null;
  pedidoId?: string | null;
  fornecedorId?: string | null;
  /** O degrau da hierarquia em que a tolerância foi decidida. */
  nivelResolvido?: EscopoTolerancia | null;
  prazo?: string | null;
  decisao?: string | null;
  decididoEm?: string | null;
  createdAt: string;
  responsavel?: { name: string } | null;
  decididoPor?: { name: string } | null;
}

export interface PoliticaTolerancia {
  id: string;
  escopo: EscopoTolerancia;
  escopoId?: string | null;
  dimensao: DimensaoTolerancia;
  limitePercent?: number | null;
  limiteAbsoluto?: number | null;
  limiteSuperiorPercent?: number | null;
  limiteInferiorPercent?: number | null;
  accao: 'EXCEPCAO' | 'BLOQUEIO';
  activa: boolean;
}

export interface RegistarFacturaDto {
  fornecedorId: string;
  pedidoId?: string;
  numero: string;
  dataEmissao: string;
  dataVencimento?: string;
  totalDeclarado: number;
  totalImposto?: number;
  frete?: number;
  observacoes?: string;
  linhas: {
    itemId?: string;
    produtoId?: string;
    descricao: string;
    quantidade: number;
    precoUnitario: number;
    taxaIva?: number;
    desconto?: number;
  }[];
}

// ─── Rótulos ─────────────────────────────────────────────────────────────────
//
// Em português e a dizer o que aconteceu, não o nome da constante. «RECEPCAO_EM_FALTA»
// não diz nada a quem abre o Centro de Excepções pela primeira vez.

export const ROTULO_TIPO: Record<TipoExcepcao, string> = {
  PRECO: 'Preço',
  QUANTIDADE: 'Quantidade',
  IMPOSTO: 'IVA',
  FRETE: 'Frete',
  RECEPCAO_EM_FALTA: 'Facturado sem recepção',
  FACTURA_DUPLICADA: 'Factura duplicada',
  ASN_VERSUS_RECEPCAO: 'Aviso ≠ recepção',
  TOTAL_INCONSISTENTE: 'Total não bate com as linhas',
  PRODUTO_NAO_ENCOMENDADO: 'Produto não encomendado',
};

export const ROTULO_ESTADO_EXCEPCAO: Record<EstadoExcepcao, string> = {
  ABERTA: 'Aberta',
  ATRIBUIDA: 'Atribuída',
  EM_ANALISE: 'Em análise',
  AGUARDA_FORNECEDOR: 'A aguardar fornecedor',
  RESOLVIDA: 'Resolvida',
  DISPENSADA: 'Dispensada',
  REJEITADA: 'Rejeitada',
  ESCALADA: 'Escalada',
  ENCERRADA: 'Encerrada',
};

export const ROTULO_DIMENSAO: Record<DimensaoTolerancia, string> = {
  PRECO: 'Preço',
  QUANTIDADE: 'Quantidade',
  IMPOSTO: 'IVA',
  FRETE: 'Frete',
  TOTAL: 'Total da factura',
};

export const ROTULO_ESCOPO: Record<EscopoTolerancia, string> = {
  EMPRESA: 'Empresa',
  CATEGORIA: 'Categoria',
  FORNECEDOR: 'Fornecedor',
  PRODUTO: 'Produto',
};

/**
 * As transições possíveis de um caso, espelhando o backend.
 *
 * Serve para o ecrã só oferecer o que vai ser aceite. Um caso encerrado não reabre:
 * reabrir apagaria a data de encerramento, que é o que responde a «quanto tempo demorámos
 * a fechar isto».
 */
export const TRANSICOES_EXCEPCAO: Record<EstadoExcepcao, EstadoExcepcao[]> = {
  ABERTA: ['ATRIBUIDA', 'EM_ANALISE', 'DISPENSADA', 'REJEITADA', 'ESCALADA'],
  ATRIBUIDA: ['EM_ANALISE', 'AGUARDA_FORNECEDOR', 'RESOLVIDA', 'DISPENSADA', 'REJEITADA', 'ESCALADA'],
  EM_ANALISE: ['AGUARDA_FORNECEDOR', 'RESOLVIDA', 'DISPENSADA', 'REJEITADA', 'ESCALADA'],
  AGUARDA_FORNECEDOR: ['EM_ANALISE', 'RESOLVIDA', 'DISPENSADA', 'ESCALADA'],
  RESOLVIDA: ['ENCERRADA'],
  DISPENSADA: ['ENCERRADA'],
  REJEITADA: ['ENCERRADA'],
  ESCALADA: ['EM_ANALISE', 'RESOLVIDA', 'DISPENSADA', 'REJEITADA'],
  ENCERRADA: [],
};

/** Estados que exigem motivo escrito. Dispensar é fechar **sem** resolver. */
export const EXIGE_DECISAO: EstadoExcepcao[] = ['RESOLVIDA', 'DISPENSADA', 'REJEITADA'];

export const conferenciaApi = {
  // ─── Facturas ──────────────────────────────────────────────────────────────

  listarFacturas: async (params?: { estado?: string; fornecedorId?: string }) => {
    const { data } = await api.get<Factura[]>('/b2b/facturas', { params });
    return data;
  },

  obterFactura: async (id: string) => {
    const { data } = await api.get<Factura>(`/b2b/facturas/${id}`);
    return data;
  },

  registarFactura: async (dto: RegistarFacturaDto) => {
    const { data } = await api.post<Factura>('/b2b/facturas', dto);
    return data;
  },

  /**
   * Confronta ordem, recepção e factura.
   *
   * Pode correr mais do que uma vez: reconferir substitui o resultado anterior e os casos
   * que ele abriu. É o que se faz depois de corrigir uma recepção ou uma ordem.
   */
  conferir: async (id: string) => {
    const { data } = await api.post<ResultadoConferencia>(`/b2b/facturas/${id}/conferir`);
    return data;
  },

  /**
   * Liberta para pagamento, ou rejeita.
   *
   * Quem registou a factura não a pode aprovar, sem excepção. A obrigação criada no
   * Financeiro é do valor **conforme** — a parcela em disputa não gera obrigação enquanto
   * a divergência não for resolvida.
   */
  decidirFactura: async (
    id: string,
    dto: { aprovar: boolean; motivo?: string; dataVencimento?: string },
  ) => {
    const { data } = await api.post<Factura>(`/b2b/facturas/${id}/decisao`, dto);
    return data;
  },

  // ─── Centro de Excepções ───────────────────────────────────────────────────

  listarExcepcoes: async (params?: {
    estado?: EstadoExcepcao;
    tipo?: string;
    responsavelId?: string;
  }) => {
    const { data } = await api.get<CasoExcepcao[]>('/b2b/excepcoes', { params });
    return data;
  },

  actualizarExcepcao: async (
    id: string,
    dto: { estado: EstadoExcepcao; responsavelId?: string; prazo?: string; decisao?: string },
  ) => {
    const { data } = await api.patch<CasoExcepcao>(`/b2b/excepcoes/${id}`, dto);
    return data;
  },

  // ─── Tolerâncias ───────────────────────────────────────────────────────────

  listarTolerancias: async () => {
    const { data } = await api.get<PoliticaTolerancia[]>('/b2b/tolerancias');
    return data;
  },

  guardarTolerancia: async (dto: Omit<PoliticaTolerancia, 'id'>) => {
    const { data } = await api.post<PoliticaTolerancia>('/b2b/tolerancias', dto);
    return data;
  },

  apagarTolerancia: async (id: string) => {
    await api.delete(`/b2b/tolerancias/${id}`);
  },
};
