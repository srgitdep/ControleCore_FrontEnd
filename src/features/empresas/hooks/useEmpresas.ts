import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  getEmpresas,
  getEmpresaDetails,
  getMinhaEmpresa,
  getFiscalidade,
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

export function useEmpresas({ activo = true }: { activo?: boolean } = {}) {
  return useQuery({
    queryKey: ['empresas'],
    queryFn: getEmpresas,
    enabled: activo,
  });
}

export function useEmpresaDetails(id: string) {
  return useQuery({
    queryKey: ['empresa', id],
    queryFn: () => getEmpresaDetails(id),
    enabled: !!id,
  });
}

/** A própria empresa — ecrã de Configurações (ADMIN/MANAGER da empresa). */
export function useMinhaEmpresa() {
  return useQuery({
    queryKey: ['empresa', 'minha'],
    queryFn: getMinhaEmpresa,
  });
}

/**
 * A fiscalidade da empresa, legível por qualquer utilizador autenticado — ao contrário de
 * `useMinhaEmpresa`, que pede `VER_EMPRESA` e dá 403 ao Operador de Caixa.
 *
 * Muda raramente (um interruptor nas Configurações), por isso fica fresca 5 minutos em
 * vez de ser pedida a cada montagem do POS.
 */
export function useFiscalidade() {
  return useQuery({
    queryKey: ['empresa', 'fiscalidade'],
    queryFn: getFiscalidade,
    staleTime: 5 * 60 * 1000,
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
    onSuccess: (empresaActualizada, variables) => {
      toast.success(t('mensagens.actualizada'));

      // A empresa que o servidor devolveu entra já na cache, antes de invalidar.
      //
      // Sem isto ficava um intervalo — entre o `invalidate` e a resposta do refetch — em
      // que `['empresa','minha']` ainda tinha os dados **antigos**. Um ecrã que copie esse
      // valor para estado local (o interruptor do IVA, em `ConfiguracoesEmpresaPage`) via
      // o valor velho voltar e o botão saltava para trás, como se a gravação não tivesse
      // resultado — quando tinha.
      if (empresaActualizada) {
        queryClient.setQueryData(['empresa', 'minha'], empresaActualizada);
        queryClient.setQueryData(['empresa', variables.id], empresaActualizada);
      }

      queryClient.invalidateQueries({ queryKey: ['empresas'] });
      queryClient.invalidateQueries({ queryKey: ['empresa', variables.id] });
      queryClient.invalidateQueries({ queryKey: ['empresa', 'minha'] });
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
