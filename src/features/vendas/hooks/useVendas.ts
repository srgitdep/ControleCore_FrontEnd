import { useMutation, useQueryClient } from '@tanstack/react-query';
import { processarVenda, enviarRecibo } from '../api/vendas.api';
import type { ProcessarVendaDto } from '../api/vendas.api';
import toast from 'react-hot-toast';
import i18n from '@/i18n';
import { mensagemDeErro } from '@/shared/utils';

export function useProcessarVenda() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: ProcessarVendaDto) => processarVenda(data),
    onSuccess: () => {
      toast.success(i18n.t('pos:venda.processada'));
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
      toast.error(mensagemDeErro(error, i18n.t('pos:venda.erro_processar')));
    }
  });
}

export function useEnviarRecibo() {
  return useMutation({
    mutationFn: ({ vendaId, email }: { vendaId: string; email: string }) => enviarRecibo(vendaId, email),
    onSuccess: () => {
      toast.success(i18n.t('pos:recibo.enviado'));
    },
    onError: (error: any) => {
      toast.error(mensagemDeErro(error, i18n.t('pos:recibo.erro_enviar')));
    }
  });
}
