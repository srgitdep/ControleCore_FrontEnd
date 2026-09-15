/**
 * Transferências entre lojas — DT01 §12 e §15.1.
 *
 * Os tipos espelham `TransferenciaLoja` e o workflow do backend. Nada aqui é
 * calculado no cliente: a validação de não-ruptura na origem é revalidada no
 * servidor a cada aprovação (§12).
 */

export type EstadoTransferencia = 'SOLICITADA' | 'APROVADA' | 'EXPEDIDA' | 'RECEBIDA' | 'CANCELADA';

export const ESTADO_TRANSFERENCIA_LABEL: Record<EstadoTransferencia, string> = {
  SOLICITADA: 'Solicitada',
  APROVADA: 'Aprovada',
  EXPEDIDA: 'Expedida',
  RECEBIDA: 'Recebida',
  CANCELADA: 'Cancelada',
};

export interface LinhaTransferencia {
  id: string;
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

export interface DetalheTransferencia extends LinhaTransferencia {
  aprovadaPor: { name: string } | null;
  expedidaPor: { name: string } | null;
  recebidaPor: { name: string } | null;
  canceladaPor: { name: string } | null;
}

export interface FiltrosTransferencia {
  lojaId?: string;
  estado?: EstadoTransferencia[];
  page?: number;
  limit?: number;
}
