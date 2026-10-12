import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { AlertTriangle, ChevronRight, FileWarning, Loader2, PackageCheck, Radio, RefreshCw } from 'lucide-react';
import { cn, formatMoeda } from '@/shared/utils';
import { AjudaDeInstalacao } from '../components/AjudaDeInstalacao';
import { EstadoDaEntrega } from '../components/EstadoDaEntrega';
import { useMeuPerfil, useMinhasEntregas } from '../hooks/useEstafeta';
import type { EntregaEstafeta } from '../types/estafeta';

function Cartao({ entrega }: { entrega: EntregaEstafeta }) {
  const { t } = useTranslation('estafeta');

  return (
    <Link
      to={`/estafeta/entregas/${entrega.id}`}
      className="flex min-h-20 items-center gap-3 rounded-2xl border border-slate-200 bg-white p-4 active:bg-slate-50"
    >
      <div className="min-w-0 flex-1">
        <div className="flex items-center justify-between gap-2">
          <span className="text-sm font-bold text-slate-900">{entrega.pedido.numeroPedido}</span>
          <EstadoDaEntrega estado={entrega.estado} />
        </div>
        <p className="mt-1 line-clamp-2 text-sm text-slate-600">{entrega.destinoMorada}</p>
        <p className="mt-1 text-xs text-slate-400">
          {entrega.loja.nome}
          {entrega.valorACobrar > 0 && ` · ${t('a_cobrar')} ${formatMoeda(entrega.valorACobrar)}`}
        </p>
      </div>
      <ChevronRight size={18} className="shrink-0 text-slate-300" />
    </Link>
  );
}

/** As minhas entregas: o que está por fazer, ou o histórico recente. */
export function MinhasEntregasPage() {
  const { t } = useTranslation('estafeta');
  const [historico, setHistorico] = useState(false);
  const entregas = useMinhasEntregas(historico);
  const perfil = useMeuPerfil().data;

  return (
    <div className="space-y-4">
      <AjudaDeInstalacao />

      {/* Um estafeta anterior ao onboarding não fica bloqueado (a frota não pára por uma regra nova), mas vê isto até
          completar os documentos (plano §4.9, D9). */}
      {perfil && perfil.onboardingCompleto && !perfil.documentosCompletos && (
        <Link
          to="/estafeta/onboarding"
          className="flex items-start gap-3 rounded-2xl border border-amber-200 bg-amber-50 p-4 active:bg-amber-100"
        >
          <FileWarning size={20} className="mt-0.5 shrink-0 text-amber-600" aria-hidden />
          <span className="min-w-0 flex-1">
            <span className="block text-sm font-bold text-amber-900">{t('onboarding.aviso_antigo.titulo')}</span>
            <span className="mt-0.5 block text-sm text-amber-900">{t('onboarding.aviso_antigo.texto')}</span>
            <span className="mt-2 block text-sm font-bold text-amber-800">{t('onboarding.aviso_antigo.accao')}</span>
          </span>
        </Link>
      )}

      {/* Online na plataforma e sem nada em curso: está à espera de uma oferta. Dizê-lo evita a dúvida «está a funcionar?». */}
      {perfil?.frota === 'PLATAFORMA' && perfil.online && !historico && (entregas.data?.length ?? 0) === 0 && (
        <p className="flex items-center gap-2 rounded-2xl bg-emerald-50 p-3 text-sm font-medium text-emerald-900" role="status">
          <Radio size={16} className="shrink-0" aria-hidden />
          {t('online.a_espera')}
        </p>
      )}

      <div className="flex items-center gap-2">
        <div className="flex flex-1 rounded-xl bg-slate-200/70 p-1" role="tablist">
          {[false, true].map((h) => (
            <button
              key={String(h)}
              type="button"
              role="tab"
              aria-selected={historico === h}
              onClick={() => setHistorico(h)}
              className={cn(
                'min-h-11 flex-1 rounded-lg text-sm font-semibold transition-colors',
                historico === h ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500',
              )}
            >
              {h ? t('abas.historico') : t('abas.por_fazer')}
            </button>
          ))}
        </div>
        <button
          type="button"
          onClick={() => void entregas.refetch()}
          aria-label={t('actualizar')}
          disabled={entregas.isFetching}
          className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-white text-slate-500 shadow-sm disabled:opacity-50"
        >
          <RefreshCw size={18} className={entregas.isFetching ? 'animate-spin' : ''} />
        </button>
      </div>

      {entregas.isLoading ? (
        <div className="space-y-3">
          {[0, 1, 2].map((i) => (
            <div key={i} className="h-24 animate-pulse rounded-2xl bg-slate-200/70" />
          ))}
        </div>
      ) : entregas.isError && !entregas.data ? (
        <div className="space-y-3 rounded-2xl bg-red-50 p-4 text-sm text-red-700">
          <p className="flex items-center gap-2">
            <AlertTriangle size={16} className="shrink-0" />
            {t('erro_carregar')}
          </p>
          <button
            type="button"
            onClick={() => void entregas.refetch()}
            className="min-h-11 rounded-xl bg-white px-4 text-sm font-semibold text-red-700 shadow-sm"
          >
            {t('tentar_de_novo')}
          </button>
        </div>
      ) : entregas.data && entregas.data.length > 0 ? (
        <ul className="space-y-3">
          {entregas.data.map((e) => (
            <li key={e.id}>
              <Cartao entrega={e} />
            </li>
          ))}
        </ul>
      ) : (
        <div className="flex flex-col items-center gap-2 rounded-2xl border border-dashed border-slate-300 bg-white py-16 text-center">
          {entregas.isFetching ? (
            <Loader2 size={26} className="animate-spin text-slate-300" />
          ) : (
            <PackageCheck size={30} className="text-slate-300" />
          )}
          <p className="px-6 text-sm text-slate-500">{historico ? t('vazio_historico') : t('vazio_por_fazer')}</p>
        </div>
      )}
    </div>
  );
}
