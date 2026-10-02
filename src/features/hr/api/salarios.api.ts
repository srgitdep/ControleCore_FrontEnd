import { api } from '@/shared/config';

/**
 * Tipos de ausência que o gestor pode marcar. Os restantes vêm do relógio de ponto. As
 * etiquetas vivem no catálogo (`rh`, chaves `ausencia.<código>`), para seguirem a língua activa.
 */
export const TIPOS_AUSENCIA = ['FERIAS', 'BAIXA_MEDICA', 'FALTA_JUSTIFICADA', 'FERIADO'] as const;

export type TipoAusencia = (typeof TIPOS_AUSENCIA)[number];

export interface ReciboVencimento {
  id: string;
  userId: string;
  mesRef: number;
  anoRef: number;
  salarioBase: number;
  diasFalta: number;
  minutosAtraso: number;
  valorDescontos: number;
  valorBonus: number;
  totalLiquido: number;
  createdAt: string;
}

export interface ProcessarSalarioDto {
  userId: string;
  mesRef: number;
  anoRef: number;
  /** Bónus, prémio ou subsídio a somar ao líquido deste mês. */
  valorBonus?: number;
}

export interface MarcarAusenciaDto {
  userId: string;
  /** Dia da ausência, em AAAA-MM-DD. */
  data: string;
  tipo: TipoAusencia;
  observacoes?: string;
}

/**
 * Processa o salário de um mês já terminado.
 *
 * O valor/dia sai dos dias que o funcionário tinha escalados nesse mês, e a hora da
 * duração real do turno. Dias marcados como ausência justificada não descontam.
 *
 * Só pode ser processado uma vez por funcionário e por mês.
 */
export const processarSalario = async (dto: ProcessarSalarioDto) => {
  const { data } = await api.post<ReciboVencimento>('/rh/salarios/processar', dto);
  return data;
};

export const getRecibos = async (userId: string) => {
  const { data } = await api.get<ReciboVencimento[]>(`/rh/salarios/funcionario/${userId}`);
  return data;
};

/**
 * Marca um dia como ausência justificada.
 *
 * Sem esta marcação, um dia escalado sem registo de ponto conta como falta e
 * desconta salário — incluindo férias, baixa médica e feriados.
 */
export const marcarAusencia = async (dto: MarcarAusenciaDto) => {
  const { data } = await api.post('/rh/ponto/ausencia', dto);
  return data;
};
