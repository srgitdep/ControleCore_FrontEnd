import { api } from '@/api/axios';
import type { Employee, WeeklySchedule, Employee360Profile } from '../types';

/**
 * Lista todos os funcionários activos da empresa autenticada.
 * Dados sensíveis (salário, BI, NUIT) não são retornados por este endpoint.
 */
export const getEmployees = async (): Promise<Employee[]> => {
  const { data } = await api.get<Employee[]>('/hr/funcionarios');
  return data;
};

/**
 * Retorna a escala semanal de turnos.
 * @param dataInicial - YYYY-MM-DD
 * @param dataFinal   - YYYY-MM-DD
 * @param lojaId      - Opcional. Se omitido, retorna todas as lojas.
 */
export const getWeeklySchedule = async (
  dataInicial: string,
  dataFinal: string,
  lojaId?: string,
): Promise<WeeklySchedule> => {
  const params: Record<string, string> = { dataInicial, dataFinal };
  if (lojaId) params.lojaId = lojaId;

  const { data } = await api.get<WeeklySchedule>('/hr/escalas/semanal', { params });
  return data;
};

/**
 * Retorna a Visão 360º de um funcionário.
 * @param id - ID do funcionário
 */
export const getEmployee360Profile = async (id: string): Promise<Employee360Profile> => {
  const { data } = await api.get<Employee360Profile>(`/hr/employees/${id}/360-profile`);
  return data;
};
