export interface DashboardKpis {
  vendasTotalMeticais: number;
  vendasTotalFaturas: number;
  produtosBaixoStock: number;
  funcionariosPresentes: number;
  /** Pedidos do Compra Fácil por atender — sem filtro de data, ao contrário dos de vendas. */
  pedidosPendentes: number;
}

export interface ChartData {
  dia: string;
  valor: number;
}

export interface AdminDashboardResponse {
  kpis: DashboardKpis;
  graficoVendasSemana: ChartData[];
}

export interface SuperAdminKpis {
  totalEmpresas: number;
  totalUtilizadores: number;
  totalLojas: number;
  subscricoesAtivas: number;
  /** Trials cujo fim cai nos próximos 7 dias. */
  trialsAExpirar: number;
  empresasEmAtraso: number;
  /** Empresas sem acesso: sem assinatura que o dê e com alguma expirada, suspensa ou cancelada. */
  empresasSuspensas: number;
  /** Em meticais, por mês: o valor de cada ciclo repartido pelos seus meses. */
  receitaMensalRecorrente: number;
}

export type TipoDeActividade =
  | 'ADESAO_DECIDIDA'
  | 'ASSINATURA_ALTERADA'
  | 'PAGAMENTO_REGISTADO'
  | 'ASSINATURA_EXPIRADA'
  | 'SUPORTE_ENTROU'
  | 'SUPORTE_SAIU'
  | 'EMPRESA_CRIADA'
  | 'EMPRESA_APAGADA'
  | 'EMPRESA_ESTADO'
  | 'SUPER_ADMIN_CRIADO';

export interface ActividadeDaPlataforma {
  id: string;
  tipo: TipoDeActividade;
  quando: string;
  /** `null` numa empresa apagada ou num evento sem empresa (adesão, Super Admin criado). */
  empresaNome: string | null;
  actor: string | null;
  detalhe: string | null;
}

export interface SuperAdminDashboardResponse {
  kpis: SuperAdminKpis;
  actividade: ActividadeDaPlataforma[];
}

/** `GET /super-admins` — os operadores da plataforma. */
export interface SuperAdminResumo {
  id: string;
  code: string;
  name: string;
  email: string;
  isActive: boolean;
  /** `false` até ao primeiro login com código: o QR ainda não foi lido. */
  mfaActivo: boolean;
  createdAt: string;
}

export interface CriarSuperAdminPayload {
  name: string;
  email: string;
}

/**
 * `POST /super-admins`. `senhaInicial` só vem nesta resposta — o servidor guarda o hash —,
 * e `emailEnviado: false` quer dizer que quem criou tem de entregar as credenciais à mão.
 */
export interface SuperAdminCriado extends Omit<SuperAdminResumo, 'mfaActivo'> {
  role: 'SUPER_ADMIN';
  senhaInicial: string;
  emailEnviado: boolean;
}

/** `POST /super-admins/:id/repor-senha` — a senha nova, uma única vez. */
export interface SenhaSuperAdminReposta {
  id: string;
  code: string;
  senhaInicial: string;
  emailEnviado: boolean;
}
