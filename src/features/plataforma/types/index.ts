export type CodigoModulo =
  | 'catalogo'
  | 'compras'
  | 'armazem'
  | 'loja'
  | 'pos'
  | 'precos'
  | 'clientes'
  | 'pessoas'
  | 'financeiro'
  | 'direccao'
  | 'administracao';

export interface PermissaoEfectiva {
  codigo: string;
  modulo: CodigoModulo;
  descricao: string;
}

export interface ContextoAcesso {
  utilizadorId: string;
  empresaId: string;
  lojasPermitidas: string[];
  permissoes: PermissaoEfectiva[];
  total: number;
}

export type EstadoSubscricao =
  | 'TRIAL'
  | 'ATIVA'
  | 'EM_ATRASO'
  | 'EM_RENOVACAO'
  | 'EXPIRADA'
  | 'SUSPENSA'
  | 'CANCELADA';

export interface EstadoDaSubscricao {
  activa: boolean;
  leituraPermitida?: boolean;
  escritaPermitida?: boolean;
  estado: EstadoSubscricao | null;
  plano: { codigo: string; nome: string } | null;
  ciclo?: string;
  dataInicio?: string;
  dataFim?: string;
  dataRenovacao?: string | null;
  modulos: CodigoModulo[];
}

export interface ConsumoPlano {
  metrica: string;
  actual: number;
  limite: number | null;
  percentagem: number | null;
  comportamento: string | null;
}

export type TipoUnidade = 'DISCRETA' | 'CONTINUA';

export interface UnidadeMedida {
  codigo: string;
  nome: string;
  simbolo: string;
  tipo: TipoUnidade;
  casasDecimais: number;
}

export interface ConversaoCalculada {
  de: string;
  para: string;
  quantidade: string;
  factor: string;
  resultado: string;
}

export interface Plano {
  codigo: string;
  nome: string;
  descricao: string;
  precoBase: number;
  modulos: CodigoModulo[];
  limites: Record<string, number>;
  ordem: number;
}
