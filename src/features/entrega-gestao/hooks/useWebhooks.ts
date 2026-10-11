import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { useTranslation } from 'react-i18next';
import { mensagemDeErro } from '@/shared/utils';
import { webhookApi } from '../api/webhook.api';
import type { ActualizarSubscricaoPayload, CriarSubscricaoPayload } from '../types/webhook';

const CHAVE = 'entrega-webhooks';

export function useSubscricoesWebhook() {
  return useQuery({ queryKey: [CHAVE, 'lista'], queryFn: () => webhookApi.listar() });
}

/** Os envios de uma subscrição. Refaz-se de 15 em 15 s: um teste ou um recuo muda o estado sozinho. */
export function useEnviosWebhook(subscricaoId: string | null, pagina: number, estado?: string) {
  return useQuery({
    queryKey: [CHAVE, 'envios', subscricaoId, pagina, estado ?? null],
    queryFn: () => webhookApi.envios(subscricaoId!, pagina, estado),
    enabled: !!subscricaoId,
    refetchInterval: 15_000,
    placeholderData: (anterior) => anterior,
  });
}

/** Quem pode receber uma entrega delegada. Sem operadores (ou sem permissão), o botão «Delegar» não aparece. */
export function useOperadoresExternos(activo = true) {
  return useQuery({
    queryKey: [CHAVE, 'operadores'],
    queryFn: () => webhookApi.operadores(),
    enabled: activo,
    retry: false,
    staleTime: 60_000,
  });
}

function useInvalidar() {
  const queryClient = useQueryClient();
  return () => queryClient.invalidateQueries({ queryKey: [CHAVE] });
}

export function useCriarSubscricao() {
  const { t } = useTranslation('entrega');
  const invalidar = useInvalidar();
  return useMutation({
    mutationFn: (payload: CriarSubscricaoPayload) => webhookApi.criar(payload),
    onSuccess: () => void invalidar(),
    onError: (erro) => toast.error(mensagemDeErro(erro, t('webhooks.mensagens.erro_guardar'))),
  });
}

export function useActualizarSubscricao() {
  const { t } = useTranslation('entrega');
  const invalidar = useInvalidar();
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: ActualizarSubscricaoPayload }) =>
      webhookApi.actualizar(id, payload),
    onSuccess: () => {
      toast.success(t('webhooks.mensagens.guardado'));
      void invalidar();
    },
    onError: (erro) => toast.error(mensagemDeErro(erro, t('webhooks.mensagens.erro_guardar'))),
  });
}

export function useApagarSubscricao() {
  const { t } = useTranslation('entrega');
  const invalidar = useInvalidar();
  return useMutation({
    mutationFn: (id: string) => webhookApi.apagar(id),
    onSuccess: () => {
      toast.success(t('webhooks.mensagens.apagado'));
      void invalidar();
    },
    onError: (erro) => toast.error(mensagemDeErro(erro, t('webhooks.mensagens.erro_apagar'))),
  });
}

export function useRodarSegredo() {
  const { t } = useTranslation('entrega');
  const invalidar = useInvalidar();
  return useMutation({
    mutationFn: (id: string) => webhookApi.rodarSegredo(id),
    onSuccess: () => void invalidar(),
    onError: (erro) => toast.error(mensagemDeErro(erro, t('webhooks.mensagens.erro_rodar'))),
  });
}

/** O resultado do teste é para mostrar no ecrã (sucesso ou o erro do receptor), não só um aviso. */
export function useTestarSubscricao() {
  const { t } = useTranslation('entrega');
  const invalidar = useInvalidar();
  return useMutation({
    mutationFn: (id: string) => webhookApi.testar(id),
    onSettled: () => void invalidar(),
    onError: (erro) => toast.error(mensagemDeErro(erro, t('webhooks.mensagens.erro_testar'))),
  });
}

export function useReenviarEnvio() {
  const { t } = useTranslation('entrega');
  const invalidar = useInvalidar();
  return useMutation({
    mutationFn: (envioId: string) => webhookApi.reenviar(envioId),
    onSuccess: () => {
      toast.success(t('webhooks.mensagens.reenviado'));
      void invalidar();
    },
    onError: (erro) => toast.error(mensagemDeErro(erro, t('webhooks.mensagens.erro_reenviar'))),
  });
}

export function useDelegarEntrega() {
  const { t } = useTranslation('entrega');
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, operadorId }: { id: string; operadorId: string }) => webhookApi.delegar(id, operadorId),
    onSuccess: () => toast.success(t('mensagens.entrega_actualizada')),
    onError: (erro) => toast.error(mensagemDeErro(erro, t('mensagens.erro_operacao'))),
    onSettled: () => void queryClient.invalidateQueries({ queryKey: ['entrega-operacao', 'entregas'] }),
  });
}
