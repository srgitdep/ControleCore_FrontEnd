export interface DashboardKpis {
  vendasTotalMeticais: number;
  vendasTotalFaturas: number;
  produtosBaixoStock: number;
  funcionariosPresentes: number;
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
