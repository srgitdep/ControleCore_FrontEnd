import { api } from '@/shared/config';

export interface Supplier {
  id: string;
  /** A organização a que esta relação comercial pertence. */
  organizacaoId?: string | null;
  estadoRelacao?: string;
  nome: string;
  nuit?: string;
  tipoFornecimento?: string;
  email?: string;
  telefone?: string;
  endereco?: string;
  website?: string;
  isActive: boolean;
}

export type SupplierPayload = Omit<Supplier, 'id' | 'isActive'> & { isActive?: boolean };

// ─── Vitrine ──────────────────────────────────────────────────────────────────

export interface PrecoVitrine {
  id: string;
  preco: number;
  moeda: string;
  quantidadeMinima: number;
  vigenteDe: string;
  vigenteAte: string | null;
  promocional: boolean;
}

/**
 * Um artigo publicado, como o comprador o vê. A mesma forma que `ArtigoVitrine` do portal
 * do fornecedor, menos os campos que só interessam a quem gere a vitrine (`estado`,
 * `publicadoEm`) — aqui só entram artigos já publicados, o backend filtra por isso.
 */
export interface ArtigoDaVitrine {
  id: string;
  organizacaoId: string;
  referencia: string;
  nome: string;
  descricao: string | null;
  gtin: string | null;
  categoria: string | null;
  marca: string | null;
  unidadeVenda: string | null;
  factorConversao: number;
  embalagem: string | null;
  quantidadeDisponivel: number | null;
  esgotado: boolean;
  imagens: string[];
  precos: PrecoVitrine[];
}

// ─── A lista completa, incluindo quem ainda não é fornecedor desta empresa ────

/** Um fornecedor com quem esta empresa já tem relação — cadastrado à mão, ou já usado. */
export interface FornecedorComRelacao {
  tipo: 'RELACAO';
  fornecedor: Supplier;
}

/**
 * Uma organização da plataforma com vitrine publicada, que esta empresa ainda não usou.
 *
 * Sem `id` de `Fornecedor` — não existe relação nenhuma para editar, suspender ou ver
 * desempenho. O único acto possível é ver a vitrine; ao adjudicar-lhe algo através do
 * sourcing, a relação nasce e a organização passa a aparecer como as outras.
 */
export interface FornecedorSemRelacao {
  tipo: 'SEM_RELACAO';
  organizacaoId: string;
  razaoSocial: string;
  nomeComercial: string | null;
  nuit: string | null;
  email: string | null;
  telefone: string | null;
  artigosPublicados: number;
}

export type LinhaDeFornecedor = FornecedorComRelacao | FornecedorSemRelacao;

export interface VitrinaDoFornecedor {
  organizacaoId: string;
  razaoSocial: string;
  nomeComercial: string | null;
  sede: string | null;
  email: string | null;
  telefone: string | null;
  website: string | null;
  logoUrl: string | null;
  nuit: string | null;
  provinciasServidas: string[];
  documentosValidos: string[];
  artigos: ArtigoDaVitrine[];
}

// ─── Histórico e desempenho ──────────────────────────────────────────────────

export interface PedidoDoFornecedor {
  pedidoId: string;
  estado: string;
  dataPedido: string;
  dataPrevista: string | null;
  observacoes: string | null;
  linhas: number;
  quantidadePedida: number;
  quantidadeRecebida: number;
  /** O que falta receber — a pergunta de quem abre o histórico. */
  pendente: number;
  valorPedido: number;
  produtos: {
    produtoId: string;
    nome: string;
    quantidadePedida: number;
    quantidadeRecebida: number;
    custoUnitario: number;
  }[];
  rececoes: {
    rececaoId: string;
    data: string;
    documentoRef: string | null;
    armazem: string | null;
    recebidoPor: string | null;
    valor: number;
  }[];
}

export interface HistoricoFornecedor {
  fornecedor: { id: string; nome: string; isActive: boolean; tipoFornecimento: string | null };
  pedidos: PedidoDoFornecedor[];
  /** `true` quando há mais pedidos do que os devolvidos. */
  truncado: boolean;
}

/**
 * Os nulos são significativos e não devem ser tratados como zero.
 *
 * `prazoMedioDias` nulo = nenhuma entrega registada, não "entrega imediata".
 * `pontualidadePercent` nulo = nenhum pedido tinha data combinada, não "0% pontual" —
 * a diferença é entre não saber e acusar.
 */
export interface DesempenhoFornecedor {
  pedidos: number;
  pedidosComEntrega: number;
  valorEncomendado: number;
  valorRecebido: number;
  prazoMedioDias: number | null;
  prazoMinimoDias: number | null;
  prazoMaximoDias: number | null;
  pontualidadePercent: number | null;
  pedidosComDataPrevista: number;
  entregasAtrasadas: number;
  atrasoMedioDias: number | null;
  cumprimentoPercent: number | null;
}

export const suppliersApi = {
  getSuppliers: async () => {
    const { data } = await api.get<Supplier[]>('/fornecedores');
    return data;
  },

  getSupplierById: async (id: string) => {
    const { data } = await api.get<Supplier>(`/fornecedores/${id}`);
    return data;
  },

  /**
   * A lista de fornecedores desta empresa, incluindo as organizações da plataforma que
   * ainda não usou — a lista que `FornecedoresTab` mostra.
   *
   * Diferente de `getSuppliers`: aquela devolve só `Fornecedor`, a relação comercial, e é o
   * que `CriarPedidoModal` e `CatalogoTab` continuam a usar — não se pode emitir um pedido
   * de compra manual a uma organização com quem não há relação nenhuma; essa nasce na
   * adjudicação do sourcing, não à mão.
   */
  getFornecedoresDaEmpresa: async () => {
    const { data } = await api.get<LinhaDeFornecedor[]>('/b2b/qualificacao/fornecedores');
    return data;
  },

  /**
   * A vitrine de um fornecedor — os seus dados e todos os artigos publicados, com preço.
   *
   * `organizacaoId` e não `id`: a vitrine pertence à **organização** do fornecedor, que é a
   * identidade partilhada por todos os compradores; `id` é a relação comercial desta
   * empresa com ele, e uma organização sem relação nenhuma ainda tem vitrine. Um fornecedor
   * cadastrado à mão (sem `organizacaoId`) não tem esta rota para chamar — ver a nota em
   * `FornecedoresTab`.
   */
  getVitrina: async (organizacaoId: string) => {
    const { data } = await api.get<VitrinaDoFornecedor>(
      `/b2b/qualificacao/${organizacaoId}/vitrine`,
    );
    return data;
  },

  createSupplier: async (payload: SupplierPayload) => {
    const { data } = await api.post<Supplier>('/fornecedores', payload);
    return data;
  },

  updateSupplier: async (id: string, payload: Partial<SupplierPayload>) => {
    const { data } = await api.patch<Supplier>(`/fornecedores/${id}`, payload);
    return data;
  },

  // Apaga o registo de facto (não é desactivação lógica). Para suspender um
  // fornecedor sem perder o histórico, use updateSupplier com isActive: false.
  deleteSupplier: async (id: string) => {
    const { data } = await api.delete(`/fornecedores/${id}`);
    return data;
  },

  /** Pedidos feitos ao fornecedor, com o que ficou pendente e as recepções de cada um. */
  getHistorico: async (id: string) => {
    const { data } = await api.get<HistoricoFornecedor>(`/fornecedores/${id}/historico`);
    return data;
  },

  /**
   * Prazo real, pontualidade e cumprimento das quantidades.
   *
   * Recepções anuladas não contam — não houve entrega.
   */
  getDesempenho: async (id: string) => {
    const { data } = await api.get<{
      fornecedor: { id: string; nome: string };
      desempenho: DesempenhoFornecedor;
    }>(`/fornecedores/${id}/desempenho`);
    return data;
  },
};

// ─── Organização fornecedora e conta bancária (§3 e §15.1) ───────────────────
//
// A identidade da organização é global; a relação comercial é por empresa compradora. O
// que é da organização — NUIT, sede, conta bancária — não se repete a cada empresa que
// compra ao mesmo fornecedor.

export type ForcaIndicio = 'CERTEZA' | 'FORTE' | 'FRACO';

export interface Indicio {
  campo: 'NUIT' | 'IBAN' | 'NOME' | 'EMAIL' | 'TELEFONE';
  forca: ForcaIndicio;
  descricao: string;
}

export interface SuspeitaDuplicado {
  organizacaoId: string;
  razaoSocial: string;
  indicios: Indicio[];
  /** Verdadeiro quando há certeza — NUIT igual. O cadastro reutiliza em vez de criar. */
  bloqueia: boolean;
}

export interface OrganizacaoFornecedora {
  id: string;
  razaoSocial: string;
  nomeComercial?: string | null;
  nuit?: string | null;
  sede?: string | null;
  email?: string | null;
  telefone?: string | null;
  website?: string | null;
  /** Preenchido quando esta organização foi fundida noutra. É um remissivo. */
  fundidaEmId?: string | null;
  fundidaEm?: string | null;
  motivoFusao?: string | null;
}

export const EstadoContaBancaria = {
  PENDENTE: 'PENDENTE',
  ACTIVA: 'ACTIVA',
  RECUSADA: 'RECUSADA',
  SUBSTITUIDA: 'SUBSTITUIDA',
} as const;
export type EstadoContaBancaria =
  (typeof EstadoContaBancaria)[keyof typeof EstadoContaBancaria];

export interface ContaBancaria {
  id: string;
  organizacaoId: string;
  banco: string;
  iban: string;
  ibanNormalizado: string;
  titular?: string | null;
  estado: EstadoContaBancaria;
  comprovativoUrl?: string | null;
  canalVerificacao?: string | null;
  solicitadaEm: string;
  decididaEm?: string | null;
  motivoDecisao?: string | null;
  /** Verdadeiro quando quem pediu foi quem aprovou. Hoje impossível — a regra bloqueia. */
  sodExcepcao: boolean;
  solicitadaPor?: { name: string };
  decididaPor?: { name: string } | null;
}

export interface PedidoDeContaBancaria {
  banco: string;
  iban: string;
  titular?: string;
  comprovativoUrl?: string;
}

export const ROTULO_ESTADO_CONTA: Record<EstadoContaBancaria, string> = {
  PENDENTE: 'Por aprovar',
  ACTIVA: 'Em uso',
  RECUSADA: 'Recusada',
  SUBSTITUIDA: 'Substituída',
};

export const b2bFornecedorApi = {
  /**
   * Procura organizações que possam ser a mesma antes de criar.
   *
   * NUIT igual é certeza e o cadastro reutiliza sem perguntar — pedir confirmação
   * ensinaria a carregar em «sim» sem ler. Nome parecido, IBAN partilhado e contactos
   * iguais avisam e deixam prosseguir: «Padaria Central» da Beira não é a de Maputo.
   */
  verificarDuplicado: async (dados: {
    razaoSocial: string;
    nomeComercial?: string;
    nuit?: string;
    email?: string;
    telefone?: string;
  }) => {
    const { data } = await api.post<SuspeitaDuplicado[]>(
      '/b2b/organizacoes/verificar-duplicado',
      dados,
    );
    return data;
  },

  obterOrganizacao: async (id: string) => {
    const { data } = await api.get<OrganizacaoFornecedora>(`/b2b/organizacoes/${id}`);
    return data;
  },

  /**
   * Funde duas organizações que são a mesma empresa.
   *
   * A perdedora não é apagada: fica como remissivo, e a fusão pode ser desfeita. Nenhuma
   * ordem de compra, recepção ou registo financeiro é tocado — apontam para a relação, e
   * não para a organização.
   */
  fundirOrganizacoes: async (dto: {
    perdedoraId: string;
    sobreviventeId: string;
    motivo: string;
  }) => {
    const { data } = await api.post<{
      sobreviventeId: string;
      relacoesMovidas: number;
      contasMovidas: number;
      aviso: string | null;
    }>('/b2b/organizacoes/fundir', dto);
    return data;
  },

  // ─── Contas bancárias ──────────────────────────────────────────────────────

  /** Todas as contas, incluindo substituídas e recusadas. Nunca se apaga nenhuma. */
  listarContas: async (organizacaoId: string) => {
    const { data } = await api.get<ContaBancaria[]>(
      `/b2b/organizacoes/${organizacaoId}/contas-bancarias`,
    );
    return data;
  },

  /** Cria o pedido em PENDENTE. Não activa nada — a conta só vale depois de aprovada. */
  pedirConta: async (organizacaoId: string, dto: PedidoDeContaBancaria) => {
    const { data } = await api.post<{
      conta: ContaBancaria;
      avisoIbanJaRecusado: string | null;
    }>(`/b2b/organizacoes/${organizacaoId}/contas-bancarias`, dto);
    return data;
  },

  /**
   * Aprova ou recusa, por outra pessoa.
   *
   * Exige comprovativo junto ao pedido e a descrição do canal independente pelo qual a
   * alteração foi confirmada. Um pedido que chega por e-mail e é confirmado por resposta
   * ao mesmo e-mail não foi confirmado: quem controla a caixa controla os dois lados.
   */
  decidirConta: async (
    contaId: string,
    dto: { aprovar: boolean; canalVerificacao?: string; motivo?: string },
  ) => {
    const { data } = await api.patch<ContaBancaria>(`/b2b/contas-bancarias/${contaId}`, dto);
    return data;
  },
};
