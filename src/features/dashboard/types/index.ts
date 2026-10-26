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
}

export interface SuperAdminDashboardResponse {
  kpis: SuperAdminKpis;
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
