import { useMutation, useQueryClient } from '@tanstack/react-query';
import { processarVenda, enviarRecibo } from '../api/vendas.api';
import type { ProcessarVendaDto } from '../api/vendas.api';
import toast from 'react-hot-toast';

export function useProcessarVenda() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: ProcessarVendaDto) => processarVenda(data),
    onSuccess: () => {
      toast.success('Venda processada com sucesso!');
      queryClient.invalidateQueries({ queryKey: ['minha-sessao'] });
      queryClient.invalidateQueries({ queryKey: ['produtos'] });
      queryClient.invalidateQueries({ queryKey: ['finance'] });
      // A venda abate stock e cria movimentos: sem isto, quem tenha o módulo de
      // Stock aberto continuaria a ver saldos anteriores à venda.
      queryClient.invalidateQueries({ queryKey: ['stocks'] });
      queryClient.invalidateQueries({ queryKey: ['stock'] });
      queryClient.invalidateQueries({ queryKey: ['stock-movements'] });
      queryClient.invalidateQueries({ queryKey: ['all-stock-movements'] });
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Erro ao processar venda.');
    }
  });
}

export function useEnviarRecibo() {
  return useMutation({
    mutationFn: ({ vendaId, email }: { vendaId: string; email: string }) => enviarRecibo(vendaId, email),
    onSuccess: () => {
      toast.success('Recibo enviado com sucesso!');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Erro ao enviar recibo.');
    }
  });
}
