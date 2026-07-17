export type AuditAction = 'CREATE' | 'UPDATE' | 'DELETE' | 'LOGIN' | 'LOGOUT' | 'SALE_COMPLETED' | 'SALE_CANCELLED';

export interface AuditLogUser {
  id: string;
  name: string;
  email: string;
  code: string;
  role?: string;
  perfil?: { nome: string } | null;
}

export interface AuditLog {
  id: string;
  userId: string | null;
  user: AuditLogUser | null;
  action: AuditAction;
  entityName: string;
  entityId: string;
  oldValues: any | null;
  newValues: any | null;
  ipAddress: string | null;
  userAgent: string | null;
  empresaId: string | null;
  createdAt: string;
}

export interface GetAuditLogsParams {
  limit?: number;
  offset?: number;
  userId?: string;
}
