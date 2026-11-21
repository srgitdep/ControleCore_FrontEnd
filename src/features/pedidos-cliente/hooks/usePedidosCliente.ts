import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { registarPedidoCliente, getRankingPedidosCliente } from '../api/pedidosCliente.api';
import type { RegistarPedidoClienteDto } from '../api/pedidosCliente.api';
import toast from 'react-hot-toast';
import i18n from '@/i18n';
import { mensagemDeErro } from '@/shared/utils';

export function useRegistarPedidoCliente() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: RegistarPedidoClienteDto) => registarPedidoCliente(data),
    onSuccess: () => {
      toast.success(i18n.t('pos:pedidoCliente.registado'));
      queryClient.invalidateQueries({ queryKey: ['pedidos-cliente-ranking'] });
    },
    onError: (error: any) => {
      toast.error(mensagemDeErro(error, i18n.t('pos:pedidoCliente.erro_registar')));
    },
  });
}

export function useRankingPedidosCliente(lojaId?: string) {
  return useQuery({
    queryKey: ['pedidos-cliente-ranking', lojaId],
    queryFn: () => getRankingPedidosCliente(lojaId),
  });
}
