import { api } from './axios';
import type { AuditLog, GetAuditLogsParams } from '@/types/auditoria.types';

export const getAuditLogs = async (params?: GetAuditLogsParams): Promise<AuditLog[]> => {
  const { data } = await api.get<AuditLog[]>('/auditoria/logs', { params });
  return data;
};
