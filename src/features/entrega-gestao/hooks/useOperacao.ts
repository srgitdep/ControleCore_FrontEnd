import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { useTranslation } from 'react-i18next';
import { mensagemDeErro } from '@/shared/utils';
import { operacaoApi } from '../api/operacao.api';
import type {
  ActualizarEstafetaPayload,
  CriarEstafetaPayload,
  FiltrosEntregas,
  MetodoCobranca,
  MotivoFalha,
} from '../types/operacao';

const CHAVE = 'entrega-operacao';
const TRINTA_SEGUNDOS = 30_000;

// ── Estafetas ───────────────────────────────────────────────────────────────

export function useEstafetas(inactivos = false) {
  return useQuery({
    queryKey: [CHAVE, 'estafetas', inactivos],
    queryFn: () => operacaoApi.listarEstafetas(inactivos),
  });
}

/**
 * Criar devolve as credenciais **uma só vez**: quem chama guarda-as no estado do ecrã, no
 * `onSuccess` da mutação. Não voltam a vir do servidor, e a cache do TanStack Query não as
 * guarda — por isso só se invalida a lista.
 */
export function useCriarEstafeta() {
  const { t } = useTranslation('entrega');
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: CriarEstafetaPayload) => operacaoApi.criarEstafeta(payload),
    onSuccess: () => void queryClient.invalidateQueries({ queryKey: [CHAVE, 'estafetas'] }),
    onError: (erro) => toast.error(mensagemDeErro(erro, t('mensagens.erro_estafeta'))),
  });
}

export function useActualizarEstafeta() {
  const { t } = useTranslation('entrega');
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: ActualizarEstafetaPayload }) =>
      operacaoApi.actualizarEstafeta(id, payload),
    onSuccess: () => {
      toast.success(t('mensagens.estafeta_actualizado'));
      void queryClient.invalidateQueries({ queryKey: [CHAVE, 'estafetas'] });
    },
    onError: (erro) => toast.error(mensagemDeErro(erro, t('mensagens.erro_estafeta'))),
  });
}

export function useReporSenhaEstafeta() {
  const { t } = useTranslation('entrega');
  return useMutation({
    mutationFn: (id: string) => operacaoApi.reporSenhaEstafeta(id),
    onError: (erro) => toast.error(mensagemDeErro(erro, t('mensagens.erro_repor_senha'))),
  });
}

// ── Entregas ────────────────────────────────────────────────────────────────

/**
 * O painel de entregas. Consulta periódica de 30 s, como a fila de pedidos do Compra Fácil: o
 * socket `/entregas` é da Fase 5, e para quem gere não importa um atraso de meio minuto.
 */
export function useEntregas(filtros: FiltrosEntregas) {
  return useQuery({
    queryKey: [CHAVE, 'entregas', filtros],
    queryFn: () => operacaoApi.listarEntregas(filtros),
    refetchInterval: TRINTA_SEGUNDOS,
    placeholderData: (anterior) => anterior,
  });
}

/**
 * Uma operação sobre uma entrega. O erro do servidor (já avançada por outra pessoa, estafeta que
 * não serve a loja, referência em falta) chega ao ecrã com a causa — e a lista refaz-se sempre:
 * uma operação recusada por «já avançada» quer dizer que o painel estava desactualizado.
 */
function useOperacaoEntrega<V>(
  accao: (variaveis: V) => Promise<unknown>,
  sucesso: 'entrega_actualizada' | 'entrega_devolvida',
) {
  const { t } = useTranslation('entrega');
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: accao,
    onSuccess: () => toast.success(t(`mensagens.${sucesso}`)),
    onError: (erro) => toast.error(mensagemDeErro(erro, t('mensagens.erro_operacao'))),
    onSettled: () => void queryClient.invalidateQueries({ queryKey: [CHAVE, 'entregas'] }),
  });
}

export const useAtribuirEntrega = () =>
  useOperacaoEntrega(
    ({ id, estafetaId }: { id: string; estafetaId: string }) => operacaoApi.atribuir(id, estafetaId),
    'entrega_actualizada',
  );

export const useRecolherEntrega = () =>
  useOperacaoEntrega((id: string) => operacaoApi.recolher(id), 'entrega_actualizada');

export const useIniciarRotaEntrega = () =>
  useOperacaoEntrega((id: string) => operacaoApi.iniciarRota(id), 'entrega_actualizada');

export const useEntregarEntrega = () =>
  useOperacaoEntrega(
    ({ id, ...corpo }: { id: string; metodoCobrado: MetodoCobranca; referenciaPagamento?: string }) =>
      operacaoApi.entregar(id, corpo),
    'entrega_actualizada',
  );

export const useFalharEntrega = () =>
  useOperacaoEntrega(
    ({ id, ...corpo }: { id: string; motivo: MotivoFalha; nota?: string }) => operacaoApi.falhar(id, corpo),
    'entrega_actualizada',
  );

export const useDevolverEntrega = () =>
  useOperacaoEntrega(
    ({ id, motivo }: { id: string; motivo: string }) => operacaoApi.devolver(id, motivo),
    'entrega_devolvida',
  );
