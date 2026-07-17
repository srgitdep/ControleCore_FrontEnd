import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  getEmpresas, 
  getEmpresaDetails, 
  createEmpresa, 
  updateEmpresa, 
  deleteEmpresa 
} from '../api/empresa.api';
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
