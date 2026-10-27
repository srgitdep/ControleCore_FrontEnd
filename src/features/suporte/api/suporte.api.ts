import { api } from '@/shared/config';
import type {
  EntrarSuportePayload,
  SessaoDeSuporte,
  SessaoEntrada,
  SuporteActual,
} from '../types';

export const entrarEmSuporte = async (payload: EntrarSuportePayload) => {
  const { data } = await api.post<SessaoEntrada>('/plataforma/suporte/entrar', payload);
  return data;
};

export const sairDeSuporte = async () => {
  const { data } = await api.post<{ terminada: boolean }>('/suporte/sair');
  return data;
};

export const getSuporteActual = async () => {
  const { data } = await api.get<SuporteActual>('/suporte/actual');
  return data;
};

export const getSessoesDeSuporte = async () => {
  const { data } = await api.get<SessaoDeSuporte[]>('/suporte/sessoes');
  return data;
};
