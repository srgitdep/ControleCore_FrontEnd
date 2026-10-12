import { useEffect, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { useTranslation } from 'react-i18next';
import { mensagemDeErro } from '@/shared/utils';
import { estafetaApi } from '../api/estafeta.api';
import { useEstafetaStore } from '../store/useEstafetaStore';
import type { DadosDeEntrega, DadosDeFalha, EstadoEscolhido } from '../types/estafeta';

const CHAVE = 'estafeta-app';
const TRINTA_SEGUNDOS = 30_000;

/**
 * Há ligação à rede? Só um **palpite** do navegador (`navigator.onLine`): serve para avisar e para não
 * deixar carregar num botão que não vai chegar a lado nenhum — o servidor é quem confirma tudo.
 */
export function useOnline() {
  const [online, setOnline] = useState(() => (typeof navigator === 'undefined' ? true : navigator.onLine));

  useEffect(() => {
    const aoLigar = () => setOnline(true);
    const aoDesligar = () => setOnline(false);
    window.addEventListener('online', aoLigar);
    window.addEventListener('offline', aoDesligar);
    return () => {
      window.removeEventListener('online', aoLigar);
      window.removeEventListener('offline', aoDesligar);
    };
  }, []);

  return online;
}

/**
 * As minhas entregas. Consulta de 30 s, como o painel do gestor: o canal em tempo real é a Fase 5, e
 * antes disso 30 s chega para ver uma entrega nova. Desligada sem sessão.
 */
export function useMinhasEntregas(historico = false) {
  const autenticado = useEstafetaStore((s) => s.autenticado);
  const operacional = useOnboardingCompleto();

  return useQuery({
    queryKey: [CHAVE, 'entregas', historico],
    queryFn: () => estafetaApi.entregas(historico),
    // Em onboarding o servidor recusa as entregas (403): não se pergunta, em vez de um erro a cada 30 s.
    enabled: autenticado && operacional,
    refetchInterval: TRINTA_SEGUNDOS,
    placeholderData: (anterior) => anterior,
  });
}

export function useMinhaEntrega(id: string | undefined) {
  const autenticado = useEstafetaStore((s) => s.autenticado);
  const operacional = useOnboardingCompleto();

  return useQuery({
    queryKey: [CHAVE, 'entrega', id],
    queryFn: () => estafetaApi.entrega(id!),
    enabled: autenticado && operacional && !!id,
    refetchInterval: TRINTA_SEGUNDOS,
  });
}

/**
 * O estafeta já completou o onboarding? Só depois disso o servidor deixa ver entregas e ofertas (plano §4.9, D15); até
 * o perfil chegar assume-se que não, para nenhuma consulta operacional sair com um 403 certo.
 */
export function useOnboardingCompleto(): boolean {
  return useMeuPerfil().data?.onboardingCompleto === true;
}

export function useMeuPerfil() {
  const autenticado = useEstafetaStore((s) => s.autenticado);

  return useQuery({
    queryKey: [CHAVE, 'perfil'],
    queryFn: () => estafetaApi.eu(),
    enabled: autenticado,
    refetchInterval: TRINTA_SEGUNDOS,
  });
}

/** Depois de qualquer acção, as listas e o detalhe refazem-se: o estado mudou no servidor. */
function useInvalidar() {
  const queryClient = useQueryClient();
  return () => queryClient.invalidateQueries({ queryKey: [CHAVE] });
}

export function useMudarEstado() {
  const { t } = useTranslation('estafeta');
  const invalidar = useInvalidar();

  return useMutation({
    mutationFn: (estado: EstadoEscolhido) => estafetaApi.mudarEstado(estado),
    onSuccess: () => void invalidar(),
    onError: (erro) => toast.error(mensagemDeErro(erro, t('mensagens.erro_estado'))),
  });
}

/**
 * As quatro acções sobre uma entrega. Um erro do servidor (409: «já mudou», 404: «já não é sua») mostra-se
 * com a mensagem **dele** e refaz as listas — é provável que o gestor tenha mexido entretanto.
 */
export function useAccoesDaEntrega(id: string) {
  const { t } = useTranslation('estafeta');
  const invalidar = useInvalidar();

  const comum = {
    onSuccess: () => void invalidar(),
    onError: (erro: unknown) => {
      toast.error(mensagemDeErro(erro, t('mensagens.erro_accao')));
      void invalidar();
    },
  };

  const recolher = useMutation({
    mutationFn: () => estafetaApi.recolher(id),
    ...comum,
    onSuccess: () => {
      toast.success(t('mensagens.recolhida'));
      void invalidar();
    },
  });

  const iniciarRota = useMutation({
    mutationFn: () => estafetaApi.iniciarRota(id),
    ...comum,
    onSuccess: () => {
      toast.success(t('mensagens.em_rota'));
      void invalidar();
    },
  });

  const entregar = useMutation({
    mutationFn: (dados: DadosDeEntrega) => estafetaApi.entregar(id, dados),
    ...comum,
    onSuccess: () => {
      toast.success(t('mensagens.entregue'));
      void invalidar();
    },
  });

  const falhar = useMutation({
    mutationFn: (dados: DadosDeFalha) => estafetaApi.falhar(id, dados),
    ...comum,
    onSuccess: () => {
      toast.success(t('mensagens.falhada'));
      void invalidar();
    },
  });

  /** «Cheguei»: avisa o cliente e a gestão sem mudar o estado da entrega. */
  const cheguei = useMutation({
    mutationFn: () => estafetaApi.cheguei(id),
    ...comum,
    onSuccess: () => {
      toast.success(t('mensagens.cheguei'));
      void invalidar();
    },
    onError: (erro: unknown) => {
      toast.error(mensagemDeErro(erro, t('mensagens.erro_cheguei')));
      void invalidar();
    },
  });

  return { recolher, iniciarRota, entregar, falhar, cheguei };
}
