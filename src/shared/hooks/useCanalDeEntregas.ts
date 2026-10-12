import { useEffect, useRef, useState } from 'react';
import { io, type Socket } from 'socket.io-client';
import { enderecoDoSocket } from '../config/enderecoSocket';

/** Quanto se espera antes de tentar de novo depois de o servidor fechar a ligação (token recusado, estafeta desactivado). */
const ESPERA_ENTRE_TENTATIVAS_MS = 30_000;

type Manipulador = (dados: never) => void;

interface OpcoesDoCanal {
  /** Falso = não se liga (sem sessão, ecrã sem nada a seguir). Passar a falso desliga. */
  activo: boolean;
  /**
   * Pede o token de socket por REST. Chama-se **a cada ligação e reconexão**: o token vale 15 min, e um
   * telemóvel que perdeu a rede a meio da rota reconecta com um token já expirado se o guardarmos.
   */
  obterToken: () => Promise<string>;
  /** Corre a cada (re)ligação — é onde o cliente pede `seguir`. */
  aoLigar?: (socket: Socket) => void;
  /** Os eventos do servidor que interessam a este ecrã. */
  eventos?: Record<string, Manipulador>;
}

/**
 * A ligação ao canal `/entregas` (plano §4.6): a mesma para a loja, o cliente e o estafeta — muda só de
 * onde vem o token e o que se escuta.
 *
 * ## Porque o token vem por REST e não do cookie
 *
 * Igual a `useSocket`: a página é servida pela Vercel, a API vive no Fly e os `rewrites` da Vercel não
 * encaminham WebSockets. O socket liga directamente ao Fly, para onde os cookies do domínio da Vercel
 * não seguem.
 *
 * ## `ligado` é a verdade do ecrã
 *
 * Quem usa isto mostra «ao vivo» só com `ligado` verdadeiro; senão cai para a consulta de 30 s e diz
 * que é isso que está a fazer. Um indicador «ao vivo» a mentir é pior do que não ter indicador.
 *
 * Os manipuladores guardam-se numa referência: mudá-los a cada render não pode derrubar e refazer a
 * ligação (e com ela perder a sala).
 */
export function useCanalDeEntregas({ activo, obterToken, aoLigar, eventos }: OpcoesDoCanal) {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [ligado, setLigado] = useState(false);
  const opcoes = useRef({ obterToken, aoLigar, eventos });

  useEffect(() => {
    opcoes.current = { obterToken, aoLigar, eventos };
  });

  useEffect(() => {
    if (!activo) return;

    const { endereco } = enderecoDoSocket();
    const instancia = io(`${endereco}/entregas`, {
      // Função: o socket.io chama-a a cada tentativa, e assim a reconexão leva um token novo.
      auth: (entregar) => {
        opcoes.current
          .obterToken()
          .then((token) => entregar({ token }))
          // Sem token o servidor recusa e fecha; o ecrã fica na consulta de 30 s.
          .catch(() => entregar({}));
      },
    });

    let espera: ReturnType<typeof setTimeout> | undefined;

    instancia.on('connect', () => {
      setLigado(true);
      opcoes.current.aoLigar?.(instancia);
    });
    instancia.on('disconnect', (motivo) => {
      setLigado(false);
      // «io server disconnect»: foi o servidor que fechou (token recusado). O socket.io não volta a
      // tentar sozinho nesse caso, e um estafeta ficaria sem rastreio até recarregar a página.
      if (motivo === 'io server disconnect') {
        espera = setTimeout(() => instancia.connect(), ESPERA_ENTRE_TENTATIVAS_MS);
      }
    });
    instancia.on('connect_error', () => setLigado(false));

    // Escuta os eventos que quem chama pediu (`entrega.posicao`, `entrega.estado`, `notificacao.nova`…): o servidor
    // decide a que sala cada um vai, e aqui só se regista o que este ecrã quer receber.
    for (const nome of Object.keys(opcoes.current.eventos ?? {})) {
      instancia.on(nome, (dados: unknown) => {
        const manipulador = opcoes.current.eventos?.[nome] as ((d: unknown) => void) | undefined;
        manipulador?.(dados);
      });
    }

    // O iOS (e o Android, com o separador esquecido) suspende a página em segundo plano e mata o WebSocket sem avisar;
    // o socket.io só o descobre ao fim do ping, e se o servidor tiver fechado a ligação nem tenta de novo. Ao voltar
    // ao ecrã, se não está ligado, liga-se já — em vez de o utilizador ver «ao vivo» parado até recarregar.
    const aoVoltar = () => {
      if (document.visibilityState === 'visible' && !instancia.connected) instancia.connect();
    };
    document.addEventListener('visibilitychange', aoVoltar);

    setSocket(instancia);

    return () => {
      if (espera) clearTimeout(espera);
      document.removeEventListener('visibilitychange', aoVoltar);
      instancia.disconnect();
      setSocket(null);
      setLigado(false);
    };
  }, [activo]);

  return { socket, ligado };
}
