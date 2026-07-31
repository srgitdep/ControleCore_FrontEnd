export type AuditAction =
  | 'CREATE'
  | 'UPDATE'
  | 'DELETE'
  | 'LOGIN'
  | 'LOGOUT'
  | 'SYSTEM_ACTION'
  | 'SALE_COMPLETED'
  | 'SALE_CANCELLED';

export interface AuditLogUser {
  id: string;
  name: string;
  email: string;
  code?: string;
  role?: string;
  perfil?: { nome: string } | null;
}

/** Campos que a tabela usa para descrever o registo, quando existem. */
export interface ValoresAuditoria {
  nome?: string;
  name?: string;
  numeroFatura?: string;
  email?: string;
  titulo?: string;
  [campo: string]: unknown;
}

export interface AuditLog {
  id: string;
  userId: string | null;
  user: AuditLogUser | null;
  action: AuditAction;
  entityName: string;
  entityId: string;
  oldValues: ValoresAuditoria | null;
  newValues: ValoresAuditoria | null;
  ipAddress: string | null;
  userAgent: string | null;
  empresaId: string | null;
  createdAt: string;
  sequencia?: number | null;
  hash?: string | null;
  hashAnterior?: string | null;
  origem?: string | null;
  campos?: string[];
  contextoMayra?: unknown;
}

export interface GetAuditLogsParams {
  limit?: number;
  offset?: number;
  userId?: string;
}

export interface ResultadoValidacaoCadeia {
  empresaId: string;
  total: number;
  validos: number;
  legados: number;
  invalidos: Array<{ id: string; sequencia: number | null; motivo: string }>;
  ok: boolean;
}
