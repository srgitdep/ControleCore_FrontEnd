import { useTranslation } from 'react-i18next';
import { AlertTriangle, Loader2, MapPin } from 'lucide-react';
import { useNomeDoLocal } from '@/shared/hooks/useNomeDoLocal';
import type { PontoNoMapa } from './MapaEntrega';

/**
 * O nome do sítio onde está o pino — rua, bairro, cidade —, para quem marca conseguir **conferir**
 * se é o sítio certo. Umas coordenadas sozinhas não dizem nada a ninguém.
 *
 * Se o ponto cair fora de Moçambique, avisa: é quase de certeza o GPS (ou um clique) a errar, e uma
 * loja com a localização no sítio errado estraga a distância de todas as entregas.
 */
export function NomeDoLocal({ ponto }: { ponto: PontoNoMapa | null }) {
  const { t } = useTranslation('shell');
  const { nome, aProcurar, falhou } = useNomeDoLocal(ponto);

  if (!ponto) return null;

  if (aProcurar) {
    return (
      <p className="flex items-center gap-1.5 text-xs text-slate-500" aria-live="polite">
        <Loader2 size={12} className="animate-spin" />
        {t('mapa.a_identificar')}
      </p>
    );
  }

  if (nome?.foraDeMocambique) {
    return (
      <p className="flex items-start gap-1.5 rounded-lg bg-red-50 px-3 py-2 text-xs font-medium text-red-700" role="alert">
        <AlertTriangle size={14} className="mt-0.5 shrink-0" />
        <span>
          {t('mapa.fora_de_mocambique', { local: nome.texto })}
        </span>
      </p>
    );
  }

  if (nome) {
    return (
      <p className="flex items-start gap-1.5 text-sm font-medium text-slate-800">
        <MapPin size={14} className="mt-0.5 shrink-0 text-blue-600" />
        <span>{nome.texto}</span>
      </p>
    );
  }

  // Sem nome (mato, mar) ou sem rede: não bloqueia — só diz que a verificação fica por conta de quem vê.
  return <p className="text-xs text-slate-400">{falhou ? t('mapa.nome_indisponivel') : t('mapa.sem_nome')}</p>;
}
