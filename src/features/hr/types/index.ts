// Tipos locais do módulo HR — sem importações do backend
// Mapeiam os contratos da API REST em /hr/*

export type EmployeeRole =
  | 'SUPER_ADMIN'
  | 'ADMIN'
  | 'MANAGER'
  | 'CASHIER'
  | 'STOCK_KEEPER'
  | 'USER';

export interface Employee {
  id: string;
  nome: string;
  email: string;
  cargo: EmployeeRole;
  isActive: boolean;
  dataContratacao: string | null; // YYYY-MM-DD
}

export interface Shift {
  funcionario: string;
  turno: string;
  horaInicio: string; // HH:mm
  horaFim: string;   // HH:mm
  data: string;       // YYYY-MM-DD
  lojaId: string;
  lojaNome: string;
}

export interface WeeklySchedule {
  totalEscalas: number;
  periodo: { inicio: string; fim: string };
  escalas: Shift[];
}

export interface Employee360Profile {
  perfil: {
    id: string;
    nome: string;
    email: string;
    cargo: EmployeeRole;
    isActive: boolean;
    dataContratacao: string;
    bi: string | null;
    nuit: string | null;
    salarioBase: number | null;
  };
  assiduidade: {
    turnosPlaneados: number;
    diasTrabalhados: number;
    faltas: number;
    atrasos: number;
    minutosAtraso: number;
  };
  performance: {
    totalVendido: number;
    ticketMedio: number;
    diferencasCaixa: number;
    sessoesFechadas: number;
  } | null;
  auditoria: Array<{
    id: string;
    action: string;
    entityName: string;
    entityId: string;
    createdAt: string;
  }>;
}
