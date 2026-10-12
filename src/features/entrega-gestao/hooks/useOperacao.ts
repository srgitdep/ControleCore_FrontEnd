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
 * O servidor envia as credenciais por e-mail ao estafeta e só devolve se o envio correu bem
 * (`emailEnviado`): a senha nunca passa por aqui. Quem chama decide o aviso; aqui só se invalida a
 * lista.
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

/** O convite da frota própria. Sem permissão responde 403 e o painel não o mostra. */
export function useConvite(activo = true) {
  return useQuery({
    queryKey: [CHAVE, 'convite'],
    queryFn: () => operacaoApi.obterConvite(),
    enabled: activo,
    staleTime: 60_000,
  });
}

/** Gerar um convite novo **invalida o anterior** no servidor: quem o usa pede confirmação antes. */
export function useRodarConvite() {
  const { t } = useTranslation('entrega');
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => operacaoApi.rodarConvite(),
    onSuccess: (r) => {
      queryClient.setQueryData([CHAVE, 'convite'], r);
      toast.success(t('convite.rodado'));
    },
    onError: (erro) => toast.error(mensagemDeErro(erro, t('convite.erro'))),
  });
}

/**
 * Os documentos de um estafeta. `ambito` decide a rota: a frota própria vê os seus pela rota da empresa, e o Super Admin
 * os da plataforma pela sua — o servidor não deixa uma alcançar a outra. Os URLs das fotografias valem 5 minutos, pelo
 * que não se guardam em cache além disso.
 */
export function useDocumentosDoEstafeta(id: string | null, ambito: 'EMPRESA' | 'PLATAFORMA') {
  return useQuery({
    queryKey: [CHAVE, 'documentos', ambito, id],
    queryFn: () => (ambito === 'EMPRESA' ? operacaoApi.documentosDoEstafeta(id!) : operacaoApi.documentosDaPlataforma(id!)),
    enabled: !!id,
    staleTime: 0,
    gcTime: 0,
  });
}

export function useConferirDocumentos(ambito: 'EMPRESA' | 'PLATAFORMA') {
  const { t } = useTranslation('entrega');
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => (ambito === 'EMPRESA' ? operacaoApi.conferirDocumentos(id) : operacaoApi.conferirDaPlataforma(id)),
    onSuccess: () => {
      toast.success(t('documentos.conferido'));
      void queryClient.invalidateQueries({ queryKey: [CHAVE] });
    },
    onError: (erro) => toast.error(mensagemDeErro(erro, t('documentos.erro_conferir'))),
  });
}

export function useEstafetasDaPlataforma(inactivos = false) {
  return useQuery({
    queryKey: [CHAVE, 'plataforma', inactivos],
    queryFn: () => operacaoApi.listarEstafetasDaPlataforma(inactivos),
  });
}

export function useActividadeDaPlataforma() {
  const { t } = useTranslation('entrega');
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, isActive }: { id: string; isActive: boolean }) => operacaoApi.actividadeDaPlataforma(id, isActive),
    onSuccess: (_r, { isActive }) => {
      toast.success(isActive ? t('plataforma.reactivado') : t('plataforma.suspenso'));
      void queryClient.invalidateQueries({ queryKey: [CHAVE, 'plataforma'] });
    },
    onError: (erro) => toast.error(mensagemDeErro(erro, t('plataforma.erro_actividade'))),
  });
}

export function useProcurarEstafeta() {
  const { t } = useTranslation('entrega');
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => operacaoApi.procurarEstafeta(id),
    onSuccess: () => {
      toast.success(t('procura.lancada'));
      void queryClient.invalidateQueries({ queryKey: [CHAVE, 'entregas'] });
    },
    onError: (erro) => toast.error(mensagemDeErro(erro, t('procura.erro'))),
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
    ({
      id,
      ...corpo
    }: {
      id: string;
      metodoCobrado: MetodoCobranca;
      referenciaPagamento?: string;
      valorCobrado?: number;
    }) => operacaoApi.entregar(id, corpo),
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

// ── Acertos de contas ───────────────────────────────────────────────────────

export function useAcertosPendentes() {
  return useQuery({
    queryKey: [CHAVE, 'acertos', 'pendentes'],
    queryFn: () => operacaoApi.listarAcertosPendentes(),
    refetchInterval: TRINTA_SEGUNDOS,
  });
}

export function useAcertos() {
  return useQuery({
    queryKey: [CHAVE, 'acertos', 'historico'],
    queryFn: () => operacaoApi.listarAcertos(),
  });
}

/**
 * Fechar as contas de um estafeta. O erro do servidor chega ao ecrã com a causa — sem caixa aberto
 * (409, com a instrução), já acertado por outra pessoa (409). Refaz sempre as listas: uma recusa
 * por «já acertado» quer dizer que o ecrã estava desactualizado.
 */
export function useAcertarContas() {
  const { t } = useTranslation('entrega');
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (corpo: { estafetaId: string; totalEntregue: number; notas?: string }) => operacaoApi.acertar(corpo),
    onSuccess: () => toast.success(t('mensagens.acerto_feito')),
    onError: (erro) => toast.error(mensagemDeErro(erro, t('mensagens.erro_acerto'))),
    onSettled: () => void queryClient.invalidateQueries({ queryKey: [CHAVE, 'acertos'] }),
  });
}
