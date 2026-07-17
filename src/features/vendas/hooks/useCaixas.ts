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
      toast.success('Caixa aberto com sucesso!');
      queryClient.invalidateQueries({ queryKey: ['minha-sessao'] });
      queryClient.invalidateQueries({ queryKey: ['caixas-disponiveis'] });
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Erro ao abrir caixa.');
    }
  });
}

export function useFecharSessao() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ sessaoId, payload }: { sessaoId: string; payload: { saldoDeclarado: number; observacoes?: string } }) => fecharSessao(sessaoId, payload),
    onSuccess: () => {
      toast.success('Caixa fechado com sucesso!');
      queryClient.invalidateQueries({ queryKey: ['minha-sessao'] });
      queryClient.invalidateQueries({ queryKey: ['historico-sessoes'] });
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Erro ao fechar caixa.');
    }
  });
}

export function useRegistrarSangria() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ sessaoId, payload }: { sessaoId: string; payload: { valor: number; motivo: string } }) => registrarSangria(sessaoId, payload),
    onSuccess: () => {
      toast.success('Sangria registada com sucesso!');
      queryClient.invalidateQueries({ queryKey: ['minha-sessao'] });
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Erro ao registar sangria.');
    }
  });
}

export function useRegistrarReforco() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ sessaoId, payload }: { sessaoId: string; payload: { valor: number; motivo: string } }) => registrarReforco(sessaoId, payload),
    onSuccess: () => {
      toast.success('Reforço registado com sucesso!');
      queryClient.invalidateQueries({ queryKey: ['minha-sessao'] });
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Erro ao registar reforço.');
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
      toast.success('Caixa criado com sucesso!');
      queryClient.invalidateQueries({ queryKey: ['caixas-fisicos'] });
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Erro ao criar caixa.');
    }
  });
}

export function useAtualizarCaixaFisico() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: { nome: string; isActive: boolean } }) => atualizarCaixa(id, data),
    onSuccess: () => {
      toast.success('Caixa atualizado com sucesso!');
      queryClient.invalidateQueries({ queryKey: ['caixas-fisicos'] });
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Erro ao atualizar caixa.');
    }
  });
}

export function useRemoverCaixaFisico() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: removerCaixa,
    onSuccess: () => {
      toast.success('Caixa removido com sucesso!');
      queryClient.invalidateQueries({ queryKey: ['caixas-fisicos'] });
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Erro ao remover caixa.');
    }
  });
}
