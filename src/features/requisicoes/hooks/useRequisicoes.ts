import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import {
  requisicoesApi,
  type Escalao,
  type EstadoRequisicao,
} from '../api/requisicoes.api';

export function useRequisicoes(filtros?: { estado?: EstadoRequisicao }) {
  return useQuery({
    queryKey: ['requisicoes', filtros],
    queryFn: () => requisicoesApi.listar(filtros),
  });
}

export function useRequisicao(id: string | undefined) {
  return useQuery({
    queryKey: ['requisicao', id],
    queryFn: () => requisicoesApi.obter(id!),
    enabled: !!id,
  });
}

export function useEscaloes() {
  return useQuery({
    queryKey: ['escaloes'],
    queryFn: () => requisicoesApi.escaloes(),
  });
}

export function useRequisicaoMutations(id?: string) {
  const queryClient = useQueryClient();

  const invalidar = () => {
    queryClient.invalidateQueries({ queryKey: ['requisicoes'] });
    queryClient.invalidateQueries({ queryKey: ['requisicao', id] });
    // Um alerta pedia esta decisão; deixa de o pedir.
    queryClient.invalidateQueries({ queryKey: ['alertas'] });
  };

  /**
   * A mensagem do servidor nunca é substituída.
   *
   * Aqui diz coisas que nenhuma mensagem genérica diria: que quem pede não aprova o próprio
   * pedido, que o valor cai num escalão de outro perfil, ou que falta o motivo. Trocá-la por
   * «ocorreu um erro» apagaria o que resolve o problema.
   */
  const aoFalhar = (erro: any) =>
    toast.error(erro?.response?.data?.message || 'Não foi possível concluir a operação.');

  const criar = useMutation({
    mutationFn: requisicoesApi.criar,
    onSuccess: (r) => {
      invalidar();
      toast.success(`Requisição ${r.numero} criada em rascunho.`);
    },
    onError: aoFalhar,
  });

  const submeter = useMutation({
    mutationFn: (requisicaoId: string) => requisicoesApi.submeter(requisicaoId),
    onSuccess: (r: any) => {
      invalidar();
      toast.success(
        r.escalaoAplicavel
          ? `Submetida. Vai para o escalão "${r.escalaoAplicavel.nome}".`
          : 'Submetida.',
      );
    },
    onError: aoFalhar,
  });

  const aprovar = useMutation({
    mutationFn: (requisicaoId: string) => requisicoesApi.aprovar(requisicaoId),
    onSuccess: () => {
      invalidar();
      toast.success('Requisição aprovada. Pode ser convertida em ordem de compra.');
    },
    onError: aoFalhar,
  });

  const rejeitar = useMutation({
    mutationFn: ({ requisicaoId, motivo }: { requisicaoId: string; motivo: string }) =>
      requisicoesApi.rejeitar(requisicaoId, motivo),
    onSuccess: () => {
      invalidar();
      toast.success('Requisição recusada.');
    },
    onError: aoFalhar,
  });

  const cancelar = useMutation({
    mutationFn: ({ requisicaoId, motivo }: { requisicaoId: string; motivo: string }) =>
      requisicoesApi.cancelar(requisicaoId, motivo),
    onSuccess: () => {
      invalidar();
      toast.success('Requisição cancelada.');
    },
    onError: aoFalhar,
  });

  const converter = useMutation({
    mutationFn: ({
      requisicaoId,
      fornecedorId,
      dataPrevista,
    }: {
      requisicaoId: string;
      fornecedorId: string;
      dataPrevista?: string;
    }) => requisicoesApi.converter(requisicaoId, fornecedorId, dataPrevista),
    onSuccess: () => {
      invalidar();
      queryClient.invalidateQueries({ queryKey: ['purchase-orders'] });
      toast.success('Ordem de compra criada em rascunho. Falta negociar o preço e enviá-la.');
    },
    onError: aoFalhar,
  });

  const definirEscaloes = useMutation({
    mutationFn: (escaloes: Omit<Escalao, 'id' | 'perfil'>[]) =>
      requisicoesApi.definirEscaloes(escaloes),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['escaloes'] });
      toast.success('Escalões gravados.');
    },
    onError: (erro: any) => {
      // Os problemas de coerência vêm numa lista à parte da mensagem — e são eles que dizem
      // onde está o buraco.
      const problemas: string[] | undefined = erro?.response?.data?.problemas;
      toast.error(
        problemas?.length
          ? `${erro.response.data.message} ${problemas[0]}`
          : erro?.response?.data?.message || 'Não foi possível gravar os escalões.',
      );
    },
  });

  return { criar, submeter, aprovar, rejeitar, cancelar, converter, definirEscaloes };
}
