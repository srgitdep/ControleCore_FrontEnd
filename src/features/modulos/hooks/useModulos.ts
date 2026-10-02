import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { useTranslation } from 'react-i18next';
import { mensagemDeErro } from '@/shared/utils';
import { modulosApi } from '../api/modulos.api';
import type { CriarModuloDto, ActualizarModuloDto } from '../api/modulos.api';

export function useModulos(incluirInativos = false) {
  return useQuery({
    queryKey: ['modulos-catalogo', incluirInativos],
    queryFn: () => modulosApi.listar(incluirInativos),
  });
}

export function useCriarModulo() {
  const { t } = useTranslation('modulos');
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (dto: CriarModuloDto) => modulosApi.criar(dto),
    onSuccess: () => {
      toast.success(t('mensagens.criado'));
      queryClient.invalidateQueries({ queryKey: ['modulos-catalogo'] });
    },
    onError: (error: any) => {
      toast.error(mensagemDeErro(error, t('mensagens.erro_criar')));
    },
  });
}

export function useActualizarModulo() {
  const { t } = useTranslation('modulos');
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, dto }: { id: string; dto: ActualizarModuloDto }) =>
      modulosApi.actualizar(id, dto),
    onSuccess: () => {
      toast.success(t('mensagens.actualizado'));
      queryClient.invalidateQueries({ queryKey: ['modulos-catalogo'] });
    },
    onError: (error: any) => {
      toast.error(mensagemDeErro(error, t('mensagens.erro_actualizar')));
    },
  });
}

export function useMudarEstadoModulo() {
  const { t } = useTranslation('modulos');
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, isAtivo }: { id: string; isAtivo: boolean }) =>
      modulosApi.mudarEstado(id, isAtivo),
    onSuccess: (modulo) => {
      toast.success(
        modulo.isAtivo
          ? t('mensagens.activado', { nome: modulo.nome })
          : t('mensagens.desactivado', { nome: modulo.nome }),
      );
      queryClient.invalidateQueries({ queryKey: ['modulos-catalogo'] });
    },
    onError: (error: any) => {
      toast.error(mensagemDeErro(error, t('mensagens.erro_estado')));
    },
  });
}

export function useApagarModulo() {
  const { t } = useTranslation('modulos');
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => modulosApi.apagar(id),
    onSuccess: () => {
      toast.success(t('mensagens.apagado'));
      queryClient.invalidateQueries({ queryKey: ['modulos-catalogo'] });
    },
    onError: (error: any) => {
      // Módulo com assinaturas devolve 400/409 explicando — sugerir desactivar em vez.
      toast.error(mensagemDeErro(error, t('mensagens.erro_apagar')));
    },
  });
}
