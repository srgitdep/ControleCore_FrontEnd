import { useCallback, useEffect, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { Socket } from 'socket.io-client';
import { useTranslation } from 'react-i18next';
import toast from 'react-hot-toast';
import { mensagemDeErro } from '@/shared/utils';
import { obterMelhorPosicao } from '@/shared/utils/geolocalizacao';
import { estafetaApi } from '../api/estafeta.api';
import { useEstafetaStore } from '../store/useEstafetaStore';
import type { MotivoDaOfertaEncerrada, OfertaDeEntrega, PosicaoParaOnline } from '../types/onboarding';

const CHAVE = 'estafeta-app';

/**
 * Se o telemóvel perder o canal em tempo real (a rede cai, o iOS suspende a página), uma oferta pode chegar e não
 * ser vista. Enquanto está online, pergunta-se ao servidor a cada 15 s: é a rede de segurança, com 30 s de prazo
 * por oferta — e o `visibilitychange` trata do caso de voltar a abrir a aplicação.
 */
const QUINZE_SEGUNDOS = 15_000;

export type FalhaDaLocalizacao = 'sem_suporte' | 'negada' | 'indisponivel';

/** O que correu mal ao obter a posição para ficar online, em palavras que o ecrã sabe dizer. */
export function classificarFalhaDaLocalizacao(erro: unknown): FalhaDaLocalizacao {
  const codigo = (erro as { code?: number } | null)?.code;
  if (codigo === 1) return 'negada';
  return 'indisponivel';
}

/** Pede a posição ao GPS: a melhor em ~10 s, não a primeira (que costuma ser a pior). */
export async function obterPosicaoParaFicarOnline(): Promise<PosicaoParaOnline> {
  if (typeof navigator === 'undefined' || !('geolocation' in navigator) || (typeof window !== 'undefined' && !window.isSecureContext)) {
    throw Object.assign(new Error('Sem suporte'), { falha: 'sem_suporte' as const });
  }
  const p = await obterMelhorPosicao(navigator.geolocation, { alvoMetros: 50, tempoMaximoMs: 10_000 });
  return { latitude: p.latitude, longitude: p.longitude, precisao: p.precisaoMetros };
}

function useInvalidar() {
  const queryClient = useQueryClient();
  return () => queryClient.invalidateQueries({ queryKey: [CHAVE] });
}

/**
 * Ficar online. A frota da plataforma **exige** a posição (é com ela que se escolhe quem está perto da loja); a
 * própria dispensa-a, mas pede-se na mesma — se o GPS falhar, na frota própria fica-se online sem ela.
 */
export function useFicarOnline() {
  const { t } = useTranslation('estafeta');
  const invalidar = useInvalidar();

  return useMutation({
    mutationFn: async ({ daPlataforma }: { daPlataforma: boolean }) => {
      let posicao: PosicaoParaOnline | undefined;
      try {
        posicao = await obterPosicaoParaFicarOnline();
      } catch (erro) {
        if (daPlataforma) {
          const falha = (erro as { falha?: FalhaDaLocalizacao }).falha ?? classificarFalhaDaLocalizacao(erro);
          throw Object.assign(new Error(falha), { falhaDaLocalizacao: falha });
        }
      }
      return estafetaApi.ficarOnline(posicao);
    },
    onSuccess: () => void invalidar(),
    onError: (erro) => {
      const falha = (erro as { falhaDaLocalizacao?: FalhaDaLocalizacao }).falhaDaLocalizacao;
      toast.error(falha ? t(`online.falha.${falha}`) : mensagemDeErro(erro, t('online.falha.generica')));
    },
  });
}

export function useFicarOffline() {
  const { t } = useTranslation('estafeta');
  const invalidar = useInvalidar();

  return useMutation({
    mutationFn: () => estafetaApi.ficarOffline(),
    onSuccess: () => void invalidar(),
    onError: (erro) => toast.error(mensagemDeErro(erro, t('online.falha.generica'))),
  });
}

/**
 * A oferta de entrega pendente (plano §4.9, D7), do estafeta que está online.
 *
 * Três fontes, para nenhuma oferta se perder: o evento em tempo real `oferta.nova` (o caminho normal), a consulta
 * ao servidor ao ligar e de 15 em 15 s (a rede de segurança), e ao voltar a ver a página. O evento
 * `oferta.encerrada` fecha-a — expirou, foi para outro, ou foi cancelada.
 *
 * Aceitar e recusar não escondem a oferta à força: só quando o servidor responde. Um 409 («já não está
 * disponível») mostra a mensagem dele e fecha a oferta.
 */
export function useOfertas({
  activo,
  socket,
  aoAceitar,
}: {
  activo: boolean;
  socket: Socket | null;
  /** Corre depois de aceitar, com o id da entrega: é para onde o estafeta vai a seguir (já pode ver a morada). */
  aoAceitar?: (entregaId: string) => void;
}) {
  const { t } = useTranslation('estafeta');
  const autenticado = useEstafetaStore((s) => s.autenticado);
  const invalidar = useInvalidar();
  const [recebida, setRecebida] = useState<OfertaDeEntrega | null>(null);

  const consulta = useQuery({
    queryKey: [CHAVE, 'oferta'],
    queryFn: () => estafetaApi.ofertaActual(),
    enabled: autenticado && activo,
    refetchInterval: QUINZE_SEGUNDOS,
    refetchOnWindowFocus: true,
  });

  // A oferta que se mostra: a que chegou pelo canal ou, não havendo, a da consulta. Fecha com o prazo.
  const candidata = recebida ?? consulta.data ?? null;
  const [agora, setAgora] = useState(() => Date.now());
  useEffect(() => {
    if (!candidata) return;
    const id = setInterval(() => setAgora(Date.now()), 1000);
    return () => clearInterval(id);
  }, [candidata]);

  const oferta = candidata && Date.parse(candidata.expiraEm) > agora ? candidata : null;
  const segundosRestantes = oferta ? Math.max(0, Math.ceil((Date.parse(oferta.expiraEm) - agora) / 1000)) : 0;

  useEffect(() => {
    if (!socket || !activo) return;

    const aoChegar = (dados: Omit<OfertaDeEntrega, 'id'> & { ofertaId: string }) => {
      setRecebida({
        id: dados.ofertaId,
        entregaId: dados.entregaId,
        lojaNome: dados.lojaNome,
        distanciaMetros: dados.distanciaMetros,
        taxa: dados.taxa,
        expiraEm: dados.expiraEm,
      });
      setAgora(Date.now());
    };
    const aoEncerrar = (dados: { ofertaId: string; motivo: MotivoDaOfertaEncerrada }) => {
      setRecebida((actual) => (actual?.id === dados.ofertaId ? null : actual));
      void invalidar();
    };

    socket.on('oferta.nova', aoChegar);
    socket.on('oferta.encerrada', aoEncerrar);
    return () => {
      socket.off('oferta.nova', aoChegar);
      socket.off('oferta.encerrada', aoEncerrar);
    };
    // `invalidar` muda de identidade a cada render e não deve religar os eventos.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [socket, activo]);

  const fechar = useCallback(() => {
    setRecebida(null);
    void invalidar();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const aceitar = useMutation({
    mutationFn: (id: string) => estafetaApi.aceitarOferta(id),
    onSuccess: (resposta) => {
      toast.success(t('oferta.aceite'));
      fechar();
      aoAceitar?.(resposta.entregaId);
    },
    onError: (erro) => {
      toast.error(mensagemDeErro(erro, t('oferta.erro_aceitar')));
      fechar();
    },
  });

  const recusar = useMutation({
    mutationFn: (id: string) => estafetaApi.recusarOferta(id),
    onSuccess: fechar,
    onError: (erro) => {
      toast.error(mensagemDeErro(erro, t('oferta.erro_recusar')));
      fechar();
    },
  });

  return { oferta, segundosRestantes, aceitar, recusar };
}
