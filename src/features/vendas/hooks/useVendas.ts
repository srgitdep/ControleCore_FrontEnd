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
      // Invalidate relevant queries (e.g. caixas, finance, products)
      queryClient.invalidateQueries({ queryKey: ['minha-sessao'] });
      queryClient.invalidateQueries({ queryKey: ['produtos'] });
      queryClient.invalidateQueries({ queryKey: ['finance'] });
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
