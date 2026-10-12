import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import toast from 'react-hot-toast';
import { comprimirImagem, mensagemDeErro } from '@/shared/utils';
import { estafetaApi } from '../api/estafeta.api';
import { useEstafetaStore } from '../store/useEstafetaStore';
import type {
  ContactoDeEmergencia,
  DadosDoDocumento,
  DadosDoRegisto,
  LadoDaImagem,
  TipoDeDocumento,
} from '../types/onboarding';

/** A mesma raiz de chave de `useEstafeta`: depois de qualquer passo, o perfil e o estado refazem-se juntos. */
const CHAVE = 'estafeta-app';

/**
 * O estado do onboarding: o que falta, as imagens enviadas (com um URL de 5 minutos) e os dados já confirmados. É a
 * fonte do assistente — retoma onde o estafeta ficou. Sem consulta periódica: só muda quando ele faz alguma coisa, e
 * cada passo invalida-o.
 */
export function useEstadoOnboarding() {
  const autenticado = useEstafetaStore((s) => s.autenticado);

  return useQuery({
    queryKey: [CHAVE, 'onboarding'],
    queryFn: () => estafetaApi.estadoDoOnboarding(),
    enabled: autenticado,
    // Os URLs assinados valem 5 minutos: uma consulta mais velha do que isso mostraria imagens partidas.
    staleTime: 60_000,
  });
}

function useInvalidar() {
  const queryClient = useQueryClient();
  return () => queryClient.invalidateQueries({ queryKey: [CHAVE] });
}

/**
 * Envia **uma** fotografia: comprime-a no telemóvel (dados móveis custam dinheiro) e envia-a. O servidor valida pelo
 * conteúdo, orienta, converte e guarda; a anterior do mesmo lado fica guardada, marcada como substituída.
 */
export function useEnviarImagem() {
  const { t } = useTranslation('estafeta');
  const invalidar = useInvalidar();

  return useMutation({
    mutationFn: async ({ tipo, lado, ficheiro }: { tipo: TipoDeDocumento; lado: LadoDaImagem; ficheiro: File }) =>
      estafetaApi.enviarImagem(tipo, lado, await comprimirImagem(ficheiro)),
    onSuccess: () => void invalidar(),
    onError: (erro) => toast.error(mensagemDeErro(erro, t('onboarding.mensagens.erro_imagem'))),
  });
}

/**
 * Lê o documento a partir das fotografias já enviadas. Devolve uma **sugestão**: quem a usa decide o que fazer com
 * ela. Os erros próprios (limite de leituras, sem imagens) mostram-se com a mensagem do servidor.
 */
export function useLerDocumento() {
  const { t } = useTranslation('estafeta');

  return useMutation({
    mutationFn: (tipo: TipoDeDocumento) => estafetaApi.lerDocumento(tipo),
    onError: (erro) => toast.error(mensagemDeErro(erro, t('onboarding.mensagens.erro_leitura'))),
  });
}

/**
 * Confirma os dados. **Os erros de validação (400) não passam por aqui como toast:** o ecrã marca cada campo, com a
 * lista que o servidor devolveu — um toast genérico não diria qual campo corrigir.
 */
export function useConfirmarDocumento() {
  const invalidar = useInvalidar();

  return useMutation({
    mutationFn: ({ tipo, dados }: { tipo: TipoDeDocumento; dados: DadosDoDocumento }) =>
      estafetaApi.confirmarDocumento(tipo, dados),
    onSuccess: () => void invalidar(),
  });
}

export function useContactoDeEmergencia() {
  const { t } = useTranslation('estafeta');
  const invalidar = useInvalidar();

  return useMutation({
    mutationFn: (contacto: ContactoDeEmergencia) => estafetaApi.contactoDeEmergencia(contacto),
    onSuccess: () => void invalidar(),
    onError: (erro) => toast.error(mensagemDeErro(erro, t('onboarding.mensagens.erro_contacto'))),
  });
}

export function useConcluirOnboarding() {
  const { t } = useTranslation('estafeta');
  const invalidar = useInvalidar();

  return useMutation({
    mutationFn: () => estafetaApi.concluirOnboarding(),
    onSuccess: () => {
      toast.success(t('onboarding.mensagens.concluido'));
      void invalidar();
    },
    onError: (erro) => toast.error(mensagemDeErro(erro, t('onboarding.mensagens.erro_concluir'))),
  });
}

/**
 * O registo (público). Abre a sessão do estafeta no servidor; quem o usa regista-a no store e segue para o
 * assistente. Os erros (convite inválido, contacto repetido, registo fechado) mostram-se na própria página.
 */
export function useRegistar() {
  return useMutation({
    mutationFn: (dados: DadosDoRegisto) => estafetaApi.registar(dados),
  });
}

/** O convite, antes de preencher o formulário: o nome da empresa, ou 404 se não existe ou foi substituído. */
export function useVerificarConvite(codigo: string | null) {
  return useQuery({
    queryKey: [CHAVE, 'convite', codigo],
    queryFn: () => estafetaApi.verificarConvite(codigo!),
    enabled: !!codigo,
    retry: false,
    staleTime: 5 * 60_000,
  });
}
