export interface PosicaoGps {
  latitude: number;
  longitude: number;
  /** Raio de erro, em metros, que o próprio dispositivo declara (nível de confiança de ~68%). */
  precisaoMetros: number;
}

interface Opcoes {
  /** Para assim que o dispositivo declarar um erro igual ou menor que este. */
  alvoMetros?: number;
  /** Tecto de espera: devolve a melhor posição até aí, em vez de esperar para sempre. */
  tempoMaximoMs?: number;
  /** Chamada a cada posição melhor que as anteriores — para o ecrã mostrar o progresso. */
  aoMelhorar?: (posicao: PosicaoGps) => void;
}

type FonteGps = Pick<Geolocation, 'watchPosition' | 'clearWatch'>;

/**
 * A melhor posição que o dispositivo consegue dar em alguns segundos.
 *
 * ## Porque não `getCurrentPosition`
 *
 * Devolve a **primeira** posição que o dispositivo tem, e essa costuma ser a pior: o
 * receptor GPS ainda está a procurar satélites e a resposta vem da rede Wi-Fi ou do IP,
 * com erros de centenas de metros ou de quilómetros (num computador, quase sempre). Gravar
 * isso como a localização da loja ou da morada estraga todas as distâncias da entrega.
 * Ficar a ouvir (`watchPosition`) e guardar a de menor erro dá ao GPS o tempo de se fixar.
 *
 * Rejeita só se nunca chegou nenhuma posição (permissão negada, sem sinal, tempo esgotado).
 */
export function obterMelhorPosicao(fonte: FonteGps, opcoes: Opcoes = {}): Promise<PosicaoGps> {
  const { alvoMetros = 25, tempoMaximoMs = 15_000, aoMelhorar } = opcoes;

  return new Promise((resolver, rejeitar) => {
    let melhor: PosicaoGps | null = null;
    let concluido = false;
    let idObservacao: number | null = null;

    const terminar = (erro?: unknown) => {
      if (concluido) return;
      concluido = true;
      clearTimeout(temporizador);
      if (idObservacao !== null) fonte.clearWatch(idObservacao);
      if (melhor) resolver(melhor);
      else rejeitar(erro ?? new Error('Sem posição.'));
    };

    const temporizador = setTimeout(() => terminar(new Error('Tempo esgotado.')), tempoMaximoMs);

    idObservacao = fonte.watchPosition(
      (p) => {
        if (concluido) return;
        const actual: PosicaoGps = {
          latitude: p.coords.latitude,
          longitude: p.coords.longitude,
          precisaoMetros: Math.round(p.coords.accuracy),
        };
        if (!melhor || actual.precisaoMetros < melhor.precisaoMetros) {
          melhor = actual;
          aoMelhorar?.(actual);
        }
        if (melhor.precisaoMetros <= alvoMetros) terminar();
      },
      // Um erro depois de já haver posição não deita fora o que se tem.
      (erro) => terminar(erro),
      { enableHighAccuracy: true, maximumAge: 0, timeout: tempoMaximoMs },
    );
  });
}

/** Ligação para ver o ponto num mapa conhecido — para a pessoa conferir com o que já conhece. */
export function ligacaoNoMapa(latitude: number, longitude: number): string {
  return `https://www.google.com/maps?q=${latitude},${longitude}`;
}

/** Até aqui é GPS a sério (ao ar livre, num telemóvel). */
export const PRECISAO_BOA_METROS = 100;
/**
 * Acima disto a posição **não se usa**: é a rede Wi-Fi ou o IP a adivinhar (um computador sem GPS
 * dá erros de dezenas de quilómetros e pode pôr o pino noutra cidade, ou noutra província). Aceitá-la
 * em silêncio faria gravar a loja ou a morada no sítio errado, e a distância de todas as entregas
 * seria calculada a partir daí.
 */
export const PRECISAO_MAXIMA_ACEITAVEL_METROS = 1000;

export type QualidadeDaPosicao = 'boa' | 'fraca' | 'inutilizavel';

/**
 * `boa` (≤ 100 m): usa-se. `fraca` (até 1 km): usa-se, mas avisa-se. `inutilizavel` (> 1 km): não se
 * usa — diz-se porquê e sugere-se outra via (telemóvel, pesquisar o local, marcar no mapa).
 */
export function avaliarPrecisao(precisaoMetros: number): QualidadeDaPosicao {
  if (precisaoMetros <= PRECISAO_BOA_METROS) return 'boa';
  if (precisaoMetros <= PRECISAO_MAXIMA_ACEITAVEL_METROS) return 'fraca';
  return 'inutilizavel';
}
