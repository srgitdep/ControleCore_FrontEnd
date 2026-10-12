import { useCallback, useEffect, useRef, useState } from 'react';
import type { Socket } from 'socket.io-client';
import { useCanalDeEntregas } from '@/shared/hooks/useCanalDeEntregas';
import { devePartilhar, type PontoComHora } from '@/shared/utils/rastreio';
import { estafetaApi } from '../api/estafeta.api';

/** O que o ecrã precisa de saber para dizer a verdade ao estafeta sobre a partilha. */
export type EstadoDaPartilha =
  /** Sem entrega em rota: não se partilha nada, e nem se pede a localização. */
  | 'inactiva'
  /** Em rota, mas a primeira vez: espera o «compreendo» antes de tocar no GPS. */
  | 'precisa_consentimento'
  /** O navegador não tem geolocalização, ou a página não está num contexto seguro (HTTPS/localhost). */
  | 'sem_suporte'
  /** O estafeta recusou a permissão (ou o telemóvel tem a localização desligada). */
  | 'negada'
  /** A partilhar, com o canal ligado. */
  | 'a_partilhar'
  /** A ler o GPS mas o canal não liga: a posição não está a chegar a ninguém. */
  | 'sem_canal';

const CHAVE_CONSENTIMENTO = 'estafeta.partilha.consentimento';
/**
 * O consentimento de ficar **online** é outro, de propósito: o de «partilhar em rota» diz que a posição só se partilha
 * durante uma entrega, e ficar online (para receber ofertas) alarga isso — a loja e o cliente continuam a não ver
 * nada fora da rota, mas o servidor passa a saber onde o estafeta está enquanto espera. Quem aceitou o primeiro não
 * aceitou o segundo.
 */
const CHAVE_CONSENTIMENTO_ONLINE = 'estafeta.partilha.consentimento.online';

function lerConsentimento(chave: string): boolean {
  try {
    return localStorage.getItem(chave) === '1';
  } catch {
    // Armazenamento bloqueado (modo privado): pergunta-se de cada vez, mas nunca se assume que sim.
    return false;
  }
}

function geolocalizacaoDisponivel(): boolean {
  return typeof navigator !== 'undefined' && 'geolocation' in navigator && (typeof window === 'undefined' || window.isSecureContext);
}

/**
 * Partilha a posição do estafeta **enquanto houver uma entrega em rota** (plano §4.6, D2/D7) **ou enquanto estiver
 * online** à espera de ofertas (plano §4.9, D5).
 *
 * - Só liga o GPS e o canal com `emRota` ou `online` e depois do consentimento: antes disso não se lê a localização.
 * - O canal é também por onde chegam as ofertas (`oferta.nova`): devolve-se o `socket` para quem as escuta.
 * - Envia a posição quando passaram 2,5 s **e** o estafeta se moveu 5 m (ou, parado, ao fim de 10 s).
 * - Pede ao navegador para **não apagar o ecrã** (Wake Lock). Não é um truque para contornar nada: sem
 *   isto, o ecrã apaga e o navegador pára o GPS — e esta é uma limitação honesta de uma PWA: com a
 *   aplicação em segundo plano ou o telemóvel bloqueado, **a posição pára de ser enviada**. O ecrã avisa.
 * - Ao deixar de haver entrega em rota (ou ao sair da aplicação) pára tudo: GPS, canal e Wake Lock.
 */
export function useEmitirPosicao({ emRota, online = false }: { emRota: boolean; online?: boolean }) {
  // Em rota manda o consentimento da rota; só online, o do modo online.
  const modo: 'rota' | 'online' = emRota ? 'rota' : 'online';
  const chave = modo === 'rota' ? CHAVE_CONSENTIMENTO : CHAVE_CONSENTIMENTO_ONLINE;
  const [consentimentos, setConsentimentos] = useState(() => ({
    [CHAVE_CONSENTIMENTO]: lerConsentimento(CHAVE_CONSENTIMENTO),
    [CHAVE_CONSENTIMENTO_ONLINE]: lerConsentimento(CHAVE_CONSENTIMENTO_ONLINE),
  }));
  const consentido = consentimentos[chave];
  const aPartilhar = emRota || online;
  const [permissao, setPermissao] = useState<'pendente' | 'concedida' | 'negada'>('pendente');
  const ultimoEnvio = useRef<PontoComHora | null>(null);
  const socketRef = useRef<Socket | null>(null);
  // Sobe quando a página volta a ficar visível: o Safari do iOS deixa o `watchPosition` calado depois de a página
  // ter estado em segundo plano (sem erro, sem leituras); recomeçá-lo é o que o põe a andar de novo.
  const [retoma, setRetoma] = useState(0);

  const suportado = geolocalizacaoDisponivel();
  const activo = aPartilhar && consentido && suportado;

  const { socket, ligado } = useCanalDeEntregas({
    activo,
    obterToken: () => estafetaApi.tokenDeSocket(),
  });

  useEffect(() => {
    socketRef.current = socket;
  }, [socket]);

  const consentir = useCallback(() => {
    try {
      localStorage.setItem(chave, '1');
    } catch {
      // Sem armazenamento: vale só nesta sessão.
    }
    setConsentimentos((c) => ({ ...c, [chave]: true }));
  }, [chave]);

  // O GPS. Corre enquanto `activo`; ao parar, limpa o último envio para a próxima rota começar de novo.
  useEffect(() => {
    if (!activo) return;

    const id = navigator.geolocation.watchPosition(
      (posicao) => {
        setPermissao('concedida');
        const nova: PontoComHora = {
          latitude: posicao.coords.latitude,
          longitude: posicao.coords.longitude,
          em: Date.now(),
        };
        if (!devePartilhar(ultimoEnvio.current, nova)) return;

        const s = socketRef.current;
        // Sem canal não se marca como enviado: a próxima leitura volta a tentar, em vez de esperar 15 s a mais.
        if (!s?.connected) return;
        s.emit('posicao', {
          latitude: nova.latitude,
          longitude: nova.longitude,
          precisao: posicao.coords.accuracy,
        });
        ultimoEnvio.current = nova;
      },
      (erro) => {
        // 1 = PERMISSION_DENIED. Os outros (sinal fraco, tempo esgotado) passam sozinhos.
        if (erro.code === 1) setPermissao('negada');
      },
      // `maximumAge` curto: com envios a cada 2,5 s, reaproveitar uma leitura de 5 s repetia o mesmo ponto.
      { enableHighAccuracy: true, maximumAge: 1_000, timeout: 20_000 },
    );

    return () => {
      navigator.geolocation.clearWatch(id);
      ultimoEnvio.current = null;
    };
  }, [activo, retoma]);

  useEffect(() => {
    if (!activo) return;
    const aoVoltar = () => {
      if (document.visibilityState === 'visible') setRetoma((n) => n + 1);
    };
    document.addEventListener('visibilitychange', aoVoltar);
    return () => document.removeEventListener('visibilitychange', aoVoltar);
  }, [activo]);

  // O ecrã ligado. O navegador liberta o bloqueio ao esconder a página; pede-se de novo ao voltar.
  useEffect(() => {
    if (!activo || !('wakeLock' in navigator)) return;

    let bloqueio: WakeLockSentinel | null = null;
    let parado = false;

    const pedir = async () => {
      try {
        const obtido = await navigator.wakeLock.request('screen');
        if (parado) void obtido.release();
        else bloqueio = obtido;
      } catch {
        // Recusado (bateria fraca, separador escondido): o aviso permanente já diz para manter o ecrã ligado.
      }
    };
    const aoVoltar = () => {
      if (document.visibilityState === 'visible') void pedir();
    };

    void pedir();
    document.addEventListener('visibilitychange', aoVoltar);
    return () => {
      parado = true;
      document.removeEventListener('visibilitychange', aoVoltar);
      void bloqueio?.release();
    };
  }, [activo]);

  let estado: EstadoDaPartilha;
  if (!aPartilhar) estado = 'inactiva';
  else if (!suportado) estado = 'sem_suporte';
  else if (!consentido) estado = 'precisa_consentimento';
  else if (permissao === 'negada') estado = 'negada';
  else if (!ligado) estado = 'sem_canal';
  else estado = 'a_partilhar';

  return { estado, consentir, socket, modo };
}
