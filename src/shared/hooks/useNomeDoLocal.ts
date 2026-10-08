import { useQuery } from '@tanstack/react-query';
import { idiomaActivo } from '@/i18n';
import { procurarNomeDoLocal } from '@/shared/utils/nomeDoLocal';
import { useDebounce } from './useDebounce';

/** Cinco casas decimais são ~1 m: o suficiente para o nome, e agrupa cliques quase iguais na mesma cache. */
const casas = (n: number) => Number(n.toFixed(5));

/**
 * O nome do sítio onde está o ponto. Espera 800 ms depois da última mudança (a pessoa pode estar a
 * arrastar o pino ou o GPS a afinar) e guarda a resposta para sempre: as coordenadas dão sempre o
 * mesmo sítio, e o Nominatim pede no máximo um pedido por segundo. `retry: 0` pelo mesmo motivo.
 */
export function useNomeDoLocal(ponto: { latitude: number; longitude: number } | null) {
  const alvo = useDebounce(ponto ? { lat: casas(ponto.latitude), lng: casas(ponto.longitude) } : null, 800);
  const lingua = idiomaActivo();

  const consulta = useQuery({
    queryKey: ['nome-do-local', alvo?.lat, alvo?.lng, lingua],
    queryFn: ({ signal }) => procurarNomeDoLocal(alvo!.lat, alvo!.lng, lingua, signal),
    enabled: alvo !== null,
    staleTime: Infinity,
    retry: 0,
  });

  // Enquanto o ponto mudou mas o debounce ainda não, o nome que se vê é o do ponto antigo: não o
  // mostrar como se fosse do novo.
  const desactualizado =
    ponto !== null &&
    (alvo === null || casas(ponto.latitude) !== alvo.lat || casas(ponto.longitude) !== alvo.lng);

  return {
    nome: desactualizado ? undefined : consulta.data,
    aProcurar: ponto !== null && (desactualizado || consulta.isFetching),
    falhou: !desactualizado && consulta.isError,
  };
}
