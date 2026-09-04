import { api } from '@/shared/config';

/**
 * Contratos de trabalho.
 *
 * ## Porque isto faltava
 *
 * O `ContratoController` existia inteiro — criar, obter o activo, listar o histórico — e a
 * palavra «contratos» não aparecia uma única vez no frontend. O controlador era órfão.
 *
 * Não é um detalhe administrativo. `salarioBase` do contrato activo é o número de que o
 * processamento de vencimento parte, e o perfil 360 do colaborador mostra-o. Sem forma de
 * criar um contrato, esse valor fica nulo e o salário processado é zero — sem nada no ecrã
 * a dizer que a causa é a ausência de contrato.
 */

export type EstadoContrato = 'ATIVO' | 'SUSPENSO' | 'TERMINADO';

export interface Contrato {
  id: string;
  userId: string;
  cargo: string;
  salarioBase: number;
  /** ISO. */
  dataInicio: string;
  /** ISO, ou nulo quando o contrato é sem termo. */
  dataFim: string | null;
  estado: EstadoContrato;
  observacoes: string | null;
  createdAt: string;
}

export interface CriarContratoDto {
  userId: string;
  cargo: string;
  salarioBase: number;
  /** AAAA-MM-DD. */
  dataInicio: string;
  /** AAAA-MM-DD. Omitido significa sem termo. */
  dataFim?: string;
  observacoes?: string;
}

export const contratosApi = {
  /**
   * O contrato em vigor de um funcionário.
   *
   * Devolve nulo quando não há nenhum — o que é informação, não erro: um funcionário sem
   * contrato registado é o estado inicial de todos, e é o que este ecrã veio permitir
   * resolver.
   */
  activo: async (userId: string) => {
    const { data } = await api.get<Contrato | null>(`/rh/contratos/funcionario/${userId}/ativo`);
    return data;
  },

  historico: async (userId: string) => {
    const { data } = await api.get<Contrato[]>(
      `/rh/contratos/funcionario/${userId}/historico`,
    );
    return data;
  },

  /**
   * Cria ou renova um contrato.
   *
   * «Renovar» é criar outro: o anterior fica no histórico com as suas datas, e é o que
   * permite responder quanto ganhava esta pessoa em Março do ano passado. Sobrescrever o
   * contrato existente apagaria essa resposta.
   */
  criar: async (dto: CriarContratoDto) => {
    const { data } = await api.post<Contrato>('/rh/contratos', dto);
    return data;
  },
};

export const ROTULO_ESTADO_CONTRATO: Record<EstadoContrato, string> = {
  ATIVO: 'Em vigor',
  SUSPENSO: 'Suspenso',
  TERMINADO: 'Terminado',
};

export const COR_ESTADO_CONTRATO: Record<EstadoContrato, string> = {
  ATIVO: 'bg-emerald-100 text-emerald-700',
  SUSPENSO: 'bg-amber-100 text-amber-700',
  TERMINADO: 'bg-slate-100 text-slate-500',
};
