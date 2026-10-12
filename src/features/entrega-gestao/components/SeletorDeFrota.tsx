import { useTranslation } from 'react-i18next';
import { cn } from '@/shared/utils';
import { useActualizarConfiguracaoEntrega } from '../hooks/useEntregaGestao';
import type { ConfiguracaoEntrega } from '../types';

/**
 * De onde vêm os estafetas desta empresa (plano §4.9, D4): da sua frota própria, ou da plataforma (o mais próximo da
 * loja aceita a entrega). Só aparece com a frota da plataforma aberta — o servidor recusa a opção na mesma, mas
 * oferecê-la fechada seria uma promessa que dá erro.
 */
export function SeletorDeFrota({ configuracao }: { configuracao: ConfiguracaoEntrega }) {
  const { t } = useTranslation('entrega');
  const actualizar = useActualizarConfiguracaoEntrega();

  if (!configuracao.frotaPlataformaDisponivel) return null;

  const opcoes = ['PROPRIA', 'PLATAFORMA'] as const;

  return (
    <fieldset className="rounded-2xl border border-slate-200 bg-white p-5">
      <legend className="sr-only">{t('frota.titulo')}</legend>
      <h2 className="text-sm font-bold text-slate-900">{t('frota.titulo')}</h2>
      <p className="mt-0.5 text-xs text-slate-500">{t('frota.ajuda')}</p>
      <div className="mt-3 grid gap-2 sm:grid-cols-2">
        {opcoes.map((frota) => (
          <label
            key={frota}
            className={cn(
              'flex cursor-pointer flex-col rounded-xl border p-3',
              configuracao.frotaEntrega === frota ? 'border-blue-600 bg-blue-50' : 'border-slate-300 hover:bg-slate-50',
              actualizar.isPending && 'opacity-60',
            )}
          >
            <span className="flex items-center gap-2 text-sm font-semibold text-slate-900">
              <input
                type="radio"
                name="frota-entrega"
                checked={configuracao.frotaEntrega === frota}
                disabled={actualizar.isPending}
                onChange={() => actualizar.mutate({ frotaEntrega: frota })}
              />
              {t(`frota.${frota}.nome`)}
            </span>
            <span className="mt-1 text-xs text-slate-500">{t(`frota.${frota}.descricao`)}</span>
          </label>
        ))}
      </div>
    </fieldset>
  );
}
