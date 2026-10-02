import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  getEmpresas,
  getEmpresaDetails,
  createEmpresa,
  updateEmpresa,
  deleteEmpresa,
  updateBranding,
} from '../api/empresa.api';
import type { UpdateBrandingPayload } from '../types';
import toast from 'react-hot-toast';
import i18n from '@/i18n';

// Fora de componentes não há hook: `getFixedT` com língua nula segue a língua activa em cada
// chamada, e não a do momento em que o módulo carregou.
const t = i18n.getFixedT(null, 'empresas');

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
      toast.success(t('mensagens.criada'));
      queryClient.invalidateQueries({ queryKey: ['empresas'] });
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || t('mensagens.erro_criar'));
    }
  });
}

export function useUpdateEmpresa() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => updateEmpresa(id, data),
    onSuccess: (_, variables) => {
      toast.success(t('mensagens.actualizada'));
      queryClient.invalidateQueries({ queryKey: ['empresas'] });
      queryClient.invalidateQueries({ queryKey: ['empresa', variables.id] });
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || t('mensagens.erro_actualizar'));
    }
  });
}

export function useUpdateBranding() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateBrandingPayload }) => updateBranding(id, data),
    onSuccess: (_, variables) => {
      toast.success(t('mensagens.branding_actualizado'));
      queryClient.invalidateQueries({ queryKey: ['empresas'] });
      queryClient.invalidateQueries({ queryKey: ['empresa', variables.id] });
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || t('mensagens.erro_branding'));
    },
  });
}

export function useDeleteEmpresa() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: deleteEmpresa,
    onSuccess: () => {
      toast.success(t('mensagens.eliminada'));
      queryClient.invalidateQueries({ queryKey: ['empresas'] });
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || t('mensagens.erro_eliminar'));
    }
  });
}
