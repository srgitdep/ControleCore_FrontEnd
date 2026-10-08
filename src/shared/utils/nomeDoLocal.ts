/**
 * O nome de um sítio a partir das coordenadas («geocodificação inversa»), para a pessoa conferir
 * se o ponto que o GPS ou o mapa deram é mesmo o que ela quer — umas coordenadas, sozinhas, não
 * dizem nada a ninguém.
 *
 * ## De onde vem
 *
 * Do **Nominatim**, o serviço de pesquisa do OpenStreetMap (o mesmo que fornece os tiles do mapa).
 * É gratuito e sem chave, mas tem uma política de uso: no máximo **1 pedido por segundo** e só uso
 * moderado — daí o debounce e a cache do `useNomeDoLocal`. Para tráfego sério, trocar `URL_NOMINATIM`
 * por um servidor próprio ou pago. As coordenadas enviadas são as da loja ou da morada que a pessoa
 * está a marcar; o servidor do OSM vê-as.
 */

const URL_NOMINATIM = 'https://nominatim.openstreetmap.org/reverse';

export interface NomeDoLocal {
  /** Rua, bairro, cidade e província, em texto legível. */
  texto: string;
  /** O ponto caiu fora de Moçambique: quase de certeza o GPS ou o clique estão errados. */
  foraDeMocambique: boolean;
}

interface RespostaNominatim {
  display_name?: string;
  error?: string;
  address?: Record<string, string | undefined>;
}

/**
 * Transforma a resposta do Nominatim em algo que se lê de relance: `Rua, Bairro, Cidade, Província`.
 * Devolve `null` quando o serviço não conhece o sítio (oceano, mato) — e não uma frase vazia.
 */
export function formatarLocal(resposta: RespostaNominatim): NomeDoLocal | null {
  if (resposta.error) return null;
  const a = resposta.address ?? {};

  const partes = [
    a.road,
    a.suburb ?? a.neighbourhood ?? a.city_district,
    a.city ?? a.town ?? a.village ?? a.municipality,
    a.state,
  ].filter((p): p is string => !!p && p.trim() !== '');

  // Sem nenhum campo estruturado, os três primeiros pedaços do nome completo são o melhor que há.
  const texto =
    partes.length > 0
      ? [...new Set(partes)].join(', ')
      : (resposta.display_name ?? '').split(',').slice(0, 3).join(',').trim();

  if (texto === '') return null;

  return {
    texto,
    // `country_code` ausente não se trata como «fora»: sem informação, não se alarma ninguém.
    foraDeMocambique: !!a.country_code && a.country_code.toLowerCase() !== 'mz',
  };
}

/** Pede o nome do sítio. Rejeita se a rede falhar; devolve `null` se o sítio não tem nome. */
export async function procurarNomeDoLocal(
  latitude: number,
  longitude: number,
  lingua: string,
  sinal?: AbortSignal,
): Promise<NomeDoLocal | null> {
  const url = new URL(URL_NOMINATIM);
  url.searchParams.set('format', 'jsonv2');
  url.searchParams.set('lat', String(latitude));
  url.searchParams.set('lon', String(longitude));
  // 18 = ao nível do edifício/rua; mais baixo dava só a cidade, que não chega para conferir.
  url.searchParams.set('zoom', '18');
  url.searchParams.set('addressdetails', '1');
  url.searchParams.set('accept-language', lingua);

  const resposta = await fetch(url, { signal: sinal, headers: { Accept: 'application/json' } });
  if (!resposta.ok) throw new Error(`Nominatim respondeu ${resposta.status}`);

  return formatarLocal((await resposta.json()) as RespostaNominatim);
}

export interface ResultadoDePesquisa {
  texto: string;
  /** O nome completo, para distinguir dois sítios com o mesmo nome. */
  detalhe: string;
  latitude: number;
  longitude: number;
}

interface ItemDePesquisa extends RespostaNominatim {
  lat?: string;
  lon?: string;
}

/** Os resultados do Nominatim, só os que têm coordenadas válidas, já com um texto legível. */
export function formatarResultadosDaPesquisa(itens: ItemDePesquisa[]): ResultadoDePesquisa[] {
  const resultados: ResultadoDePesquisa[] = [];
  for (const item of itens) {
    const latitude = Number(item.lat);
    const longitude = Number(item.lon);
    if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) continue;

    const detalhe = item.display_name ?? '';
    const texto = formatarLocal(item)?.texto ?? detalhe.split(',').slice(0, 3).join(',').trim();
    if (texto === '') continue;
    resultados.push({ texto, detalhe, latitude, longitude });
  }
  return resultados;
}

/**
 * Procura um sítio pelo nome («Bairro Central, Maputo»). **Só em Moçambique** (`countrycodes=mz`):
 * uma loja ou uma morada fora do país é sempre um engano. Chamar só quando a pessoa pede (Enter ou
 * botão), nunca a cada tecla — a política do Nominatim é de 1 pedido por segundo.
 */
export async function pesquisarLocais(
  consulta: string,
  lingua: string,
  sinal?: AbortSignal,
): Promise<ResultadoDePesquisa[]> {
  const url = new URL(URL_NOMINATIM.replace(/reverse$/, 'search'));
  url.searchParams.set('format', 'jsonv2');
  url.searchParams.set('q', consulta);
  url.searchParams.set('countrycodes', 'mz');
  url.searchParams.set('limit', '5');
  url.searchParams.set('addressdetails', '1');
  url.searchParams.set('accept-language', lingua);

  const resposta = await fetch(url, { signal: sinal, headers: { Accept: 'application/json' } });
  if (!resposta.ok) throw new Error(`Nominatim respondeu ${resposta.status}`);

  return formatarResultadosDaPesquisa((await resposta.json()) as ItemDePesquisa[]);
}
