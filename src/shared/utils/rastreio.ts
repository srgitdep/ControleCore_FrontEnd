/**
 * Regras puras do rastreio ao vivo (plano §4.6): quando o telemóvel do estafeta deve enviar uma posição,
 * quão fresca é a que se mostra, e o rasto desenhado no mapa.
 *
 * Tudo aqui é aritmética sem browser — por isso se testa. O que toca em `navigator.geolocation` e no
 * socket vive nos hooks.
 */

export interface Ponto {
  latitude: number;
  longitude: number;
}

export interface PontoComHora extends Ponto {
  /** Instante da leitura, em milissegundos desde 1970. */
  em: number;
}

/** Entre dois envios passam, no mínimo, 15 s: o servidor recusa menos de 10 s, e um envio por segundo gasta bateria e dados sem melhorar nada. */
export const INTERVALO_MINIMO_ENVIO_MS = 15_000;
/** Parado, não se envia nada novo — mas mesmo assim há um sinal de vida a cada minuto, para o cliente não ver «sem posição recente» num semáforo. */
export const SINAL_DE_VIDA_MS = 60_000;
/** Só conta como movimento acima disto: o GPS «treme» uns metros mesmo com o telemóvel numa mesa. */
export const DESLOCACAO_MINIMA_METROS = 25;
/** Espelha `POSICAO_RECENTE_MS` do servidor: depois disto o cliente vê «sem posição recente» e não um pino parado. */
export const POSICAO_RECENTE_MS = 2 * 60 * 1000;
/** Quantos pontos do rasto se guardam na memória: chega para uma rota inteira e não cresce sem fim. */
export const MAXIMO_DO_RASTO = 300;

const RAIO_TERRA_METROS = 6_371_000;
const emRadianos = (graus: number) => (graus * Math.PI) / 180;

/** Distância em linha recta entre dois pontos (Haversine). */
export function distanciaMetros(a: Ponto, b: Ponto): number {
  const dLat = emRadianos(b.latitude - a.latitude);
  const dLng = emRadianos(b.longitude - a.longitude);
  const h =
    Math.sin(dLat / 2) ** 2 + Math.cos(emRadianos(a.latitude)) * Math.cos(emRadianos(b.latitude)) * Math.sin(dLng / 2) ** 2;
  return 2 * RAIO_TERRA_METROS * Math.asin(Math.min(1, Math.sqrt(h)));
}

/**
 * Esta leitura do GPS deve ser enviada ao servidor?
 *
 * Sim se ainda não se enviou nada; senão, só passados 15 s **e** com deslocação de 25 m — ou, parado,
 * passado um minuto (sinal de vida).
 */
export function devePartilhar(ultimoEnvio: PontoComHora | null, nova: PontoComHora): boolean {
  if (!ultimoEnvio) return true;
  const passou = nova.em - ultimoEnvio.em;
  if (passou < INTERVALO_MINIMO_ENVIO_MS) return false;
  if (passou >= SINAL_DE_VIDA_MS) return true;
  return distanciaMetros(ultimoEnvio, nova) >= DESLOCACAO_MINIMA_METROS;
}

/** A posição é recente? Uma data inválida nunca é recente. */
export function posicaoRecente(em: string | number | Date | null | undefined, agora: number = Date.now()): boolean {
  if (em === null || em === undefined) return false;
  const instante = new Date(em).getTime();
  if (Number.isNaN(instante)) return false;
  return agora - instante <= POSICAO_RECENTE_MS;
}

/**
 * Acrescenta um ponto ao rasto, **sem mutar** o anterior. Ignora um ponto igual ao último (o mesmo
 * evento pode chegar duas vezes ao reconectar) e corta o início quando passa do máximo.
 */
export function acrescentarAoRasto(rasto: readonly Ponto[], ponto: Ponto, maximo: number = MAXIMO_DO_RASTO): Ponto[] {
  const ultimo = rasto[rasto.length - 1];
  if (ultimo && ultimo.latitude === ponto.latitude && ultimo.longitude === ponto.longitude) return [...rasto];
  const novo = [...rasto, { latitude: ponto.latitude, longitude: ponto.longitude }];
  return novo.length > maximo ? novo.slice(novo.length - maximo) : novo;
}

/** «350 m» abaixo de um quilómetro, «2,4 km» acima — a vírgula decimal é a de quem lê. */
export function textoDeDistancia(metros: number, separadorDecimal = ','): string {
  if (!Number.isFinite(metros) || metros < 0) return '';
  if (metros < 1000) return `${Math.round(metros / 10) * 10 || 10} m`;
  return `${(metros / 1000).toFixed(1).replace('.', separadorDecimal)} km`;
}
