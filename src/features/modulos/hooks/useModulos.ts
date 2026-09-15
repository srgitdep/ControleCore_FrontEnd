import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { modulosApi } from '../api/modulos.api';
import type { CriarModuloDto, ActualizarModuloDto } from '../api/modulos.api';

export function useModulos(incluirInativos = false) {
  return useQuery({
    queryKey: ['modulos-catalogo', incluirInativos],
    queryFn: () => modulosApi.listar(incluirInativos),
  });
}

export function useCriarModulo() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (dto: CriarModuloDto) => modulosApi.criar(dto),
    onSuccess: () => {
      toast.success('Módulo criado.');
      queryClient.invalidateQueries({ queryKey: ['modulos-catalogo'] });
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.message || 'Erro ao criar o módulo.');
    },
  });
}

export function useActualizarModulo() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, dto }: { id: string; dto: ActualizarModuloDto }) =>
      modulosApi.actualizar(id, dto),
    onSuccess: () => {
      toast.success('Módulo actualizado.');
      queryClient.invalidateQueries({ queryKey: ['modulos-catalogo'] });
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.message || 'Erro ao actualizar o módulo.');
    },
  });
}

export function useMudarEstadoModulo() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, isAtivo }: { id: string; isAtivo: boolean }) =>
      modulosApi.mudarEstado(id, isAtivo),
    onSuccess: (modulo) => {
      toast.success(modulo.isAtivo ? `«${modulo.nome}» activado.` : `«${modulo.nome}» desactivado.`);
      queryClient.invalidateQueries({ queryKey: ['modulos-catalogo'] });
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.message || 'Erro ao mudar o estado do módulo.');
    },
  });
}

export function useApagarModulo() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => modulosApi.apagar(id),
    onSuccess: () => {
      toast.success('Módulo apagado.');
      queryClient.invalidateQueries({ queryKey: ['modulos-catalogo'] });
    },
    onError: (error: any) => {
      // Módulo com assinaturas devolve 400/409 explicando — sugerir desactivar em vez.
      toast.error(error?.response?.data?.message || 'Erro ao apagar o módulo.');
    },
  });
}
