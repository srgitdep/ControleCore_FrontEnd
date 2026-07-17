import { api } from './axios';

export const obterCaixasDisponiveis = async () => {
  const { data } = await api.get('/caixas/sessoes/disponiveis');
  return data;
};

export const obterMinhaSessao = async () => {
  try {
    const { data } = await api.get('/caixas/sessoes/minha-sessao');
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
  const { data } = await api.post('/caixas/sessoes/abrir', { caixaId, saldoInicial });
  return data;
};

export const fecharSessao = async (sessaoId: string, payload: { saldoDeclarado: number; observacoes?: string }) => {
  const { data } = await api.post(`/caixas/sessoes/${sessaoId}/fechar`, payload);
  return data;
};

export const registrarSangria = async (sessaoId: string, payload: { valor: number; motivo: string }) => {
  const { data } = await api.post(`/caixas/sessoes/${sessaoId}/sangria`, payload);
  return data;
};

export const registrarReforco = async (sessaoId: string, payload: { valor: number; motivo: string }) => {
  const { data } = await api.post(`/caixas/sessoes/${sessaoId}/reforco`, payload);
  return data;
};

// â”€â”€â”€ GESTÃƒO FÃSICA DOS CAIXAS â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
export const getAllCaixas = async () => {
  const { data } = await api.get('/caixas');
  return data;
};

export const criarCaixa = async (caixa: { lojaId: string; nome: string }) => {
  const { data } = await api.post('/caixas', caixa);
  return data;
};

export const atualizarCaixa = async (id: string, caixa: { nome: string; isActive: boolean }) => {
  const { data } = await api.put(`/caixas/${id}`, caixa);
  return data;
};

export const removerCaixa = async (id: string) => {
  const { data } = await api.delete(`/caixas/${id}`);
  return data;
};

