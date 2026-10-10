/** O contrato de `GET /procura-online` e `GET /relatorios/procura-online/sistema` — igual ao do backend. */

export interface ResumoDaProcura {
  pedidos: number;
  valor: number;
  /** A soma das taxas de entrega. */
  taxas: number;
  entregas: number;
  levantamentos: number;
  ticketMedio: number;
  /** `null` quando nenhuma entrega tem distância (loja sem localização, ou sem entregas). */
  distanciaMediaKm: number | null;
  concluidos: number;
  cancelados: number;
}

export interface ProdutoDaProcura {
  produtoId: string;
  nome: string;
  pedidos: number;
  unidades: number;
  valor: number;
  /** Pedidos por semana no período. */
  frequenciaSemanal: number;
}

export interface ZonaDaProcura {
  cidade: string | null;
  bairro: string | null;
  pedidos: number;
  valor: number;
  distanciaMediaKm: number | null;
}

export interface LojaDaProcura {
  lojaId: string;
  nome: string;
  pedidos: number;
  valor: number;
}

export interface EmpresaDaProcura {
  empresaId: string;
  nome: string;
  pedidos: number;
  valor: number;
}

export interface NavegacaoDaProcura {
  pesquisas: number;
  produtosVistos: number;
  carrinhosAdicionados: number;
  checkoutsIniciados: number;
  termos: Array<{ termo: string; pesquisas: number }>;
}

export interface RelatorioDaProcura {
  periodo: { desde: string; ate: string; dias: number };
  resumo: ResumoDaProcura;
  produtos: ProdutoDaProcura[];
  zonas: ZonaDaProcura[];
  /** 24 posições (0–23), na hora de Maputo. */
  horas: Array<{ hora: number; pedidos: number }>;
  /** 7 posições (0 = domingo … 6 = sábado), na hora de Maputo. */
  dias: Array<{ dia: number; pedidos: number }>;
  lojas: LojaDaProcura[];
  /** Só na visão do sistema. */
  empresas?: EmpresaDaProcura[];
  navegacao: NavegacaoDaProcura;
}

export interface FiltrosDaProcura {
  dias: number;
  /** Só na visão da empresa. */
  lojaId?: string;
}
