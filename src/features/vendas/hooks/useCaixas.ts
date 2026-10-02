import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  obterCaixasDisponiveis, 
  obterMinhaSessao, 
  obterHistoricoSessoes, 
  abrirSessao, 
  fecharSessao, 
  registrarSangria, 
  registrarReforco,
  getAllCaixas,
  criarCaixa,
  atualizarCaixa,
  removerCaixa
} from '../api/caixas.api';
import toast from 'react-hot-toast';
import i18n from '@/i18n';
import { mensagemDeErro } from '@/shared/utils';

export function useCaixasDisponiveis() {
  return useQuery({
    queryKey: ['caixas-disponiveis'],
    queryFn: obterCaixasDisponiveis,
  });
}

export function useMinhaSessao() {
  return useQuery({
    queryKey: ['minha-sessao'],
    queryFn: obterMinhaSessao,
    retry: false, // Don't retry if it fails (e.g., 404 because no session exists)
  });
}

export function useHistoricoSessoes() {
  return useQuery({
    queryKey: ['historico-sessoes'],
    queryFn: obterHistoricoSessoes,
  });
}

export function useAbrirSessao() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ caixaId, saldoInicial }: { caixaId: string; saldoInicial: number }) => abrirSessao(caixaId, saldoInicial),
    onSuccess: () => {
      toast.success(i18n.t('pos:caixa.aberta'));
      queryClient.invalidateQueries({ queryKey: ['minha-sessao'] });
      queryClient.invalidateQueries({ queryKey: ['caixas-disponiveis'] });
    },
    onError: (error: any) => {
      toast.error(mensagemDeErro(error, i18n.t('pos:caixa.erro_abrir')));
    }
  });
}

export function useFecharSessao() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ sessaoId, payload }: { sessaoId: string; payload: { saldoDeclarado: number; observacoes?: string } }) => fecharSessao(sessaoId, payload),
    onSuccess: () => {
      toast.success(i18n.t('pos:caixa.fechada'));
      queryClient.invalidateQueries({ queryKey: ['minha-sessao'] });
      queryClient.invalidateQueries({ queryKey: ['historico-sessoes'] });
    },
    onError: (error: any) => {
      toast.error(mensagemDeErro(error, i18n.t('pos:caixa.erro_fechar')));
    }
  });
}

export function useRegistrarSangria() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ sessaoId, payload }: { sessaoId: string; payload: { valor: number; motivo: string } }) => registrarSangria(sessaoId, payload),
    onSuccess: () => {
      toast.success(i18n.t('pos:caixa.sangria_registada'));
      queryClient.invalidateQueries({ queryKey: ['minha-sessao'] });
    },
    onError: (error: any) => {
      toast.error(mensagemDeErro(error, i18n.t('pos:caixa.erro_sangria')));
    }
  });
}

export function useRegistrarReforco() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ sessaoId, payload }: { sessaoId: string; payload: { valor: number; motivo: string } }) => registrarReforco(sessaoId, payload),
    onSuccess: () => {
      toast.success(i18n.t('pos:caixa.reforco_registado'));
      queryClient.invalidateQueries({ queryKey: ['minha-sessao'] });
    },
    onError: (error: any) => {
      toast.error(mensagemDeErro(error, i18n.t('pos:caixa.erro_reforco')));
    }
  });
}

// Físicos
export function useCaixasFisicos() {
  return useQuery({
    queryKey: ['caixas-fisicos'],
    queryFn: getAllCaixas,
  });
}

export function useCriarCaixaFisico() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: { lojaId: string; nome: string }) => criarCaixa(data),
    onSuccess: () => {
      toast.success(i18n.t('pos:caixa.criado'));
      queryClient.invalidateQueries({ queryKey: ['caixas-fisicos'] });
    },
    onError: (error: any) => {
      toast.error(mensagemDeErro(error, i18n.t('pos:caixa.erro_criar')));
    }
  });
}

export function useAtualizarCaixaFisico() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: { nome: string; isActive: boolean } }) => atualizarCaixa(id, data),
    onSuccess: () => {
      toast.success(i18n.t('pos:caixa.atualizado'));
      queryClient.invalidateQueries({ queryKey: ['caixas-fisicos'] });
    },
    onError: (error: any) => {
      toast.error(mensagemDeErro(error, i18n.t('pos:caixa.erro_atualizar')));
    }
  });
}

export function useRemoverCaixaFisico() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: removerCaixa,
    onSuccess: () => {
      toast.success(i18n.t('pos:caixa.removido'));
      queryClient.invalidateQueries({ queryKey: ['caixas-fisicos'] });
    },
    onError: (error: any) => {
      toast.error(mensagemDeErro(error, i18n.t('pos:caixa.erro_remover')));
    }
  });
}
