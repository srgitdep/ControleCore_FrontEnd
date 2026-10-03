import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { useTranslation } from 'react-i18next';
import { mensagemDeErro } from '@/shared/utils';
import { useContaClienteStore } from '../store/useContaClienteStore';
import { favoritos } from '../api/favoritos.api';

const CHAVE = 'loja';

/**
 * A lista de favoritos do cliente autenticado.
 *
 * Desligada sem sessão (`enabled`): um visitante sem conta não tem favoritos, e a
 * chamada daria 401 em cada cartão de produto do mercado.
 */
export function useFavoritos() {
  const autenticado = useContaClienteStore((s) => s.autenticado);

  return useQuery({
    queryKey: [CHAVE, 'favoritos'],
    queryFn: () => favoritos.listar(),
    enabled: autenticado,
  });
}

export function useAlternarFavorito() {
  const queryClient = useQueryClient();
  const { t } = useTranslation('loja');

  const invalidar = () =>
    queryClient.invalidateQueries({ queryKey: [CHAVE, 'favoritos'] });

  const adicionar = useMutation({
    mutationFn: (produtoId: string) => favoritos.adicionar(produtoId),
    onSuccess: invalidar,
    onError: (erro) => toast.error(mensagemDeErro(erro, t('favoritos.erro_adicionar'))),
  });

  const remover = useMutation({
    mutationFn: (produtoId: string) => favoritos.remover(produtoId),
    onSuccess: invalidar,
    onError: (erro) => toast.error(mensagemDeErro(erro, t('favoritos.erro_remover'))),
  });

  return { adicionar, remover };
}
