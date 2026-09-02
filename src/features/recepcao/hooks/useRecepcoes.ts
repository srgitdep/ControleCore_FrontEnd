import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { recepcaoApi, type EstadoRecepcao } from '../api/recepcao.api';

export function useRecepcoes(filtros?: { estado?: EstadoRecepcao; pedidoId?: string }) {
  return useQuery({
    queryKey: ['recepcoes', filtros],
    queryFn: () => recepcaoApi.listar(filtros),
  });
}

export function useRecepcao(id: string | undefined) {
  return useQuery({
    queryKey: ['recepcao', id],
    queryFn: () => recepcaoApi.obter(id!),
    enabled: !!id,
  });
}

export function useConferencia(id: string | undefined) {
  return useQuery({
    queryKey: ['recepcao', id, 'conferencia'],
    queryFn: () => recepcaoApi.conferencia(id!),
    enabled: !!id,
  });
}

/**
 * As acções sobre uma descarga.
 *
 * A mensagem do servidor é a que interessa e nunca é substituída: diz que a conta não fecha e
 * por quanto, que a unidade não tem conversão declarada, ou que quem conferiu não pode
 * aprovar. Trocá-la por «ocorreu um erro» apagaria exactamente o que resolve o problema.
 */
export function useRecepcaoMutations(id: string | undefined) {
  const queryClient = useQueryClient();

  const invalidar = () => {
    queryClient.invalidateQueries({ queryKey: ['recepcoes'] });
    queryClient.invalidateQueries({ queryKey: ['recepcao', id] });
  };

  const aoFalhar = (erro: any) =>
    toast.error(erro?.response?.data?.message || 'Não foi possível concluir a operação.');

  const abrir = useMutation({
    mutationFn: recepcaoApi.abrir,
    onSuccess: (s) => {
      queryClient.invalidateQueries({ queryKey: ['recepcoes'] });
      toast.success(`Descarga ${s.numero} aberta com ${s.linhas.length} linha(s).`);
    },
    onError: aoFalhar,
  });

  const contar = useMutation({
    mutationFn: ({ linhaId, ...payload }: Parameters<typeof recepcaoApi.contar>[2] & { linhaId: string }) =>
      recepcaoApi.contar(id!, linhaId, payload),
    onSuccess: invalidar,
    onError: aoFalhar,
  });

  const actualizarLinha = useMutation({
    mutationFn: ({
      linhaId,
      ...payload
    }: Parameters<typeof recepcaoApi.actualizarLinha>[2] & { linhaId: string }) =>
      recepcaoApi.actualizarLinha(id!, linhaId, payload),
    onSuccess: invalidar,
    onError: aoFalhar,
  });

  const conferir = useMutation({
    mutationFn: () => recepcaoApi.conferir(id!),
    onSuccess: (r: any) => {
      invalidar();
      // A mensagem diz o que aconteceu à descarga, e não só que a operação passou: sem isto,
      // quem fecha a conferência não sabe se pode lançar ou se está à espera de alguém.
      toast.success(
        r.exigeAprovacao
          ? `Conferência fechada com ${r.divergencias.length} divergência(s). Precisa de aprovação.`
          : 'Conferência fechada sem divergências. Pode lançar no stock.',
      );
    },
    onError: aoFalhar,
  });

  const aprovar = useMutation({
    mutationFn: () => recepcaoApi.aprovar(id!),
    onSuccess: () => {
      invalidar();
      toast.success('Divergência aprovada. A descarga pode entrar no stock.');
    },
    onError: aoFalhar,
  });

  const rejeitar = useMutation({
    mutationFn: (motivo: string) => recepcaoApi.rejeitar(id!, motivo),
    onSuccess: () => {
      invalidar();
      toast.success('Descarga rejeitada.');
    },
    onError: aoFalhar,
  });

  const reabrir = useMutation({
    mutationFn: () => recepcaoApi.reabrir(id!),
    onSuccess: () => {
      invalidar();
      toast.success('Conferência reaberta. Pode recontar.');
    },
    onError: aoFalhar,
  });

  const cancelar = useMutation({
    mutationFn: (motivo: string) => recepcaoApi.cancelar(id!, motivo),
    onSuccess: () => {
      invalidar();
      toast.success('Descarga cancelada.');
    },
    onError: aoFalhar,
  });

  const lancar = useMutation({
    mutationFn: (prazoPagamentoDias?: number) => recepcaoApi.lancar(id!, prazoPagamentoDias),
    onSuccess: () => {
      invalidar();
      // O stock mudou: as listas que o mostram têm de o saber.
      queryClient.invalidateQueries({ queryKey: ['stocks'] });
      queryClient.invalidateQueries({ queryKey: ['products'] });
      queryClient.invalidateQueries({ queryKey: ['purchase-orders'] });
      toast.success('Mercadoria lançada no stock.');
    },
    onError: aoFalhar,
  });

  return {
    abrir,
    contar,
    actualizarLinha,
    conferir,
    aprovar,
    rejeitar,
    reabrir,
    cancelar,
    lancar,
  };
}
