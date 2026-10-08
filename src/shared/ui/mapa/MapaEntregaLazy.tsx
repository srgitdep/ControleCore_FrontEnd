import { Component, lazy, Suspense } from 'react';
import type { ComponentProps, ReactNode } from 'react';
import { Loader2, MapPinOff } from 'lucide-react';
import { useTranslation } from 'react-i18next';

const MapaEntrega = lazy(() => import('./MapaEntrega'));

function MapaIndisponivel() {
  const { t } = useTranslation('shell');
  return (
    <div className="flex h-64 w-full flex-col items-center justify-center gap-2 rounded-xl bg-slate-100 px-4 text-center">
      <MapPinOff size={22} className="text-slate-400" />
      <p className="text-sm text-slate-500">{t('mapa.indisponivel')}</p>
    </div>
  );
}

/**
 * Uma falha do mapa (o Leaflet, os tiles, um erro de cálculo) fica **no mapa**: o resto do ecrã — o
 * formulário, o botão de guardar — continua a funcionar. Sem esta barreira, um erro dentro do mapa
 * subia até ao router e deitava abaixo a página inteira («Unexpected Application Error»), como
 * aconteceu com o GPS em produção.
 */
class BarreiraDoMapa extends Component<{ children: ReactNode }, { falhou: boolean }> {
  state = { falhou: false };

  static getDerivedStateFromError() {
    return { falhou: true };
  }

  componentDidCatch(erro: unknown) {
    console.error('Falha no mapa:', erro);
  }

  render() {
    return this.state.falhou ? <MapaIndisponivel /> : this.props.children;
  }
}

/**
 * O mapa a pedido: o Leaflet só é descarregado quando um ecrã o mostra. A caixa de espera
 * tem a altura do mapa para a página não saltar quando ele chega.
 */
export function MapaEntregaLazy(props: ComponentProps<typeof MapaEntrega>) {
  return (
    <BarreiraDoMapa>
      <Suspense
        fallback={
          <div className="flex h-64 w-full items-center justify-center rounded-xl bg-slate-100">
            <Loader2 size={20} className="animate-spin text-slate-400" />
          </div>
        }
      >
        <MapaEntrega {...props} />
      </Suspense>
    </BarreiraDoMapa>
  );
}
