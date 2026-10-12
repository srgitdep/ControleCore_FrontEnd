import { useTranslation } from 'react-i18next';
import { Copy, Link2, Loader2, RefreshCw } from 'lucide-react';
import toast from 'react-hot-toast';
import { useConvite, useRodarConvite } from '../hooks/useOperacao';

/**
 * O convite para estafetas se registarem na frota própria (plano §4.9, D4). A ligação leva o código; quem a abre
 * regista-se **nesta** empresa em vez de na plataforma. Gerar um novo invalida o anterior — serve para revogar uma
 * ligação que se espalhou demais, e por isso pede confirmação.
 */
export function ConviteEstafetas() {
  const { t } = useTranslation('entrega');
  const convite = useConvite();
  const rodar = useRodarConvite();

  // A ligação monta-se com o endereço onde a gestão está: o registo é uma rota pública do mesmo frontend.
  const ligacao = convite.data?.convite ? `${window.location.origin}/estafeta/registo?convite=${encodeURIComponent(convite.data.convite)}` : null;

  const copiar = async () => {
    if (!ligacao) return;
    try {
      await navigator.clipboard.writeText(ligacao);
      toast.success(t('convite.copiado'));
    } catch {
      // Sem permissão da área de transferência (contexto inseguro, por exemplo): a ligação está à vista para copiar à mão.
      toast.error(t('convite.copiar_falhou'));
    }
  };

  const gerar = () => {
    if (ligacao && !window.confirm(t('convite.rodar_confirmar'))) return;
    rodar.mutate();
  };

  // Sem permissão (403) ou erro: o cartão não aparece, em vez de um erro que a pessoa não pode resolver.
  if (convite.isError) return null;

  return (
    <section className="rounded-xl border border-slate-200 bg-white p-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <h2 className="flex items-center gap-2 text-sm font-bold text-slate-900">
            <Link2 size={14} className="text-slate-400" />
            {t('convite.titulo')}
          </h2>
          <p className="mt-0.5 text-xs text-slate-500">{t('convite.ajuda')}</p>
        </div>
        <div className="flex shrink-0 gap-1.5">
          {ligacao && (
            <button type="button" onClick={() => void copiar()} className="inline-flex items-center gap-1 rounded-lg border border-slate-300 px-2.5 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50">
              <Copy size={12} />
              {t('convite.copiar')}
            </button>
          )}
          <button
            type="button"
            onClick={gerar}
            disabled={rodar.isPending || convite.isLoading}
            className="inline-flex items-center gap-1 rounded-lg border border-slate-300 px-2.5 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50"
          >
            {rodar.isPending ? <Loader2 size={12} className="animate-spin" /> : <RefreshCw size={12} />}
            {ligacao ? t('convite.gerar_novo') : t('convite.gerar')}
          </button>
        </div>
      </div>

      {convite.isLoading ? (
        <div className="mt-3 h-8 animate-pulse rounded-lg bg-slate-100" />
      ) : ligacao ? (
        <p className="mt-3 select-all break-all rounded-lg bg-slate-50 px-3 py-2 font-mono text-xs text-slate-700">{ligacao}</p>
      ) : (
        <p className="mt-3 text-xs text-slate-500">{t('convite.sem_convite')}</p>
      )}
    </section>
  );
}
