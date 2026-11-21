import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Loader2, Settings } from 'lucide-react';
import { useMinhaEmpresa, useUpdateEmpresa } from '@/features/empresas';

/**
 * As configurações da própria empresa (ADMIN/MANAGER) — distinto de `/empresas`, que é
 * a plataforma a gerir os seus clientes. Começa só com o interruptor de IVA; é o sítio
 * natural para outras definições futuras da empresa.
 */
export function ConfiguracoesEmpresaPage() {
  const { t } = useTranslation('configuracoesEmpresa');
  const { data: empresa, isLoading } = useMinhaEmpresa();
  const actualizar = useUpdateEmpresa();

  const [cobraIva, setCobraIva] = useState(true);

  useEffect(() => {
    if (empresa) setCobraIva(empresa.cobraIva);
  }, [empresa]);

  const aoMudarCobraIva = (valor: boolean) => {
    if (!empresa) return;
    setCobraIva(valor);
    actualizar.mutate(
      { id: empresa.id, data: { cobraIva: valor } },
      { onError: () => setCobraIva(empresa.cobraIva) },
    );
  };

  if (isLoading) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center">
        <Loader2 size={22} className="animate-spin text-slate-400" />
      </div>
    );
  }

  return (
    <div className="space-y-6 p-4 sm:p-6">
      <div className="flex items-center gap-2">
        <Settings size={20} className="text-slate-500" />
        <h1 className="text-lg font-bold text-slate-900">{t('titulo')}</h1>
      </div>

      <div className="max-w-xl rounded-xl border border-slate-200 bg-white p-5">
        <h2 className="text-sm font-semibold text-slate-900">{t('fiscalidade.titulo')}</h2>
        <p className="mt-1 text-sm text-slate-500">{t('fiscalidade.descricao')}</p>

        <label className="mt-4 flex items-start justify-between gap-4 rounded-lg border border-slate-200 p-3">
          <span>
            <span className="block text-sm font-medium text-slate-800">{t('fiscalidade.cobra_iva')}</span>
            <span className="block text-xs text-slate-500">{t('fiscalidade.cobra_iva_ajuda')}</span>
          </span>
          <button
            type="button"
            role="switch"
            aria-checked={cobraIva}
            onClick={() => aoMudarCobraIva(!cobraIva)}
            disabled={actualizar.isPending}
            className={`relative h-6 w-11 shrink-0 rounded-full transition-colors disabled:opacity-50 ${
              cobraIva ? 'bg-blue-600' : 'bg-slate-200'
            }`}
          >
            <span
              className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform ${
                cobraIva ? 'translate-x-5' : 'translate-x-0.5'
              }`}
            />
          </button>
        </label>
      </div>
    </div>
  );
}
