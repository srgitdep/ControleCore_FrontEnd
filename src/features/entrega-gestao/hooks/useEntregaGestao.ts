import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { useTranslation } from 'react-i18next';
import { mensagemDeErro } from '@/shared/utils';
import { entregaGestaoApi } from '../api/entrega-gestao.api';
import type {
  ActualizarConfiguracaoPayload,
  ActualizarZonaPayload,
  CriarZonaPayload,
} from '../types';

const CHAVE = 'entrega-gestao';

export function useZonasEntrega(lojaId?: string) {
  return useQuery({
    queryKey: [CHAVE, 'zonas', lojaId ?? null],
    queryFn: () => entregaGestaoApi.listarZonas(lojaId),
  });
}

export function useConfiguracaoEntrega() {
  return useQuery({
    queryKey: [CHAVE, 'configuracao'],
    queryFn: () => entregaGestaoApi.obterConfiguracao(),
  });
}

/** Uma zona nova ou alterada muda o que cada loja precisa para ligar a entrega. */
function useInvalidar() {
  const queryClient = useQueryClient();
  return () => queryClient.invalidateQueries({ queryKey: [CHAVE] });
}

export function useCriarZona() {
  const { t } = useTranslation('entrega');
  const invalidar = useInvalidar();
  return useMutation({
    mutationFn: (payload: CriarZonaPayload) => entregaGestaoApi.criarZona(payload),
    onSuccess: () => {
      toast.success(t('mensagens.zona_criada'));
      void invalidar();
    },
    onError: (erro) => toast.error(mensagemDeErro(erro, t('mensagens.erro_zona'))),
  });
}

export function useActualizarZona() {
  const { t } = useTranslation('entrega');
  const invalidar = useInvalidar();
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: ActualizarZonaPayload }) =>
      entregaGestaoApi.actualizarZona(id, payload),
    onSuccess: () => {
      toast.success(t('mensagens.zona_actualizada'));
      void invalidar();
    },
    onError: (erro) => toast.error(mensagemDeErro(erro, t('mensagens.erro_zona'))),
  });
}

export function useActualizarConfiguracaoEntrega() {
  const { t } = useTranslation('entrega');
  const invalidar = useInvalidar();
  return useMutation({
    mutationFn: (payload: ActualizarConfiguracaoPayload) =>
      entregaGestaoApi.actualizarConfiguracao(payload),
    onSuccess: () => {
      toast.success(t('mensagens.configuracao_guardada'));
      void invalidar();
    },
    onError: (erro) => toast.error(mensagemDeErro(erro, t('mensagens.erro_configuracao'))),
  });
}
