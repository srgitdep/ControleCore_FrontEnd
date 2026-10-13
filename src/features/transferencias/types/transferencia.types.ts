/**
 * Transferências entre lojas — DT01 §12 e §15.1.
 *
 * Os tipos espelham `TransferenciaLoja` e o workflow do backend. Nada aqui é
 * calculado no cliente: a validação de não-ruptura na origem é revalidada no
 * servidor a cada aprovação (§12).
 */

export type EstadoTransferencia = 'SOLICITADA' | 'APROVADA' | 'EXPEDIDA' | 'RECEBIDA' | 'CANCELADA';

export interface ArmazemNomeado {
  id: string;
  /** Nulo se o armazém entretanto foi removido. */
  nome: string | null;
}

export interface LinhaTransferencia {
  id: string;
  /** Um pedido em massa cria uma transferência por produto, todas com o mesmo grupo (plano §4.12). */
  grupoId: string | null;
  /** `TRF-XXXXXXXX`: do grupo, ou da própria transferência se é de um só produto. */
  referencia: string;
  origemArmazem: ArmazemNomeado | null;
  destinoArmazem: ArmazemNomeado | null;
  estado: EstadoTransferencia;
  quantidadeSolicitada: number;
  quantidadeExpedida: number | null;
  quantidadeRecebida: number | null;
  motivo: string | null;
  motivoCancelamento: string | null;
  createdAt: string;
  aprovadaEm: string | null;
  expedidaEm: string | null;
  recebidaEm: string | null;
  produto: { id: string; nome: string; sku: string | null; imagemUrl: string | null };
  origemLoja: { id: string; nome: string };
  destinoLoja: { id: string; nome: string };
  solicitadaPor: { name: string };
}

export interface ListaTransferencias {
  dados: LinhaTransferencia[];
  total: number;
  page: number;
  limit: number;
}

/** Um movimento de stock que a transferência gerou: a saída na origem ou a entrada no destino. */
export interface MovimentoDaTransferencia {
  id: string;
  type: 'IN' | 'OUT' | 'ADJUSTMENT';
  quantity: number;
  balanceAfter: number;
  createdAt: string;
  stock: { armazem: { id: string; nome: string } | null } | null;
}

export interface DetalheTransferencia extends LinhaTransferencia {
  aprovadaPor: { name: string } | null;
  expedidaPor: { name: string } | null;
  recebidaPor: { name: string } | null;
  canceladaPor: { name: string } | null;
  movimentos: MovimentoDaTransferencia[];
}

/** Um pedido em massa: o cabeçalho e as suas linhas. */
export interface DetalheDoGrupo {
  grupoId: string;
  referencia: string;
  origemArmazem: ArmazemNomeado | null;
  destinoArmazem: ArmazemNomeado | null;
  origemLoja: { id: string; nome: string };
  destinoLoja: { id: string; nome: string };
  solicitadaPor: { name: string };
  createdAt: string;
  motivo: string | null;
  linhas: LinhaTransferencia[];
}

/** Um produto com stock no armazém de origem, com o que a decisão de transferir precisa. */
export interface ProdutoDisponivel {
  produtoId: string;
  nome: string;
  sku: string | null;
  codigoBarras: string | null;
  unidade: string;
  imagemUrl: string | null;
  fisico: number;
  reservado: number;
  /** O único que se pode transferir: físico menos reservado. */
  disponivel: number;
  minimo: number;
  /** O que a aprovação deixa sair sem pôr a origem em risco (DT01 §12). */
  cedivel: number;
  noDestino: number;
  emTransitoNoDestino: number;
}

export interface DisponivelNoArmazem {
  armazem: { id: string; nome: string; lojaId: string };
  total: number;
  page: number;
  limit: number;
  dados: ProdutoDisponivel[];
}

export interface LinhaDoPedido {
  produtoId: string;
  quantidade: number;
}

export interface PedidoEmMassa {
  origemArmazemId: string;
  destinoArmazemId: string;
  motivo?: string;
  linhas: LinhaDoPedido[];
}

export type MotivoDeErroDeLinha = 'QUANTIDADE_INVALIDA' | 'REPETIDA' | 'SEM_STOCK_NA_ORIGEM' | 'ACIMA_DO_DISPONIVEL';

/** Uma linha que o servidor recusou. Vêm **todas** de uma vez, no topo do corpo do erro (`erros`). */
export interface ErroDeLinha {
  produtoId: string;
  nome: string | null;
  motivo: MotivoDeErroDeLinha;
  disponivel: number | null;
}

export interface ResultadoDoPedido {
  grupoId: string;
  referencia: string;
  transferencias: Array<{ id: string; produtoId: string; quantidadeSolicitada: number; estado: EstadoTransferencia }>;
}

export interface ResultadoDeLinhaDoGrupo {
  transferenciaId: string;
  produtoId: string;
  ok: boolean;
  erro?: { codigo: string; mensagem: string };
}

/** O que uma acção sobre o grupo fez: linha a linha, com as que falharam e porquê. */
export interface ResultadoDaAccaoDoGrupo {
  grupoId: string;
  referencia: string;
  feitas: number;
  falhadas: number;
  /** Linhas noutro estado: não são erro, só não eram para esta acção. */
  ignoradas: number;
  resultados: ResultadoDeLinhaDoGrupo[];
}

export interface ArmazemEscolhivel {
  id: string;
  nome: string;
  tipo: string;
  lojaId: string;
  lojaNome: string;
}

export interface FiltrosTransferencia {
  lojaId?: string;
  armazemId?: string;
  produtoId?: string;
  grupoId?: string;
  /** `AAAA-MM-DD`, inclusive. */
  desde?: string;
  ate?: string;
  /** A referência (`TRF-XXXXXXXX`) ou o início dela. */
  pesquisa?: string;
  estado?: EstadoTransferencia[];
  page?: number;
  limit?: number;
}
