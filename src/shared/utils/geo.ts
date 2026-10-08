/** Metros por grau de latitude (~constante em todo o globo). */
const METROS_POR_GRAU = 111_320;

/**
 * O rectângulo que enquadra um círculo de `raioMetros` à volta de um ponto — como `[[sul, oeste],
 * [norte, este]]`, o formato que o `fitBounds` do Leaflet aceita.
 *
 * ## Porque não `L.circle(...).getBounds()`
 *
 * O Leaflet só sabe calcular os limites de um círculo quando ele já foi **desenhado num mapa**:
 * `Circle.getBounds()` usa `this._map.layerPointToLatLng(...)`. Num círculo criado só para medir,
 * `_map` é `undefined` e a chamada rebenta com «Cannot read properties of undefined (reading
 * 'layerPointToLatLng')» — o que, dentro de um efeito do React, deitava abaixo a página inteira
 * assim que o GPS devolvia a primeira posição. A conta é simples e não precisa do Leaflet.
 *
 * A longitude encolhe com o cosseno da latitude (os meridianos aproximam-se dos pólos).
 */
export function limitesDoCirculo(
  latitude: number,
  longitude: number,
  raioMetros: number,
): [[number, number], [number, number]] {
  const dLat = raioMetros / METROS_POR_GRAU;
  // Perto dos pólos o cosseno tende a zero; o mínimo evita dividir por ~0 (nunca acontece em Moçambique).
  const dLng = raioMetros / (METROS_POR_GRAU * Math.max(Math.cos((latitude * Math.PI) / 180), 0.01));

  return [
    [latitude - dLat, longitude - dLng],
    [latitude + dLat, longitude + dLng],
  ];
}
