import { lazy, Suspense } from 'react';
import { Loader2 } from 'lucide-react';
import type { ComponentProps } from 'react';

const MapaEntrega = lazy(() => import('./MapaEntrega'));

/**
 * O mapa a pedido: o Leaflet só é descarregado quando um ecrã o mostra. A caixa de espera
 * tem a altura do mapa para a página não saltar quando ele chega.
 */
export function MapaEntregaLazy(props: ComponentProps<typeof MapaEntrega>) {
  return (
    <Suspense
      fallback={
        <div className="flex h-64 w-full items-center justify-center rounded-xl bg-slate-100">
          <Loader2 size={20} className="animate-spin text-slate-400" />
        </div>
      }
    >
      <MapaEntrega {...props} />
    </Suspense>
  );
}
