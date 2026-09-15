import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { transferenciasApi } from '../api/transferencias.api';
import type { FiltrosTransferencia } from '../types/transferencia.types';

const UM_MINUTO = 60 * 1000;

export function useTransferencias(filtros?: FiltrosTransferencia) {
  return useQuery({
    queryKey: ['transferencias', 'lista', filtros],
    queryFn: () => transferenciasApi.listar(filtros),
    staleTime: UM_MINUTO,
    placeholderData: (prev) => prev,
  });
}

export function useDetalheTransferencia(id: string | null) {
  return useQuery({
    queryKey: ['transferencias', 'detalhe', id],
    queryFn: () => transferenciasApi.getDetalhe(id as string),
    enabled: !!id,
  });
}

function useInvalidarTransferencias() {
  const queryClient = useQueryClient();
  return () => {
    queryClient.invalidateQueries({ queryKey: ['transferencias'] });
    // Uma transferência aprovada/expedida/recebida muda o stock e pode resolver ou
    // criar necessidades — o painel também precisa de reflectir isso.
    queryClient.invalidateQueries({ queryKey: ['necessidades'] });
  };
}

export function useSolicitarTransferencia() {
  const invalidar = useInvalidarTransferencias();

  return useMutation({
    mutationFn: transferenciasApi.solicitar,
    onSuccess: () => {
      toast.success('Transferência solicitada.');
      invalidar();
    },
    onError: (erro: any) => {
      toast.error(erro?.response?.data?.message ?? 'Não foi possível solicitar a transferência.');
    },
  });
}

export function useDecidirTransferencia() {
  const invalidar = useInvalidarTransferencias();

  return useMutation({
    mutationFn: ({ id, decisao, motivo }: { id: string; decisao: 'APROVAR' | 'RECUSAR'; motivo?: string }) =>
      transferenciasApi.decidir(id, decisao, motivo),
    onSuccess: (_dados, variaveis) => {
      toast.success(variaveis.decisao === 'APROVAR' ? 'Transferência aprovada.' : 'Transferência recusada.');
      invalidar();
    },
    onError: (erro: any) => {
      // A revalidação em tempo real (DT01 §12) pode recusar aqui mesmo quando o
      // painel mostrou a oportunidade há pouco — a mensagem do backend explica porquê.
      toast.error(erro?.response?.data?.message ?? 'Não foi possível decidir a transferência.');
    },
  });
}

export function useExpedirTransferencia() {
  const invalidar = useInvalidarTransferencias();

  return useMutation({
    mutationFn: transferenciasApi.expedir,
    onSuccess: () => {
      toast.success('Expedição registada.');
      invalidar();
    },
    onError: (erro: any) => {
      toast.error(erro?.response?.data?.message ?? 'Não foi possível expedir.');
    },
  });
}

export function useReceberTransferencia() {
  const invalidar = useInvalidarTransferencias();

  return useMutation({
    mutationFn: ({ id, quantidadeRecebida }: { id: string; quantidadeRecebida: number }) =>
      transferenciasApi.receber(id, quantidadeRecebida),
    onSuccess: () => {
      toast.success('Recepção confirmada.');
      invalidar();
    },
    onError: (erro: any) => {
      toast.error(erro?.response?.data?.message ?? 'Não foi possível confirmar a recepção.');
    },
  });
}

export function useCancelarTransferencia() {
  const invalidar = useInvalidarTransferencias();

  return useMutation({
    mutationFn: ({ id, motivo }: { id: string; motivo: string }) =>
      transferenciasApi.cancelar(id, motivo),
    onSuccess: () => {
      toast.success('Transferência cancelada.');
      invalidar();
    },
    onError: (erro: any) => {
      toast.error(erro?.response?.data?.message ?? 'Não foi possível cancelar.');
    },
  });
}
