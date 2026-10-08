import { useEffect } from 'react';
import L from 'leaflet';
import { Circle, MapContainer, Marker, TileLayer, useMap, useMapEvents } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import iconeMarcador from 'leaflet/dist/images/marker-icon.png';
import iconeMarcador2x from 'leaflet/dist/images/marker-icon-2x.png';
import sombraMarcador from 'leaflet/dist/images/marker-shadow.png';
import { limitesDoCirculo } from '@/shared/utils/geo';

/**
 * O único ficheiro que conhece o Leaflet. Trocar de fornecedor de mapas (Mapbox, Google)
 * é reescrever este componente — quem o usa só vê `Coordenadas` e callbacks.
 *
 * Carrega-se com `React.lazy` (ver `MapaEntregaLazy`): o Leaflet pesa ~150 KB e só quem
 * chega a uma morada o precisa.
 */

export interface PontoNoMapa {
  latitude: number;
  longitude: number;
}

/** Os tiles públicos do OpenStreetMap — um só sítio para trocar por um servidor próprio. */
const URL_TILES = 'https://tile.openstreetmap.org/{z}/{x}/{y}.png';
/** Exigida pela política de uso do OpenStreetMap; nunca a retirar. */
const ATRIBUICAO = '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors';

/** Maputo, quando ainda não há pino nem localização do dispositivo. */
export const CENTRO_OMISSAO: PontoNoMapa = { latitude: -25.9692, longitude: 32.5732 };

// O Leaflet resolve os ícones por um caminho relativo ao CSS, que o bundler parte. Apontá-los
// explicitamente evita o marcador «imagem quebrada» que se vê em produção e não em dev.
const ICONE = L.icon({
  iconUrl: iconeMarcador,
  iconRetinaUrl: iconeMarcador2x,
  shadowUrl: sombraMarcador,
  iconSize: [25, 41],
  iconAnchor: [12, 41],
});

interface MapaEntregaProps {
  /** O pino escolhido (a morada). */
  marcador: PontoNoMapa | null;
  /** Presente = o mapa é de selecção: tocar nele move o pino. */
  aoEscolher?: (ponto: PontoNoMapa) => void;
  /** Erro, em metros, da posição vinda do GPS — desenha-se como um círculo à volta do pino. */
  precisaoMetros?: number | null;
  /** A loja, só para contexto visual (modo leitura). */
  loja?: PontoNoMapa | null;
  className?: string;
}

function CliqueNoMapa({ aoEscolher }: { aoEscolher: (p: PontoNoMapa) => void }) {
  useMapEvents({
    click: (e) => aoEscolher({ latitude: e.latlng.lat, longitude: e.latlng.lng }),
  });
  return null;
}

/**
 * Mostra o pino quando ele muda por fora (GPS, morada seleccionada).
 *
 * Com a precisão do GPS, enquadra o círculo de erro inteiro — a pessoa vê de uma vez onde
 * o dispositivo acha que está e com que margem. Sem ela (clique no mapa), só se mexe na
 * vista se o pino ficou fora dela: mover o mapa debaixo do dedo a cada toque desorienta.
 */
function SeguirMarcador({ ponto, precisaoMetros }: { ponto: PontoNoMapa | null; precisaoMetros?: number | null }) {
  const mapa = useMap();
  useEffect(() => {
    if (!ponto) return;
    const centro = L.latLng(ponto.latitude, ponto.longitude);
    if (precisaoMetros && precisaoMetros > 0) {
      // Sem `L.circle(...).getBounds()`: precisa de o círculo estar desenhado num mapa, e rebentava.
      mapa.fitBounds(limitesDoCirculo(ponto.latitude, ponto.longitude, precisaoMetros), { maxZoom: 18, animate: false });
    } else if (!mapa.getBounds().contains(centro)) {
      mapa.setView(centro, Math.max(mapa.getZoom(), 16), { animate: false });
    }
  }, [mapa, ponto, precisaoMetros]);
  return null;
}

/**
 * O Leaflet mede o contentor **uma vez**, ao criar o mapa. Dentro de um modal ou de um
 * separador que acabou de aparecer, o contentor ainda não tem o tamanho final nesse
 * instante — e os tiles ficam deslocados, mostrando outro sítio, até algo forçar a remedir.
 */
function RemedirAoMudarDeTamanho() {
  const mapa = useMap();
  useEffect(() => {
    const contentor = mapa.getContainer();
    const observador = new ResizeObserver(() => mapa.invalidateSize());
    observador.observe(contentor);
    mapa.invalidateSize();
    return () => observador.disconnect();
  }, [mapa]);
  return null;
}

export default function MapaEntrega({ marcador, aoEscolher, precisaoMetros, loja, className }: MapaEntregaProps) {
  const centro = marcador ?? loja ?? CENTRO_OMISSAO;

  return (
    <MapContainer
      center={[centro.latitude, centro.longitude]}
      zoom={marcador ? 16 : 13}
      scrollWheelZoom={false}
      className={className ?? 'h-64 w-full rounded-xl'}
    >
      <TileLayer url={URL_TILES} attribution={ATRIBUICAO} />
      {aoEscolher && <CliqueNoMapa aoEscolher={aoEscolher} />}
      <RemedirAoMudarDeTamanho />
      <SeguirMarcador ponto={marcador} precisaoMetros={precisaoMetros} />
      {marcador && precisaoMetros ? (
        <Circle
          center={[marcador.latitude, marcador.longitude]}
          radius={precisaoMetros}
          pathOptions={{ color: '#2563eb', weight: 1, fillOpacity: 0.12 }}
        />
      ) : null}
      {marcador && <Marker position={[marcador.latitude, marcador.longitude]} icon={ICONE} />}
      {loja && <Marker position={[loja.latitude, loja.longitude]} icon={ICONE} opacity={0.6} />}
    </MapContainer>
  );
}
