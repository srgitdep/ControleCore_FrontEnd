import { Sparkles, Loader2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Card } from '@/shared/ui';
import { useAnaliseMayra } from '../hooks/useNecessidades';
import type { KpisNecessidades } from '../types/necessidade.types';

interface PainelMayraProps {
  kpis: KpisNecessidades | undefined;
  isLoading?: boolean;
  lojaId?: string;
}

/**
 * MAYRA — Assistente de Abastecimento — DT01 §14.
 *
 * Os cinco números vêm de `ListarNecessidadesUseCase.kpis` — contagens, sem IA
 * nenhuma envolvida. A recomendação principal, essa sim, é gerada por
 * `AnalisarNecessidadesMayraUseCase` (Fase 4): uma síntese em linguagem natural que,
 * por definição, não é uma contagem que se possa calcular no cliente.
 *
 * ## Indisponibilidade explícita, não um botão desactivado
 *
 * Sem `GEMINI_API_KEY` configurada no backend, o endpoint devolve 400 — tratado aqui
 * como "MAYRA indisponível", nunca como um erro genérico. O DT01 §6 e §25 são
 * explícitos: "se a MAYRA estiver indisponível, o painel operacional continua
 * funcional e indica apenas indisponibilidade da análise inteligente". Os quatro
 * números continuam visíveis mesmo quando a recomendação falha.
 */
export function PainelMayra({ kpis, isLoading, lojaId }: PainelMayraProps) {
  const { t } = useTranslation('necessidades');
  const { data: analise, isLoading: aCarregarAnalise, isError } = useAnaliseMayra(lojaId);

  if (isLoading || !kpis) {
    return (
      <Card className="animate-pulse" padding="lg">
        <div className="h-4 w-40 rounded bg-slate-100" />
        <div className="mt-4 space-y-2">
          <div className="h-3 w-full rounded bg-slate-100" />
          <div className="h-3 w-3/4 rounded bg-slate-100" />
        </div>
      </Card>
    );
  }

  const emRisco = kpis.emRiscoRuptura;
  const resolveisPorTransferencia = kpis.porRecomendacao.TRANSFERIR;
  const jaEmTransito = kpis.porRecomendacao.AGUARDAR;
  const precisamNovaCompra = kpis.porRecomendacao.COMPRAR;

  return (
    <Card padding="lg">
      <div className="flex items-center gap-2">
        <Sparkles size={18} className="text-indigo-500" />
        <p className="text-sm font-semibold text-slate-800">{t('mayra.titulo')}</p>
      </div>

      <ul className="mt-4 space-y-2 text-sm text-slate-600">
        <li className="flex items-center gap-2">
          <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-rose-500" />
          <span className="tabular-nums font-semibold text-slate-800">{emRisco}</span>{' '}
          {t('mayra.em_risco')}
        </li>
        <li className="flex items-center gap-2">
          <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-blue-500" />
          <span className="tabular-nums font-semibold text-slate-800">
            {resolveisPorTransferencia}
          </span>{' '}
          {t('mayra.por_transferencia')}
        </li>
        <li className="flex items-center gap-2">
          <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-slate-400" />
          <span className="tabular-nums font-semibold text-slate-800">{jaEmTransito}</span>{' '}
          {t('mayra.em_transito')}
        </li>
        <li className="flex items-center gap-2">
          <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-amber-500" />
          <span className="tabular-nums font-semibold text-slate-800">{precisamNovaCompra}</span>{' '}
          {t('mayra.nova_compra')}
        </li>
      </ul>

      {/* A recomendação principal — DT01 §14. Três estados, nunca escondidos: a
          carregar, indisponível, ou o texto que a Gemini gerou sobre esta fila. */}
      <div className="mt-4 rounded-lg bg-indigo-50 p-3 text-sm text-indigo-900">
        {aCarregarAnalise ? (
          <span className="flex items-center gap-2 text-indigo-700">
            <Loader2 size={14} className="animate-spin" /> {t('mayra.a_analisar')}
          </span>
        ) : isError ? (
          <span className="text-indigo-700/70">
            {t('mayra.indisponivel')}
          </span>
        ) : (
          <span>{analise?.recomendacaoPrincipal}</span>
        )}
      </div>
    </Card>
  );
}
