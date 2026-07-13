import { api } from './axios';
import type { AuditLog, GetAuditLogsParams } from '@/types/auditoria.types';

export const getAuditLogs = async (params?: GetAuditLogsParams): Promise<AuditLog[]> => {
  const { data } = await api.get<AuditLog[]>('/auditoria/logs', { params });
  return data;
};

export const createAuditLog = async (payload: { action: string; entityName: string; entityId: string; details?: any }): Promise<{ success: boolean }> => {
  const { data } = await api.post<{ success: boolean }>('/auditoria/logs', payload);
  return data;
};
