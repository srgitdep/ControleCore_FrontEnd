import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import i18n from '@/i18n';
import { transferenciasApi } from '../api/transferencias.api';
import { getArmazensByLoja, getLojas } from '@/features/lojas/api/lojas.api';
import type { ArmazemEscolhivel, FiltrosTransferencia } from '../types/transferencia.types';

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

/**
 * Os armazéns activos de todas as lojas, já com o nome da loja — para escolher a origem e o destino. Procura-os loja
 * a loja (como o ecrã de Armazéns): a lista de lojas pode já trazê-los, e, se não, vão-se buscar.
 */
export function useArmazensEscolhiveis() {
  return useQuery({
    queryKey: ['transferencias', 'armazens'],
    queryFn: async (): Promise<ArmazemEscolhivel[]> => {
      const lojas: Array<{ id: string; nome: string; armazens?: unknown[] }> = (await getLojas()) ?? [];
      const porLoja = await Promise.all(
        lojas.map(async (loja) => ({
          loja,
          armazens: ((loja.armazens ?? (await getArmazensByLoja(loja.id))) ?? []) as Array<{ id: string; nome: string; tipo: string; isActive?: boolean }>,
        })),
      );
      return porLoja.flatMap(({ loja, armazens }) =>
        armazens
          .filter((a) => a.isActive !== false)
          .map((a) => ({ id: a.id, nome: a.nome, tipo: a.tipo, lojaId: loja.id, lojaNome: loja.nome })),
      );
    },
    staleTime: 60_000,
  });
}

/** Os produtos com stock num armazém, para escolher o que transferir (plano §4.12, D3). */
export function useDisponivelNoArmazem(
  armazemId: string | null,
  params: { destinoArmazemId?: string; pesquisa?: string; page?: number; limit?: number },
) {
  return useQuery({
    queryKey: ['transferencias', 'disponivel', armazemId, params],
    queryFn: () => transferenciasApi.disponivelNoArmazem(armazemId as string, params),
    enabled: !!armazemId,
    // O stock muda a cada venda: não se guarda mais do que o tempo de escolher.
    staleTime: 15_000,
    placeholderData: (anterior) => anterior,
  });
}

export function useDetalheDoGrupo(grupoId: string | null) {
  return useQuery({
    queryKey: ['transferencias', 'grupo', grupoId],
    queryFn: () => transferenciasApi.getGrupo(grupoId as string),
    enabled: !!grupoId,
  });
}

/**
 * Pede a transferência de vários produtos. Sem toast de erro aqui: uma recusa traz a lista de linhas a corrigir
 * (`erros`), que o ecrã mostra nas próprias linhas — um toast com uma frase genérica esconderia o que interessa.
 */
export function useSolicitarEmMassa() {
  const invalidar = useInvalidarTransferencias();

  return useMutation({
    mutationFn: transferenciasApi.solicitarEmMassa,
    onSuccess: (resultado) => {
      toast.success(i18n.t('transferencias:hooks.pedido_criado', { referencia: resultado.referencia, count: resultado.transferencias.length }));
      invalidar();
    },
  });
}

type AccaoDoGrupo =
  | { tipo: 'decidir'; decisao: 'APROVAR' | 'RECUSAR'; motivo?: string }
  | { tipo: 'expedir' }
  | { tipo: 'receber'; quantidades?: Record<string, number> }
  | { tipo: 'cancelar'; motivo: string };

/** Uma acção sobre as linhas de um pedido em massa, linha a linha; o resultado diz as que falharam e porquê. */
export function useAccaoDoGrupo(grupoId: string) {
  const invalidar = useInvalidarTransferencias();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (accao: AccaoDoGrupo) => {
      switch (accao.tipo) {
        case 'decidir':
          return transferenciasApi.decidirGrupo(grupoId, accao.decisao, accao.motivo);
        case 'expedir':
          return transferenciasApi.expedirGrupo(grupoId);
        case 'receber':
          return transferenciasApi.receberGrupo(grupoId, accao.quantidades);
        case 'cancelar':
          return transferenciasApi.cancelarGrupo(grupoId, accao.motivo);
      }
    },
    onSuccess: () => {
      invalidar();
      void queryClient.invalidateQueries({ queryKey: ['transferencias', 'grupo', grupoId] });
    },
    onError: (erro: any) => {
      toast.error(erro?.response?.data?.message ?? i18n.t('transferencias:hooks.erro_grupo'));
    },
  });
}

export function useDecidirTransferencia() {
  const invalidar = useInvalidarTransferencias();

  return useMutation({
    mutationFn: ({ id, decisao, motivo }: { id: string; decisao: 'APROVAR' | 'RECUSAR'; motivo?: string }) =>
      transferenciasApi.decidir(id, decisao, motivo),
    onSuccess: (_dados, variaveis) => {
      toast.success(
        variaveis.decisao === 'APROVAR'
          ? i18n.t('transferencias:hooks.aprovada')
          : i18n.t('transferencias:hooks.recusada'),
      );
      invalidar();
    },
    onError: (erro: any) => {
      // A revalidação em tempo real (DT01 §12) pode recusar aqui mesmo quando o
      // painel mostrou a oportunidade há pouco — a mensagem do backend explica porquê.
      toast.error(erro?.response?.data?.message ?? i18n.t('transferencias:hooks.erro_decidir'));
    },
  });
}

export function useExpedirTransferencia() {
  const invalidar = useInvalidarTransferencias();

  return useMutation({
    mutationFn: transferenciasApi.expedir,
    onSuccess: () => {
      toast.success(i18n.t('transferencias:hooks.expedicao_registada'));
      invalidar();
    },
    onError: (erro: any) => {
      toast.error(erro?.response?.data?.message ?? i18n.t('transferencias:hooks.erro_expedir'));
    },
  });
}

export function useReceberTransferencia() {
  const invalidar = useInvalidarTransferencias();

  return useMutation({
    mutationFn: ({ id, quantidadeRecebida }: { id: string; quantidadeRecebida: number }) =>
      transferenciasApi.receber(id, quantidadeRecebida),
    onSuccess: () => {
      toast.success(i18n.t('transferencias:hooks.recepcao_confirmada'));
      invalidar();
    },
    onError: (erro: any) => {
      toast.error(erro?.response?.data?.message ?? i18n.t('transferencias:hooks.erro_receber'));
    },
  });
}

export function useCancelarTransferencia() {
  const invalidar = useInvalidarTransferencias();

  return useMutation({
    mutationFn: ({ id, motivo }: { id: string; motivo: string }) =>
      transferenciasApi.cancelar(id, motivo),
    onSuccess: () => {
      toast.success(i18n.t('transferencias:hooks.cancelada'));
      invalidar();
    },
    onError: (erro: any) => {
      toast.error(erro?.response?.data?.message ?? i18n.t('transferencias:hooks.erro_cancelar'));
    },
  });
}
