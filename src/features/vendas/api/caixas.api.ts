import { api } from '@/api/axios';

export const obterCaixasDisponiveis = async () => {
  const { data } = await api.get('/caixas/disponiveis');
  return data;
};

export const obterMinhaSessao = async () => {
  try {
    const { data } = await api.get('/caixas/sessao/atual');
    return data;
  } catch (error) {
    return null;
  }
};

export const obterHistoricoSessoes = async () => {
  const { data } = await api.get('/caixas/sessoes/historico');
  return data;
};

export const abrirSessao = async (caixaId: string, saldoInicial: number) => {
  const { data } = await api.post(`/caixas/${caixaId}/abrir`, { saldoInicial });
  return data;
};

export const fecharSessao = async (sessaoId: string, payload: { saldoDeclarado: number; observacoes?: string }) => {
  const { data } = await api.post(`/caixas/sessao/${sessaoId}/fechar`, payload);
  return data;
};

export const registrarSangria = async (sessaoId: string, payload: { valor: number; motivo: string }) => {
  const { data } = await api.post(`/caixas/sessao/${sessaoId}/sangria`, payload);
  return data;
};

export const registrarReforco = async (sessaoId: string, payload: { valor: number; motivo: string }) => {
  const { data } = await api.post(`/caixas/sessao/${sessaoId}/reforco`, payload);
  return data;
};

// ─── GESTÃO FÍSICA DOS CAIXAS ──────────────────────────────────────────
export const getAllCaixas = async () => {
  const { data } = await api.get('/caixas/gestao');
  return data;
};

export const criarCaixa = async (caixa: { lojaId: string; nome: string }) => {
  const { data } = await api.post(`/caixas/gestao/${caixa.lojaId}`, { nome: caixa.nome });
  return data;
};

export const atualizarCaixa = async (id: string, caixa: { nome: string; isActive: boolean }) => {
  const { data } = await api.patch(`/caixas/gestao/${id}`, caixa);
  return data;
};

export const removerCaixa = async (id: string) => {
  const { data } = await api.delete(`/caixas/gestao/${id}`);
  return data;
};
