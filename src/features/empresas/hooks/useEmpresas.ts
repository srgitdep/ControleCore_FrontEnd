import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  getEmpresas,
  getEmpresaDetails,
  createEmpresa,
  updateEmpresa,
  deleteEmpresa,
  changeEmpresaStatus,
  updateBranding,
} from '../api/empresa.api';
import type { BrandingPayload } from '../types';
import toast from 'react-hot-toast';

export function useEmpresas() {
  return useQuery({
    queryKey: ['empresas'],
    queryFn: getEmpresas,
  });
}

export function useEmpresaDetails(id: string) {
  return useQuery({
    queryKey: ['empresa', id],
    queryFn: () => getEmpresaDetails(id),
    enabled: !!id,
  });
}

export function useCreateEmpresa() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createEmpresa,
    onSuccess: () => {
      toast.success('Empresa criada com sucesso!');
      queryClient.invalidateQueries({ queryKey: ['empresas'] });
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Erro ao criar empresa.');
    }
  });
}

export function useUpdateEmpresa() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => updateEmpresa(id, data),
    onSuccess: (_, variables) => {
      toast.success('Empresa atualizada com sucesso!');
      queryClient.invalidateQueries({ queryKey: ['empresas'] });
      queryClient.invalidateQueries({ queryKey: ['empresa', variables.id] });
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Erro ao atualizar empresa.');
    }
  });
}

export function useDeleteEmpresa() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: deleteEmpresa,
    onSuccess: () => {
      toast.success('Empresa eliminada com sucesso!');
      queryClient.invalidateQueries({ queryKey: ['empresas'] });
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Erro ao eliminar empresa.');
    }
  });
}

/**
 * Suspender ou reactivar uma empresa.
 *
 * A alternativa reversível a apagar, que era a única acção que o ecrã oferecia.
 */
export function useEmpresaStatus() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      id,
      action,
      reason,
    }: {
      id: string;
      action: 'ACTIVATE' | 'DEACTIVATE';
      reason?: string;
    }) => changeEmpresaStatus(id, action, reason),
    onSuccess: (_, variables) => {
      toast.success(
        variables.action === 'DEACTIVATE'
          ? 'Empresa suspensa. Os dados ficam intactos.'
          : 'Empresa reactivada.',
      );
      queryClient.invalidateQueries({ queryKey: ['empresas'] });
      queryClient.invalidateQueries({ queryKey: ['empresa', variables.id] });
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Não foi possível alterar o estado.');
    },
  });
}

export function useUpdateBranding() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: BrandingPayload }) =>
      updateBranding(id, payload),
    onSuccess: (_, variables) => {
      toast.success('Identidade visual gravada.');
      queryClient.invalidateQueries({ queryKey: ['empresa', variables.id] });
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Não foi possível gravar a identidade visual.');
    },
  });
}
