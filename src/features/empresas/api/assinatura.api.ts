import { api } from '@/shared/config';
import type {
  AlterarAssinaturaPayload,
  RegistarPagamentoPayload,
  RelatorioExpiracao,
  RespostaAssinatura,
} from '../types/assinatura';

// As rotas da plataforma (só Super Admin): a assinatura de uma empresa e o relatório.

export const getAssinatura = async (empresaId: string) => {
  const { data } = await api.get<RespostaAssinatura>(`/plataforma/empresas/${empresaId}/assinatura`);
  return data;
};

export const alterarAssinatura = async (empresaId: string, payload: AlterarAssinaturaPayload) => {
  const { data } = await api.patch<RespostaAssinatura>(`/plataforma/empresas/${empresaId}/assinatura`, payload);
  return data;
};

export const registarPagamento = async (empresaId: string, payload: RegistarPagamentoPayload) => {
  const { data } = await api.post<RespostaAssinatura>(
    `/plataforma/empresas/${empresaId}/assinatura/pagamentos`,
    payload,
  );
  return data;
};

export const getRelatorioExpiracao = async () => {
  const { data } = await api.get<RelatorioExpiracao>('/plataforma/assinaturas/relatorio-expiracao');
  return data;
};
