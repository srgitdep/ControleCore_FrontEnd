import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { useTranslation } from 'react-i18next';
import { mensagemDeErro } from '@/shared/utils';
import { entregaApi } from '../api/entrega.api';
import type { DadosEndereco } from '../api/entrega.api';

const CHAVE = 'loja-entrega';

export function useEnderecos(activo = true) {
  return useQuery({
    queryKey: [CHAVE, 'enderecos'],
    queryFn: () => entregaApi.listarEnderecos(),
    enabled: activo,
  });
}

export function useGuardarEndereco() {
  const queryClient = useQueryClient();
  const { t } = useTranslation('loja');

  return useMutation({
    mutationFn: ({ id, dados }: { id?: string; dados: DadosEndereco }) =>
      id ? entregaApi.actualizarEndereco(id, dados) : entregaApi.criarEndereco(dados),
    onSuccess: () => {
      toast.success(t('moradas.guardada'));
      void queryClient.invalidateQueries({ queryKey: [CHAVE] });
    },
    onError: (erro) => toast.error(mensagemDeErro(erro, t('moradas.erro_guardar'))),
  });
}

export function useRemoverEndereco() {
  const queryClient = useQueryClient();
  const { t } = useTranslation('loja');

  return useMutation({
    mutationFn: (id: string) => entregaApi.removerEndereco(id),
    onSuccess: () => {
      toast.success(t('moradas.removida'));
      void queryClient.invalidateQueries({ queryKey: [CHAVE] });
    },
    onError: (erro) => toast.error(mensagemDeErro(erro, t('moradas.erro_remover'))),
  });
}

/**
 * A cotação da entrega para a morada escolhida. Informativa — o servidor volta a cotar ao
 * criar o pedido. A chave inclui o subtotal: ao mudar o carrinho muda o valor mínimo.
 */
export function useCotacaoEntrega(
  lojaId: string | undefined,
  enderecoId: string | null,
  subtotal: number,
) {
  return useQuery({
    queryKey: [CHAVE, 'cotacao', lojaId, enderecoId, subtotal],
    queryFn: () => entregaApi.cotar({ lojaId: lojaId!, enderecoId: enderecoId!, subtotal }),
    enabled: !!lojaId && !!enderecoId,
  });
}
