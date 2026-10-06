import { useEffect } from 'react';
import L from 'leaflet';
import { MapContainer, Marker, TileLayer, useMap, useMapEvents } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import iconeMarcador from 'leaflet/dist/images/marker-icon.png';
import iconeMarcador2x from 'leaflet/dist/images/marker-icon-2x.png';
import sombraMarcador from 'leaflet/dist/images/marker-shadow.png';

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

/** Acompanha o pino quando ele muda por fora (geolocalização, morada guardada seleccionada). */
function SeguirMarcador({ ponto }: { ponto: PontoNoMapa | null }) {
  const mapa = useMap();
  useEffect(() => {
    if (ponto) mapa.setView([ponto.latitude, ponto.longitude], Math.max(mapa.getZoom(), 15));
  }, [mapa, ponto]);
  return null;
}

export default function MapaEntrega({ marcador, aoEscolher, loja, className }: MapaEntregaProps) {
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
      <SeguirMarcador ponto={marcador} />
      {marcador && <Marker position={[marcador.latitude, marcador.longitude]} icon={ICONE} />}
      {loja && <Marker position={[loja.latitude, loja.longitude]} icon={ICONE} opacity={0.6} />}
    </MapContainer>
  );
}
