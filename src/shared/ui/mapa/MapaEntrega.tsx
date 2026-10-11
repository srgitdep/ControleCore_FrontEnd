import { useEffect, useRef } from 'react';
import L from 'leaflet';
import { Circle, MapContainer, Marker, Polyline, TileLayer, Tooltip, useMap, useMapEvents } from 'react-leaflet';
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

/** Um estafeta em rota, para o mapa da loja. */
export interface EstafetaNoMapa extends PontoNoMapa {
  id: string;
  nome: string;
  /** Posição velha (> 2 min): desenha-se esbatida, para ninguém a tomar por ao vivo. */
  desactualizada?: boolean;
}

/**
 * O estafeta: um disco azul com um anel, e não o alfinete dos destinos — numa vista com a loja, o
 * destino e o estafeta, o que se move tem de se distinguir do que está parado.
 */
const iconeEstafeta = (desactualizada: boolean) =>
  L.divIcon({
    className: '',
    html: `<span style="display:block;width:18px;height:18px;border-radius:9999px;background:${desactualizada ? '#94a3b8' : '#2563eb'};border:3px solid #fff;box-shadow:0 0 0 2px ${desactualizada ? '#94a3b8' : '#2563eb'},0 1px 4px rgba(0,0,0,.4)"></span>`,
    iconSize: [18, 18],
    iconAnchor: [9, 9],
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
  /** Rastreio (plano §4.6): onde está o estafeta agora, ou `null` quando não há posição recente. */
  estafeta?: (PontoNoMapa & { desactualizada?: boolean }) | null;
  /** O caminho já percorrido, em memória; desenha-se como linha. */
  rasto?: readonly PontoNoMapa[];
  /** O caminho previsto por estrada (5C), do estafeta ao destino; quando existe, substitui a linha recta. */
  rotaPrevista?: readonly PontoNoMapa[] | null;
  /** O mapa da loja: vários estafetas em rota, sem pino de destino. */
  estafetas?: readonly EstafetaNoMapa[];
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

/**
 * Enquadra de uma vez tudo o que há para ver (estafeta, destino, loja) e depois só acompanha: se o
 * estafeta sai da vista, centra-o; se continua dentro, não mexe — mover o mapa debaixo do dedo a cada
 * posição nova tornava impossível arrastá-lo.
 */
function EnquadrarRastreio({ pontos, estafeta }: { pontos: readonly PontoNoMapa[]; estafeta: PontoNoMapa | null }) {
  const mapa = useMap();
  const enquadrado = useRef(false);
  const total = pontos.length;

  useEffect(() => {
    if (total === 0) return;
    if (!enquadrado.current && estafeta) {
      mapa.fitBounds(L.latLngBounds(pontos.map((p) => [p.latitude, p.longitude] as [number, number])), {
        padding: [40, 40],
        maxZoom: 17,
        animate: false,
      });
      enquadrado.current = true;
      return;
    }
    if (estafeta && enquadrado.current) {
      const ponto = L.latLng(estafeta.latitude, estafeta.longitude);
      if (!mapa.getBounds().contains(ponto)) mapa.panTo(ponto);
    }
    // Só reage ao estafeta e ao número de pontos: a lista é nova a cada render.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mapa, estafeta?.latitude, estafeta?.longitude, total]);

  return null;
}

/** O mapa da loja enquadra todos os estafetas quando entra ou sai alguém (e não a cada posição). */
function EnquadrarEstafetas({ estafetas }: { estafetas: readonly EstafetaNoMapa[] }) {
  const mapa = useMap();
  const assinatura = estafetas.map((e) => e.id).sort().join('|');

  useEffect(() => {
    if (estafetas.length === 0) return;
    mapa.fitBounds(L.latLngBounds(estafetas.map((e) => [e.latitude, e.longitude] as [number, number])), {
      padding: [50, 50],
      maxZoom: 16,
      animate: false,
    });
    // Só quando muda quem está no mapa.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mapa, assinatura]);

  return null;
}

export default function MapaEntrega({
  marcador,
  aoEscolher,
  precisaoMetros,
  loja,
  estafeta,
  rasto,
  rotaPrevista,
  estafetas,
  className,
}: MapaEntregaProps) {
  const centro = marcador ?? estafetas?.[0] ?? loja ?? CENTRO_OMISSAO;
  const rastreio = !!estafeta;

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
      {/* No rastreio quem enquadra é `EnquadrarRastreio`; `SeguirMarcador` puxaria a vista para o destino. */}
      {!rastreio && <SeguirMarcador ponto={marcador} precisaoMetros={precisaoMetros} />}
      {rastreio && (
        <EnquadrarRastreio
          pontos={[estafeta, marcador, loja].filter((p): p is PontoNoMapa => !!p)}
          estafeta={estafeta}
        />
      )}
      {estafetas && <EnquadrarEstafetas estafetas={estafetas} />}
      {rasto && rasto.length > 1 && (
        <Polyline
          positions={rasto.map((p) => [p.latitude, p.longitude] as [number, number])}
          pathOptions={{ color: '#2563eb', weight: 4, opacity: 0.7 }}
        />
      )}
      {rotaPrevista && rotaPrevista.length > 1 && (
        <Polyline
          positions={rotaPrevista.map((p) => [p.latitude, p.longitude] as [number, number])}
          pathOptions={{ color: '#059669', weight: 4, opacity: 0.6, dashArray: '2 8' }}
        />
      )}
      {estafeta && marcador && !(rotaPrevista && rotaPrevista.length > 1) && (
        // Linha recta até ao destino: não é a rota (essa é a 5C), é a direcção. Tracejada para não a confundir.
        <Polyline
          positions={[
            [estafeta.latitude, estafeta.longitude],
            [marcador.latitude, marcador.longitude],
          ]}
          pathOptions={{ color: '#64748b', weight: 2, dashArray: '6 8' }}
        />
      )}
      {estafeta && (
        <Marker
          position={[estafeta.latitude, estafeta.longitude]}
          icon={iconeEstafeta(!!estafeta.desactualizada)}
          zIndexOffset={1000}
        />
      )}
      {estafetas?.map((e) => (
        <Marker key={e.id} position={[e.latitude, e.longitude]} icon={iconeEstafeta(!!e.desactualizada)} zIndexOffset={1000}>
          <Tooltip permanent direction="top" offset={[0, -10]}>
            {e.nome}
          </Tooltip>
        </Marker>
      ))}
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
