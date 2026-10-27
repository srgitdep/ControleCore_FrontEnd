// O contrato de `/plataforma/empresas/:id/assinatura` e do relatório de expiração.
// Os campos `Decimal` do Prisma chegam em JSON como texto ("1500.00"): quem mostra converte.

export type CicloAssinatura = 'MENSAL' | 'TRIMESTRAL' | 'SEMESTRAL' | 'ANUAL';

export type EstadoAssinatura =
  | 'TRIAL'
  | 'ATIVA'
  | 'EXPIRADA'
  | 'CANCELADA'
  | 'SUSPENSA'
  | 'EM_ATRASO'
  | 'EM_RENOVACAO';

/** Os estados que se escolhem à mão. Os outros vêm das datas. */
export type EstadoManual = 'ATIVA' | 'SUSPENSA' | 'CANCELADA';

export const METODOS_PAGAMENTO = ['TRANSFERENCIA', 'MPESA', 'EMOLA', 'NUMERARIO', 'CHEQUE', 'OUTRO'] as const;
export type MetodoPagamento = (typeof METODOS_PAGAMENTO)[number];

/** O que aconteceria à assinatura se as datas contassem (a expiração automática ainda não está ligada). */
export type SituacaoAssinatura = 'EM_DIA' | 'TRIAL_EXPIRADO' | 'PAGAMENTO_EM_FALTA';

export interface PagamentoAssinatura {
  id: string;
  valor: string;
  metodoPagamento: string;
  referencia: string | null;
  estado: 'PENDENTE' | 'PAGO' | 'FALHADO' | 'REEMBOLSADO';
  dataVencimento: string;
  dataPagamento: string | null;
  observacoes: string | null;
  createdAt: string;
}

export interface AssinaturaGerida {
  id: string;
  estado: EstadoAssinatura;
  ciclo: CicloAssinatura;
  dataInicio: string;
  dataFim: string;
  trialAte: string | null;
  dataRenovacao: string | null;
  valorTotal: string;
  desconto: string;
  renovacaoAutomatica: boolean;
  diasToleranciaPagamento: number;
  motivoSuspensao: string | null;
  suspensaEm: string | null;
  modulos: Array<{
    moduloId: string;
    precoAcordado: string;
    modulo: { id: string; codigo: string; nome: string; precoMensal: string };
  }>;
  pagamentos: PagamentoAssinatura[];
  planos: { codigo: string; nome: string } | null;
}

export interface RespostaAssinatura {
  empresa: { id: string; nome: string; moeda: string; isActive: boolean };
  assinatura: AssinaturaGerida | null;
  fimDoAcesso: string | null;
  situacao: SituacaoAssinatura | null;
}

export interface AlterarAssinaturaPayload {
  motivo: string;
  modulos?: Array<{ moduloId: string; precoAcordado: number }>;
  ciclo?: CicloAssinatura;
  valorTotal?: number;
  desconto?: number;
  dataFim?: string;
  trialAte?: string;
  renovacaoAutomatica?: boolean;
  estado?: EstadoManual;
}

export interface RegistarPagamentoPayload {
  valor: number;
  metodoPagamento: MetodoPagamento;
  referencia?: string;
  dataPagamento?: string;
  observacoes?: string;
  estenderAssinatura?: boolean;
}

export interface RelatorioExpiracao {
  geradoEm: string;
  /** O interruptor `EXPIRACAO_ASSINATURAS_ACTIVA`: se o que o relatório descreve já acontece. */
  expiracaoActiva: boolean;
  porEstado: Partial<Record<EstadoAssinatura, number>>;
  totais: {
    empresasComAcesso: number;
    emDia: number;
    ficariamSemAcesso: number;
    trialExpirado: number;
    pagamentoEmFalta: number;
  };
  afectadas: Array<{
    empresaId: string;
    empresaNome: string;
    empresaActiva: boolean;
    assinaturaId: string;
    estado: EstadoAssinatura;
    situacao: Exclude<SituacaoAssinatura, 'EM_DIA'>;
    fimDoAcesso: string;
    diasDesdeOFim: number;
    valorTotal: string;
  }>;
  semAssinaturaActiva: Array<{ id: string; nome: string }>;
}
