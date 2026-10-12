import { useTranslation } from 'react-i18next';
import { Loader2 } from 'lucide-react';
import { cn } from '@/shared/utils';
import { useFicarOffline, useFicarOnline } from '../hooks/useOfertas';
import type { PerfilEstafeta } from '../types/estafeta';

/**
 * O interruptor de estar disponível (plano §4.9, D5).
 *
 * - **Estafeta da plataforma:** «online» — passa a receber ofertas das entregas perto da loja, e para isso a
 *   aplicação pede a localização ao ligar. Sem ela não fica online (o servidor também o recusa), e a mensagem diz
 *   porquê: é com a posição que se escolhe quem está perto.
 * - **Frota própria:** o mesmo botão de sempre, «disponível / indisponível» — quem lhe atribui entregas é o gestor.
 *
 * Fica desligado sem ligação à rede: ligar sem rede não chegava a lado nenhum e deixava o ecrã a dizer o contrário
 * do servidor.
 */
export function InterruptorOnline({ perfil, semRede }: { perfil: PerfilEstafeta; semRede: boolean }) {
  const { t } = useTranslation('estafeta');
  const ficarOnline = useFicarOnline();
  const ficarOffline = useFicarOffline();

  const daPlataforma = perfil.frota === 'PLATAFORMA';
  // A frota da plataforma vive do `online`; a própria, do estado que o gestor vê (os estafetas antigos têm-no sem `online`).
  const ligado = daPlataforma ? perfil.online : perfil.estado === 'DISPONIVEL' || perfil.estado === 'EM_ENTREGA';
  const aMudar = ficarOnline.isPending || ficarOffline.isPending;

  const alternar = () => {
    if (ligado) ficarOffline.mutate();
    else ficarOnline.mutate({ daPlataforma });
  };

  const texto = perfil.estado === 'EM_ENTREGA'
    ? t('estado.em_entrega')
    : daPlataforma
      ? ligado
        ? t('online.ligado')
        : t('online.desligado')
      : ligado
        ? t('estado.disponivel')
        : t('estado.indisponivel');

  return (
    <div className="mt-3 rounded-xl bg-slate-50 px-3 py-2">
      <div className="flex items-center justify-between gap-3">
        <span className="text-sm text-slate-600">{texto}</span>
        <button
          type="button"
          role="switch"
          aria-checked={ligado}
          aria-label={daPlataforma ? t('online.alternar') : t('estado.alternar')}
          disabled={aMudar || semRede}
          onClick={alternar}
          className={cn(
            'relative h-8 w-14 shrink-0 rounded-full transition-colors disabled:opacity-50',
            ligado ? 'bg-emerald-500' : 'bg-slate-300',
          )}
        >
          {aMudar ? (
            <Loader2 size={16} className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 animate-spin text-white" />
          ) : (
            <span
              className={cn('absolute top-1 h-6 w-6 rounded-full bg-white shadow transition-all', ligado ? 'left-7' : 'left-1')}
            />
          )}
        </button>
      </div>
      {daPlataforma && !ligado && <p className="mt-1.5 text-xs text-slate-500">{t('online.ajuda')}</p>}
    </div>
  );
}
