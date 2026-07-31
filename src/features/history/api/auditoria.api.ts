import { api } from '@/shared/config';
import type {
  AuditLog,
  GetAuditLogsParams,
  ResultadoValidacaoCadeia,
} from '@/features/history';

export const getAuditLogs = async (params?: GetAuditLogsParams): Promise<AuditLog[]> => {
  const { data } = await api.get<AuditLog[]>('/auditoria/logs', { params });
  return data;
};

export const createAuditLog = async (payload: {
  action: string;
  entityName: string;
  entityId: string;
  details?: unknown;
}): Promise<{ success: boolean }> => {
  const { data } = await api.post<{ success: boolean }>('/auditoria/logs', payload);
  return data;
};

/** PLT-27 */
export const getAuditTimeline = async (
  entidade: string,
  entidadeId: string,
): Promise<AuditLog[]> => {
  const { data } = await api.get<AuditLog[]>(
    `/auditoria/timeline/${encodeURIComponent(entidade)}/${encodeURIComponent(entidadeId)}`,
  );
  return data;
};

/** PLT-25 */
export const validarCadeiaAuditoria = async (): Promise<ResultadoValidacaoCadeia> => {
  const { data } = await api.post<ResultadoValidacaoCadeia>('/auditoria/validar-cadeia');
  return data;
};
