import { api } from '@/shared/config';

/**
 * O módulo B2B: requisições, sourcing e adjudicação.
 *
 * ## O que a API devolve e que este cliente não recalcula
 *
 * A pontuação de cada fornecedor, a decomposição de cada factor, os cenários e o custo de
 * cada um vêm calculados do backend, de uma corrida **congelada** — com os pesos e a versão
 * do algoritmo guardados.
 *
 * Recalcular qualquer um destes números no browser daria outro valor no momento em que os
 * preços mudassem, e a decisão de Março passaria a parecer errada sem ninguém ter errado.
 * Este ficheiro transporta números; não os produz.
 */

export const EstadoRequisicao = {
  RASCUNHO: 'RASCUNHO',
  AGUARDA_APROVACAO: 'AGUARDA_APROVACAO',
  APROVADA: 'APROVADA',
  EM_SOURCING: 'EM_SOURCING',
  EM_DECISAO: 'EM_DECISAO',
  ADJUDICADA: 'ADJUDICADA',
  PARCIALMENTE_ADJUDICADA: 'PARCIALMENTE_ADJUDICADA',
  CANCELADA: 'CANCELADA',
} as const;

export type EstadoRequisicao = (typeof EstadoRequisicao)[keyof typeof EstadoRequisicao];

export const EstrategiaAdjudicacao = {
  FORNECEDOR_UNICO: 'FORNECEDOR_UNICO',
  REPARTIDA: 'REPARTIDA',
  EQUILIBRADA: 'EQUILIBRADA',
} as const;

export type EstrategiaAdjudicacao =
  (typeof EstrategiaAdjudicacao)[keyof typeof EstrategiaAdjudicacao];

export interface RequisicaoLinha {
  id: string;
  produtoId: string;
  quantidade: number;
  quantidadeAdjudicada: number;
  observacoes?: string | null;
  produto?: {
    id: string;
    nome: string;
    sku?: string | null;
    codigoBarras?: string | null;
    taxaIva: number;
  };
}

export interface Requisicao {
  id: string;
  numero: string;
  empresaId: string;
  lojaId: string;
  estado: EstadoRequisicao;
  dataNecessidade?: string | null;
  observacoes?: string | null;
  criadoPorId: string;
  submetidaPorId?: string | null;
  aprovadaPorId?: string | null;
  adjudicadaPorId?: string | null;
  submetidaEm?: string | null;
  aprovadaEm?: string | null;
  motivoDecisao?: string | null;
  /** Verdadeiro quando quem submeteu foi quem aprovou, ao abrigo da excepção autorizada. */
  sodExcepcao: boolean;
  runAdjudicadoId?: string | null;
  estrategiaAdjudicada?: EstrategiaAdjudicacao | null;
  adjudicadaEm?: string | null;
  motivoDesvio?: string | null;
  createdAt: string;
  linhas: RequisicaoLinha[];
  loja?: { id: string; nome: string; cidade?: string | null };
}

/**
 * Um factor da pontuação, com o que o justifica.
 *
 * `explicacao` vem formada do backend e não é reconstruída aqui. A frase é o produto de uma
 * regra de negócio — «12% acima do melhor preço» sai de uma divisão que vive no domínio — e
 * reescrevê-la no browser daria duas versões que divergiriam na primeira correcção que só um
 * dos lados recebesse.
 */
export interface FactorPontuacao {
  chave: string;
  etiqueta: string;
  valorLegivel: string;
  normalizado: number;
  peso: number;
  contribuicao: number;
  explicacao: string;
  /** Verdadeiro quando não havia dados e o factor ficou no ponto neutro. */
  neutro: boolean;
}

export interface FactoresCandidato {
  indicePreco: number | null;
  factores: FactorPontuacao[];
  conformidade: string;
  zona: string | null;
  avisoMinimoEntrega: string | null;
}

export interface CandidatoLinha {
  id: string;
  requisicaoLinhaId: string;
  artigoId: string;
  metodoCorrespondencia: string;
  confianca: number;
  precoUnitarioBase: number;
  precoFacturavelBase: number;
  quantidadeFornecedor: number;
  quantidadeBase: number;
  ajusteMotivo?: string | null;
  custoLinha: number;
  melhorDaLinha: boolean;
}

export interface Candidato {
  id: string;
  organizacaoId: string;
  fornecedorId?: string | null;
  posicao?: number | null;
  pontuacao?: number | null;
  factores?: FactoresCandidato | null;
  linhasCobertas: number;
  custoTotal?: number | null;
  custoTotalMelhorAlternativa?: number | null;
  prazoEstimadoDias?: number | null;
  excluido: boolean;
  motivoExclusao?: string | null;
  detalheExclusao?: string | null;
  organizacao: { id: string; razaoSocial: string; nomeComercial?: string | null };
  linhas: CandidatoLinha[];
}

export interface CenarioResumo {
  estrategia: EstrategiaAdjudicacao;
  custoMercadoria: number;
  custoAdministrativo: number;
  custoTotal: number;
  fornecedores: { organizacaoId: string; nome: string; linhas: number; custo: number }[];
  linhasNaoCobertas: number;
  descricao: string;
  atribuicoes: { requisicaoLinhaId: string; organizacaoId: string; custoLinha: number }[];
}

export interface ResumoRun {
  cenarios?: CenarioResumo[];
  recomendado?: EstrategiaAdjudicacao | null;
  avisosMinimoEntrega?: { organizacaoId: string; aviso: string }[];
  candidatosExcluidos?: number;
  semCandidatos?: boolean;
  motivo?: string;
}

export interface SourcingRun {
  id: string;
  requisicaoId: string;
  estado: 'EM_CURSO' | 'CONCLUIDA' | 'FALHADA';
  /** Os pesos usados, congelados. É o que permite dizer «nesta empresa o custo pesa 35». */
  pesos: Record<string, number>;
  versaoAlgoritmo: string;
  estrategiaRecomendada?: EstrategiaAdjudicacao | null;
  resumo?: ResumoRun | null;
  candidatosAvaliados: number;
  linhasTotais: number;
  executadoEm: string;
  concluidoEm?: string | null;
  erro?: string | null;
  candidatos: Candidato[];
}

export interface PesosSourcing {
  id: string;
  empresaId: string;
  pesoCusto: number;
  pesoCobertura: number;
  pesoPrazo: number;
  pesoPontualidade: number;
  pesoCumprimento: number;
  pesoDivergencia: number;
  pesoConformidade: number;
  pesoRelacao: number;
  taxaJuroAnual: number;
  custoAdministrativoPorFornecedor: number;
  confiancaMinima: number;
}

export interface ResultadoAdjudicacao {
  requisicao: Requisicao;
  pedidoIds: string[];
  /** A adjudicação escolheu o fornecedor; a despesa continua por aprovar. */
  aviso: string;
}

const BASE = '/b2b/requisicoes';

export const b2bApi = {
  // ─── Requisições ────────────────────────────────────────────────────────────

  listar: async (filtros?: { estado?: EstadoRequisicao; lojaId?: string }) => {
    const { data } = await api.get<Requisicao[]>(BASE, { params: filtros });
    return data;
  },

  obter: async (id: string) => {
    const { data } = await api.get<Requisicao>(`${BASE}/${id}`);
    return data;
  },

  criar: async (payload: {
    lojaId: string;
    dataNecessidade?: string;
    observacoes?: string;
    linhas: { produtoId: string; quantidade: number; observacoes?: string }[];
  }) => {
    const { data } = await api.post<Requisicao>(BASE, payload);
    return data;
  },

  substituirLinhas: async (
    id: string,
    linhas: { produtoId: string; quantidade: number; observacoes?: string }[],
  ) => {
    const { data } = await api.put<Requisicao>(`${BASE}/${id}/linhas`, { linhas });
    return data;
  },

  submeter: async (id: string) => {
    const { data } = await api.patch<Requisicao>(`${BASE}/${id}/submeter`);
    return data;
  },

  decidir: async (id: string, payload: { decisao: 'APROVAR' | 'RECUSAR'; motivo?: string }) => {
    const { data } = await api.patch<Requisicao>(`${BASE}/${id}/decidir`, payload);
    return data;
  },

  reabrir: async (id: string, motivo: string) => {
    const { data } = await api.patch<Requisicao>(`${BASE}/${id}/reabrir`, { motivo });
    return data;
  },

  cancelar: async (id: string, motivo: string) => {
    const { data } = await api.patch<Requisicao>(`${BASE}/${id}/cancelar`, { motivo });
    return data;
  },

  // ─── Sourcing ───────────────────────────────────────────────────────────────

  correrSourcing: async (id: string, ivaRecuperavel = true) => {
    const { data } = await api.post<SourcingRun>(`${BASE}/${id}/sourcing`, { ivaRecuperavel });
    return data;
  },

  listarRuns: async (id: string) => {
    const { data } = await api.get<SourcingRun[]>(`${BASE}/${id}/sourcing`);
    return data;
  },

  obterRun: async (runId: string) => {
    const { data } = await api.get<SourcingRun>(`${BASE}/sourcing/${runId}`);
    return data;
  },

  // ─── Adjudicação ────────────────────────────────────────────────────────────

  adjudicar: async (
    id: string,
    payload: {
      runId: string;
      estrategia: EstrategiaAdjudicacao;
      atribuicoes?: { requisicaoLinhaId: string; organizacaoId: string }[];
      motivoDesvio?: string;
      dataPrevista?: string;
    },
  ) => {
    const { data } = await api.post<ResultadoAdjudicacao>(`${BASE}/${id}/adjudicar`, payload);
    return data;
  },

  // ─── Pesos ──────────────────────────────────────────────────────────────────

  obterPesos: async () => {
    const { data } = await api.get<PesosSourcing>(`${BASE}/config/pesos`);
    return data;
  },

  actualizarPesos: async (payload: Partial<Omit<PesosSourcing, 'id' | 'empresaId'>>) => {
    const { data } = await api.patch<PesosSourcing>(`${BASE}/config/pesos`, payload);
    return data;
  },
};

// ═══════════════════════════════════════════════════════════════════════════════
// Regras de transição, para o ecrã não oferecer o que o backend recusa
// ═══════════════════════════════════════════════════════════════════════════════
//
// Duplicam a tabela de transições de `gerir-requisicao.use-case.ts`, e a duplicação é
// consciente: o backend é a autoridade e recusa sempre o que não é permitido; estas funções
// existem só para o botão não aparecer.
//
// Um botão que aparece e dá erro é pior do que um botão que não aparece — ensina o
// utilizador a desconfiar do ecrã. E ter as regras aqui não abre buraco de segurança
// nenhum: são regras de apresentação sobre uma decisão que é tomada do outro lado.

export const podeEditarLinhas = (r: Requisicao) => r.estado === 'RASCUNHO';

export const podeSubmeter = (r: Requisicao) =>
  r.estado === 'RASCUNHO' && r.linhas.length > 0;

export const podeDecidir = (r: Requisicao) => r.estado === 'AGUARDA_APROVACAO';

export const podeCorrerSourcing = (r: Requisicao) =>
  r.estado === 'APROVADA' || r.estado === 'EM_DECISAO';

export const podeAdjudicar = (r: Requisicao) =>
  r.estado === 'EM_DECISAO' || r.estado === 'PARCIALMENTE_ADJUDICADA';

export const podeCancelar = (r: Requisicao) =>
  ['RASCUNHO', 'AGUARDA_APROVACAO', 'APROVADA', 'EM_DECISAO', 'PARCIALMENTE_ADJUDICADA'].includes(
    r.estado,
  );

/**
 * O saldo por adjudicar de uma requisição.
 *
 * A diferença entre o pedido e o adjudicado, por linha. É o que distingue uma requisição
 * completa de uma parcial — e uma parcial que ninguém veja fica na lista de pendências para
 * sempre.
 *
 * A tolerância de uma milésima é a mesma do backend: as quantidades são de vírgula
 * flutuante, e a soma de parcelas adjudicadas separadamente não dá exactamente o total.
 */
export function saldoPorAdjudicar(requisicao: Requisicao): RequisicaoLinha[] {
  return requisicao.linhas.filter((l) => l.quantidadeAdjudicada < l.quantidade - 0.001);
}

/** As etiquetas dos estados, para o ecrã não ter de as inventar em cada sítio. */
export const ETIQUETA_ESTADO: Record<EstadoRequisicao, string> = {
  RASCUNHO: 'Rascunho',
  AGUARDA_APROVACAO: 'Aguarda aprovação',
  APROVADA: 'Aprovada',
  EM_SOURCING: 'A comparar fornecedores',
  EM_DECISAO: 'Aguarda decisão',
  ADJUDICADA: 'Adjudicada',
  PARCIALMENTE_ADJUDICADA: 'Parcialmente adjudicada',
  CANCELADA: 'Cancelada',
};

export const ETIQUETA_ESTRATEGIA: Record<EstrategiaAdjudicacao, string> = {
  FORNECEDOR_UNICO: 'Fornecedor único',
  REPARTIDA: 'Repartida',
  EQUILIBRADA: 'Equilibrada',
};

/**
 * O que cada estratégia significa, em uma frase.
 *
 * Vive aqui e não no ecrã porque é usado em três sítios — o cartão do cenário, o selector de
 * adjudicação e a confirmação — e três cópias divergiriam.
 */
export const DESCRICAO_ESTRATEGIA: Record<EstrategiaAdjudicacao, string> = {
  FORNECEDOR_UNICO: 'Um fornecedor serve tudo o que consegue. Uma ordem, uma entrega, uma factura.',
  REPARTIDA: 'Cada linha ao mais barato. Menor custo de mercadoria, mais entregas para conferir.',
  EQUILIBRADA: 'O ponto onde acrescentar mais um fornecedor deixa de compensar o trabalho.',
};

/** Os motivos de exclusão, traduzidos. */
export const ETIQUETA_EXCLUSAO: Record<string, string> = {
  ESTADO_RELACAO: 'Relação comercial',
  CONFORMIDADE: 'Conformidade documental',
  SEM_COBERTURA: 'Não tem os artigos',
  SEM_PRECO_VIGENTE: 'Sem preço em vigor',
  FORA_DA_ZONA: 'Não entrega na zona',
};
